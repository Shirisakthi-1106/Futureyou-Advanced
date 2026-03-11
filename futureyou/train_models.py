"""
train_models.py
───────────────
Trains 4 real ML models on real datasets.
Run this ONCE before starting the app: python train_models.py

Models trained:
  1. exam_score_model     — predicts academic performance (GPA proxy)
  2. stress_model         — predicts stress level
  3. wellbeing_model      — predicts work-life balance / wellbeing score
  4. dropout_model        — predicts dropout risk probability
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score, r2_score
import warnings
warnings.filterwarnings("ignore")

os.makedirs("models", exist_ok=True)

print("=" * 60)
print("  FutureYou — Training ML Models on Real Datasets")
print("=" * 60)

# ── DATASET 1: enhanced_student_habits_performance_dataset.csv ──
# 80,000 students. Best dataset. Used for exam score + dropout.
print("\n[1/4] Loading Student Habits Dataset (80,000 students)...")
df1 = pd.read_csv("data/enhanced_student_habits_performance_dataset.csv")

# Encode categoricals
diet_map = {"Poor": 0, "Fair": 1, "Good": 2}
df1["diet_quality_enc"] = df1["diet_quality"].map(diet_map).fillna(1)
df1["stress_level"] = pd.to_numeric(df1["stress_level"], errors="coerce").fillna(5)

FEATURES_MAIN = [
    "sleep_hours",
    "study_hours_per_day",
    "social_media_hours",
    "exercise_frequency",
    "diet_quality_enc",
    "mental_health_rating",
    "stress_level",
    "screen_time",
    "attendance_percentage",
    "time_management_score",
]

df1_clean = df1[FEATURES_MAIN + ["exam_score", "dropout_risk"]].dropna()
df1_clean["dropout_binary"] = (df1_clean["dropout_risk"] == "Yes").astype(int)

X_main = df1_clean[FEATURES_MAIN].values
y_exam = df1_clean["exam_score"].values
y_dropout = df1_clean["dropout_binary"].values

X_tr, X_te, y_tr, y_te = train_test_split(X_main, y_exam, test_size=0.2, random_state=42)
scaler_main = StandardScaler()
X_tr_s = scaler_main.fit_transform(X_tr)
X_te_s = scaler_main.transform(X_te)

print("    Training Exam Score Model (Gradient Boosting)...")
exam_model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.08, max_depth=5, random_state=42)
exam_model.fit(X_tr_s, y_tr)
mae = mean_absolute_error(y_te, exam_model.predict(X_te_s))
r2 = r2_score(y_te, exam_model.predict(X_te_s))
print(f"    ✅ Exam Score Model — MAE: {mae:.2f} pts, R²: {r2:.3f}")

print("    Training Dropout Risk Model...")
X_tr2, X_te2, y_tr2, y_te2 = train_test_split(X_main, y_dropout, test_size=0.2, random_state=42, stratify=y_dropout)
dropout_model = GradientBoostingClassifier(n_estimators=150, learning_rate=0.08, max_depth=4, random_state=42)
dropout_model.fit(scaler_main.transform(X_tr2), y_tr2)
acc = accuracy_score(y_te2, dropout_model.predict(scaler_main.transform(X_te2)))
print(f"    ✅ Dropout Risk Model — Accuracy: {acc:.1%}")

joblib.dump(exam_model, "models/exam_model.pkl")
joblib.dump(dropout_model, "models/dropout_model.pkl")
joblib.dump(scaler_main, "models/scaler_main.pkl")
joblib.dump(FEATURES_MAIN, "models/features_main.pkl")

# ── DATASET 2: StressLevelDataset.csv ──
print("\n[2/4] Loading Stress Level Dataset (1,100 students)...")
df2 = pd.read_csv("data/StressLevelDataset.csv")

FEATURES_STRESS = [
    "anxiety_level", "self_esteem", "sleep_quality",
    "academic_performance", "study_load", "future_career_concerns",
    "social_support", "peer_pressure", "depression"
]
df2_clean = df2[FEATURES_STRESS + ["stress_level"]].dropna()

X_s = df2_clean[FEATURES_STRESS].values
y_s = df2_clean["stress_level"].values
X_tr, X_te, y_tr, y_te = train_test_split(X_s, y_s, test_size=0.2, random_state=42)

scaler_stress = StandardScaler()
stress_model = GradientBoostingRegressor(n_estimators=150, learning_rate=0.1, max_depth=4, random_state=42)
stress_model.fit(scaler_stress.fit_transform(X_tr), y_tr)
mae = mean_absolute_error(y_te, stress_model.predict(scaler_stress.transform(X_te)))
print(f"    ✅ Stress Model — MAE: {mae:.2f} pts")

joblib.dump(stress_model, "models/stress_model.pkl")
joblib.dump(scaler_stress, "models/scaler_stress.pkl")
joblib.dump(FEATURES_STRESS, "models/features_stress.pkl")

# ── DATASET 3: Wellbeing_and_lifestyle_data_Kaggle.csv ──
print("\n[3/4] Loading Wellbeing & Lifestyle Dataset (15,972 people)...")
df3 = pd.read_csv("data/Wellbeing_and_lifestyle_data_Kaggle.csv")

# Clean BMI_RANGE (it's a string like "18-25")
df3["BMI_RANGE"] = df3["BMI_RANGE"].astype(str).str.extract(r'(\d+)').astype(float).fillna(22)
df3["WEEKLY_MEDITATION"] = pd.to_numeric(df3["WEEKLY_MEDITATION"], errors="coerce").fillna(0)

FEATURES_WB = [
    "FRUITS_VEGGIES", "DAILY_STRESS", "SLEEP_HOURS",
    "DAILY_STEPS", "WEEKLY_MEDITATION", "TODO_COMPLETED",
    "FLOW", "TIME_FOR_PASSION", "SOCIAL_NETWORK"
]
for col in FEATURES_WB + ["WORK_LIFE_BALANCE_SCORE"]:
    df3[col] = pd.to_numeric(df3[col], errors="coerce")

df3_clean = df3[FEATURES_WB + ["WORK_LIFE_BALANCE_SCORE"]].dropna()

X_w = df3_clean[FEATURES_WB].values.astype(float)
y_w = df3_clean["WORK_LIFE_BALANCE_SCORE"].values

X_tr, X_te, y_tr, y_te = train_test_split(X_w, y_w, test_size=0.2, random_state=42)
scaler_wb = StandardScaler()
wb_model = RandomForestRegressor(n_estimators=150, max_depth=10, n_jobs=-1, random_state=42)
wb_model.fit(scaler_wb.fit_transform(X_tr), y_tr)
mae = mean_absolute_error(y_te, wb_model.predict(scaler_wb.transform(X_te)))
r2 = r2_score(y_te, wb_model.predict(scaler_wb.transform(X_te)))
print(f"    ✅ Wellbeing Model — MAE: {mae:.2f}, R²: {r2:.3f}")

joblib.dump(wb_model, "models/wb_model.pkl")
joblib.dump(scaler_wb, "models/scaler_wb.pkl")
joblib.dump(FEATURES_WB, "models/features_wb.pkl")

print("\n" + "=" * 60)
print("  ✅ All 4 models trained and saved to /models/")
print("  Now run: streamlit run app.py")
print("=" * 60)
