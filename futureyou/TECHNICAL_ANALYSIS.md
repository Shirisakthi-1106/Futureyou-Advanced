# FutureYou Project: Comprehensive Technical Analysis

**Date:** March 31, 2026  
**Project:** FutureYou - ML-driven trajectory prediction with conversational AI interface  
**Overview:** A sophisticated application combining machine learning, real-time prediction, 3D visualization, and generative AI to help users understand their potential future trajectories based on current habits.

---

## Table of Contents

1. [Backend Architecture & Framework](#backend-architecture--framework)
2. [ML/Prediction System](#mlprediction-system)
3. [Trends & Projections Logic](#trends--projections-logic)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Flow: Complete Pipeline](#data-flow-complete-pipeline)
6. [Key Technical Decisions](#key-technical-decisions)
7. [Database & Persistence](#database--persistence)
8. [Authentication & Security](#authentication--security)
9. [API Endpoints Summary](#api-endpoints-summary)
10. [Performance Optimizations](#performance-optimizations)

---

## Backend Architecture & Framework

### Technology Stack

**Framework:** FastAPI (Python web framework) + Streamlit (UI layer)

```
Requirements (from requirements.txt):
- FastAPI >= 0.100.0        (REST API framework)
- Uvicorn >= 0.23.0         (ASGI server)
- Streamlit >= 1.32.0       (Streamlit pages)
- Scikit-learn == 1.4.0     (ML models)
- Pandas >= 2.0.0           (Data processing)
- NumPy >= 1.24.0           (Numerical computing)
- Joblib >= 1.3.0           (Model serialization)
- SHAP >= 0.44.0            (Model explainability)
- Requests >= 2.31.0        (HTTP client)
- Groq API integration      (LLM backbone)
```

### Entry Points

1. **Streamlit Application** ([app.py](app.py#L1-L50))
   - Main landing page at `app.py`
   - Multi-page structure in `/pages/` directory:
     - [1_📝_Your_Habits.py](pages/1_📝_Your_Habits.py) - Habit input UI
     - [2_📊_Trajectory_Dashboard.py](pages/2_📊_Trajectory_Dashboard.py) - Predictions visualization
     - [3_🔮_Future_You_Chat.py](pages/3_🔮_Future_You_Chat.py) - Conversational AI interface

2. **FastAPI Backend** ([api.py](api.py#L1-L50))
   - RESTful API for React frontend
   - CORS middleware enabled for cross-origin requests
   - Runs on port 8000 (uvicorn)
   - Health check endpoint: `GET /health`

**Key File Structure:**
```
futureyou/
├── app.py                  # Streamlit entry point
├── api.py                  # FastAPI backend (core API)
├── train_models.py         # ML model training pipeline
├── predictor.py            # Prediction engine + trajectory generation
├── sentinel.py             # Risk evaluation system
├── email_service.py        # Guardian alert system
├── utils.py                # Styling & utilities
├── models/                 # Trained model artifacts (.pkl files)
├── data/                   # Training datasets (4 CSVs, 97k+ records)
└── frontend/               # React + Three.js UI
```

### API Architecture

The FastAPI backend ([api.py](api.py)) follows RESTful design with the following structure:

**Startup Event** ([api.py#L61-L65](api.py#L61-L65)):
```python
@app.on_event("startup")
async def startup_event():
    global models
    if models is None:
        print("WARNING: Models not found on startup!")
```

Models are loaded once at startup using `load_models()` from [predictor.py](predictor.py#L8-L47).

**Memory System (RAG)** ([api.py#L27-L49](api.py#L27-L49)):
- JSON-based persistent memory (`memory.json`)
- Stores up to 10 most recent predictions per user
- User ID keyed storage for tracking changes over time
- Enables "agentic memory awareness" - model considers user history

---

## ML/Prediction System

### Models Overview

Four distinct ML models trained on real datasets, detailed in [train_models.py](train_models.py):

| Model | Type | Dataset | Size | Features | Target | Metric |
|-------|------|---------|------|----------|--------|--------|
| **exam_score_model** | GradientBoostingRegressor | Student Habits | 80,000 | 10 | Academic score | MAE: ~5-8 pts, R²: 0.65+ |
| **dropout_model** | GradientBoostingClassifier | Student Habits | 80,000 | 10 | Dropout risk (binary) | Accuracy: 85%+ |
| **stress_model** | GradientBoostingRegressor | Stress Dataset | 1,100 | 9 | Stress level | MAE: ~0.3 pts |
| **wellbeing_model** | RandomForestRegressor | Lifestyle Dataset | 15,972 | 9 | Work-life balance | MAE: ~0.5, R²: 0.70+ |

**Dataset Sources:**
1. [data/enhanced_student_habits_performance_dataset.csv](data/enhanced_student_habits_performance_dataset.csv) - 80,000 students
2. [data/StressLevelDataset.csv](data/StressLevelDataset.csv) - 1,100 students
3. [data/Wellbeing_and_lifestyle_data_Kaggle.csv](data/Wellbeing_and_lifestyle_data_Kaggle.csv) - 15,972 people
4. [data/student-por.csv](data/student-por.csv) - Secondary dataset

### Model Loading & Persistence

**Model Serialization** ([train_models.py#L85-L106](train_models.py#L85-L106)):
```python
joblib.dump(exam_model, "models/exam_model.pkl")
joblib.dump(dropout_model, "models/dropout_model.pkl")
joblib.dump(scaler_main, "models/scaler_main.pkl")
joblib.dump(FEATURES_MAIN, "models/features_main.pkl")
# ... and similar for stress and wellbeing models
```

**Load Function** ([predictor.py#L8-L47](predictor.py#L8-L47)):
- Loads 12 artifacts (4 models × 3 support files)
- Initializes SHAP TreeExplainers for model explainability
- Returns None if models not found (fail-safe)

### Prediction Pipeline

**Main Prediction Function** ([predictor.py#L56-L154](predictor.py#L56-L154)):

Input: User habits dictionary containing:
```python
{
    "sleep_hours": 6.5,                    # hours/night
    "study_hours": 3.0,                    # hours/day
    "screen_time": 6.0,                    # hours/day
    "social_media_hours": 3.0,             # hours/day
    "exercise_frequency": 2,               # days/week (0-7)
    "mood_score": 6,                       # 1-10
    "diet_quality": 1,                     # 0=Poor, 1=Fair, 2=Good
    "mental_health_rating": 6              # 1-10
}
```

**Processing Steps:**

1. **Feature Engineering** ([predictor.py#L78-L90](predictor.py#L78-L90)):
   - Derived features calculated from inputs:
     - `attendance = min(100, max(0, 60 + study * 5 - social_media * 2))`
     - `time_mgmt = min(10, max(0, (study * 1.2 + sleep * 0.5 - screen * 0.3)))`
     - `stress_approx = min(10, max(0, 10 - mood - sleep * 0.3 + social_media * 0.4))`

2. **Exam Score Prediction** ([predictor.py#L92-L103](predictor.py#L92-L103)):
   ```python
   x_main = np.array([[sleep, study, social_media, exercise, 
                       diet, mh, stress_approx, screen, 
                       attendance, time_mgmt]])
   x_main_s = models["scaler_main"].transform(x_main)
   exam_score = float(models["exam"].predict(x_main_s)[0])
   exam_score = np.clip(exam_score, 0, 100)
   dropout_prob = float(models["dropout"].predict_proba(x_main_s)[0][1])
   ```
   - Clipped to [0, 100] range
   - Dropout probability extracted from positive class

3. **Stress Level Prediction** ([predictor.py#L105-L131](predictor.py#L105-L131)):
   - Maps user inputs to stress dataset features:
     - `self_esteem = min(20, max(0, mh * 2))`
     - `sleep_quality = min(5, max(0, sleep / 2))`
     - `anxiety = min(21, max(0, stress_approx * 1.5))`
   - Clipped to [0, 2] range (categorical: 0=low, 1=mid, 2=high)

4. **Wellbeing Score Prediction** ([predictor.py#L133-L149](predictor.py#L133-L149)):
   - Maps to lifestyle dataset features
   - Clipped to [1, 10] range

5. **SHAP Explainability** ([predictor.py#L151-L169](predictor.py#L151-L169)):
   - Generates feature importance for top 3 contributing factors
   - Separate SHAP values for each model
   - Returns impact (numerical) and direction (positive/negative)

**Output:**
```python
{
    "exam_score": 72.5,           # 0-100
    "dropout_prob": 15.2,         # percentage
    "stress_level": 1.45,         # 0-2
    "stress_pct": 72.5,           # 0-100 (normalized)
    "wellbeing_score": 6.8,       # 1-10
    "attendance": 82.3,           # 0-100
    "time_mgmt": 5.2,             # 0-10
    "insights": {
        "exam": [{"feature": "sleep_hours", "impact": 2.34, "direction": "positive"}, ...],
        "dropout": [...],
        "stress": [...],
        "wellbeing": [...]
    }
}
```

---

## Trends & Projections Logic

### Trajectory Generation Algorithm

**Core Function:** [predictor.py#L173-L233](predictor.py#L173-L233)

The system generates **three parallel future trajectories** over N years (default 5):

1. **Current Trajectory** - Habits remain unchanged
2. **Declining Trajectory** - Habits gradually worsen
3. **Optimized Trajectory** - Habits improve toward healthy ranges

**Key Design:** Each trajectory is a year-by-year simulation where multiplier factors adjust habits incrementally.

#### Declining Trajectory Simulation

**Multiplier Logic** ([predictor.py#L195-L202](predictor.py#L195-L202)):

```python
# Declining trajectory: habits worsen by 8% per year compounded
factor = year * 0.08  # Year-based decay multiplier

inp["sleep_hours"] = max(4, inp["sleep_hours"] - factor * 1.5)
    # Maximum decay: -1.5 hrs/night per year
    # Hard floor: 4 hours minimum (biologically unsustainable below)

inp["study_hours"] = max(0, inp["study_hours"] - factor)
    # Linear decay in study hours

inp["social_media_hours"] = min(12, inp["social_media_hours"] + factor)
    # Social media increases (cap at 12 hrs/day)

inp["exercise_frequency"] = max(0, inp["exercise_frequency"] - factor * 0.5)
    # Exercise frequency decreases

inp["mental_health_rating"] = max(1, inp["mental_health_rating"] - factor * 0.8)
    # Mental health deteriorates

inp["mood_score"] = max(1, inp["mood_score"] - factor * 0.6)
    # Mood worsens
```

**Year 5 Declining Example:**
- Base sleep: 6.5h → Final: 6.5 - (5 * 0.08 * 1.5) = 5.5h
- Base study: 3.0h → Final: 3.0 - (5 * 0.08) = 2.6h
- Base social media: 3.0h → Final: 3.0 + (5 * 0.08) = 3.4h

#### Optimized Trajectory Simulation

**Multiplier Logic** ([predictor.py#L204-L212](predictor.py#L204-L212)):

```python
# Optimized trajectory: habits improve by 12% per year
factor = year * 0.12  # Year-based improvement multiplier

inp["sleep_hours"] = min(9, inp["sleep_hours"] + factor * 0.4)
    # Gradual increase to healthy range (max 9 hrs)
    # Multiplier 0.4 means slower improvement than decline

inp["study_hours"] = min(8, inp["study_hours"] + factor * 0.5)
    # Study increases toward productive range

inp["social_media_hours"] = max(0.5, inp["social_media_hours"] - factor * 0.6)
    # Digital minimalism applied aggressively

inp["exercise_frequency"] = min(7, inp["exercise_frequency"] + factor * 0.4)
    # Exercise increases to 7 days/week (max)

inp["mental_health_rating"] = min(10, inp["mental_health_rating"] + factor * 0.5)
    # Mental health improves

inp["mood_score"] = min(10, inp["mood_score"] + factor * 0.4)
    # Mood improves

inp["diet_quality"] = int(min(2, inp["diet_quality"] + (1 if year > 2 else 0)))
    # Diet quality jumps at year 3
```

**Year 5 Optimized Example:**
- Base sleep: 6.5h → Final: min(9, 6.5 + (5 * 0.12 * 0.4)) = 7.74h
- Base study: 3.0h → Final: min(8, 3.0 + (5 * 0.12 * 0.5)) = 3.3h
- Base social media: 3.0h → Final: max(0.5, 3.0 - (5 * 0.12 * 0.6)) = 1.8h

#### Trajectory Output Structure

**Format** ([predictor.py#L173-L180](predictor.py#L173-L180)):

```python
return {
    "current": [
        {"year": 0, "exam_score": 72.5, "stress_pct": 65.2, ..., "wellbeing_score": 6.8},
        {"year": 1, "exam_score": 71.8, "stress_pct": 64.1, ..., "wellbeing_score": 6.9},
        {"year": 2, "exam_score": 71.2, ...},
        {"year": 3, ...},
        {"year": 4, ...},
        {"year": 5, ...}
    ],
    "declining": [...],  # 6 data points (year 0-5)
    "optimized": [...]   # 6 data points (year 0-5)
}
```

Each year's data point is a full prediction result (exam_score, stress_pct, dropout_prob, wellbeing_score, etc.)

### Mathematical Model Summary

**Declining Model:**
$$\text{habit}_{declining}(t) = \text{habit}_0 - (0.08 \cdot t \cdot k)$$

where:
- $t$ = year (0-5)
- $k$ = habit-specific decay multiplier (1.5 for sleep, 1.0 for study, etc.)
- Floor constraints prevent unrealistic values

**Optimized Model:**
$$\text{habit}_{optimized}(t) = \text{habit}_0 + (0.12 \cdot t \cdot k)$$

where:
- $k$ = habit-specific improvement rate (0.4-0.6)
- Ceiling constraints maintain realism

**Key Insight:** The declining multiplier (0.08) is more conservative than optimized (0.12), reflecting that it's harder to improve than degrade rapidly.

---

## Frontend Architecture

### Technology Stack

**Framework:** React 18.3.1 + Vite 5.4.10

**Key Dependencies** ([frontend/package.json](frontend/package.json)):

```json
{
  "react": "^18.3.1",                    // UI framework
  "react-dom": "^18.3.1",                // React rendering
  "react-router-dom": "^7.13.1",         // Client-side routing
  "three": "^0.183.2",                   // 3D graphics
  "@react-three/fiber": "^8.17.10",      // React wrapper for Three.js
  "@react-three/drei": "^9.122.0",       // Three.js helpers
  "framer-motion": "^12.35.2",           // Animations & transitions
  "recharts": "^3.8.0",                  // Data visualization
  "tailwindcss": "^4.2.1",               // Utility-first CSS
  "axios": "^1.13.6",                    // HTTP client
  "firebase": "^12.11.0",                // Auth & database
  "@supabase/supabase-js": "^2.99.0",    // PostgreSQL backend
  "lucide-react": "^0.577.0"             // Icon library
}
```

### Page Structure & Routing

**App Router** ([frontend/src/App.jsx](frontend/src/App.jsx#L1-L45)):

```javascript
<Routes location={location} key={location.pathname}>
  <Route path="/" element={<Home />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
  <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
  <Route path="/persona" element={<ProtectedRoute><PersonaChat /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
  <Route path="/guardian-portal" element={<GuardianPortal />} />
</Routes>
```

**Protected Routes:** Chat, Simulation, Persona, and Profile require authentication via `ProtectedRoute` component.

### State Management

**Global Context** ([frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx)):

```javascript
export const AppContext = createContext();

export function AppProvider({ children }) {
    // User & Auth
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    // Habit Input
    const [habits, setHabits] = useState({
        sleep_hours: 6.5,
        study_hours: 3.0,
        screen_time: 6.0,
        // ... 5 more habit fields
    });
    
    // Predictions
    const [predictions, setPredictions] = useState(null);
    const [trajectory, setTrajectory] = useState(null);
    
    // UI State
    const [quests, setQuests] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [sentinelEvents, setSentinelEvents] = useState([]);
    
    // Settings
    const [settings, setSettings] = useState({
        guardianEmail: "",
        guardianEmails: [],
        guardianName: "Guardian",
        sentinelEnabled: true,
        voiceEnabled: true,
        voiceGender: "auto",
        // ...
    });
    
    // Avatar
    const [selectedAvatar, setSelectedAvatar] = useState({
        name: "Alucard",
        path: "/avatars/alucard.glb",
        gender: "male"
    });
    
    // Persistence
    useEffect(() => {
        localStorage.setItem("futureyou_settings", JSON.stringify(settings));
        setDoc(doc(db, "configs", user.uid), { settings }, { merge: true });
    }, [settings, user]);
}
```

**Persistence Strategy:**
- Primary: Firestore (cloud sync when user logged in)
- Secondary: LocalStorage (immediate access, fallback for demo users)
- Demo users: localStorage only, no cloud sync

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **Dashboard** | [Dashboard.jsx](frontend/src/pages/Dashboard.jsx) | Main prediction display with charts |
| **Chat** | [Chat.jsx](frontend/src/pages/Chat.jsx) | Conversational interface with Future-You |
| **ThreeCanvas** | [ThreeCanvas.jsx](frontend/src/components/ThreeCanvas.jsx) | 3D particle effects background |
| **AvatarCanvas** | [AvatarCanvas.jsx](frontend/src/components/AvatarCanvas.jsx) | 3D avatar model display |
| **SentinelStatusCard** | [SentinelStatusCard.jsx](frontend/src/components/SentinelStatusCard.jsx) | Risk alert display |
| **Timeline** | [Timeline.jsx](frontend/src/components/Timeline.jsx) | Story-driven milestone visualization |
| **RecoveryPlan** | [RecoveryPlan.jsx](frontend/src/components/RecoveryPlan.jsx) | Actionable improvement suggestions |

### 3D Visualization System

**Three.js Integration** ([frontend/src/components/ThreeCanvas.jsx](frontend/src/components/ThreeCanvas.jsx#L1-L85)):

1. **Data Particles Component** - 150 particles representing data points
   - Color based on wellbeing score
   - Position updated each frame
   - Bounce off boundaries
   - Emissive material for glow effect

2. **Trajectory Paths** - Visualize three paths (current/declining/optimized)
   - Drawn as 3D lines
   - Updated based on trajectory data

**Rendering Stack:**
- Canvas: React Three Fiber
- Scene: Multiple geometries + materials
- Camera: Orbital controls (built into Drei)
- Post-processing: Optional effects

### Avatar System

**Avatar Service** ([frontend/src/lib/avatarService.js](frontend/src/lib/avatarService.js)):

```javascript
async function saveAvatar(userId, avatarData) {
    const updatePayload = {
        avatar_preference: avatarData.avatar_preference,
        avatar_model_url: avatarData.avatar_model_url,
        avatar_type: avatarData.avatar_type
    };
    
    const { data, error } = await supabase
        .from("user_profiles")
        .update(updatePayload)
        .eq("id", userId)
        .select();
}
```

**Avatar Voices** ([frontend/src/lib/useAvatarVoice.js](frontend/src/lib/useAvatarVoice.js)):

```javascript
export function useAvatarVoice() {
    const playVoice = useCallback((text, personaId = 'future') => {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Voice selection based on gender
        const targetGender = settings.voiceGender === 'auto' 
            ? (selectedAvatar?.gender || 'male') 
            : settings.voiceGender;
            
        // Persona-based adjustments
        if (personaId === 'future') {
            pitch = 1.05;   // Confident
            rate = 1.08;    // Faster
        } else if (personaId === 'burnout') {
            pitch = 0.82;   // Regretful
            rate = 0.82;    // Slower
        }
        
        // Wellbeing modifier
        if (predictions.wellbeing_score >= 8) {
            pitch += 0.1;   // Happier
        }
        
        window.speechSynthesis.speak(utterance);
    });
}
```

### Data Visualization

**Dashboard Charts** ([frontend/src/pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx#L15-L65)):

Using Recharts library:

1. **Multiverse Chart** - Area chart showing all 3 trajectories over 5 years
   - X-axis: Years
   - Y-axes: Exam score, Stress percentage
   - Three colored areas: current (cyan), declining (red), optimized (green)

2. **Radar Chart** - 6-axis habit profile
   - Sleep (normalized by 12h)
   - Study (normalized by 16h)
   - Screen time (inverted, 0-16h)
   - Mood (normalized to 100)
   - Diet (0-2 → 0-100%)
   - Exercise (0-7 → 0-100%)

3. **Pie Chart** - Time allocation across 24 hours
   - Sleep, Study, Screen, Social media, Other

4. **Line Charts** - Individual prediction metrics

---

## Data Flow: Complete Pipeline

### Request Flow: User Input → Predictions

**Step 1: Frontend Form Submission** ([frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx))
```
User fills habit form with 8 inputs:
  sleep_hours, study_hours, screen_time, social_media_hours,
  exercise_frequency, mood_score, diet_quality, mental_health_rating
```

**Step 2: API Request** → `POST /predict` ([api.py#L66-L101](api.py#L66-L101))
```javascript
// Frontend code
const response = await axios.post(`${API_URL}/predict`, {
    user_id: user?.uid,
    sleep_hours: 6.5,
    study_hours: 3.0,
    // ... other habits
    years_ahead: 5
});
```

**Step 3: Backend Processing** ([api.py#L66-L101](api.py#L66-L101))

```python
@app.post("/predict")
def get_predictions(data: UserInput):
    ui_dict = data.dict()
    
    # 1. Get predictions from all 4 models
    predictions = predict_all(models, ui_dict)
    
    # 2. Generate 3 trajectories (5-year simulation)
    trajectory = generate_trajectory(models, ui_dict, years=5)
    
    # 3. Generate quests from SHAP insights
    quests = generate_quests(predictions.get("insights", {}))
    
    # 4. Build LLM context (optional)
    future_context = build_future_context(predictions, ui_dict, trajectory)
    
    # 5. Save to user memory
    save_to_memory(data.user_id, {
        "type": "prediction",
        "habits": ui_dict,
        "exam_score": predictions["exam_score"],
        "stress_level": predictions["stress_pct"]
    })
    
    # 6. Evaluate sentinel risk
    sentinel_result = evaluate_sentinel_risk(predictions, trajectory, ui_dict)
    
    # 7. Send guardian alert (if triggered)
    # ... email logic
    
    return {
        "predictions": predictions,
        "trajectory": trajectory,
        "quests": quests,
        "timeline": timeline_items,
        "sentinel": sentinel_result
    }
```

**Step 4: Frontend State Update** ([frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx#L77-L82))
```javascript
setPredictions(response.predictions);
setTrajectory(response.trajectory);
setQuests(response.quests);
setTimeline(response.timeline);
setSentinelEvents([response.sentinel]);
```

**Step 5: Persistence**
- Predictions saved to localStorage
- If authenticated: synced to Firestore
- Memory saved to `memory.json` on backend

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (React)                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ User Input Form (Home.jsx)                         │  │
│ │ - 8 habit sliders/inputs                           │  │
│ └────────────────────────────────────────────────────┘  │
│                        ↓                                 │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Axios POST /predict                                │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ BACKEND (FastAPI)                                       │
│ ┌────────────────────────────────────────────────────┐  │
│ │ POST /predict (api.py line 66)                     │  │
│ │ Pydantic validation → UserInput object             │  │
│ └────────────────────────────────────────────────────┘  │
│         ↓                                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ predict_all(models, user_input)                    │  │
│ │ (predictor.py line 56)                             │  │
│ │ - Feature engineering                              │  │
│ │ - 4 model predictions                              │  │
│ │ - SHAP explanations                                │  │
│ └────────────────────────────────────────────────────┘  │
│         ↓                                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ generate_trajectory(models, user_input, years=5)  │  │
│ │ (predictor.py line 173)                            │  │
│ │ - Current: year-by-year with same habits          │  │
│ │ - Declining: 0.08 multiplier decay                │  │
│ │ - Optimized: 0.12 multiplier improvement          │  │
│ └────────────────────────────────────────────────────┘  │
│         ↓                                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ evaluate_sentinel_risk(predictions, trajectory)   │  │
│ │ (sentinel.py line 1)                               │  │
│ │ - Risk scoring (multi-threshold)                   │  │
│ │ - Severity level: low/medium/high/critical        │  │
│ │ - Guardian alert decision                          │  │
│ └────────────────────────────────────────────────────┘  │
│         ↓                                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Optional: send_sentinel_alert(emails)             │  │
│ │ (email_service.py line 40+)                        │  │
│ │ - SMTP connection                                  │  │
│ │ - HTML email generation                            │  │
│ │ - Multi-recipient support                          │  │
│ └────────────────────────────────────────────────────┘  │
│         ↓                                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ save_to_memory(user_id, prediction_data)          │  │
│ │ (api.py line 27)                                   │  │
│ │ - memory.json persistence                          │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ RESPONSE JSON                                           │
│ {                                                       │
│   "predictions": {...},                             │
│   "trajectory": {current: [...], declining: [...], │
│                  optimized: [...]},                 │
│   "quests": [{...}, {...}],                         │
│   "timeline": [{...}, {...}],                       │
│   "sentinel": {...}                                 │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ FRONTEND (State Update)                                 │
│ Context: setPredictions(), setTrajectory(),            │
│          setQuests(), setSentinelEvents()               │
│         ↓                                               │
│ Dashboard renders:                                      │
│ - Multiverse charts (3 trajectories)                   │
│ - Metrics cards (exam score, stress, dropout, etc)    │
│ - Quests / Recovery Plan                              │
│ - Timeline milestones                                  │
│ - Sentinel status indicator                            │
└─────────────────────────────────────────────────────────┘
```

### Chat Pipeline: Future-You Conversation

**Flow:** User message → Backend context building → Groq LLM → Response

1. **User Sends Message** → `POST /chat` ([api.py#L313-L365](api.py#L313-L365))

2. **Context Building** ([api.py#L313-L330](api.py#L313-L330))
```python
future_context = build_future_context(predictions, ui_dict, trajectory)
# Includes:
# - Current predictions (exam, stress, wellbeing)
# - User's exact habit numbers
# - 5-year trajectory comparisons
# - Problem habits identified

# If user has history: add "agentic memory"
memory_context = f"""
You have interacted with this user before.
Their first exam score was {first_mem.exam_score}, current is {predictions.exam_score}.
"""
```

3. **Message Assembly** ([api.py#L331-L338](api.py#L331-L338))
```python
messages = [
    {"role": "system", "content": future_context + memory_context},
    # ... previous chat history (last 6 messages)
    {"role": "user", "content": user_message}
]
```

4. **LLM Call** → Groq API (llama-3.3-70b-versatile)
```python
resp = requests.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
    json={
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "max_tokens": 200,
        "temperature": 0.85,  # Balanced creativity
    }
)
```

5. **Response Processing** ([api.py#L339-L354](api.py#L339-L354))
```python
reply = data["choices"][0]["message"]["content"]

# Save to memory (for next context building)
save_to_memory(user_id, {
    "type": "chat",
    "user_msg": user_message,
    "agent_reply": reply
})
```

6. **Frontend Display**
```javascript
// Chat.jsx
setChatHistory([...history, 
    {role: "user", content: message},
    {role: "future", content: reply}
]);

// Avatar speaks (optional)
useAvatarVoice().playVoice(reply, personaId='future');
```

---

## Key Technical Decisions

### 1. **Dual Frontend Architecture: Streamlit + React**

**Why Two?**
- **Streamlit** ([app.py](app.py)): Rapid prototyping, no-code data viz, internal/admin interface
- **React** ([frontend/](frontend/)): Polished UX, complex interactions, production web app

**Trade-off:** Duplication of some logic, but allows iterative development on both fronts.

### 2. **Ensemble ML Approach (4 Models)**

**Why Multiple Models?**
- No single model captures all aspects (academic performance ≠ stress ≠ wellbeing)
- Real-world data is domain-specific (student vs. general population)
- Increased confidence through triangulation

**Feature Multiplexing:**
- Different feature sets optimized per model
- Feature engineering happens at prediction time (not stored)

### 3. **SHAP-based Feature Importance**

**Why SHAP over basic feature importance?**
- TreeExplainer is fast for ensemble models
- Per-sample explanations (not just global)
- Handles feature interactions

**Output:** Top 3 contributing factors with direction → **Quests**

### 4. **Year-by-Year Simulation (Not Curve Fitting)**

**Why Year-by-Year?**
- Linear decay/improvement multipliers are interpretable
- Non-linear curves (sigmoid, exponential) less explainable to users
- Easier to adjust multipliers per feedback

**Constants Used:**
- Declining rate: 0.08/year (conservative)
- Optimizing rate: 0.12/year (faster improvement)
- Habit-specific multipliers: 0.5-1.5x

### 5. **Firebase + Supabase Dual Database**

**Firebase (React Frontend):**
- Authentication (Google, email)
- Real-time Firestore sync for settings/configs
- Fast writes for UI responsiveness

**Supabase (Avatar Storage):**
- PostgreSQL for user profiles
- Avatar model URLs and preferences
- Traditional RDBMS advantages

**Why Both?** Firebase auth is industry standard; Supabase makes sense for avatar system which needs PostgreSQL.

### 6. **Groq LLM (Not OpenAI/Claude)**

**Why Groq?**
- Free tier for API access
- 70B parameter model (competitive quality)
- Lower latency than competitors
- Suitable for education use case

**Alternative Considered:** Huggingface inference, but Groq won out for simplicity.

### 7. **Memory System (JSON, Not Database)**

**Why Simple JSON?**
```python
memory.json:
{
  "user_id_1": [
    {type: "prediction", exam_score: 72.5, stress_level: 65.2, timestamp: "2024-03-31T10:00:00"},
    {type: "chat", user_msg: "...", agent_reply: "...", timestamp: "..."}
  ],
  "user_id_2": [...]
}
```

- Keeps last 10 entries per user → bounded memory
- Fast lookups (JSON keys)
- Sufficient for prototype (scales to ~1-2k users)

**At scale:** Would migrate to TimescaleDB or MongoDB for better performance.

### 8. **3D Visualization (Three.js)**

**Why 3D?**
- Engages users emotionally
- Differentiates from text-based predictions
- Particle effects visualize "data coming alive"

**Trade-off:** Higher CPU/GPU usage, but acceptable for modern browsers.

### 9. **Guardian Alert System (Email)**

**Why SMTP instead of Twilio/SendGrid?**
- Self-hosted SMTP (Gmail support)
- Lower cost
- Direct control over templates

**Cooldown Logic:** 4-hour minimum between emails (unless severity escalates to critical).

### 10. **Pydantic Validation**

**Why Pydantic for API inputs?**
```python
class UserInput(BaseModel):
    sleep_hours: float
    study_hours: float
    # ... all fields with type hints
    
    # Automatic validation at request time
```

- Auto schema generation (`/docs`)
- Type safety
- Prevents garbage data from frontend

---

## Database & Persistence

### Frontend Persistence Layer

**Local Storage** (primary for demo users):
```javascript
localStorage.setItem("futureyou_settings", JSON.stringify(settings));
localStorage.setItem("futureyou_predictions", JSON.stringify(predictions));
localStorage.setItem("futureyou_trajectory", JSON.stringify(trajectory));
localStorage.setItem("futureyou_habits", JSON.stringify(habits));
localStorage.setItem("futureyou_selected_avatar", JSON.stringify(selectedAvatar));
```

**Firestore** (cloud sync for authenticated users):
```javascript
// Settings sync
useEffect(() => {
    setDoc(doc(db, "configs", user.uid), { settings }, { merge: true });
}, [settings, user]);

// Avatar sync
useEffect(() => {
    setDoc(doc(db, "configs", user.uid), { selectedAvatar }, { merge: true });
}, [selectedAvatar, user]);
```

**Firestore Collections:**
- `configs/{userId}` → User preferences, avatar choice, settings
- Could expand to: `predictions/{userId}/list`, `chat_history/{userId}/list`

### Backend Persistence

**User Memory** (`memory.json` in [api.py#L27-L49](api.py#L27-L49)):
```json
{
  "anonymous": [{...}, {...}],
  "user_123": [
    {
      "type": "prediction",
      "habits": {...},
      "exam_score": 72.5,
      "stress_level": 65.2,
      "timestamp": "2024-03-31T10:00:00"
    },
    {
      "type": "chat",
      "user_msg": "Can I improve my exam score?",
      "agent_reply": "Yes, if you focus on sleep and study hours...",
      "timestamp": "2024-03-31T10:05:00"
    }
  ]
}
```

**Model Artifacts** (in `models/` directory):
```
models/
├── exam_model.pkl          # GradientBoostingRegressor
├── dropout_model.pkl       # GradientBoostingClassifier
├── stress_model.pkl        # GradientBoostingRegressor
├── wb_model.pkl            # RandomForestRegressor
├── scaler_main.pkl         # StandardScaler (exam/dropout)
├── scaler_stress.pkl       # StandardScaler (stress)
├── scaler_wb.pkl           # StandardScaler (wellbeing)
├── features_main.pkl       # Feature list (exam/dropout)
├── features_stress.pkl     # Feature list (stress)
└── features_wb.pkl         # Feature list (wellbeing)
```

Total: 12 files per model set, ~50-100 MB combined.

### Avatar Storage (Supabase)

**Schema** (from avatarService.js):
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  avatar_preference TEXT,
  avatar_model_url TEXT,       -- Path to .glb file
  avatar_type VARCHAR(50),     -- "default", "custom", etc.
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Avatar Model Files** (static hosting):
```
public/avatars/
├── alucard.glb
├── aria.glb
├── sentinel.glb
└── [custom user avatars]
```

---

## Authentication & Security

### Firebase Authentication

**Supported Methods** ([frontend/src/components/AuthModal.jsx](frontend/src/components/AuthModal.jsx)):
1. Google OAuth
2. Email/Password
3. Demo Mode (guest access)

**Implementation** ([frontend/src/context/AppContext.jsx#L116-L153](frontend/src/context/AppContext.jsx#L116-L153)):

```javascript
// Demo user (no Firebase required)
const loginDemoUser = (customUser) => {
    const demoUser = customUser || {
        uid: "demo-user",
        email: "demo@futureyou.local",
        displayName: "Demo User",
        isDemo: true
    };
    localStorage.setItem("futureyou_demo_user", JSON.stringify(demoUser));
    setUser(demoUser);
};

// Real Firebase auth
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!localStorage.getItem("futureyou_demo_user")) {
            setUser(firebaseUser);
        }
        setAuthLoading(false);
    });
    return () => unsubscribe();
}, []);
```

**Auth Protection** ([frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx)):
```javascript
export default function ProtectedRoute({ children }) {
    const { user, authLoading } = useContext(AppContext);
    
    if (authLoading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/" />;
    
    return children;
}
```

### API Security

**CORS Configuration** ([api.py#L15-L20](api.py#L15-L20)):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Development only - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Pydantic Input Validation** ([api.py#L22-L46](api.py#L22-L46)):
- All user inputs validated before processing
- Type checking prevents injection attacks
- Range constraints (e.g., mood 1-10)

**Environment Variables** ([api.py#L10](api.py#L10)):
```python
from dotenv import load_dotenv
load_dotenv()  # Load from .env file (not in git)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SMTP_USER = os.getenv("SMTP_USER")
# ... sensitive data never hardcoded
```

### Sentinel Alert Security

**Guardian Email Validation** ([sentinel.py#L1-L50](sentinel.py#L1-L50)):
- Risk only triggers for high/critical severity
- 4-hour cooldown prevents spam
- Escalation check: bypass cooldown if severity increases

**Email Template Sanitization** ([email_service.py#L40+](email_service.py#L40+)):
- Plain text + HTML alternative
- No user-generated content directly in email
- All data escaped/validated before rendering

---

## API Endpoints Summary

### Core Endpoints

| Method | Path | Input | Output | Purpose |
|--------|------|-------|--------|---------|
| `GET` | `/health` | None | `{status: "ok", models_loaded: bool}` | Server status check |
| `POST` | `/predict` | UserInput | Predictions + Trajectory + Quests | Main prediction endpoint |
| `POST` | `/chat` | ChatRequest | `{reply: str}` | Future-You conversation |
| `POST` | `/parse_input` | `{message: str}` | UserInput | NL→structured input parsing |
| `POST` | `/send_sentinel_alert` | SentinelRequest | `{sent_to: [...], error: str}` | Manual alert trigger |
| `GET` | `/smtp-status` | None | SMTP config status | Frontend checks email readiness |
| `POST` | `/feedback` | FeedbackRequest | `{saved: bool}` | User-reported actual outcomes |

### Data Models

**UserInput** ([api.py#L22-L46](api.py#L22-L46)):
```python
class UserInput(BaseModel):
    user_id: str = "anonymous"
    sleep_hours: float
    study_hours: float
    screen_time: float
    social_media_hours: float
    exercise_frequency: int
    mood_score: int
    diet_quality: int           # 0=Poor, 1=Fair, 2=Good
    mental_health_rating: int
    years_ahead: int = 5
    guardian_emails: list[str]  # Multi-recipient support
    guardian_name: str
    sentinel_enabled: bool
```

**ChatRequest** ([api.py#L56-L61](api.py#L56-L61)):
```python
class ChatRequest(BaseModel):
    user_input: UserInput
    message: str
    history: list[ChatMessage] = []  # Conversation context
```

**PersonaChatRequest** ([api.py#L63-L68](api.py#L63-L68)):
```python
class PersonaChatRequest(BaseModel):
    persona_id: str              # "future", "burnout", "present"
    system_prompt: str           # Custom character instructions
    message: str
    history: list[ChatMessage]
    user_input: UserInput        # For context building
```

---

## Performance Optimizations

### Backend Optimizations

1. **Model Caching** ([predictor.py#L8-L47](predictor.py#L8-L47)):
   - Models loaded once at startup
   - Not reloaded per request
   - Global variable: `models`

2. **Batch Prediction**:
   - Single prediction generates all 4 models at once
   - Trajectory: 6 data points per trajectory (18 total predictions pre-computed)

3. **SHAP Caching**:
   - TreeExplainers created at startup
   - Reused for all predictions
   - Faster than SHAP force plot computation

4. **Memory Rolloff** ([api.py#L43-L48](api.py#L43-L48)):
   - Keeps only last 10 entries per user
   - Prevents unbounded memory growth
   - Fast lookup: O(1) per user

### Frontend Optimizations

1. **Usememo Hooks** ([frontend/src/pages/Dashboard.jsx#L14-L47](frontend/src/pages/Dashboard.jsx#L14-L47)):
   ```javascript
   const multiverseData = useMemo(() => {
       if (!trajectory) return [];
       return trajectory.current.map((pt, i) => ({ ... }));
   }, [trajectory]);  // Only recalculate if trajectory changes
   ```

2. **Lazy Component Loading** ([frontend/src/pages/Dashboard.jsx#L5-L10](frontend/src/pages/Dashboard.jsx#L5-L10)):
   ```javascript
   const Timeline = lazy(() => import('../components/Timeline'));
   const RecoveryPlan = lazy(() => import('../components/RecoveryPlan'));
   
   <Suspense fallback={<Placeholder />}>
       <Timeline />
   </Suspense>
   ```

3. **Skeleton Loading** ([frontend/src/components/DashboardSkeleton.jsx](frontend/src/components/DashboardSkeleton.jsx)):
   - Shows placeholder during data fetch
   - 15-second timeout → fallback message

4. **Three.js Optimization**:
   - 150 particles (not 1000+)
   - Sphere geometry simplified (8 segments)
   - Material reuse
   - useFrame at 60fps

### Database Query Optimization

**Firestore Sync** ([frontend/src/context/AppContext.jsx#L60-L76](frontend/src/context/AppContext.jsx#L60-L76)):
```javascript
// Only fetch once per user
useEffect(() => {
    if (user && !user.isDemo) {
        isSyncing.current = true;
        getDoc(doc(db, "configs", user.uid))
            .then(docSnap => { ... })
            .finally(() => { isSyncing.current = false; });
    }
}, [user]);
```

---

## Advanced Features

### Sentinel Risk Evaluation ([sentinel.py](sentinel.py))

**Multi-Layer Risk Scoring:**

1. **Critical Thresholds** ([sentinel.py#L50-L57](sentinel.py#L50-L57)):
   - Stress > 85%: +4 points
   - Dropout risk > 40%: +4 points
   - Wellbeing < 3.0: +3 points
   - Sleep < 4h: +3 points

2. **High Thresholds** ([sentinel.py#L59-L66](sentinel.py#L59-L66)):
   - Stress 70-85%: +2 points
   - Wellbeing 3-4: +2 points
   - Sleep < 5h: +2 points

3. **Combined Patterns** ([sentinel.py#L68-L75](sentinel.py#L68-L75)):
   - High stress + poor sleep: +2
   - Low wellbeing + high dropout: +2
   - Triple risk: stress + wellbeing + sleep: +2

4. **History-Aware** ([sentinel.py#L77-L88](sentinel.py#L77-L88)):
   - Sustained high stress (3+ entries avg > 75%): +2
   - Academic decline (5+ point drop): +1

5. **Trajectory Analysis** ([sentinel.py#L90-L118](sentinel.py#L90-L118)):
   - If declining 5-year score drop > 15 points: +2
   - If declining 5-year score drop 8-15 points: +1

**Severity Mapping** ([sentinel.py#L120-L127](sentinel.py#L120-L127)):
- Score ≥ 6: **CRITICAL**
- Score 4-5: **HIGH**
- Score 2-3: **MEDIUM**
- Score < 2: **LOW**

**Guardian Alert Decision** ([sentinel.py#L129-L131](sentinel.py#L129-L131)):
- Only `severity in ['high', 'critical']` trigger auto-alerts
- 4-hour cooldown unless severity escalates
- Email includes recovery suggestions

### Timeline Generation (LLM-Driven)

**Groq Call** ([api.py#L102-L143](api.py#L102-L143)):
```python
timeline_prompt = generate_timeline_narrative_prompt(trajectory, ui_dict)

resp = requests.post(
    "https://api.groq.com/openai/v1/chat/completions",
    json={
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system", 
                "content": "Return only JSON arrays of milestones"
            },
            {"role": "user", "content": timeline_prompt}
        ],
        "response_format": {"type": "json_object"},
        "max_tokens": 800,
        "temperature": 0.3,  # Deterministic (low creativity)
    }
)
```

**Example Prompt:**
```
Based on these 5-year projections:
- Year 0: exam 72.5, stress 65%, wellbeing 6.8
- Year 1: exam 71.8, stress 64%, wellbeing 6.9
- Year 5 (declining): exam 45.2, stress 90%, wellbeing 3.5
- Year 5 (optimized): exam 82.5, stress 40%, wellbeing 8.2

Generate 5 narrative milestones describing the journey year-by-year.
Return JSON array: [{year: 0, title: "...", description: "..."}, ...]
```

---

## Summary: Key Implementation Details

### Most Important Technical Insights

1. **Trajectory Generation is Simple but Effective**
   - Year-by-year multiplier adjustment (not curve fitting)
   - Constants: 0.08 declining, 0.12 optimizing per year
   - Produces intuitive "What if?" scenarios

2. **SHAP Integration Drives Quests**
   - Feature importance extracted per prediction
   - Top 3 features → actionable tasks
   - Makes ML "explainable" to users

3. **Dual Frontend Strategy**
   - Streamlit for dev/iteration
   - React for production polish
   - Both hitting same FastAPI backend

4. **Sentinel is Multi-Layered Risk System**
   - Not just "stress > 70%"
   - Composite scoring (thresholds + patterns + history + trajectory)
   - Severity escalation logic prevents alert fatigue

5. **Memory System Enables Personalization**
   - JSON history stored in file
   - LLM uses past context to reference user's journey
   - "You improved from 65 to 72" — makes responses personal

---

## Recommendations for Future Enhancement

1. **Database Migration:** Replace `memory.json` with PostgreSQL (TimescaleDB) for scalability
2. **Model Retraining:** Automate monthly retraining on aggregated feedback data
3. **Real-Time Collaboration:** WebSocket support for simultaneous multi-user editing
4. **Mobile App:** React Native port of frontend (share business logic)
5. **Advanced Visualizations:** 3D trajectory surfaces, predictive confidence intervals
6. **A/B Testing:** Flask blueprint for variant testing of different UI layouts
7. **Blockchain Certificates:** Store milestone achievements as verifiable credentials

---

**Generated:** March 31, 2026  
**Analysis By:** Technical Documentation System  
**Project Status:** Production prototype with advanced ML + 3D UI
