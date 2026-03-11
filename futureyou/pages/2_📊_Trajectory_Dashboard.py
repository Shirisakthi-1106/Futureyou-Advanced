import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from utils import apply_custom_css, render_sidebar_info
from predictor import load_models, predict_all, generate_trajectory
import os
import warnings
warnings.filterwarnings("ignore")

st.set_page_config(page_title="FutureYou | Dashboard", page_icon="📊", layout="wide", initial_sidebar_state="expanded")
apply_custom_css()

@st.cache_resource(show_spinner=False)
def get_trained_models():
    return load_models()

models = get_trained_models()

if models is None:
    st.error("⚠️ Models not found. Please run `python train_models.py` first!")
    st.stop()
    
if "user_input" not in st.session_state:
    st.warning("Please enter your habits on the **📝 Your Habits** page first!")
    st.stop()

ui = st.session_state.user_input
years_ahead = ui.get("years_ahead", 5)

predictions = predict_all(models, ui)
trajectory = generate_trajectory(models, ui, years=years_ahead)

st.markdown('<div class="section-title">02 — Your Current Predictions</div>', unsafe_allow_html=True)

c1, c2, c3, c4 = st.columns(4)

exam_color = "#2ed573" if predictions["exam_score"] >= 75 else "#ffa502" if predictions["exam_score"] >= 55 else "#ff4757"
dropout_color = "#ff4757" if predictions["dropout_prob"] > 30 else "#ffa502" if predictions["dropout_prob"] > 15 else "#2ed573"
stress_color = "#ff4757" if predictions["stress_pct"] > 65 else "#ffa502" if predictions["stress_pct"] > 40 else "#2ed573"
wb_color = "#2ed573" if predictions["wellbeing_score"] >= 7 else "#ffa502" if predictions["wellbeing_score"] >= 5 else "#ff4757"

with c1:
    st.markdown(f"""<div class="score-card">
        <div class="score-value" style="color:{exam_color}">{predictions['exam_score']}</div>
        <div class="score-label">Academic Score /100</div>
    </div>""", unsafe_allow_html=True)

with c2:
    st.markdown(f"""<div class="score-card">
        <div class="score-value" style="color:{dropout_color}">{predictions['dropout_prob']}%</div>
        <div class="score-label">Dropout Risk</div>
    </div>""", unsafe_allow_html=True)

with c3:
    st.markdown(f"""<div class="score-card">
        <div class="score-value" style="color:{stress_color}">{predictions['stress_pct']}%</div>
        <div class="score-label">Stress Level</div>
    </div>""", unsafe_allow_html=True)

with c4:
    st.markdown(f"""<div class="score-card">
        <div class="score-value" style="color:{wb_color}">{predictions['wellbeing_score']}</div>
        <div class="score-label">Wellbeing /10</div>
    </div>""", unsafe_allow_html=True)

# Insights
warnings_list = []
goods_list = []
sleep = ui["sleep_hours"]
social_media = ui["social_media_hours"]
exercise = ui["exercise_frequency"]
study = ui["study_hours"]

if sleep < 6: warnings_list.append(f"⚠️ {sleep}hrs sleep is below the minimum 7hrs needed for healthy brain function")
if social_media > 4: warnings_list.append(f"⚠️ {social_media}hrs social media/day is strongly correlated with lower academic performance in the dataset")
if exercise < 2: warnings_list.append("⚠️ Exercising less than 2 days/week significantly increases stress and dropout risk")
if predictions["dropout_prob"] > 30: warnings_list.append(f"⚠️ {predictions['dropout_prob']}% dropout risk is HIGH — this is in the top 15% of risky profiles in the dataset")

if sleep >= 7: goods_list.append(f"✅ {sleep}hrs sleep — within healthy range")
if study >= 4: goods_list.append(f"✅ {study}hrs study/day — above dataset average")
if exercise >= 4: goods_list.append(f"✅ Exercising {exercise} days/week — strong positive effect on wellbeing")

if warnings_list:
    st.markdown(f'<div class="warning-box">{"<br>".join(warnings_list)}</div>', unsafe_allow_html=True)
if goods_list:
    st.markdown(f'<div class="good-box">{"<br>".join(goods_list)}</div>', unsafe_allow_html=True)

st.markdown("---")
st.markdown('<div class="section-title">03 — Your Life Trajectory</div>', unsafe_allow_html=True)

