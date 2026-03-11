import streamlit as st
from utils import apply_custom_css, render_sidebar_info
import os

st.set_page_config(
    page_title="FutureYou | Home",
    page_icon="🔮",
    layout="wide",
    initial_sidebar_state="expanded"
)

apply_custom_css()

st.markdown("""
<div class="hero">
    <h1>🔮 FutureYou</h1>
    <p>Enter your daily habits → ML models predict your trajectory → Talk to who you'll become</p>
</div>
""", unsafe_allow_html=True)

st.markdown("---")
st.markdown("""
### Welcome to FutureYou!
This grand application breaks down your journey into three distinct phases:

1. **📝 Your Habits**: Define your current lifestyle choices.
2. **📊 Trajectory Dashboard**: See ML models predict your future path based on 97,000+ real records.
3. **🔮 Future You Chat**: Chat directly with your future self using LLMs.

👈 **Navigate using the sidebar to get started!**
""")

render_sidebar_info()
