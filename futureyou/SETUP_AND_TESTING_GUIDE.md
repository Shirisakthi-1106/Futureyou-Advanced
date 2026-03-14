# FutureYou Advanced Features - Setup & Testing Guide

## Overview
All advanced features have been implemented:
1. ✅ **Natural Language Input** - Parse sentences to populate sliders
2. ✅ **Explainable AI Insights (SHAP)** - See why ML models gave specific scores
3. ✅ **Multiverse Trajectory** - 3 diverging timelines visualization
4. ✅ **3D "Future Self" Avatar** - Particle wave tied to ML predictions
5. ✅ **Agentic Memory Chat** - Persistent memory across sessions
6. ✅ **Continuous Fine-Tuning MVP** - Log actual vs predicted values

## Prerequisites

### Backend Requirements
- Python 3.9+
- FastAPI, Uvicorn
- scikit-learn, numpy, pandas, shap
- python-dotenv, requests
- Groq API Key (free at https://console.groq.com)

### Frontend Requirements
- Node.js 16+
- React, Vite
- axios, framer-motion, recharts, three.js

## Installation & Setup

### Step 1: Backend Setup
```bash
cd d:\futureyou\futureyou

# Install Python dependencies
pip install -r requirements.txt

# Create .env file with required variables
# Add at minimum:
# GROQ_API_KEY=your_key_here
```

### Step 2: Train Models (if not already done)
```bash
# From futureyou directory
python train_models.py
# This will create models/ directory with all .pkl files
```

### Step 3: Start Backend
```bash
# From futureyou directory - runs on http://localhost:8000
uvicorn api:app --reload --port 8000
```

### Step 4: Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# This will run on http://localhost:5173
```

### Step 5: Verify Apps are Running
- Backend: Visit http://localhost:8000/health → should return `{"status": "ok", "models_loaded": true}`
- Frontend: Visit http://localhost:5173 → should load FutureYou app

---

## Feature Testing Guide

### 1. Natural Language Input 🗣️
**Where:** Home page (top button toggle)

**How to test:**
1. Click on "Describe Your Day" tab
2. Type a sentence like:
   ```
   I slept for 5 hours, studied for 8, spent 4 hours on social media, and exercised 3 times this week. I'm feeling pretty stressed but eating okay.
   ```
3. Click "Extract Data" button
4. Watch as sliders automatically populate with parsed values

**What's happening:**
- Frontend sends text to `/parse_input` endpoint
- Groq LLM extracts structured habits data  
- Frontend updates sliders with parsed values
- User can review/adjust before predicting

---

### 2. Explainable AI Insights (SHAP) 🧠
**Where:** Dashboard page (top section after prediction)

**How to test:**
1. From Home page, adjust sliders to different values
2. Click "Generate Trajectory"
3. On Dashboard, look at the **"AI Insights (Why did I get this prediction?)"** section
4. You'll see 3 columns: Academic Performance, Dropout Risk, Stress Level
5. Each column shows top 3 factors with:
   - Green "+X%" = positive contributor
   - Red "-X%" = negative contributor

**What's happening:**
- SHAP TreeExplainer calculates feature importance for each prediction
- Backend returns `insights` object with top contributing factors
- Dashboard displays these as colored impact scores
- Numbers show exact percentage impact on final prediction

**Example output you might see:**
- Academic Performance: Study Hours +15%, Screen Time -8%
- Dropout Risk: Mental Health -12%, Social Media +5%
- Stress Level: Sleep Hours -10%, Mood -8%

---

### 3. Multiverse Trajectory 🌌
**Where:** Dashboard page (middle section, two charts side-by-side)

**How to test:**
1. After prediction, scroll to "Multiverse" section
2. You'll see two line charts:
   - Left: **Academic Performance** (0-100)
   - Right: **Stress Forecast** (0-100%)
3. Each chart shows 3 lines:
   - **Cyan (Optimized)**: Best case - habits improve over 5 years
   - **White (Current)**: Stays same - habits unchanged
   - **Red (Declining)**: Worst case - habits worsen over 5 years
4. Hover over points to see exact year-by-year predictions

**What's happening:**
- Generator simulates 5 years of trajectory with 3 scenarios
- Each scenario applies different growth/decline factors
- Frontend plots all 3 paths on same graph to show "multiverse"
- Users can see potential futures based on habit choices

**Try this:**
1. Set bad habits (low sleep, high screen time)
2. Generate trajectory
3. See declining path go down, optimized path go up
4. Go back and improve 1 habit (e.g., add 2 hours sleep)
5. Generate again - see different curves!

---

### 4. 3D "Future Self" Avatar 🔮
**Where:** Dynamic background across entire app

**How to test:**
1. Check the animated particle wave in the background on any page
2. Go to Home, adjust habits to different extremes:
   - **Good habits** (high wellbeing) → wave turns **cyan** and **calm**
   - **Bad habits** (low wellbeing) → wave turns **red/purple** and **chaotic**
3. Generate prediction
4. On Dashboard, watch the wave dynamics change based on your dropoutrisk and stress

**What's happening:**
- `ThreeCanvas.jsx` creates 3D particle system using Three.js
- Wave color: `Green/Cyan` (wellbeing ≥ 7) → `Purple` (4-7) → `Red` (<4)
- Wave chaos: Increases with dropout probability
- Wave speed: Increases with stress levels
- Real-time updates via `predictions` context

**Try this to see dramatic changes:**
1. Start with balanced habits
2. Watch the calm cyan wave
3. Drastically reduce sleep to 3 hours, max out screen time
4. Generate - see the wave turn red/purple and erratic
5. Optimize all habits → wave becomes smooth cyan again

---

### 5. "Agentic Memory" Future-Self Chat 🤖
**Where:** Chat page (page 3)

**How to test:**
1. From Dashboard, go to Chat page
2. Have a brief conversation:
   ```
   User: "Will I pass my exams?"
   Future Self: [responds with your specific numbers]
   ```
3. Note what Future-Self says about your exam score and stress
4. **Go back to Home page**
5. Drastically change habits (make them much worse):
   - Reduce sleep from 6 to 3 hours
   - Increase screen time from 4 to 10 hours
   - Reduce exercise to 0 days
6. Generate new trajectory
7. Return to Chat page
8. Ask about your journey:
   ```
   User: "I made some changes..."
   Future Self: [NOW REFERENCES YOUR PREVIOUS SCORES!]
   ```

**What's happening:**
- Every prediction is saved to `memory.json` with timestamp
- Chat endpoint retrieves past memory and includes it in system prompt
- Groq LLM sees comparison: "You were at exam=75, stress=45% before. Now you're at exam=52, stress=68%!"
- Agent analyzes the delta and calls out the decline/improvement
- Chat history is kept in context (last 6 messages)

**Key evidence of memory:**
- Agent will say things like: "Wait, last time we talked you were scoring 75... what happened?!"
- Praise if habits improved: "I'm proud - you managed to fix your sleep!"
- Concern if declined: "I'm worried about this trajectory shift. You're slipping."

---

### 6. Continuous Fine-Tuning MVP 📉
**Where:** Dashboard page (bottom section)

**How to test:**
1. On Dashboard, scroll to **"Log Today's Reality"** section
2. You'll see two input fields:
   - Actual Exam Score (0-100)
   - Actual Stress Level (0-100%)
3. There's a placeholder showing what was predicted:
   - `Predicted: 75.2`
   - `Predicted: 52.1%`
4. Enter your actual values (they can be the same or different):
   - Exam: 72
   - Stress: 48
5. Click "Log Data" button
6. See success message: "Logged!"

**What's happening:**
- Data saved to `feedback.json` with timestamp
- Stores: user_id, actual scores, habits, prediction metadata
- In production, this data would be used to retrain models
- MVP shows the pipeline is ready for continuous learning

**Future enhancement:**
- After collecting enough feedback, retrain models with `model.partial_fit()`
- Update predictions to account for real-world performance
- Close the feedback loop: predict → measure → improve

**Check the data:**
- Open `feedback.json` to see logged entries
- Each entry has: timestamp, user_id, actual_exam_score, actual_stress_level, habits dict

---

## Troubleshooting

### 404 on `/parse_input`
**Cause:** Ghost process or old backend running on port 8000
**Solution:**
```bash
# Kill any process on 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Then restart backend:
uvicorn api:app --reload --port 8000
```

### SHAP insights not showing
**Check:**
1. Verify all .pkl files exist in `models/` directory
2. Run `python train_models.py` if missing files
3. Check browser console for errors
4. Verify `predictions.insights` has data in Redux/Context

### Chat not responding
**Check:**
1. GROQ_API_KEY is set in `.env`
2. Backend logs show Groq API request
3. Run `curl http://localhost:8000/health` to verify backend
4. Check network tab → `/chat` POST request status

### Wave avatar not updating
**Check:**
1. Open browser DevTools → Console
2. Verify `predictions` context value updates on each predict
3. Three.js canvas is rendering (should see particles)
4. Check `ThreeCanvas.jsx` receives `predictions` prop

### Models not loading
**Solution:**
```bash
# Regenerate models
python train_models.py

# Verify all files exist:
ls -la models/
# Should show: *.pkl files for exam, dropout, stress, wb models + scalers
```

---

## API Endpoint Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check if backend and models are loaded |
| `/predict` | POST | Get predictions + trajectory + SHAP insights |
| `/chat` | POST | Chat with future self (with memory) |
| `/parse_input` | POST | Parse NLP text to habit values |
| `/feedback` | POST | Log actual vs predicted for fine-tuning |

### Example Requests

**Predict:**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "sleep_hours": 7,
    "study_hours": 4,
    "screen_time": 6,
    "social_media_hours": 2,
    "exercise_frequency": 3,
    "mood_score": 7,
    "diet_quality": 1,
    "mental_health_rating": 7,
    "years_ahead": 5
  }'
