# 🔮 FutureYou — ML-Powered Life Trajectory Simulator

> Enter your daily habits → 4 real ML models predict your future → Talk to who you'll become

---

## ⚡ Setup (10 minutes total)

### Step 1 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 2 — Add your datasets
Create a `data/` folder inside this project and paste these 4 files in:
```
futureyou/
└── data/
    ├── enhanced_student_habits_performance_dataset.csv
    ├── StressLevelDataset.csv
    ├── Wellbeing_and_lifestyle_data_Kaggle.csv
    └── student-por.csv
```

### Step 3 — Train the models (run ONCE)
```bash
python train_models.py
```
This takes ~2 minutes. Creates a `models/` folder with 4 trained ML models.

### Step 4 — Get free Groq API key
- Go to **console.groq.com**
- Sign up free (no credit card)
- Create an API key → copy it
- Paste it in the app sidebar when running

### Step 5 — Run the app
```bash
streamlit run app.py
```

Open **http://localhost:8501** 🎉

---

## 🧠 How It Works

### The ML Pipeline (NOT prompting — real models)

```
Your habits (sliders)
        ↓
Feature engineering
(attendance, time mgmt score derived from habits)
        ↓
4 trained ML models run in parallel:
  ├── Gradient Boosting → Exam Score (trained on 80k students)
  ├── Gradient Boosting → Dropout Risk (trained on 80k students)  
  ├── Gradient Boosting → Stress Level (trained on 1.1k students)
  └── Random Forest    → Wellbeing Score (trained on 16k people)
        ↓
Trajectory simulation:
  3 paths × N years × 4 metrics = full future map
        ↓
LLM (LLaMA 3 via Groq) receives ML predictions as context
→ Speaks as Future-You grounded in real numbers
```

### Datasets Used

| Dataset | Samples | Predicts |
|---|---|---|
| Student Habits & Performance | 80,000 | Exam score, dropout risk |
| Student Stress Factors | 1,100 | Stress level |
| Wellbeing & Lifestyle | 15,972 | Work-life balance score |
| Student Performance (UCI) | 649 | Supporting features |

### Why the chat is NOT a toy

Old version: "Hey Ollama, pretend to be my future self"

This version: 
```
"This person sleeps 5.5hrs, studies 2hrs, 
spends 6hrs on social media. ML model predicts:
exam score 61/100, dropout risk 34%, stress 72%.
5-year optimized trajectory: 84/100.
NOW speak as their future self who lived this."
```

The LLM is grounded in real ML predictions. Every response references actual numbers from actual models trained on actual data.

---

## 🎯 What to Say in Presentations

*"I built an ML system that predicts a student's academic trajectory from their daily habits — trained on 97,000 real student records across 4 datasets. Unlike generic advice apps, this generates a personalized 5-year projection showing three possible futures: current path, declining habits, and optimized habits. The Future-You chat isn't roleplay — it's an LLM grounded in real ML predictions about that specific person."*

---

## 📈 Model Performance

After running `train_models.py`, check the console output for:
- Exam Score Model: MAE and R² score
- Dropout Model: Accuracy
- Stress Model: MAE  
- Wellbeing Model: MAE and R²

These are real metrics on held-out test data.

---

## 🔧 Tech Stack

- **Streamlit** — UI
- **Scikit-learn** — ML models (Gradient Boosting, Random Forest)
- **Plotly** — trajectory visualizations  
- **Groq API** — free LLaMA 3 70B for Future-You chat
- **Pandas/NumPy** — data processing

---

*Academic project. Predictions are probabilistic estimates based on population data, not deterministic outcomes.*
