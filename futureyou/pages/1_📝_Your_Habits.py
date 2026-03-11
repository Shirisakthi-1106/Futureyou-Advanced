import streamlit as st
from utils import apply_custom_css, render_sidebar_info

st.set_page_config(page_title="FutureYou | Habits", page_icon="📝", layout="wide", initial_sidebar_state="expanded")
apply_custom_css()

st.markdown('<div class="section-title">01 — Your Daily Habits</div>', unsafe_allow_html=True)
st.markdown("Enter your habits below. These will be used by our Machine Learning models to predict your future trajectory.")

col1, col2, col3 = st.columns(3)

# initialize session state if not exist
if "user_input" not in st.session_state:
    st.session_state.user_input = {
        "sleep_hours": 6.5,
        "study_hours": 3.0,
        "screen_time": 6.0,
        "social_media_hours": 3.0,
        "exercise_frequency": 2,
        "mood_score": 6,
        "diet_quality": 1, # Fair
        "mental_health_rating": 6,
        "years_ahead": 5
    }

ui = st.session_state.user_input

with col1:
    sleep = st.slider("🌙 Sleep (hours/night)", 3.0, 12.0, float(ui["sleep_hours"]), 0.5)
    study = st.slider("📚 Study (hours/day)", 0.0, 12.0, float(ui["study_hours"]), 0.5)
    screen = st.slider("📱 Total Screen Time (hrs/day)", 1.0, 16.0, float(ui["screen_time"]), 0.5)

with col2:
    social_media = st.slider("📲 Social Media (hours/day)", 0.0, 10.0, float(ui["social_media_hours"]), 0.5)
    exercise = st.slider("🏃 Exercise (days/week)", 0, 7, int(ui["exercise_frequency"]))
    mood = st.slider("😊 Mood Score (1-10)", 1, 10, int(ui["mood_score"]))

with col3:
    diet_map_inv = {0: "Poor", 1: "Fair", 2: "Good"}
    diet = st.select_slider("🥗 Diet Quality", options=["Poor", "Fair", "Good"], value=diet_map_inv[ui["diet_quality"]])
    mh = st.slider("🧠 Mental Health (1-10)", 1, 10, int(ui["mental_health_rating"]))
    years_ahead = st.slider("🗓️ Trajectory (years)", 1, 10, int(ui.get("years_ahead", 5)))

diet_enc = {"Poor": 0, "Fair": 1, "Good": 2}[diet]

# Update session state
st.session_state.user_input.update({
    "sleep_hours": sleep,
    "study_hours": study,
    "social_media_hours": social_media,
    "exercise_frequency": exercise,
    "diet_quality": diet_enc,
    "mental_health_rating": mh,
    "mood_score": mood,
    "screen_time": screen,
    "years_ahead": years_ahead
})

st.markdown("---")
st.success("✅ Habits saved! Head over to the **Trajectory Dashboard** safely from the sidebar.")

render_sidebar_info()