```

**Parse NLP:**
```bash
curl -X POST http://localhost:8000/parse_input \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I sleep 6 hours, study 4 hours, spend 3 hours on social media daily. Exercise 2 times a week."
  }'
```

---

## Performance Notes

- **SHAP calculation:** ~200ms per prediction (TreeExplainer is fast)
- **Groq LLM calls:** ~2-5s (includes network latency)
- **3D rendering:** 60fps with 6400 particles
- **Memory persistence:** Stores last 10 interactions per user

## File Structure Reference

```
futureyou/
├── api.py                 # FastAPI backend (all 5 endpoints)
├── predictor.py           # ML models + SHAP explanations
├── train_models.py        # Model training pipeline
├── models/                # Trained models (.pkl files)
├── memory.json            # Agentic memory per user
├── feedback.json          # Continuous fine-tuning logs
├── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/pages/
│   │   ├── Home.jsx       # NLP input + sliders
│   │   ├── Dashboard.jsx  # SHAP insights, Multiverse, Feedback
│   │   └── Chat.jsx       # Future self chat (with memory)
│   ├── src/components/
│   │   └── ThreeCanvas.jsx # 3D avatar visualization
│   └── src/context/
│       └── AppContext.jsx  # State management
```

---

## Success Criteria ✅

You'll know everything is working when:

1. ✅ Natural Language: Type a sentence → sliders auto-populate
2. ✅ SHAP Insights: See colored +/- factors explaining predictions
3. ✅ Multiverse: See 3 diverging lines on trajectory chart
4. ✅ 3D Avatar: Wave changes color/chaos with habits
5. ✅ Memory Chat: Future-Self references previous interactions
6. ✅ Fine-Tuning: Feedback logged to `feedback.json`

---

## Next Steps (Future Enhancements)

- Implement actual model retraining with feedback data
- Add persistence layer (database instead of JSON files)
- Deploy models to edge/mobile
- Add more SHAP visualizations (force plots, dependence plots)
- Connect college course scraping from Feature #2

Happy future-self chatting! 🚀
