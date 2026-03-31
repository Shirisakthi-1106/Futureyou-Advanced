from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
import json
import datetime
from dotenv import load_dotenv
from predictor import load_models, predict_all, generate_trajectory, build_future_context, generate_quests, generate_timeline_narrative_prompt
from sentinel import evaluate_sentinel_risk
from email_service import send_sentinel_alert, get_smtp_status

load_dotenv()

app = FastAPI(title="FutureYou API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models = load_models()

# --- Memory System (RAG) ---
MEMORY_FILE = "memory.json"
def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return {}
    try:
        with open(MEMORY_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def save_to_memory(user_id: str, data: dict):
    mem = load_memory()
    if user_id not in mem:
        mem[user_id] = []
    
    data["timestamp"] = datetime.datetime.now().isoformat()
    mem[user_id].append(data)
    
    # Keep last 10 predictions for context limit
    mem[user_id] = mem[user_id][-10:]
    
    with open(MEMORY_FILE, "w") as f:
        json.dump(mem, f, indent=2)

def get_user_memory(user_id: str):
    return load_memory().get(user_id, [])
# ---------------------------

class UserInput(BaseModel):
    user_id: str = "anonymous"
    sleep_hours: float
    study_hours: float
    screen_time: float
    social_media_hours: float
    exercise_frequency: int
    mood_score: int
    diet_quality: int  # 0=Poor, 1=Fair, 2=Good
    mental_health_rating: int
    years_ahead: int = 5
    # Guardian Settings (supports single string or list of emails)
    guardian_email: str = None  # Legacy single email
    guardian_emails: list[str] = []  # Multi-recipient list
    guardian_name: str = "Guardian"
    sentinel_enabled: bool = False

class ChatMessage(BaseModel):
    role: str
    content: str
    
class ChatRequest(BaseModel):
    user_input: UserInput
    message: str
    history: list[ChatMessage] = []

class PersonaChatRequest(BaseModel):
    persona_id: str
    system_prompt: str
    message: str
    history: list[ChatMessage] = []
    user_input: UserInput

@app.on_event("startup")
async def startup_event():
    global models
    if models is None:
        print("WARNING: Models not found on startup! Make sure train_models.py has been run.")

@app.get("/health")
def read_health():
    return {"status": "ok", "models_loaded": models is not None}

@app.post("/predict")
def get_predictions(data: UserInput):
    if models is None:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    ui_dict = data.dict()
    predictions = predict_all(models, ui_dict)
    trajectory = generate_trajectory(models, ui_dict, years=ui_dict.get("years_ahead", 5))
    
    # Generate Quests from SHAP insights
    quests = generate_quests(predictions.get("insights", {}))
    
    # Generate Timeline Story-driven Milestones
    timeline_prompt = generate_timeline_narrative_prompt(trajectory, ui_dict)
    groq_key = os.getenv("GROQ_API_KEY")
    timeline_items = []
    
    if groq_key:
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are a professional life architect. Return only JSON arrays of milestones."},
                        {"role": "user", "content": timeline_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "max_tokens": 800,
                    "temperature": 0.3,
                },
                timeout=20
            )
            data_resp = resp.json()
            if "choices" in data_resp:
                raw_content = data_resp["choices"][0]["message"]["content"]
                try:
                    parsed = json.loads(raw_content)
                    if isinstance(parsed, list):
                        timeline_items = parsed
                    elif isinstance(parsed, dict):
                        for key in ["milestones", "timeline", "years"]:
                            if key in parsed and isinstance(parsed[key], list):
                                timeline_items = parsed[key]
                                break
                        if not timeline_items and len(parsed) > 0:
                            for v in parsed.values():
                                if isinstance(v, list):
                                    timeline_items = v
                                    break
                except Exception as e:
                    print(f"JSON Parse Error in Timeline: {e}")
                    timeline_items = []
        except Exception as e:
            print(f"Groq API Error in Timeline: {e}")
            timeline_items = []

    # Save to agentic memory
    if data.user_id != "anonymous":
        save_to_memory(data.user_id, {
            "type": "prediction",
            "habits": {k: v for k, v in ui_dict.items() if k != "user_id"},
            "exam_score": predictions["exam_score"],
            "stress_level": predictions["stress_pct"]
        })
    
    # --- Sentinel Mode Integration ---
    user_mem = get_user_memory(data.user_id)
    sentinel_result = evaluate_sentinel_risk(predictions, trajectory, ui_dict, history=user_mem)
    
    # 4-hour cooldown logic for automatic alerts
    last_alert_at = None
    last_alert_severity = None
    for m in reversed(user_mem):
        if m.get('type') == 'sentinel_alert':
            last_alert_at = datetime.datetime.fromisoformat(m['timestamp'])
            last_alert_severity = m.get('severity', 'low')
            break
    
    should_send_automated = False
    if sentinel_result['guardianShouldBeAlerted']:
        if not last_alert_at:
            should_send_automated = True
        else:
            hours_since = (datetime.datetime.now() - last_alert_at).total_seconds() / 3600
            if hours_since >= 4:
                should_send_automated = True
            elif sentinel_result['severity'] == 'critical' and last_alert_severity != 'critical':
                # Bypass cooldown if severity escalated to critical
                should_send_automated = True

    alert_result = {"success": False, "sent_to": [], "failed": [], "error": None}
    # Merge legacy single email + multi-email list
    all_emails = list(data.guardian_emails) if data.guardian_emails else []
    if data.guardian_email and data.guardian_email not in all_emails:
        all_emails.append(data.guardian_email)
    
    if data.sentinel_enabled and all_emails and should_send_automated:
        print(f"[SENTINEL] Automatic alert triggered: severity={sentinel_result['severity']}, recipients={all_emails}")
        alert_result = send_sentinel_alert(
            all_emails, 
            data.guardian_name, 
            data.user_id if data.user_id != "anonymous" else "FutureYou User",
            sentinel_result
        )
        if alert_result["success"]:
            save_to_memory(data.user_id, {
                "type": "sentinel_alert",
                "severity": sentinel_result['severity'],
                "reasons": sentinel_result['reasons'],
                "sent_to": alert_result["sent_to"]
            })

    return {
        "predictions": predictions,
        "trajectory": trajectory,
        "quests": quests,
        "timeline": timeline_items,
        "sentinel": {
            **sentinel_result,
            "alert_sent": alert_result["success"],
            "alert_details": {
                "sent_to": alert_result["sent_to"],
                "failed": alert_result["failed"],
                "error": alert_result["error"]
            }
        }
    }

class TestAlertRequest(BaseModel):
    emails: list[str] = []  # Multi-recipient
    email: str = None  # Legacy single
    name: str = "Guardian"
    user_name: str = "Demo User"

@app.post("/test-alert")
def test_alert(req: TestAlertRequest):
    """Send a test Sentinel alert to verify SMTP delivery works."""
    # Merge legacy + multi emails
    all_emails = list(req.emails) if req.emails else []
    if req.email and req.email not in all_emails:
        all_emails.append(req.email)
    
    if not all_emails:
        raise HTTPException(status_code=400, detail="No email addresses provided")
    
    mock_risk = {
        'severity': 'high',
        'reasons': [
            "[TEST] Manual verification: Sentinel intervention pathway active.",
            "[TEST] Simulated high-stress condition for system validation."
        ],
        'stats': {
            'stress': 82.0, 'sleep': 5.5, 'wellbeing': 4.5, 'dropout': 25.0, 'exam': 68.0
        },
        'trajectory_summary': {
            'drift_path_exam': 45.2,
            'current_path_exam': 68.0,
            'thriving_path_exam': 82.5,
            'drift_path_stress': 88.0,
            'current_path_stress': 62.0,
            'exam_gap': 37.3,
            'years_projected': 5
        },
        'recovery_suggestions': [
            "[TEST] Encourage consistent sleep of 7-8 hours.",
            "[TEST] Assess workload — reduce overcommitment and introduce breaks.",
            "[TEST] Check emotional wellbeing through open conversation about stressors.",
            "[TEST] This is a verification email — no real alert was triggered."
        ]
    }
    
    print(f"[SENTINEL] Manual test alert requested for: {all_emails}")
    result = send_sentinel_alert(all_emails, req.name, req.user_name, mock_risk)
    
    return {
        "status": "success" if result["success"] else "failed",
        "sent_to": result["sent_to"],
        "failed": result["failed"],
        "error": result["error"],
        "message": (
            f"Delivered to {len(result['sent_to'])} of {len(all_emails)} recipients"
            if result["success"]
            else f"Failed: {result['error']}"
        )
    }

@app.get("/smtp-status")
def smtp_status():
    """Frontend can check if SMTP is properly configured."""
    return get_smtp_status()

@app.post("/chat")
def chat_with_future(req: ChatRequest):
    if models is None:
        raise HTTPException(status_code=500, detail="Models not loaded")
        
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY environment variable is not set")
        
    ui_dict = req.user_input.dict()
    predictions = predict_all(models, ui_dict)
    trajectory = generate_trajectory(models, ui_dict, years=ui_dict.get("years_ahead", 5))
    
    future_context = build_future_context(predictions, ui_dict, trajectory)
    
    # Retrieve Agentic Memory (RAG)
    past_memory = get_user_memory(req.user_input.user_id)
    if past_memory and len(past_memory) > 1:
        first_mem = past_memory[0]
        latest_mem = past_memory[-1]
        memory_context = f"\n\nAGENTIC MEMORY AWARENESS:\nYou have interacted with this user before over time.\nTheir first logged exam score was {first_mem.get('exam_score')} and stress was {first_mem.get('stress_level')}%. Their current is {predictions['exam_score']} and {predictions['stress_pct']}%.\nIf they improved, praise them. If they got worse, express extreme concern from the future! Reference their journey."
        future_context += memory_context
    
    # Format history for Groq API
    messages = [{"role": "system", "content": future_context}]
    for h in req.history[-6:]:
        role = "assistant" if h.role == "future" else h.role
        messages.append({"role": role, "content": h.content})
        
    messages.append({"role": "user", "content": req.message})

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "max_tokens": 200,
                "temperature": 0.85,
            },
            timeout=15
        )
        data = resp.json()
        if "choices" in data:
            reply = data["choices"][0]["message"]["content"]
            
            if req.user_input.user_id != "anonymous":
                save_to_memory(req.user_input.user_id, {
                    "type": "chat",
                    "user_msg": req.message,
                    "agent_reply": reply
                })
                
            return {"reply": reply}
        else:
            error_msg = data.get('error', {}).get('message', 'Unknown error')
            print(f"Groq API Error in /chat: {error_msg}")
            return {"reply": f"[Neural Link Instability] The timeline is clouded and I cannot speak clearly right now. Error: {error_msg}"}
            
    except Exception as e:
        print(f"Connection error in /chat: {e}")
        return {"reply": "[Neural Link Instability] The temporal transmission was interrupted. Try speaking to me again from the dashboard."}

