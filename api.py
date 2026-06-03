
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
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

app = FastAPI(title="FutureYou API")


# ---------------- ROOT ROUTE ----------------

@app.get("/")
def home():
    return {
        "message": "FutureYou API is running"
    }


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




# ---------------- SMTP STATUS ----------------

@app.get("/smtp-status")
def smtp_status():

    return get_smtp_status()


# ---------------- STATIC FILES & SPA FALLBACK ----------------

# Mount static assets (CSS, JS, etc.) from frontend build
FRONTEND_BUILD_DIR = Path(__file__).parent / "futureyou" / "frontend" / "dist"

if FRONTEND_BUILD_DIR.exists():
    # Serve static assets (JS, CSS, etc.)
    app.mount("/assets", StaticFiles(directory=FRONTEND_BUILD_DIR / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve SPA - return index.html for non-API routes"""
        # Don't catch API routes (they're already handled by @app.post/@app.get above)
        # This catches everything else and serves index.html for SPA routing
        file_path = FRONTEND_BUILD_DIR / full_path
        
        # If it's a file that exists in dist, serve it
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        # Otherwise, serve index.html (SPA fallback)
        index_file = FRONTEND_BUILD_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file, media_type="text/html")
        
        return {
            "message": "FutureYou API is running. Frontend not built. Run: cd futureyou/frontend && npm install && npm run build"
        }
else:
    @app.get("/{full_path:path}")
    def catch_all(full_path: str):
        return {
            "message": "FutureYou API is running. Frontend not built. Run: cd futureyou/frontend && npm install && npm run build"
        }
