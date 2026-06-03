
"""
predictor.py
────────────
Loads trained models and generates predictions + trajectory data.
"""

import numpy as np
import joblib
import os


def load_models():

    models = {}

    try:

        base_dir = os.path.dirname(os.path.abspath(__file__))

        model_path = lambda filename: os.path.join(
            base_dir,
            "models",
            filename
        )

        models["exam"] = joblib.load(
            model_path("exam_model.pkl")
        )

        models["dropout"] = joblib.load(
            model_path("dropout_model.pkl")
        )

        models["scaler_main"] = joblib.load(
            model_path("scaler_main.pkl")
        )

        models["features_main"] = joblib.load(
            model_path("features_main.pkl")
        )

        models["stress"] = joblib.load(
            model_path("stress_model.pkl")
        )

        models["scaler_stress"] = joblib.load(
            model_path("scaler_stress.pkl")
        )

        models["features_stress"] = joblib.load(
            model_path("features_stress.pkl")
        )

        models["wb"] = joblib.load(
            model_path("wb_model.pkl")
        )

        models["scaler_wb"] = joblib.load(
            model_path("scaler_wb.pkl")
        )

        models["features_wb"] = joblib.load(
            model_path("features_wb.pkl")
        )

        print("Models loaded successfully")

    except FileNotFoundError:

        print(
            "WARNING: Model files not found. "
            "Run train_models.py first."
        )

        return None

    except Exception as e:

        print(f"WARNING: Failed to load models: {e}")

        print(
            "Run train_models.py to regenerate model "
            "files with current sklearn version."
        )

        return None

    return models


def predict_all(models, user_input: dict) -> dict:

    sleep = user_input["sleep_hours"]

    study = user_input["study_hours"]

    social_media = user_input["social_media_hours"]

    exercise = user_input["exercise_frequency"]

    diet = user_input["diet_quality"]

    mh = user_input["mental_health_rating"]

    mood = user_input["mood_score"]

    screen = user_input["screen_time"]

    attendance = min(
        100,
        max(0, 60 + study * 5 - social_media * 2)
    )

    time_mgmt = min(
        10,
        max(0, (study * 1.2 + sleep * 0.5 - screen * 0.3))
    )

    stress_approx = min(
        10,
        max(0, 10 - mood - sleep * 0.3 + social_media * 0.4)
    )

    # ---------------- MAIN MODEL ----------------

    x_main = np.array([[
        sleep,
        study,
        social_media,
        exercise,
        diet,
        mh,
        stress_approx,
        screen,
        attendance,
        time_mgmt
    ]])

    x_main_s = models["scaler_main"].transform(x_main)

    exam_score = float(
        models["exam"].predict(x_main_s)[0]
    )

    exam_score = np.clip(exam_score, 0, 100)

    dropout_prob = float(
        models["dropout"].predict_proba(x_main_s)[0][1]
    )

    # ---------------- STRESS MODEL ----------------

    self_esteem = min(20, max(0, mh * 2))

    sleep_quality = min(5, max(0, sleep / 2))

    academic_perf = min(5, max(0, study / 2))

    study_load = min(5, max(0, study * 0.6))

    career_concerns = min(
        5,
        max(0, (10 - mood) / 2)
    )

    social_support = min(
        3,
        max(0, 3 - social_media * 0.2)
    )

    peer_pressure = min(
        5,
        max(0, social_media * 0.4)
    )

    depression = min(
        10,
        max(0, (10 - mood) * 0.8)
    )

    anxiety = min(
        21,
        max(0, stress_approx * 1.5)
    )

    x_stress = np.array([[
        anxiety,
        self_esteem,
        sleep_quality,
        academic_perf,
        study_load,
        career_concerns,
        social_support,
        peer_pressure,
        depression
    ]])

    x_stress_s = models["scaler_stress"].transform(
        x_stress
    )

    stress_score = float(
        models["stress"].predict(x_stress_s)[0]
    )

    stress_score = np.clip(stress_score, 0, 2)

    # ---------------- WELLBEING MODEL ----------------

    fruits_veggies = diet + 1

    daily_stress = min(
        5,
        max(1, stress_approx / 2)
    )

    daily_steps = min(
        10000,
        max(1000, exercise * 1200)
    )

    meditation = min(
        7,
        max(0, mh * 0.5)
    )

    todo_completed = min(
        10,
        max(0, time_mgmt)
    )

    flow = min(
        10,
        max(0, study * 0.8 + mh * 0.3)
    )

    passion_time = min(
        10,
        max(0, (24 - study - sleep - screen) * 0.5)
    )

    social_net = min(
        10,
        max(0, 10 - social_media * 0.5)
    )

    x_wb = np.array([[
        fruits_veggies,
        daily_stress,
        sleep,
        daily_steps,
        meditation,
        todo_completed,
        flow,
        passion_time,
        social_net
    ]])

    x_wb_s = models["scaler_wb"].transform(x_wb)

    wb_score = float(
        models["wb"].predict(x_wb_s)[0]
    )

    wb_score = np.clip(wb_score, 1, 10)

    # ---------------- LIGHTWEIGHT INSIGHTS ----------------

    insights = {
        "exam": [],
        "dropout": [],
        "stress": [],
        "wellbeing": []
    }

    if sleep < 6:
        insights["exam"].append({
            "feature": "sleep_hours",
            "impact": -8,
            "direction": "negative"
        })

    if social_media > 5:
        insights["exam"].append({
            "feature": "social_media_hours",
            "impact": -6,
            "direction": "negative"
        })

    if study > 4:
        insights["exam"].append({
            "feature": "study_hours",
            "impact": 7,
            "direction": "positive"
        })

    if exercise < 2:
        insights["wellbeing"].append({
            "feature": "exercise_frequency",
            "impact": -5,
            "direction": "negative"
        })

    return {
        "exam_score": round(exam_score, 1),
        "dropout_prob": round(dropout_prob * 100, 1),
        "stress_level": round(stress_score, 2),
        "stress_pct": round((stress_score / 2) * 100, 1),
        "wellbeing_score": round(wb_score, 1),
        "attendance": round(attendance, 1),
        "time_mgmt": round(time_mgmt, 1),
        "insights": insights
    }


