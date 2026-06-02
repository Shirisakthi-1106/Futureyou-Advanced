"""
predictor.py
────────────
Loads trained models and generates predictions + trajectory data.
"""

import numpy as np
import joblib
import os
import shap

def load_models():
    models = {}
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = lambda filename: os.path.join(base_dir, "models", filename)

        models["exam"] = joblib.load(model_path("exam_model.pkl"))
        models["dropout"] = joblib.load(model_path("dropout_model.pkl"))
        models["scaler_main"] = joblib.load(model_path("scaler_main.pkl"))
        models["features_main"] = joblib.load(model_path("features_main.pkl"))

        models["stress"] = joblib.load(model_path("stress_model.pkl"))
        models["scaler_stress"] = joblib.load(model_path("scaler_stress.pkl"))
        models["features_stress"] = joblib.load(model_path("features_stress.pkl"))

        models["wb"] = joblib.load(model_path("wb_model.pkl"))
        models["scaler_wb"] = joblib.load(model_path("scaler_wb.pkl"))
        models["features_wb"] = joblib.load(model_path("features_wb.pkl"))
        
        # Initialize SHAP explainers (do it once if possible, but for TreeExplainer it's fast)
        models["explainer_exam"] = shap.TreeExplainer(models["exam"])
        models["explainer_dropout"] = shap.TreeExplainer(models["dropout"])
        models["explainer_stress"] = shap.TreeExplainer(models["stress"])
        models["explainer_wb"] = shap.TreeExplainer(models["wb"])
        
    except FileNotFoundError:
        print("WARNING: Model files not found. Run train_models.py first.")
        return None
    except Exception as e:
        print(f"WARNING: Failed to load models: {e}")
        print("Run train_models.py to regenerate model files with current sklearn version.")
        return None
    return models

def get_top_shap_features(shap_values, feature_names, top_n=3):
    """Helper to extract top positive and negative contributing features"""
    # For TreeExplainer on some models shap_values could be a list (like in classification), 
    # but for GradientBoostingClassifier it usually returns one array or a list of one array for the positive class.
    # We will assume a 1D array per prediction for simplicity (batch size 1).
    vals = shap_values[0] if isinstance(shap_values, list) else shap_values
    if len(vals.shape) > 1 and vals.shape[0] == 1:
        vals = vals[0]
        
    feature_importance = list(zip(feature_names, vals))
    # Sort by absolute impact
    feature_importance = sorted(feature_importance, key=lambda x: abs(x[1]), reverse=True)
    
    impacts = []
    for name, val in feature_importance[:top_n]:
        if abs(val) > 0.01: # threshold to ignore tiny noise
            impacts.append({
                "feature": name,
                "impact": round(float(val), 2),
                "direction": "positive" if val > 0 else "negative"
            })
    return impacts

