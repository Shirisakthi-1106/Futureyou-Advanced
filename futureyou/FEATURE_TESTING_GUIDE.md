# FutureYou Advanced Features - Interactive Testing Guide

## Pre-Flight Checklist

Before starting, ensure:
1. Backend running: `uvicorn api:app --reload --port 8000` ✅
2. Frontend running: `npm run dev` (from `frontend/`) ✅
3. Both at startup should show:
   - Backend: `http://localhost:8000/health` → `{"status": "ok", "models_loaded": true}`
   - Frontend: `http://localhost:5173` → App loads with 3D background animation

---

## Feature 1: Natural Language Input 🗣️

### Test Scenario
**Goal:** Convert a natural sentence into habit parameters

### Step-by-Step Test

1. **Open the Home page** (`http://localhost:5173`)
   - You should see sliders for all habit parameters
   - There's a tab selector at the top: "Sliders" | "Describe Your Day"

2. **Click "Describe Your Day" tab**
   - A text area appears with placeholder text
   - Example prompt: "Just tell me about your typical day."

3. **Type this test sentence:**
   ```
   I slept for around 5 hours last night, managed to study for 8 hours today, 
   but got distracted and spent 4 hours scrolling through social media. 
   I hit the gym 3 times this week. I'm feeling pretty stressed honestly, 
   maybe a 4 out of 10 for mood, but I've been eating pretty well, 
   my mental health rating is like a 5 out of 10. For screen time, 
   I'd say about 6 hours a day total.
   ```

4. **Click "Extract Data" button**
   - Button should show "Analyzing..." 
   - Wait 2-3 seconds for Groq API response
   - You should see extracted values appear

5. **Verify the parsed values make sense:**
   - Sleep Hours: Should be ~5
   - Study Hours: Should be ~8
   - Social Media: Should be ~4
   - Exercise: Should be ~3
   - Screen Time: Should be ~6
   - Mood/Mental Health: Should reflect the "stressed" tone (lower values)

6. **Switch back to Sliders tab**
   - The sliders should now be positioned at the parsed values!
   - This proves the NLP parsing worked

### Success Criteria ✅
- [ ] Text input properly parsed to numerical values
- [ ] Sliders updated to match parsed values
- [ ] No errors in browser console
- [ ] Response time < 5 seconds

### Debug Tips
- Check browser DevTools → Network tab
- Look for POST request to `/parse_input`
- Response should contain `"parsed"` object with habit values
- If 404: Backend might have crashed, restart with `uvicorn api:app --reload --port 8000`

---

## Feature 2: Explainable AI Insights (SHAP) 🧠

### Test Scenario
**Goal:** See which habits most influence your predictions

### Step-by-Step Test

1. **From Any Slider Configuration**
   - Set some extreme values to see dramatic SHAP differences
   - Example "Bad Habits":
     - Sleep: 3 hours
     - Study: 1 hour
     - Screen Time: 10 hours
     - Social Media: 6 hours
     - Exercise: 0 days
     - Mood: 3
     - Mood Score: 4
     - Mental Health: 2

2. **Click "Generate Trajectory"**
   - Page navigates to Dashboard
   - Wait for charts to load (2-3 seconds)

3. **Scroll to "AI Insights" section** (very top of main content)
   - You should see a box with three columns:
     - Academic Performance Drivers
     - Dropout Risk Drivers
     - Stress Level Drivers

4. **Examine Each Column**
   - Each shows top 3 factors
   - Format: `Factor Name    +15%` or `-8%`
   - Green (+) = increases this metric
   - Red (-) = decreases this metric

5. **Verify Logic**
   - Low sleep should show `-X%` for exam score
   - High screen time should show `+X%` for stress
   - Low exercise should show `-X%` for wellbeing
   - Study hours should show `+X%` for exam performance

6. **Change Habits and Re-predict**
   - Go back to Home
   - Increase sleep to 8 hours
   - Generate Trajectory again
   - Sleep Hours should now show as positive contributor to exam

### Expected SHAP Insights Examples

**High Study Hours + Low Sleep:**
- Academic: Study Hours +18%, Sleep Hours -12%
- Dropout: Sleep Hours -15%, Stress Related +8%
- Stress: Sleep Hours -20%, Screen Time +5%

