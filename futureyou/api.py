from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
import json
import datetime
from dotenv import load_dotenv
from predictor import load_models, predict_all, generate_trajectory, build_future_context, generate_quests, generate_timeline_narrative_prompt

load_dotenv()

app = FastAPI(title="FutureYou API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

models = load_models()

import json
import datetime

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
    
    # Add timestamp
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
                        # Handle if it wrapped in a key like "milestones"
                        for key in ["milestones", "timeline", "years"]:
                            if key in parsed and isinstance(parsed[key], list):
                                timeline_items = parsed[key]
                                break
                        if not timeline_items and len(parsed) > 0:
                            # Just take the first list we find
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
    
    return {
        "predictions": predictions,
        "trajectory": trajectory,
        "quests": quests,
        "timeline": timeline_items
    }

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
        # User has history! We can let the agent know if they improved or declined
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
            
            # Save chat interaction to memory too
            if req.user_input.user_id != "anonymous":
                save_to_memory(req.user_input.user_id, {
                    "type": "chat",
                    "user_msg": req.message,
                    "agent_reply": reply
                })
                
            return {"reply": reply}
        else:
            raise HTTPException(status_code=500, detail=f"Groq API Error: {data.get('error', {}).get('message', 'Unknown error')}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")

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
            import json
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
    # MVP Continuous Fine-Tuning Endpoint
    # In a full production system, we would take this new data point
    # and call `model.partial_fit(X, y)` if using SGDRegressor, 
    # or append to a dataset retraining queue.
    try:
        feedback_file = "feedback.json"
        
        # Load existing
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
