import streamlit as st

def apply_custom_css():
    st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

html, body, [class*="css"] { 
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    scroll-behavior: smooth;
}

/* Base Animations */
@keyframes fadeInSlideUp {
    0% { opacity: 0; transform: translateY(30px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes gradientPan {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
}

/* Ultra Modern Dark Theme - Linear/Stripe Inspired */
.stApp { 
    background-color: #0b0d17;
    background-image: 
        radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.12), transparent 45%),
        radial-gradient(circle at 85% 30%, rgba(2ec4b6, 0.1), transparent 45%),
        radial-gradient(circle at 50% 100%, rgba(255, 107, 107, 0.1), transparent 50%);
    background-size: 200% 200%;
    animation: gradientPan 15s ease infinite;
    color: #e2e8f0;
}

/* Staggered Element Entrances */
.stMarkdown, .stButton, div[data-testid="stBlock"] {
    animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
}
.stMarkdown:nth-child(1) { animation-delay: 0.1s; }
.stMarkdown:nth-child(2) { animation-delay: 0.2s; }
.stMarkdown:nth-child(3) { animation-delay: 0.3s; }
div[data-testid="stBlock"]:nth-child(1) { animation-delay: 0.4s; }
div[data-testid="stBlock"]:nth-child(2) { animation-delay: 0.5s; }

/* The Hero (Landing Page) */
.hero {
    text-align: center;
    padding: 6rem 0 4rem;
    position: relative;
    z-index: 10;
}
.hero h1 {
    font-size: 5.5rem;
    font-weight: 800;
    letter-spacing: -3px;
    background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1.5rem;
    line-height: 1.1;
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
}
.hero p { 
    color: #94a3b8; 
    font-size: 1.3rem; 
    font-weight: 400;
    letter-spacing: 0px;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
}

/* Modern Minimalist Section Titles */
.section-title {
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #818cf8;
    margin: 3.5rem 0 1.5rem;
    background: linear-gradient(90deg, rgba(129,140,248,0.1), transparent);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border-left: 3px solid #6366f1;
    backdrop-filter: blur(10px);
}

/* Breathtaking Floating Cards */
.score-card {
    background: rgba(30, 41, 59, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    padding: 2.5rem 1.5rem;
    text-align: center;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
}
.score-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
}
.score-card:hover { 
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(30, 41, 59, 0.7);
}
.score-value {
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    line-height: 1;
    letter-spacing: -2px;
}
.score-label {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Ultra Modern Motion Button */
.stButton > button {
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: white;
    border: none;
    border-radius: 100px; /* Pill button */
    font-weight: 600;
    font-size: 1.1rem;
    padding: 1rem 3rem;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5), 0 8px 10px -6px rgba(99, 102, 241, 0.1);
    position: relative;
    overflow: hidden;
}
.stButton > button::after {
    content: "";
    position: absolute;
    top: 0; left: -100%; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transform: skewX(-20deg);
    transition: all 0.5s ease;
}
.stButton > button:hover::after {
    left: 200%;
}
.stButton > button:hover { 
    transform: translateY(-3px);
    box-shadow: 0 20px 30px -5px rgba(99, 102, 241, 0.6), 0 10px 10px -5px rgba(99, 102, 241, 0.2);
    color: white;
}

/* Slick Minimalist Inputs */
.stTextInput > div > div > input {
    background-color: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    color: #e2e8f0;
    padding: 1rem;
    font-size: 1rem;
    transition: all 0.3s ease;
}
.stTextInput > div > div > input:focus {
    background-color: rgba(30, 41, 59, 0.9);
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

hr { border-color: rgba(255,255,255,0.05); }

/* Glassmorphism Alerts */
.warning-box, .good-box {
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    font-size: 0.95rem;
    margin: 1.5rem 0;
    backdrop-filter: blur(10px);
    animation: fadeInSlideUp 0.6s ease forwards;
    border: 1px solid rgba(255,255,255,0.05);
}
.warning-box {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(0,0,0,0));
    border-left: 4px solid #ef4444;
    color: #fca5a5;
}
.good-box {
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(0,0,0,0));
    border-left: 4px solid #22c55e;
    color: #86efac;
}

/* Beautiful Chat UI */
[data-testid="stChatMessage"] {
    background-color: transparent !important;
    padding: 1.5rem 0;
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    color: #e2e8f0 !important;
}
[data-testid="stChatMessage"]:nth-child(odd) {
    background: radial-gradient(circle at 100% 50%, rgba(255,255,255,0.02), transparent 50%);
}
[data-testid="stChatMessage"]:nth-child(even) {
    background: radial-gradient(circle at 0% 50%, rgba(99, 102, 241, 0.05), transparent 50%);
}
[data-testid="stChatMessageAvatar"] {
    border-radius: 50% !important;
    background: linear-gradient(135deg, #1e293b, #0f172a) !important;
    border: 2px solid rgba(255,255,255,0.1);
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

/* Sexy neon slider */
.stSlider > div > div { accent-color: #818cf8; }

/* Sidebar styling */
[data-testid="stSidebar"] {
    background-color: #0b0d17 !important;
    border-right: 1px solid rgba(255,255,255,0.05);
    background-image: linear-gradient(180deg, rgba(99, 102, 241, 0.05), transparent);
}
</style>
""", unsafe_allow_html=True)

def render_sidebar_info():
    with st.sidebar:
        st.markdown("### 📊 Data Sources")
        st.markdown("""
        <div style='font-size:0.85rem; color:#8a8a9a; line-height:2; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);'>
        • Student Habits Dataset (80k+)<br>
        • Stress Level Dataset (1.1k)<br>
        • Wellbeing & Lifestyle (16k)<br>
        • UCI Student Performance
        </div>
        """, unsafe_allow_html=True)