def predict_all(models, user_input: dict) -> dict:
    """
    user_input keys:
        sleep_hours, study_hours, social_media_hours, exercise_frequency,
        diet_quality, mental_health_rating, mood_score, screen_time
    """

    sleep = user_input["sleep_hours"]
    study = user_input["study_hours"]
    social_media = user_input["social_media_hours"]
    exercise = user_input["exercise_frequency"]
    diet = user_input["diet_quality"]           # 0=Poor, 1=Fair, 2=Good
    mh = user_input["mental_health_rating"]
    mood = user_input["mood_score"]
    screen = user_input["screen_time"]

    # Derived features
    attendance = min(100, max(0, 60 + study * 5 - social_media * 2))
    time_mgmt = min(10, max(0, (study * 1.2 + sleep * 0.5 - screen * 0.3)))
    stress_approx = min(10, max(0, 10 - mood - sleep * 0.3 + social_media * 0.4))

    # ── Model 1: Exam Score ──────────────────────────────────────────────────
    x_main = np.array([[
        sleep, study, social_media, exercise,
        diet, mh, stress_approx, screen,
        attendance, time_mgmt
    ]])
    x_main_s = models["scaler_main"].transform(x_main)
    exam_score = float(models["exam"].predict(x_main_s)[0])
    exam_score = np.clip(exam_score, 0, 100)

    dropout_prob = float(models["dropout"].predict_proba(x_main_s)[0][1])

    # ── Model 2: Stress ──────────────────────────────────────────────────────
    # Map to stress dataset features
    self_esteem = min(20, max(0, mh * 2))
    sleep_quality = min(5, max(0, sleep / 2))
    academic_perf = min(5, max(0, study / 2))
    study_load = min(5, max(0, study * 0.6))
    career_concerns = min(5, max(0, (10 - mood) / 2))
    social_support = min(3, max(0, 3 - social_media * 0.2))
    peer_pressure = min(5, max(0, social_media * 0.4))
    depression = min(10, max(0, (10 - mood) * 0.8))
    anxiety = min(21, max(0, stress_approx * 1.5))

    x_stress = np.array([[
        anxiety, self_esteem, sleep_quality,
        academic_perf, study_load, career_concerns,
        social_support, peer_pressure, depression
    ]])
    x_stress_s = models["scaler_stress"].transform(x_stress)
    stress_score = float(models["stress"].predict(x_stress_s)[0])
    stress_score = np.clip(stress_score, 0, 2)  # dataset: 0,1,2

    # ── Model 3: Wellbeing ───────────────────────────────────────────────────
    fruits_veggies = diet + 1
    daily_stress = min(5, max(1, stress_approx / 2))
    daily_steps = min(10000, max(1000, exercise * 1200))
    meditation = min(7, max(0, mh * 0.5))
    todo_completed = min(10, max(0, time_mgmt))
    flow = min(10, max(0, study * 0.8 + mh * 0.3))
    passion_time = min(10, max(0, (24 - study - sleep - screen) * 0.5))
    social_net = min(10, max(0, 10 - social_media * 0.5))

    x_wb = np.array([[
        fruits_veggies, daily_stress, sleep,
        daily_steps, meditation, todo_completed,
        flow, passion_time, social_net
    ]])
    x_wb_s = models["scaler_wb"].transform(x_wb)
    wb_score = float(models["wb"].predict(x_wb_s)[0])
    wb_score = np.clip(wb_score, 1, 10)

    # --- SHAP Explanations ---
    # Only calculate SHAP if explainers are loaded (it won't be if models failed to load properly)
    insights = {}
    if "explainer_exam" in models:
        # Note: We pass the SCALED features to the explainer because that's what the model expects
        shap_exam = models["explainer_exam"].shap_values(x_main_s)
        insights["exam"] = get_top_shap_features(shap_exam, models["features_main"])
        
        shap_dropout = models["explainer_dropout"].shap_values(x_main_s)
        # dropout is a classifier, shap_values might be a list of len 2 depending on the model
        if isinstance(shap_dropout, list) and len(shap_dropout) == 2:
            shap_dropout = shap_dropout[1] # positive class
        insights["dropout"] = get_top_shap_features(shap_dropout, models["features_main"])
        
        shap_stress = models["explainer_stress"].shap_values(x_stress_s)
        insights["stress"] = get_top_shap_features(shap_stress, models["features_stress"])
        
        shap_wb = models["explainer_wb"].shap_values(x_wb_s)
        insights["wellbeing"] = get_top_shap_features(shap_wb, models["features_wb"])

    return {
        "exam_score": round(exam_score, 1),
        "dropout_prob": round(dropout_prob * 100, 1),
        "stress_level": round(stress_score, 2),        # 0=low,1=mid,2=high
        "stress_pct": round((stress_score / 2) * 100, 1),
        "wellbeing_score": round(wb_score, 1),
        "attendance": round(attendance, 1),
        "time_mgmt": round(time_mgmt, 1),
        "insights": insights
    }


