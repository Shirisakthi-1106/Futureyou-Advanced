import streamlit as st
import requests
import os
from dotenv import load_dotenv
from utils import apply_custom_css
from predictor import load_models, predict_all, generate_trajectory, build_future_context

load_dotenv()

st.set_page_config(page_title="FutureYou | Chat", page_icon="🔮", layout="wide", initial_sidebar_state="expanded")
apply_custom_css()

def call_groq(api_key: str, system_prompt: str, user_message: str, history: list) -> str:
    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-6:]:
        role = "assistant" if h["role"] == "future" else "user"
        messages.append({"role": role, "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    try:
        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "max_tokens": 200,
                "temperature": 0.85,
            },
            timeout=15
        )
        data = resp.json()
        if "choices" in data:
            return data["choices"][0]["message"]["content"]
        else:
            return f"Error: {data.get('error', {}).get('message', 'Unknown error')}"
    except Exception as e:
        return f"Connection error: {str(e)}"

st.markdown('<div class="section-title">05 — Talk to Future You</div>', unsafe_allow_html=True)

# Securely grab the API key from the environment instead of always displaying an input box
groq_key = os.getenv("GROQ_API_KEY")

with st.sidebar:
    st.markdown("### 🤖 Future-You Chat")
    
    # If the key isn't in .env, we provide a fallback input just in case, but keep it hidden if it IS in .env.
    if not groq_key:
        st.markdown("<div style='font-size:0.82rem; color:#888899;'>Configure your API Key below.</div>", unsafe_allow_html=True)
        groq_key = st.text_input("Groq API Key", type="password", placeholder="gsk_...")
    else:
        st.success("✅ Securely connected to Groq API via environment variable.")

if not groq_key:
    st.info("⚠️ Please provide a Groq API Key to enable the Future You chat.")
    st.stop()
    
if "user_input" not in st.session_state:
    st.warning("Please enter your habits on the **📝 Your Habits** page first so Future You has context!")
    st.stop()

ui = st.session_state.user_input

@st.cache_resource(show_spinner=False)
def get_trained_models():
    return load_models()

models = get_trained_models()
if models is None:
    st.error("⚠️ Models not found. Please run `python train_models.py` first!")
    st.stop()
    
predictions = predict_all(models, ui)
trajectory = generate_trajectory(models, ui, years=ui.get("years_ahead", 5))

future_context = build_future_context(predictions, ui, trajectory)

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
    with st.spinner("Future You is connecting..."):
        opening = call_groq(
            groq_key, future_context,
            "Introduce yourself as my future self. Reference my exact habits and ML predictions. Be direct, emotional, real. Under 120 words.",
            []
        )
    if opening:
        st.session_state.chat_history.append({"role": "future", "content": opening})

# Render native Streamlit Chat message UI
for msg in st.session_state.chat_history:
    avatar = "🔮" if msg["role"] == "future" else "👤"
    with st.chat_message(name=msg["role"], avatar=avatar):
        st.write(msg["content"])

user_msg = st.chat_input("Ask your future self anything...")
if user_msg:
    st.session_state.chat_history.append({"role": "user", "content": user_msg})
    
    with st.chat_message("user", avatar="👤"):
        st.write(user_msg)
        
    with st.chat_message("future", avatar="🔮"):
        with st.spinner("Thinking..."):
            reply = call_groq(groq_key, future_context, user_msg, st.session_state.chat_history[:-1])
        st.write(reply)

        if reply and not reply.startswith("Error") and not reply.startswith("Connection error"):
            st.session_state.chat_history.append({"role": "future", "content": reply})

st.markdown("<br><br>", unsafe_allow_html=True)
if st.button("🗑️ Reset conversation", use_container_width=True):
    st.session_state.chat_history = []
    st.rerun()
