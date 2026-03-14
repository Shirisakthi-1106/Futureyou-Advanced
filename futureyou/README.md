# 🔮 FutureYou — ML-Powered Life Trajectory Simulator

> Enter your daily habits → 4 real ML models predict your future → Talk to who you'll become

---

## 📋 Advanced Features (2024 Update)

✅ **All 6 advanced features now implemented:**
1. 🗣️ **Natural Language Input** - Describe your day in plain text, AI parses it to habits
2. 🧠 **Explainable AI (SHAP)** - See exactly which habits drive each prediction
3. 🌌 **Multiverse Trajectories** - Visualize 3 diverging futures: optimized, current, declining
4. 🔮 **3D Avatar** - Dynamic particle wave that reacts to your predictions
5. 🤖 **Agentic Memory Chat** - Future-You remembers previous conversations
6. 📊 **Continuous Fine-Tuning** - Log actual vs predicted to improve the model

---

## ⚡ Quick Start (5 minutes)

### For the Impatient
```bash
cd d:\futureyou\futureyou

# 1. Setup environment
cp .env.example .env
# Edit .env and add GROQ_API_KEY from https://console.groq.com

# 2. Verify everything
python verify_setup.py

# 3. Start backend (Terminal 1)
uvicorn api:app --reload --port 8000

# 4. Start frontend (Terminal 2)
cd frontend
npm install
npm run dev

# 5. Open http://localhost:5173 🎉
```

**Full setup guide:** See [`QUICKSTART.md`](QUICKSTART.md)

---

## 📚 Documentation

| Document | Purpose | Read When |
|----------|---------|-----------|
| **[QUICKSTART.md](QUICKSTART.md)** | 5-minute setup + feature overview | You want to run it NOW |
| **[SETUP_AND_TESTING_GUIDE.md](SETUP_AND_TESTING_GUIDE.md)** | Installation, configuration, API reference | Detailed setup needed |
| **[FEATURE_TESTING_GUIDE.md](FEATURE_TESTING_GUIDE.md)** | Step-by-step testing for each feature | Verify features work |
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | Technical architecture, data flows | Understanding the design |

---

## 🧠 How It Works

### The ML Pipeline (4 real ML models)

```
Your habits (sliders or natural language)
        ↓
Feature engineering
(attendance, time management score derived from habits)
        ↓
4 trained ML models run in parallel:
  ├── Gradient Boosting → Exam Score (trained on 80k students)
  ├── Gradient Boosting → Dropout Risk (trained on 80k students)  
  ├── Gradient Boosting → Stress Level (trained on 1.1k students)
  └── Random Forest    → Wellbeing Score (trained on 16k people)
        ↓
SHAP Explainers show which habits matter most
        ↓
Trajectory simulation:
  3 paths × 5 years × 4 metrics = full future map
        ↓
Agentic Memory recalls previous interactions
        ↓
LLM (LLaMA 3 via Groq) speaks as Future-You
grounded in real ML numbers (not generic roleplay)
```

### Datasets Used

| Dataset | Samples | Predicts |
|---|---|---|
| Student Habits & Performance | 80,000 | Exam score, dropout risk |
| Student Stress Factors | 1,100 | Stress level |
| Wellbeing & Lifestyle | 15,972 | Work-life balance score |
| Student Performance (UCI) | 649 | Supporting features |

### Why This Isn't Generic AI

❌ **Old:** "Hey ChatGPT, roleplay as my future self"

✅ **New:**
```
"This person sleeps 5.5hrs, studies 2hrs, 
spends 6hrs on social media. ML predicts:
exam score 61/100, dropout risk 34%, stress 72%.
5-year optimized: 84/100, current: 58/100, declined: 35/100.

Previous interaction: They were at 75, now dropped to 61.
NOW speak as their future self who lived this reality."
```

The LLM is grounded in real ML predictions from real models trained on real data.

---

## 🎯 Elevator Pitch for Presentations