def generate_trajectory(models, user_input: dict, years: int = 5):

    trajectories = {
        "current": [],
        "declining": [],
        "optimized": []
    }

    for year in range(years + 1):

        for traj in [
            "current",
            "declining",
            "optimized"
        ]:

            inp = user_input.copy()

            if traj == "declining":

                factor = year * 0.08

                inp["sleep_hours"] = max(
                    4,
                    inp["sleep_hours"] - factor * 1.5
                )

                inp["study_hours"] = max(
                    0,
                    inp["study_hours"] - factor
                )

                inp["social_media_hours"] = min(
                    12,
                    inp["social_media_hours"] + factor
                )

                inp["exercise_frequency"] = max(
                    0,
                    inp["exercise_frequency"] - factor * 0.5
                )

                inp["mental_health_rating"] = max(
                    1,
                    inp["mental_health_rating"] - factor * 0.8
                )

                inp["mood_score"] = max(
                    1,
                    inp["mood_score"] - factor * 0.6
                )

            elif traj == "optimized":

                factor = year * 0.12

                inp["sleep_hours"] = min(
                    9,
                    inp["sleep_hours"] + factor * 0.4
                )

                inp["study_hours"] = min(
                    8,
                    inp["study_hours"] + factor * 0.5
                )

                inp["social_media_hours"] = max(
                    0.5,
                    inp["social_media_hours"] - factor * 0.6
                )

                inp["exercise_frequency"] = min(
                    7,
                    inp["exercise_frequency"] + factor * 0.4
                )

                inp["mental_health_rating"] = min(
                    10,
                    inp["mental_health_rating"] + factor * 0.5
                )

                inp["mood_score"] = min(
                    10,
                    inp["mood_score"] + factor * 0.4
                )

            result = predict_all(models, inp)

            result["year"] = year

            trajectories[traj].append(result)

    return trajectories