years_x = [d["year"] for d in trajectory["current"]]

fig = make_subplots(
    rows=2, cols=2,
    subplot_titles=["Academic Performance", "Dropout Risk %", "Stress Level %", "Wellbeing Score"],
    vertical_spacing=0.15,
    horizontal_spacing=0.1
)

colors = {"current": "#f5e642", "declining": "#ff4757", "optimized": "#2ed573"}
labels = {"current": "Current Path", "declining": "If Habits Decline", "optimized": "If You Optimize"}
metrics = [
    ("exam_score", 1, 1),
    ("dropout_prob", 1, 2),
    ("stress_pct", 2, 1),
    ("wellbeing_score", 2, 2),
]

for metric, row, col in metrics:
    for traj in ["declining", "current", "optimized"]:
        vals = [d[metric] for d in trajectory[traj]]
        show_legend = (row == 1 and col == 1)
        fig.add_trace(
            go.Scatter(
                x=years_x, y=vals,
                mode="lines+markers",
                name=labels[traj],
                line=dict(color=colors[traj], width=2.5,
                          dash="dot" if traj == "declining" else "solid"),
                marker=dict(size=5),
                showlegend=show_legend,
                legendgroup=traj,
            ),
            row=row, col=col
        )

fig.update_layout(
    paper_bgcolor="#06060e",
    plot_bgcolor="#0f0f1c",
    font=dict(color="#ccccee", family="Syne", size=11),
    legend=dict(
        bgcolor="#0f0f1c",
        bordercolor="#2a2a45",
        borderwidth=1,
        orientation="h",
        yanchor="bottom", y=1.05,
        xanchor="center", x=0.5
    ),
    margin=dict(t=60, b=40, l=40, r=40),
    height=480,
)
for i in fig['layout']['annotations']:
    i['font'] = dict(size=11, color="#aaaacc")

fig.update_xaxes(showgrid=True, gridcolor="#1a1a2e", title_text="Years from now",
                  title_font=dict(size=10), tickfont=dict(size=9))
fig.update_yaxes(showgrid=True, gridcolor="#1a1a2e", tickfont=dict(size=9))

st.plotly_chart(fig, use_container_width=True)

# 5-Year Summary
st.markdown('<div class="section-title">04 — Time Horizon Summary</div>', unsafe_allow_html=True)

yr = min(5, years_ahead)
curr = trajectory["current"][yr]
opt = trajectory["optimized"][yr]
dec = trajectory["declining"][yr]

s1, s2, s3 = st.columns(3)
with s1:
    st.markdown(f"""<div class="score-card" style="border-color:#ff4757">
        <div style="font-size:0.7rem;letter-spacing:2px;color:#ff4757;margin-bottom:0.5rem">IF HABITS DECLINE</div>
        <div style="font-family:'DM Mono';font-size:1.4rem;color:#ff4757">{dec['exam_score']:.0f}/100</div>
        <div style="font-size:0.8rem;color:#888899;margin-top:0.3rem">Academic · {dec['dropout_prob']:.0f}% dropout risk</div>
    </div>""", unsafe_allow_html=True)
with s2:
    st.markdown(f"""<div class="score-card" style="border-color:#f5e642">
        <div style="font-size:0.7rem;letter-spacing:2px;color:#f5e642;margin-bottom:0.5rem">CURRENT PATH</div>
        <div style="font-family:'DM Mono';font-size:1.4rem;color:#f5e642">{curr['exam_score']:.0f}/100</div>
        <div style="font-size:0.8rem;color:#888899;margin-top:0.3rem">Academic · {curr['dropout_prob']:.0f}% dropout risk</div>
    </div>""", unsafe_allow_html=True)
with s3:
    st.markdown(f"""<div class="score-card" style="border-color:#2ed573">
        <div style="font-size:0.7rem;letter-spacing:2px;color:#2ed573;margin-bottom:0.5rem">IF YOU OPTIMIZE</div>
        <div style="font-family:'DM Mono';font-size:1.4rem;color:#2ed573">{opt['exam_score']:.0f}/100</div>
        <div style="font-size:0.8rem;color:#888899;margin-top:0.3rem">Academic · {opt['dropout_prob']:.0f}% dropout risk</div>
    </div>""", unsafe_allow_html=True)

render_sidebar_info()