**Balanced Habits:**
- Academic: Study Hours +8%, Time Management +6%
- Dropout: Mental Health -10%, Diet Quality +3%
- Stress: Sleep Hours -8%, Mood Score -6%

### Success Criteria ✅
- [ ] AI Insights section appears after prediction
- [ ] Shows 3 columns (Exam, Dropout, Stress)
- [ ] Each column has 2-3 factors with percentages
- [ ] Different habits produce different insights
- [ ] Logic matches expected influence (sleep up = stress down)

### Debug Tips
- If no insights: Check that `predictions.insights` has data
- Check browser console for errors
- Verify SHAP models loaded: `curl http://localhost:8000/health`
- Look at API response JSON: Should include `"insights"` object

---

## Feature 3: Multiverse Trajectory 🌌

### Test Scenario
**Goal:** See three diverging timeline paths

### Step-by-Step Test

1. **On Dashboard Page**
   - Scroll to middle section labeled "Multiverse: Academic Performance"
   - You should see a large line chart with 3 lines:
     - **Cyan line (top)**: Optimized Path
     - **White dashed line (middle)**: Current Path
     - **Red line (bottom)**: Declining Path

2. **Examine the X-Axis**
   - Shows: "Now", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"

3. **Examine the Y-Axis**
   - Scale from 0-100 (exam score range)

4. **Test Different Scenarios**

   **Scenario A: Bad Habits**
   - Home → Set bad habits (sleep 3h, study 1h, etc.)
   - Predict → Dashboard
   - Observe: All three paths decline over 5 years
   - Optimized path is highest, declining is lowest

   **Scenario B: Great Habits**
   - Home → Set excellent habits (sleep 8h, study 6h, exercise 5x, etc.)
   - Predict → Dashboard
   - Observe: All paths improve, gap between them widens

   **Scenario C: Mixed Habits**
   - Home → Set moderate habits
   - Predict → Dashboard
   - Observe: Current path stays flat, optimized goes up, declining goes down

5. **Interact with Chart**
   - Hover over data points
   - Tooltip should show: Year, Optimized Score, Current Score, Declining Score
   - Click legend items to toggle lines on/off
   - Check responsive on mobile

6. **Also Check Stress Forecast Chart**
   - Same page, right side chart
   - Shows same 3 paths but for Stress Level (0-100%)
   - Should inverse of exam scores (higher exam = lower stress generally)

### Success Criteria ✅
- [ ] Two charts visible (Academic + Stress)
- [ ] Each chart has 3 lines with correct colors
- [ ] Legend shows Optimized, Current, Declining
- [ ] Y-axis ranges are correct (0-100)
- [ ] Hover tooltips work
- [ ] Different habit profiles produce different curves

### Debug Tips
- Charts use Recharts library
- Check `trajectory` context data structure
- Verify data has `optimized_score`, `current_score`, `declining_score` for each year
- Open DevTools → Console to check for chart errors

---

## Feature 4: 3D "Future Self" Avatar 🔮

### Test Scenario
**Goal:** Watch the 3D background react to ML predictions

### Step-by-Step Test

1. **Open Home Page (or any page)**
   - Observe the animated background
   - You should see a **particle wave visualization** (cyan particles)
   - The wave oscillates gently

2. **Test Color Changes**

   **Test: Set Excellent Habits**
   - Sleep: 8.5, Study: 6, Screen: 2, Exercise: 5, Mood: 9, Mental Health: 9
   - Click "Generate Trajectory"
   - Watch the background on navigation
   - **Color should be: Bright CYAN** (calm, healthy)
   - **Animation: Smooth and rhythmic**

   **Test: Set Bad Habits**
   - Sleep: 3, Study: 1, Screen: 10, Exercise: 0, Mood: 2, Mental Health: 2
   - Click "Generate"
   - **Color should be: RED/PURPLE** (chaotic, crisis)
   - **Animation: Erratic, chaotic, turbulent**
   - **Wave should be more "noisy"**

   **Test: Moderate Habits**
   - Sleep: 6, Study: 3, Screen: 5, Exercise: 2, Mood: 6, Mental Health: 6
   - Click "Generate"
   - **Color should be: PURPLE** (middle ground)
   - **Animation: Partially smooth, some chaos**

