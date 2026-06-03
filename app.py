from fastapi import FastAPI
app = FastAPI()

from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import requests
import json
import datetime
from pathlib import Path
from dotenv import load_dotenv

from futureyou.predictor import (
    load_models,
    predict_all,
    generate_trajectory,
    build_future_context,
    generate_quests,
    generate_timeline_narrative_prompt
)

from futureyou.sentinel import evaluate_sentinel_risk
from futureyou.email_service import send_sentinel_alert, get_smtp_status

load_dotenv()


# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- API PREFIX HANDLER ----------------

@app.middleware("http")
async def strip_api_prefix(request, call_next):
    path = request.scope.get("path", "")

    if path.startswith("/api"):
        request.scope["path"] = path[4:]

    return await call_next(request)


# ---------------- LOAD MODELS ----------------

models = load_models()


# ---------------- MEMORY SYSTEM ----------------

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

    mem[user_id] = mem[user_id][-10:]

    with open(MEMORY_FILE, "w") as f:
        json.dump(mem, f, indent=2)


def get_user_memory(user_id: str):
    return load_memory().get(user_id, [])


# ---------------- REQUEST MODELS ----------------

class UserInput(BaseModel):

    user_id: str = "anonymous"

    sleep_hours: float
    study_hours: float
    screen_time: float
    social_media_hours: float

    exercise_frequency: int
    mood_score: int
    diet_quality: int
    mental_health_rating: int

    years_ahead: int = 5

    guardian_email: str = None
    guardian_emails: list[str] = []

    guardian_name: str = "Guardian"

    sentinel_enabled: bool = False


class ChatMessage(BaseModel):

    role: str
    content: str


class ChatRequest(BaseModel):

    user_input: UserInput
    message: str

    history: list[ChatMessage] = []


class TextParseRequest(BaseModel):

    message: str


class FeedbackInput(BaseModel):

    user_id: str = "anonymous"
    actual_exam_score: float | None = None
    actual_stress_level: float | None = None
    habits: dict = {}


class TestAlertRequest(BaseModel):

    emails: list[str] | str
    name: str = "Guardian"
    user_name: str = "FutureYou User"


class PersonaChatRequest(BaseModel):

    persona_id: str
    system_prompt: str
    message: str

    history: list[ChatMessage] = []

    user_input: UserInput


# ---------------- STARTUP ----------------

@app.on_event("startup")
async def startup_event():

    global models

    if models is None:
        print("WARNING: Models not found on startup!")


# ---------------- HEALTH ----------------

@app.get("/health")
def read_health():

    return {
        "status": "ok",
        "models_loaded": models is not None
    }


# ---------------- PREDICT ----------------

@app.post("/predict")
def get_predictions(data: UserInput):

    if models is None:
        raise HTTPException(
            status_code=500,
            detail="Models not loaded"
        )

    ui_dict = data.dict()

    predictions = predict_all(models, ui_dict)

    trajectory = generate_trajectory(
        models,
        ui_dict,
        years=ui_dict.get("years_ahead", 5)
    )

    quests = generate_quests(
        predictions.get("insights", {})
    )

    timeline_prompt = generate_timeline_narrative_prompt(
        trajectory,
        ui_dict
    )

    return {
        "predictions": predictions,
        "trajectory": trajectory,
        "quests": quests,
        "timeline_prompt": timeline_prompt
    }


# ---------------- CHAT ----------------

@app.post("/chat")
def chat_with_future(req: ChatRequest):

    groq_key = os.getenv("GROQ_API_KEY")

    if not groq_key:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY environment variable is not set"
        )

    ui_dict = req.user_input.dict()

    predictions = predict_all(models, ui_dict)

    trajectory = generate_trajectory(
        models,
        ui_dict,
        years=ui_dict.get("years_ahead", 5)
    )

    future_context = build_future_context(
        predictions,
        ui_dict,
        trajectory
    )

    messages = [
        {
            "role": "system",
            "content": future_context
        }
    ]

    for h in req.history[-6:]:

        role = "assistant" if h.role == "future" else h.role

        messages.append({
            "role": role,
            "content": h.content
        })

    messages.append({
        "role": "user",
        "content": req.message
    })

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

            return {
                "reply": reply
            }

        else:

            error_msg = data.get(
                "error",
                {}
            ).get(
                "message",
                "Unknown error"
            )

            return {
                "reply": f"Groq API Error: {error_msg}"
            }

    except Exception as e:

        return {
            "reply": f"Connection error: {str(e)}"
        }


# ---------------- PERSONA CHAT ----------------

@app.post("/persona-chat")
def chat_with_persona(req: PersonaChatRequest):

    groq_key = os.getenv("GROQ_API_KEY")

    if not groq_key:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY environment variable is not set"
        )

    messages = [
        {
            "role": "system",
            "content": req.system_prompt
        }
    ]

    for h in req.history[-8:]:

        role = "assistant" if h.role in ("future", "persona") else h.role

        messages.append({
            "role": role,
            "content": h.content
        })

    messages.append({
        "role": "user",
        "content": req.message
    })

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
                "max_tokens": 180,
                "temperature": 0.85,
            },
            timeout=15
        )

        data = resp.json()

        if "choices" in data:
            return {
                "reply": data["choices"][0]["message"]["content"]
            }

        error_msg = data.get("error", {}).get("message", "Unknown error")

        return {
            "reply": f"Groq API Error: {error_msg}"
        }

    except Exception as e:

        return {
            "reply": f"Connection error: {str(e)}"
        }