class ParseRequest(BaseModel):
    message: str

@app.post("/parse_input")
def parse_natural_language_input(req: ParseRequest):
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY environment variable is not set")
        
    system_prompt = """You are a precise data extraction assistant. 
Extract numerical values for the user's habits from their text.
Return ONLY a raw JSON object string with these exact keys and format, no markdown formatting, no backticks, no explanatory text:
{
  "sleep_hours": 7.5,
  "study_hours": 4.0,
  "screen_time": 6.0,
  "social_media_hours": 3.0,
  "exercise_frequency": 3,
  "mood_score": 7,
  "diet_quality": 1,
  "mental_health_rating": 8,
  "years_ahead": 5
}

Rules:
- sleep_hours, study_hours, screen_time, social_media_hours: floats (hours per day)
- exercise_frequency: int (days per week, 0-7)
- mood_score, mental_health_rating: int (1-10)
- diet_quality: int (0=Poor, 1=Fair, 2=Good)
- years_ahead: int (usually 5)
If a value is not mentioned, make a reasonable, average guess based on the tone of the text.
"""
    
    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": req.message}
                ],
                "response_format": {"type": "json_object"},
                "max_tokens": 200,
                "temperature": 0.1,
            },
            timeout=15
        )
        data = resp.json()
        if "choices" in data:
            reply = data["choices"][0]["message"]["content"]
            try:
                parsed = json.loads(reply)
                return {"parsed": parsed}
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="Failed to parse LLM output as JSON")
        else:
            raise HTTPException(status_code=500, detail=f"Groq API Error: {data.get('error', {}).get('message', 'Unknown error')}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")