3. **Test Speed Changes**
   - Increase stress-related habits (low mood, high social media)
   - Wave animation should speed up noticeably
   - Higher dropout probability = more chaos in wave

4. **Watch During Prediction**
   - From Home, change a single slider dramatically
   - Click "Generate"
   - Watch loading transition
   - See smooth color/animation change on Dashboard

### Expected Behavior

| Wellbeing | Color | Animation |
|-----------|-------|-----------|
| ≥ 7 (High) | Cyan #00ffcc | Smooth, calm |
| 4-7 (Mid) | Purple #b026ff | Medium flow |
| < 4 (Low) | Red #ff3366 | Chaotic, fast |

| Stress/Dropout | Effect |
|---|---|
| High | Speed increases, more noise |
| Low | Speed decreases, clean waves |

### Success Criteria ✅
- [ ] Wave visible and animated on all pages
- [ ] Color changes based on wellbeing score
- [ ] Animation speed changes with stress level
- [ ] Smooth transitions between predictions
- [ ] 3D rendering maintains 60fps
- [ ] No console errors

### Debug Tips
- Open DevTools → Performance tab
- 3D canvas is rendered by Three.js
- Check that `predictions` context is passed to `ThreeCanvas`
- Particle count: ~6400 particles (80×80 grid)
- If not animating: Check `useFrame` in ThreeCanvas.jsx

---

## Feature 5: Agentic Memory Chat 🤖

### Test Scenario
**Goal:** Have the Future Self remember and reference past interactions

### Step-by-Step Test

1. **First Conversation**
   - From Home: Set sliders to some values (e.g., Sleep 6, Study 4, Mood 7)
   - "Generate Trajectory"
   - Go to Chat page
   - Send message:
     ```
     What's my biggest challenge based on my habits?
     ```
   - **Future Self responds with your EXACT numbers**
     - Should mention "exam score 72", "stress 45%", etc.
     - Should reference specific weak areas based on your input

2. **Note the Response**
   - Write down: exam score, stress level, mood, sleep from the response
   - Example: "At exam 72, stress 45%, sleep 6h, mood 7"

3. **Create Habit Change (Simulate Time Passing)**
   - Go back to Home
   - **Drastically change habits in a negative direction:**
     - Reduce sleep: 6 → 3 hours
     - Reduce study: 4 → 1 hour
     - Increase screen time: existing → +5 hours
     - Reduce exercise: 3 → 0 days
   - Generate new prediction

4. **Return to Chat**
   - Send message:
     ```
     I made some changes to my habits recently. How do I look now?
     ```
   - **Future Self should:**
     - Reference the old numbers ("You were at exam 72...")
     - Calculate the delta ("Now you're at exam 45...")
     - Express concern/alarm about the decline
     - Say something like "I'm worried! What happened?"

5. **Opposite Test: Improvement Path**
   - Go back to Home
   - Set EXCELLENT habits:
     - Sleep: 9, Study: 8, Screen: 1, Exercise: 6, Mood: 9, Mental Health: 9
   - Generate
   - Chat → "How am I doing compared to before?"
   - **Should praise improvement:**
     - "I'm impressed! You went from 45 to 88..."
     - "You really turned things around!"

6. **Verify Memory Persistence**
   - Refresh the page (F5)
   - Chat history should remain (stored in context)
   - Go back to Home, edit habits, predict
   - Return to Chat
   - Old conversations should still be there

### Key Memory Features

**Agentic Memory includes:**
- Previous exam scores
- Previous stress levels
- Timestamps of predictions
- Direction of change (improved/declined)
- Chat history (last 10 interactions per user)

### Success Criteria ✅
- [ ] First chat references your actual numbers
- [ ] Second chat detects change and reacts appropriately
- [ ] Responds differently to improvement vs decline
- [ ] Chat history preserved across page navigation
- [ ] No generic responses (always personalized with your data)
- [ ] Groq LLM responses feel like your future self

