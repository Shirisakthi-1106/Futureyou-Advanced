# FutureYou - Quick Start (5 Minutes)

## The Fastest Way to Get FutureYou Running

### Step 1: Get Groq API Key (2 minutes)
1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Copy it

### Step 2: Setup Environment (1 minute)
```bash
cd d:\futureyou\futureyou
```

Create `.env` file and paste:
```
GROQ_API_KEY=your_key_from_groq
VITE_API_URL=http://localhost:8000
```

### Step 3: Verify Setup (30 seconds)
```bash
python verify_setup.py
```
Should show all ✅ checks. If any ❌, follow suggestions in output.

### Step 4: Start Backend (1 terminal, runs forever)
```bash
# From: d:\futureyou\futureyou
uvicorn api:app --reload --port 8000
```
Should show: `Uvicorn running on http://127.0.0.1:8000`

### Step 5: Start Frontend (2nd terminal)
```bash
cd d:\futureyou\futureyou\frontend
npm install  # only first time
npm run dev
```
Should show: `Local: http://localhost:5173`

### Step 6: Open Browser
- Visit http://localhost:5173
- See the 3D background? ✅ You're in!

---

## Now Test the Features

### Feature 1: Natural Language Input 🗣️
1. Home page → Click "Describe Your Day" tab
2. Paste: "I sleep 6 hours, study 4, spend 3 hours on social media, exercise 2 times a week, mood is 6 out of 10"
3. Click "Extract Data"
4. **Watch the sliders auto-populate!** ✅

### Feature 2: Explainable AI 🧠
1. Home → Click "Generate Trajectory"
2. On Dashboard → Scroll up to "AI Insights" section
3. **See the top 3 factors driving your predictions with +/- percentages** ✅

### Feature 3: Multiverse Trajectories 🌌
1. Dashboard → Scroll to middle section
2. **See 3 diverging lines: optimized (cyan), current (white), declining (red)** ✅

### Feature 4: 3D Avatar 🔮
1. Home → Set bad habits (sleep 2h, study 0h)
2. "Generate Trajectory"
3. **Watch wave turn red and go chaotic** ✅
4. Go back, set great habits (sleep 8h, study 8h)
5. Generate again
6. **Wave becomes calm cyan** ✅

### Feature 5: Memory Chat 🤖
1. Dashboard → Chat page
2. Ask: "What's my biggest challenge?"
3. **Future Self responds with YOUR exact numbers** ✅
4. Go back to Home, drastically worsen habits
5. Generate trajectory
6. Return to Chat
7. Ask: "Did things change?"
8. **Future Self remembers and says "You were at exam 75, now 45... I'm worried!"** ✅

### Feature 6: Fine-Tuning Data 📊
1. Dashboard → Scroll to bottom
2. **"Log Today's Reality" form**
3. Enter actual exam score (different from predicted)
4. Click "Log Data"
5. **See success message** ✅
6. Check backend folder for `feedback.json` file ✅

---

## Done! 🎉

You've successfully:
- ✅ Parsed natural language to habits
- ✅ Saw explainable AI insights
- ✅ Viewed future trajectories
- ✅ Watched 3D avatar react
- ✅ Chatted with future self who remembers you
- ✅ Logged data for model improvement

### Next Steps
- Read `FEATURE_TESTING_GUIDE.md` for detailed feature walkthroughs
- Read `SETUP_AND_TESTING_GUIDE.md` for troubleshooting
- Check `IMPLEMENTATION_SUMMARY.md` for technical architecture

### Troubleshooting
```bash
# Backend shows error?
# Kill old process and restart:
netstat -ano | findstr :8000
taskkill /PID <number> /F
uvicorn api:app --reload --port 8000

# Missing models?
python train_models.py

# Missing dependencies?
pip install -r requirements.txt

# Frontend won't load?
cd frontend && npm install && npm run dev
```

---

**Happy time-traveling! 🚀**