*"I built an ML system that predicts a student's academic trajectory from daily habits — trained on 97,000 real student records across 4 datasets. Unlike generic advice apps, this generates a personalized 5-year projection showing three possible futures with SHAP-based explanations for each prediction. The Future-You chat isn't roleplay — it's an LLM grounded in real ML numbers about that specific person, with agentic memory that remembers if you improved or declined over time."*

---

## 📈 Model Performance

After running `python train_models.py`, check console output for:
- Exam Score Model: MAE and R² score
- Dropout Model: Accuracy
- Stress Model: MAE  
- Wellbeing Model: MAE and R²

Real metrics on held-out test data — not hand-wavy claims.

---

## 🔧 Tech Stack

### Backend
- **FastAPI** — REST API with CORS
- **Scikit-learn** — ML models (Gradient Boosting, Random Forest)
- **SHAP** — Model explainability
- **Groq API** — Free LLaMA 3.3 70B for LLM responses
- **Pandas/NumPy** — Data processing

### Frontend
- **React** — UI with Vite
- **Three.js** — 3D particle visualization
- **Recharts** — Data visualization
- **Axios** — HTTP client
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations

### Deployment
- **Uvicorn** — ASGI server for FastAPI
- **Vercel** — Frontend hosting (optional)

---

## 🚀 Deployment

### Backend (Production)
```bash
# Render.com, Railway, or your preferred Python host
gunicorn -w 4 -k uvicorn.workers.UvicornWorker api:app
```

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

See `vercel.json` for build configuration.

---

## 🔐 Important Notes

- ✅ Models are pre-trained and included
- ✅ Datasets not needed if models exist
- ⚠️ Predictions are probabilistic, not deterministic
- ⚠️ Models trained on student-specific data
- ✅ GROQ_API_KEY needed for LLM responses
- ✅ Supabase (optional) for authentication

---

## 📞 Troubleshooting

**Models not loading?**
```bash
python train_models.py
```

**Backend won't start?**
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
uvicorn api:app --reload --port 8000
```

**SHAP insights missing?**
- Verify all `.pkl` files in `models/` folder
- Check browser console for errors
- Run `verify_setup.py`

**Chat not responding?**
- Check GROQ_API_KEY in `.env`
- Verify backend health: `curl http://localhost:8000/health`
- Check network tab in browser DevTools

---

## 📂 Project Structure

```
futureyou/
├── api.py                    # FastAPI backend (all endpoints)
├── predictor.py             # ML models + SHAP explanations
├── train_models.py          # Model training pipeline
├── utils.py                 # Helper functions
├── models/                  # Trained ML models (pickle files)
├── data/                    # Training datasets
├── frontend/                # React + Vite app
│   ├── src/pages/           # Home, Dashboard, Chat pages
│   ├── src/components/      # 3D avatar, navbar, etc.
│   └── src/context/         # App state management
├── pages/                   # Streamlit pages (legacy)
├── QUICKSTART.md            # 5-minute setup
├── SETUP_AND_TESTING_GUIDE.md
├── FEATURE_TESTING_GUIDE.md
├── IMPLEMENTATION_SUMMARY.md
└── requirements.txt         # Python dependencies
```

---

## 🎓 Key Features Explained

### 1. Natural Language Input
Describe your day: "I slept 5 hours, studied 8 hours..."
→ AI extracts numerical habits → Sliders update automatically

### 2. SHAP Insights
See top 3 factors driving each prediction:
- Green +12% = Sleep increases exam score
- Red -8% = Screen time decreases it

### 3. Multiverse Trajectories
3 lines showing possible futures:
- Blue = Best case if you optimize
- Gray = Current path
- Red = Worst case if habits decline

### 4. 3D Avatar
Watch the particle wave react to your predictions:
- Cyan = Healthy predictions
- Purple = Neutral state
- Red = Risk indicators
- Speed = Stress level

### 5. Agentic Memory
Chat about how your habits changed:
- "Last time you were at exam 75, now 52. What happened?"
- Compares first vs current interaction
- Provides context-aware responses

### 6. Fine-Tuning Data
Log your actual vs predicted performance:
- Helps model learn from real outcomes
- Foundation for continuous improvement

---

*FutureYou: Where ML meets life planning. Academic project with real models, real data, real predictions.* 🚀


