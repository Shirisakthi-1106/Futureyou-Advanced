def evaluate_sentinel_risk(predictions, trajectory, habits, history=None):
    """
    Evaluates sentinel risk level based on predictions, trajectory, and history.
    Returns: {
        'triggered': bool,
        'severity': 'low'|'medium'|'high'|'critical',
        'reasons': [str],
        'stats': dict,
        'trajectory_summary': dict,
        'recovery_suggestions': [str],
        'guardianShouldBeAlerted': bool,
        'shouldSendEmail': bool
    }
    """
    risk = {
        'triggered': False,
        'severity': 'low',
        'reasons': [],
        'stats': {
            'stress': predictions.get('stress_pct', 0),
            'sleep': habits.get('sleep_hours', 0),
            'wellbeing': predictions.get('wellbeing_score', 0),
            'dropout': predictions.get('dropout_prob', 0),
            'exam': predictions.get('exam_score', 0)
        },
        'trajectory_summary': {},
        'recovery_suggestions': [],
        'guardianShouldBeAlerted': False,
        'shouldSendEmail': False
    }

    stress = risk['stats']['stress']
    sleep = risk['stats']['sleep']
    wellbeing = risk['stats']['wellbeing']
    dropout = risk['stats']['dropout']
    exam = risk['stats']['exam']

    severity_score = 0  # Accumulate severity points for combined-indicator logic

    # --- 1. Critical Level Thresholds ---
    if stress > 85:
        severity_score += 4
        risk['reasons'].append(f"Critical stress level ({stress:.1f}%) detected — immediate burnout risk.")
    if dropout > 40:
        severity_score += 4
        risk['reasons'].append(f"Critical academic dropout risk ({dropout:.1f}%) detected.")
    if wellbeing < 3.0:
        severity_score += 3
        risk['reasons'].append(f"Severe emotional wellbeing deficit ({wellbeing:.1f}/10).")
    if sleep < 4:
        severity_score += 3
        risk['reasons'].append(f"Dangerous sleep deprivation ({sleep:.1f}h) — cognitive impairment likely.")

    # --- 2. High Level Thresholds ---
    if stress > 70 and stress <= 85:
        severity_score += 2
        risk['reasons'].append(f"High stress environment detected ({stress:.1f}%).")
    if wellbeing < 4.0 and wellbeing >= 3.0:
        severity_score += 2
        risk['reasons'].append(f"Emotional wellbeing index is low ({wellbeing:.1f}/10).")
    if sleep < 5 and sleep >= 4:
        severity_score += 2
        risk['reasons'].append(f"Severe sleep deprivation (<5h) impacting cognitive stability.")
    if dropout > 25 and dropout <= 40:
        severity_score += 2
        risk['reasons'].append(f"Elevated dropout risk ({dropout:.1f}%) requires monitoring.")

    # --- 3. Combined danger patterns ---
    if stress > 60 and sleep < 5.5:
        severity_score += 2
        risk['reasons'].append("High stress combined with poor sleep detected — compounding burnout risk.")
    if wellbeing < 5.0 and dropout > 20:
        severity_score += 2
        risk['reasons'].append("Low wellbeing combined with elevated dropout risk — intervention recommended.")
    if stress > 55 and wellbeing < 5.0 and sleep < 6:
        severity_score += 2
        risk['reasons'].append("Triple risk pattern: elevated stress + low wellbeing + poor sleep detected.")

    # --- 4. Medium Level Thresholds ---
    if stress > 55 and stress <= 70 and severity_score < 2:
        severity_score += 1
        risk['reasons'].append("Elevated stress patterns observed.")
    if wellbeing < 5.5 and wellbeing >= 4.0 and severity_score < 2:
        severity_score += 1
        risk['reasons'].append("Wellbeing indicators are slightly below optimal.")
    if sleep < 6 and sleep >= 5 and severity_score < 2:
        severity_score += 1
        risk['reasons'].append("Sub-optimal sleep patterns detected.")

    # --- 5. History-Aware Logic (Repeated Negative Patterns) ---
    if history and len(history) >= 2:
        recent_predictions = [m for m in history if m.get('type') == 'prediction'][-3:]
        if len(recent_predictions) >= 2:
            avg_stress = sum(p.get('stress_level', 0) for p in recent_predictions) / len(recent_predictions)
            if avg_stress > 75:
                severity_score += 2
                risk['reasons'].append("Sustained high-stress pattern detected over multiple interactions.")
            elif avg_stress > 60:
                severity_score += 1
                risk['reasons'].append("Recurring moderate stress pattern observed over recent sessions.")

            # Check for declining exam trend
            exam_scores = [p.get('exam_score', 0) for p in recent_predictions if p.get('exam_score')]
            if len(exam_scores) >= 2 and exam_scores[-1] < exam_scores[0] - 5:
                severity_score += 1
                risk['reasons'].append(f"Academic decline detected: score dropped from {exam_scores[0]:.0f} to {exam_scores[-1]:.0f}.")

    # --- 6. Trajectory Drift Analysis ---
    traj_summary = {}
    if isinstance(trajectory, dict):
        try:
            if 'declining' in trajectory and 'current' in trajectory:
                curr_data = trajectory['current']
                decl_data = trajectory['declining']
                opt_data = trajectory.get('optimized', [])

                if len(curr_data) > 1 and len(decl_data) > 1:
                    last_idx = min(5, len(curr_data) - 1, len(decl_data) - 1)
                    curr_5yr = curr_data[last_idx].get('exam_score', 0)
                    decl_5yr = decl_data[last_idx].get('exam_score', 0)
                    opt_5yr = opt_data[last_idx].get('exam_score', 0) if opt_data and len(opt_data) > last_idx else curr_5yr

                    curr_stress_5yr = curr_data[last_idx].get('stress_pct', 0)
                    decl_stress_5yr = decl_data[last_idx].get('stress_pct', 0)

                    traj_summary = {
                        'drift_path_exam': round(decl_5yr, 1),
                        'current_path_exam': round(curr_5yr, 1),
                        'thriving_path_exam': round(opt_5yr, 1),
                        'drift_path_stress': round(decl_stress_5yr, 1),
                        'current_path_stress': round(curr_stress_5yr, 1),
                        'exam_gap': round(opt_5yr - decl_5yr, 1),
                        'years_projected': last_idx
                    }

                    if curr_5yr - decl_5yr > 15:
                        severity_score += 2
                        risk['reasons'].append(
                            f"Future trajectory indicates significant risk of academic decline "
                            f"(current {curr_5yr:.0f} vs declining {decl_5yr:.0f} at year {last_idx})."
                        )
                    elif curr_5yr - decl_5yr > 8:
                        severity_score += 1
                        risk['reasons'].append("Trajectory indicates moderate risk of academic drift if habits persist.")

                    if decl_stress_5yr > 80:
                        severity_score += 1
                        risk['reasons'].append(f"Declining trajectory projects severe future stress ({decl_stress_5yr:.0f}%).")
        except (IndexError, KeyError, TypeError):
            pass

    risk['trajectory_summary'] = traj_summary

    # --- 7. Determine severity from accumulated score ---
    if severity_score >= 6:
        risk['severity'] = 'critical'
    elif severity_score >= 4:
        risk['severity'] = 'high'
    elif severity_score >= 2:
        risk['severity'] = 'medium'
    else:
        risk['severity'] = 'low'

    # --- 8. Build recovery suggestions based on detected issues ---
    suggestions = []
    if sleep < 6:
        suggestions.append(f"Encourage consistent sleep of 7-8 hours. Current: {sleep:.1f}h.")
    if stress > 60:
        suggestions.append("Assess workload — reduce overcommitment and introduce breaks.")
    if wellbeing < 5.0:
        suggestions.append("Check emotional wellbeing through open conversation about stressors.")
    if dropout > 20:
        suggestions.append("Review academic engagement and identify potential disengagement triggers.")
    if habits.get('screen_time', 0) > 8:
        suggestions.append(f"Reduce screen time (currently {habits.get('screen_time', 0):.1f}h) to improve focus and sleep.")
    if habits.get('exercise_frequency', 0) < 2:
        suggestions.append("Encourage physical activity — even 20 minutes of exercise can reduce stress significantly.")
    if not suggestions:
        suggestions.append("Continue monitoring — maintain current healthy habits and routines.")

    risk['recovery_suggestions'] = suggestions
    risk['triggered'] = len(risk['reasons']) > 0
    # Automatic email alerts only for high/critical
    risk['guardianShouldBeAlerted'] = risk['severity'] in ['high', 'critical']
    risk['shouldSendEmail'] = risk['guardianShouldBeAlerted']

    return risk