# ---------------- TEXT PARSING ----------------

@app.post("/parse_input")
def parse_input(req: TextParseRequest):

    groq_key = os.getenv("GROQ_API_KEY")

    if not groq_key:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY environment variable is not set"
        )

    prompt = f"""
Extract student habit data from the message below.
Return only valid JSON with these numeric keys:
sleep_hours, study_hours, screen_time, social_media_hours,
exercise_frequency, mood_score, diet_quality, mental_health_rating, years_ahead.

Rules:
- Use 1-10 for mood_score and mental_health_rating.
- Use 0 poor, 1 fair, 2 good for diet_quality.
- Use 5 for years_ahead if not mentioned.
- Omit keys that cannot be inferred.

Message: {req.message}
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
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 220,
                "temperature": 0.1,
            },
            timeout=15
        )

        data = resp.json()

        if "choices" not in data:
            error_msg = data.get("error", {}).get("message", "Unknown error")
            raise HTTPException(status_code=502, detail=f"Groq API Error: {error_msg}")

        content = data["choices"][0]["message"]["content"].strip()
        start = content.find("{")
        end = content.rfind("}")

        if start == -1 or end == -1:
            raise ValueError("No JSON object found in parser response")

        parsed = json.loads(content[start:end + 1])

        return {
            "parsed": parsed
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse input: {str(e)}")


# ---------------- FEEDBACK ----------------

@app.post("/feedback")
def log_feedback(data: FeedbackInput):

    entry = data.dict()
    entry["timestamp"] = datetime.datetime.now().isoformat()

    feedback_path = Path("feedback.json")

    try:
        if feedback_path.exists():
            logs = json.loads(feedback_path.read_text())
        else:
            logs = []

        logs.append(entry)
        feedback_path.write_text(json.dumps(logs[-500:], indent=2))

        return {
            "saved": True
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save feedback: {str(e)}")


# ---------------- TEST ALERT ----------------

@app.post("/test-alert")
def test_alert(req: TestAlertRequest):

    test_risk = {
        "severity": "high",
        "reasons": [
            "Manual Sentinel test alert requested from guardian settings."
        ],
        "stats": {
            "stress": 82.0,
            "sleep": 5.5,
            "wellbeing": 4.5,
            "dropout": 25.0,
            "exam": 68.0
        },
        "trajectory_summary": {
            "drift_path_exam": 45.2,
            "current_path_exam": 68.0,
            "thriving_path_exam": 82.5,
            "exam_gap": 37.3,
            "years_projected": 5
        },
        "recovery_suggestions": [
            "Encourage consistent sleep of 7-8 hours.",
            "Review academic workload and stress triggers."
        ]
    }

    result = send_sentinel_alert(req.emails, req.name, req.user_name, test_risk)

    return {
        "status": "success" if result.get("success") else "error",
        **result
    }




# ---------------- SMTP STATUS ----------------

@app.get("/smtp-status")
def smtp_status():

    return get_smtp_status()


# ---------------- STATIC FILES & SPA FALLBACK ----------------

# Mount static assets (CSS, JS, etc.) from frontend build
# On Vercel, the code is placed in /vercel/output/function/
# So we need to navigate relative to where the files actually are

if getattr(sys, 'frozen', False):
    # Running as compiled binary
    base_dir = os.path.dirname(sys.executable)
else:
    # Running as script - use the location of this file
    base_dir = os.path.dirname(os.path.abspath(__file__))

FRONTEND_BUILD_DIR = os.path.join(base_dir, "futureyou", "frontend", "dist")

if os.path.exists(FRONTEND_BUILD_DIR):
    print(f"Frontend dist found at: {FRONTEND_BUILD_DIR}")
    
    # Try to mount static assets
    try:
        assets_dir = os.path.join(FRONTEND_BUILD_DIR, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
            print("Mounted /assets")
    except Exception as e:
        print(f"Warning: Could not mount /assets: {e}")
    
    # Override the root "/" route to serve index.html
    @app.get("/", include_in_schema=False)
    async def serve_index():
        """Serve index.html for root path"""
        index_file = os.path.join(FRONTEND_BUILD_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file, media_type="text/html")
        return {"error": "index.html not found"}
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Serve SPA - return index.html for non-API routes"""
        file_path = os.path.join(FRONTEND_BUILD_DIR, full_path)
        
        # If it's a file that exists in dist, serve it
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Otherwise, serve index.html (SPA fallback)
        index_file = os.path.join(FRONTEND_BUILD_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file, media_type="text/html")
        
        return {
            "message": "FutureYou API is running. Frontend not built."
        }
else:
    print(f"Frontend directory not found at: {FRONTEND_BUILD_DIR}")