### Debug Tips
- Check browser → Application tab → Local Storage
- Look for `memory.json` on backend (stores user data)
- Verify user_id is being sent:
  - Check Supabase auth (if enabled)
  - Otherwise uses "anonymous" user
- Monitor network tab for `/chat` endpoint responses
- If not detecting memory: User might be "anonymous"

---

## Feature 6: Continuous Fine-Tuning MVP 📉

### Test Scenario
**Goal:** Log actual vs predicted performance for model improvement

### Step-by-Step Test

1. **Generate a Prediction**
   - Home → Set habits → "Generate Trajectory"
   - Note the predicted values:
     - Predicted Exam Score: e.g., **75.2**
     - Predicted Stress: e.g., **52.1%**

2. **Go to Dashboard**
   - Scroll to **very bottom**
   - Find box: "Log Today's Reality (Fine-Tune Your Model)"

3. **Fill Log Form**
   - Input: **Actual Exam Score**
     - Try entering a different value (e.g., 72 instead of predicted 75.2)
   - Input: **Actual Stress Level**
     - Try entering a value (e.g., 45 instead of predicted 52)
   - Click **"Log Data"** button

4. **Verify Success**
   - Button text: "Logging..." → "Logged!" (green background)
   - Success message appears briefly
   - Inputs clear for next entry

5. **Check Backend Logging**
   - On backend machine, check for `feedback.json` file
   - Should contain entry with:
     ```json
     {
       "timestamp": "2024-03-13T...",
       "user_id": "your_user_id",
       "actual_exam_score": 72,
       "actual_stress_level": 45,
       "habits": {...}
     }
     ```

6. **Test Multiple Entries**
   - Go back to Home
   - Change habits
   - Generate new prediction
   - Log different actual values
   - Check `feedback.json` has multiple entries

### Feedback Loop Visualization

```
1. Predict: Habits → Model → Exam: 75, Stress: 52
   ↓
2. Reality: Actual Exam: 72, Actual Stress: 45
   ↓
3. Log: Store delta (prediction error: +3, -7)
   ↓
4. [Future] Retrain: Use feedback to improve model accuracy
   ↓
5. Next Predict: More accurate results!
```

### Success Criteria ✅
- [ ] Form visible at bottom of Dashboard
- [ ] Can input actual exam score (0-100)
- [ ] Can input actual stress level (0-100%)
- [ ] "Log Data" button works
- [ ] Success message appears
- [ ] Data saved to `feedback.json`
- [ ] Multiple entries accumulate
- [ ] No errors on submission

### Debug Tips
- `feedback.json` is JSON file in root futureyou/ directory
- Each entry has: timestamp, user_id, actual_exam_score, actual_stress_level, habits
- If logging fails: Check backend error logs
- Verify POST to `/feedback` endpoint succeeds (network tab)

---

## Quick Regression Test

After implementing all features, run through this checklist:

- [ ] **Feature 1:** NLP text input → home → Try parsing a sentence → sliders update
- [ ] **Feature 2:** Any prediction → Dashboard → Top section shows SHAP insights
- [ ] **Feature 3:** Any prediction → Dashboard → Middle section shows 3-line trajectory chart
- [ ] **Feature 4:** Observe background color changes with habit changes
- [ ] **Feature 5:** Chat page → Different predictions → Chat remembers previous scores
- [ ] **Feature 6:** Dashboard bottom → Log some values → Check feedback.json

---

## Troubleshooting Commands

```bash
# Check backend is running
curl http://localhost:8000/health

# Test NLP endpoint
curl -X POST http://localhost:8000/parse_input \
  -H "Content-Type: application/json" \
  -d '{"message": "I sleep 6 hours and study 4 hours a day"}'

# Kill stuck process on port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Restart backend
uvicorn api:app --reload --port 8000

# Check models are loading
python verify_setup.py
```

---

## Expected Success State

When all features are working:
1. You can describe your day in natural language
2. AI explains which habits most impact your predictions
3. You see 3 possible futures based on your choices
4. The 3D avatar glows healthy when you make good choices
5. Your future self remembers conversations across sessions
6. You can log real data to improve the model

🎉 **You're ready to use FutureYou!**