class FeedbackInput(BaseModel):
    user_id: str = "anonymous"
    actual_exam_score: float = None
    actual_stress_level: float = None
    habits: dict

@app.post("/feedback")
def log_feedback(data: FeedbackInput):
    try:
        feedback_file = "feedback.json"
        
        if os.path.exists(feedback_file):
            with open(feedback_file, "r") as f:
                logs = json.load(f)
        else:
            logs = []
            
        logs.append({
            "timestamp": datetime.datetime.now().isoformat(),
            **data.dict()
        })
        
        with open(feedback_file, "w") as f:
            json.dump(logs, f, indent=2)
            
        return {"status": "success", "message": "Feedback logged for future model fine-tuning."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/persona-chat")
def persona_chat(req: PersonaChatRequest):
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY environment variable is not set")
    
    messages = [{"role": "system", "content": req.system_prompt}]
    for h in req.history[-6:]:
        role = "assistant" if h.role == "persona" else h.role
        messages.append({"role": role, "content": h.content})
    
    messages.append({"role": "user", "content": req.message})

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "max_tokens": 250,
                "temperature": 0.8,
            },
            timeout=15
        )
        data = resp.json()
        if "choices" in data:
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
        else:
            raise HTTPException(status_code=500, detail=f"Groq API Error: {data.get('error', {}).get('message', 'Unknown error')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")
