from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from dotenv import load_dotenv
from predictor import load_models, predict_all, generate_trajectory, build_future_context

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

class UserInput(BaseModel):
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
    
    return {
        "predictions": predictions,
        "trajectory": trajectory
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
            return {"reply": reply}
        else:
            raise HTTPException(status_code=500, detail=f"Groq API Error: {data.get('error', {}).get('message', 'Unknown error')}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")

# To run: uvicorn api:app --reload --port 8000