def generate_trajectory(models, user_input: dict, years: int = 5) -> dict:
    """
    Simulates 3 future trajectories:
      - current:   habits stay exactly as they are
      - declining: habits gradually worsen
      - optimized: habits improve toward healthy ranges
    Returns yearly data points for each trajectory.
    """
    trajectories = {"current": [], "declining": [], "optimized": []}

    for year in range(years + 1):
        for traj in ["current", "declining", "optimized"]:
            inp = user_input.copy()

            if traj == "declining":
                factor = year * 0.08
                inp["sleep_hours"] = max(4, inp["sleep_hours"] - factor * 1.5)
                inp["study_hours"] = max(0, inp["study_hours"] - factor)
                inp["social_media_hours"] = min(12, inp["social_media_hours"] + factor)
                inp["exercise_frequency"] = max(0, inp["exercise_frequency"] - factor * 0.5)
                inp["mental_health_rating"] = max(1, inp["mental_health_rating"] - factor * 0.8)
                inp["mood_score"] = max(1, inp["mood_score"] - factor * 0.6)

            elif traj == "optimized":
                factor = year * 0.12
                inp["sleep_hours"] = min(9, inp["sleep_hours"] + factor * 0.4)
                inp["study_hours"] = min(8, inp["study_hours"] + factor * 0.5)
                inp["social_media_hours"] = max(0.5, inp["social_media_hours"] - factor * 0.6)
                inp["exercise_frequency"] = min(7, inp["exercise_frequency"] + factor * 0.4)
                inp["mental_health_rating"] = min(10, inp["mental_health_rating"] + factor * 0.5)
                inp["mood_score"] = min(10, inp["mood_score"] + factor * 0.4)
                inp["diet_quality"] = int(min(2, inp["diet_quality"] + (1 if year > 2 else 0)))

            result = predict_all(models, inp)
            result["year"] = year
            trajectories[traj].append(result)

    return trajectories


def build_future_context(predictions: dict, user_input: dict, trajectory: dict) -> str:
    """
    Builds a rich context string to feed to the LLM so Future-You
    speaks from actual ML predictions, not just roleplay.
    """
    exam = predictions["exam_score"]
    dropout = predictions["dropout_prob"]
    stress = predictions["stress_pct"]
    wb = predictions["wellbeing_score"]

    # 5-year optimized vs current delta
    current_5yr = trajectory["current"][-1]["exam_score"]
    optimized_5yr = trajectory["optimized"][-1]["exam_score"]
    declining_5yr = trajectory["declining"][-1]["exam_score"]

    # Identify biggest problem habit
    problems = []
    if user_input["sleep_hours"] < 6:
        problems.append(f"sleeping only {user_input['sleep_hours']} hours")
    if user_input["social_media_hours"] > 4:
        problems.append(f"spending {user_input['social_media_hours']} hours on social media daily")
    if user_input["exercise_frequency"] < 2:
        problems.append("barely exercising")
    if user_input["study_hours"] < 2:
        problems.append(f"studying only {user_input['study_hours']} hours a day")

    problem_str = ", ".join(problems) if problems else "your habits are reasonably balanced"

    context = f"""
You are the FUTURE SELF of the user, speaking from 5 years in the future. 
You are NOT an AI assistant — you are THEM, older and wiser.
Speak in first person as if you ARE them. Be personal, emotional, direct.
DO NOT be generic. Reference their EXACT numbers.

YOUR PAST HABITS (when you were them, right now):
- Sleep: {user_input['sleep_hours']} hours/night
- Study: {user_input['study_hours']} hours/day  
- Social media: {user_input['social_media_hours']} hours/day
- Exercise: {user_input['exercise_frequency']} days/week
- Diet: {'Poor' if user_input['diet_quality']==0 else 'Fair' if user_input['diet_quality']==1 else 'Good'}
- Mental health rating: {user_input['mental_health_rating']}/10
- Mood: {user_input['mood_score']}/10

WHAT THE ML MODEL PREDICTED FOR YOU AT THAT POINT:
- Academic performance score: {exam}/100
- Dropout risk: {dropout}%
- Stress level: {stress}%
- Wellbeing score: {wb}/10

5-YEAR TRAJECTORY PREDICTIONS:
- If you kept current habits: {current_5yr}/100 performance
- If habits declined: {declining_5yr}/100 performance  
- If you optimized: {optimized_5yr}/100 performance

YOUR MAIN RISK FACTORS AT THAT TIME: {problem_str}

Speak as their future self who LIVED one of these trajectories.
Be specific. Be honest. Be emotional if needed. Reference their exact numbers.
Don't say "as an AI" or break character ever.
Keep responses under 150 words — punchy and real.
"""
    return context

def generate_quests(insights: dict) -> list:
    """
    Converts SHAP insights (predictive drivers) into actionable quest cards.
    Focuses on negative drivers (habits to improve) and positive drivers (maintain).
    """
    quests = []
    
    # Quest templates based on feature mapping
    templates = {
        "sleep_hours": {
            "negative": {"title": "The Restorative Slumber", "action": "Increase nightly sleep to 8h", "icon": "Moon"},
            "positive": {"title": "Sleep Master", "action": "Maintain your 8h+ sleep schedule", "icon": "Moon"}
        },
        "study_hours": {
            "negative": {"title": "The Deep Work", "action": "Add 1.5h of focused study time", "icon": "Book"},
            "positive": {"title": "Scholar's Path", "action": "Keep up your consistent study habits", "icon": "Book"}
        },
        "social_media_hours": {
            "negative": {"title": "Digital Minimalism", "action": "Reduce social media by 1h daily", "icon": "Smartphone"},
            "positive": {"title": "Focus Protocol", "action": "Great job keeping digital distractions low", "icon": "Smartphone"}
        },
        "exercise_frequency": {
            "negative": {"title": "The Vitality Sprint", "action": "Add 2 more workout days per week", "icon": "Dumbbell"},
            "positive": {"title": "Peak Human", "action": "Maintain your high exercise consistency", "icon": "Dumbbell"}
        },
        "screen_time": {
            "negative": {"title": "Blue Light Detox", "action": "Cut screen time by 2h daily", "icon": "Monitor"},
            "positive": {"title": "Real-World Connection", "action": "Your screen time balance is excellent", "icon": "Monitor"}
        }
    }
    
    # Process exam score drivers first as they are central
    if "exam" in insights:
        for insight in insights["exam"]:
            feature = insight["feature"]
            direction = insight["direction"]
            impact = abs(insight["impact"])
            
            if feature in templates:
                # If negative impact, suggest improvement. If positive, suggest maintenance.
                # Actually, SHAP 'negative' for Exam Score means it HURTS the score.
                type_key = "negative" if direction == "negative" else "positive"
                meta = templates[feature][type_key]
                
                quests.append({
                    "id": f"q_{feature}_{type_key}",
                    "title": meta["title"],
                    "action": meta["action"],
                    "impact": f"{'+' if type_key == 'negative' else ''}{impact}% to Exam Performance",
                    "impact_level": "High" if impact > 5 else "Medium",
                    "icon": meta["icon"],
                    "priority": impact
                })
    
    # Sort by impact
    quests = sorted(quests, key=lambda x: x["priority"], reverse=True)
    
    # Return top 3 unique quests
    final_quests = []
    seen_features = set()
    for q in quests:
        feat = q["id"].split("_")[1]
        if feat not in seen_features:
            final_quests.append(q)
            seen_features.add(feat)
        if len(final_quests) >= 3:
            break
    
    return final_quests

def generate_timeline_narrative_prompt(trajectory: dict, user_input: dict) -> str:
    """
    Prepares a prompt for the LLM to generate 5 year-by-year life milestones.
    """
    current_path = trajectory["current"]
    
    milestones_context = ""
    for pt in current_path[1:]: # Skip Year 0 (Now)
        milestones_context += f"- Year {pt['year']}: Exam Score {pt['exam_score']}, Stress {pt['stress_pct']}%, Wellbeing {pt['wellbeing_score']}/10\n"
        
    prompt = f"""
You are a "Chronological Life Architect". Based on the following ML-predicted trajectory, 
generate exactly 5 short, professional, and evocative "Life Milestones" (one for each year).
Each milestone should be a JSON object with 'year', 'title', 'description', and 'tone' (one of: 'positive', 'neutral', 'warning').

USER'S CURRENT HABITS:
- Sleep: {user_input['sleep_hours']}h
- Study: {user_input['study_hours']}h
- Social Media: {user_input['social_media_hours']}h

PREDICTED DATA POINTS:
{milestones_context}

RULES:
- Be specific. Don't say "you will do well". Say "Your consistency in Year 2 leads to a breakthrough in complex problem solving."
- Keep descriptions under 25 words.
- Tone should reflect the stress and wellbeing scores.
- Return ONLY a raw JSON array of 5 objects. No markdown. No backticks.

Example format:
[
  {{"year": 1, "title": "The First Ripple", "description": "Minor adjustments to your sleep schedule start paying off in focus.", "tone": "positive"}},
  ...
]
"""
    return prompt
