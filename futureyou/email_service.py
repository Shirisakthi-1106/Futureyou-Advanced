import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import os
from dotenv import load_dotenv

def get_smtp_config():
    """Returns the full SMTP configuration dict (internal use)."""
    # Ensure current .env values are picked up (especially on password changes)
    load_dotenv(override=True)
    return {
        "host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", ""),
        "password": os.getenv("SMTP_PASS", ""),
        "sender_name": os.getenv("SMTP_SENDER_NAME", os.getenv("SMTP_FROM_NAME", "FutureYou Sentinel")),
        "use_tls": os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "yes"),
    }


def get_smtp_status():
    """Returns SMTP configuration status for the frontend to query."""
    cfg = get_smtp_config()

    if not cfg["user"] or not cfg["password"]:
        return {
            "configured": False,
            "reason": "SMTP_USER or SMTP_PASS not set in .env file"
        }

    # Quick connectivity check (don't send anything, just verify login)
    try:
        if cfg["port"] == 465:
            ctx = ssl.create_default_context()
            server = smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=ctx, timeout=8)
        else:
            server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=8)
            if cfg["use_tls"]:
                server.starttls(context=ssl.create_default_context())
        server.login(cfg["user"], cfg["password"])
        server.quit()
        return {
            "configured": True,
            "smtp_user": cfg["user"],
            "smtp_host": cfg["host"]
        }
    except smtplib.SMTPAuthenticationError:
        return {
            "configured": False,
            "reason": (
                "SMTP authentication failed. If using Gmail, you MUST use an App Password "
                "(not your regular password). Go to myaccount.google.com > Security > "
                "2-Step Verification > App passwords to generate one."
            )
        }
    except Exception as e:
        return {
            "configured": False,
            "reason": f"SMTP connectivity check failed: {str(e)}"
        }


def _build_email_html(guardian_name, user_name, risk_data):
    """Build the full HTML email body from risk data."""
    severity_label = risk_data.get('severity', 'unknown').upper()
    reasons = risk_data.get('reasons', [])
    stats = risk_data.get('stats', {})
    traj = risk_data.get('trajectory_summary', {})
    suggestions = risk_data.get('recovery_suggestions', [])

    stress_val = stats.get('stress', 'N/A')
    sleep_val = stats.get('sleep', 'N/A')
    dropout_val = stats.get('dropout', 'N/A')
    wellbeing_val = stats.get('wellbeing', 'N/A')
    exam_val = stats.get('exam', 'N/A')

    is_critical = risk_data.get('severity') == 'critical'
    header_color = '#dc2626' if is_critical else '#ea580c'

    # Conditional colors
    def _num_color(val, threshold_bad, invert=False):
        if not isinstance(val, (int, float)):
            return '#1e293b'
        if invert:
            return '#dc2626' if val < threshold_bad else '#059669'
        return '#dc2626' if val > threshold_bad else '#059669'

    stress_color = _num_color(stress_val, 70)
    sleep_color = _num_color(sleep_val, 6, invert=True)
    dropout_color = _num_color(dropout_val, 25)
    wellbeing_color = _num_color(wellbeing_val, 5.0, invert=True)

    # Build reasons HTML
    reasons_html = ""
    for r in reasons:
        reasons_html += f'<li style="margin-bottom: 8px;">{r}</li>'

    # Build trajectory section (only if data available)
    trajectory_html = ""
    if traj:
        trajectory_html = f"""
        <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; margin: 24px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b;">
                📊 Trajectory Dashboard ({traj.get('years_projected', 5)}-Year Projection)
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; width: 33%;">
                        <span style="display: block; font-size: 10px; font-weight: 700; color: #dc2626; text-transform: uppercase;">Drift Path</span>
                        <span style="font-size: 18px; font-weight: 800; color: #dc2626;">{traj.get('drift_path_exam', '—')}</span>
                        <span style="font-size: 10px; color: #94a3b8;"> exam</span>
                    </td>
                    <td style="padding: 8px 0; width: 33%;">
                        <span style="display: block; font-size: 10px; font-weight: 700; color: #f59e0b; text-transform: uppercase;">Current Path</span>
                        <span style="font-size: 18px; font-weight: 800; color: #f59e0b;">{traj.get('current_path_exam', '—')}</span>
                        <span style="font-size: 10px; color: #94a3b8;"> exam</span>
                    </td>
                    <td style="padding: 8px 0; width: 33%;">
                        <span style="display: block; font-size: 10px; font-weight: 700; color: #059669; text-transform: uppercase;">Thriving Path</span>
                        <span style="font-size: 18px; font-weight: 800; color: #059669;">{traj.get('thriving_path_exam', '—')}</span>
                        <span style="font-size: 10px; color: #94a3b8;"> exam</span>
                    </td>
                </tr>
                <tr>
                    <td colspan="3" style="padding-top: 12px;">
                        <span style="font-size: 10px; color: #64748b; font-weight: 600;">
                            Recovery potential gap: <strong style="color: #059669;">{traj.get('exam_gap', '—')} points</strong> between drift and thriving paths.
                        </span>
                    </td>
                </tr>
            </table>
        </div>
        """

    # Build suggestions HTML
    suggestions_html = ""
    for s in suggestions:
        suggestions_html += f'<li style="margin-bottom: 6px;">{s}</li>'
    if not suggestions_html:
        suggestions_html = """
        <li style="margin-bottom: 6px;"><strong>Sleep Recovery:</strong> Target 7-8 hours of consistent sleep.</li>
        <li style="margin-bottom: 6px;"><strong>Workload Assessment:</strong> Review academic and extracurricular load.</li>
        <li style="margin-bottom: 6px;"><strong>Wellbeing Check:</strong> Have an open conversation about stressors.</li>
        <li><strong>Dashboard Review:</strong> Log in to FutureYou to review full trajectory.</li>
        """

    body = f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; line-height: 1.6; background-color: #f8fafc; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 40px auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); background: #ffffff;">
            <!-- Header -->
            <div style="background-color: {header_color}; padding: 28px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">
                    &#9888; SENTINEL: {severity_label} RISK DETECTED
                </h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 12px;">
                    Automated Early Intervention Alert &bull; FutureYou System
                </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px;">
                <!-- Greeting -->
                <p style="font-size: 15px; margin-bottom: 20px;">Hello <strong>{guardian_name}</strong>,</p>
                <p style="font-size: 14px; color: #475569;">
                    <strong>FutureYou Sentinel</strong> has detected a significant concern regarding
                    <strong>{user_name}</strong>&rsquo;s behavioral and academic trajectory.
                    Our predictive analysis indicates conditions that may benefit from early intervention.
                </p>

                <!-- 1. Current Condition Metrics -->
                <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; margin: 24px 0; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0 0 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b;">Current Condition Snapshot</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; width: 50%;">
                                <span style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Stress Load</span>
                                <span style="font-size: 20px; font-weight: 800; color: {stress_color};">{stress_val}{'%' if isinstance(stress_val, (int, float)) else ''}</span>
                            </td>
                            <td style="padding: 8px 0; width: 50%;">
                                <span style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Sleep Pattern</span>
                                <span style="font-size: 20px; font-weight: 800; color: {sleep_color};">{sleep_val}{'h/day' if isinstance(sleep_val, (int, float)) else ''}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Dropout Risk</span>
                                <span style="font-size: 20px; font-weight: 800; color: {dropout_color};">{dropout_val}{'%' if isinstance(dropout_val, (int, float)) else ''}</span>
                            </td>
                            <td style="padding: 8px 0;">
                                <span style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Wellbeing Score</span>
                                <span style="font-size: 20px; font-weight: 800; color: {wellbeing_color};">{wellbeing_val}{'/10' if isinstance(wellbeing_val, (int, float)) else ''}</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 8px 0;">
                                <span style="display: block; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Academic Projection</span>
                                <span style="font-size: 20px; font-weight: 800; color: #1e293b;">{exam_val}{'/100' if isinstance(exam_val, (int, float)) else ''}</span>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- 2. Trajectory Dashboard -->
                {trajectory_html}

                <!-- 3. Warning Reasons -->
                <div style="margin-bottom: 28px;">
                    <h3 style="font-size: 13px; text-transform: uppercase; color: #dc2626; margin-bottom: 12px; letter-spacing: 1px;">Warning Indicators:</h3>
                    <ul style="padding-left: 20px; font-size: 14px; color: #475569; margin: 0;">
                        {reasons_html}
                    </ul>
                </div>

                <!-- 4. Recovery Suggestions -->
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0;">
                    <h3 style="margin: 0 0 12px; font-size: 13px; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">Recommended Actions:</h3>
                    <ul style="padding-left: 18px; font-size: 13px; color: #78350f; margin: 0;">
                        {suggestions_html}
                    </ul>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                    Automated Sentinel Alert &bull; FutureYou Predictive Intelligence<br>
                    This email was sent because you are registered as a guardian contact.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    return body


def send_sentinel_alert(guardian_emails, guardian_name, user_name, risk_data):
    """
    Sends a professional Sentinel Alert email to one or more guardians.

    Args:
        guardian_emails: str (single email) OR list[str] (multiple emails)
        guardian_name: str - display name for the greeting
        user_name: str - name of the user being monitored
        risk_data: dict with keys 'severity', 'reasons', 'stats', 'trajectory_summary', 'recovery_suggestions'

    Returns:
        dict: { 'success': bool, 'sent_to': list, 'failed': list, 'error': str|None }
    """
    cfg = get_smtp_config()

    # --- Validate SMTP config ---
    if not cfg["user"] or not cfg["password"]:
        error_msg = "SMTP credentials missing. Set SMTP_USER and SMTP_PASS in backend .env"
        print(f"[SENTINEL EMAIL] ERROR: {error_msg}")
        return {"success": False, "sent_to": [], "failed": [], "error": error_msg}

    # --- Normalize emails to a list ---
    if isinstance(guardian_emails, str):
        email_list = [e.strip() for e in guardian_emails.split(",") if e.strip()]
    elif isinstance(guardian_emails, list):
        email_list = [e.strip() for e in guardian_emails if isinstance(e, str) and e.strip()]
    else:
        return {"success": False, "sent_to": [], "failed": [], "error": "Invalid email format"}

    if not email_list:
        return {"success": False, "sent_to": [], "failed": [], "error": "No valid email addresses provided"}

    # --- Build the HTML body ---
    severity_label = risk_data.get('severity', 'unknown').upper()
    body = _build_email_html(guardian_name, user_name, risk_data)

    # --- Send to all recipients ---
    sent_to = []
    failed = []
    last_error = None

    try:
        # Support both port 465 (SSL) and 587 (STARTTLS)
        if cfg["port"] == 465:
            ctx = ssl.create_default_context()
            server = smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=ctx, timeout=20)
        else:
            server = smtplib.SMTP(cfg["host"], cfg["port"], timeout=24)
            server.ehlo()
            if cfg["use_tls"]:
                server.starttls(context=ssl.create_default_context())
                server.ehlo()

        server.login(cfg["user"], cfg["password"])
        print(f"[SENTINEL EMAIL] SMTP login successful as {cfg['user']}")

        for recipient in email_list:
            try:
                msg = MIMEMultipart("alternative")
                msg['From'] = formataddr((cfg['sender_name'], cfg['user']))
                msg['To'] = recipient
                msg['Subject'] = f"FutureYou Sentinel Alert: {severity_label} Risk — Intervention Recommended for {user_name}"
                msg.attach(MIMEText(body, 'html'))

                server.sendmail(cfg["user"], recipient, msg.as_string())
                sent_to.append(recipient)
                print(f"[SENTINEL EMAIL] SUCCESS: Alert sent to {recipient}")
            except Exception as e:
                failed.append(recipient)
                last_error = str(e)
                print(f"[SENTINEL EMAIL] FAILED: Could not send to {recipient}: {e}")

        server.quit()

    except smtplib.SMTPAuthenticationError as e:
        error_msg = (
            "SMTP Authentication Failed. "
            "If using Gmail, you MUST use an App Password (not your regular password). "
            "Go to myaccount.google.com > Security > 2-Step Verification > App passwords. "
            f"Raw error: {e}"
        )
        print(f"[SENTINEL EMAIL] FAILED: {error_msg}")
        return {"success": False, "sent_to": [], "failed": email_list, "error": error_msg}
    except smtplib.SMTPConnectError as e:
        error_msg = f"Could not connect to SMTP server {cfg['host']}:{cfg['port']} — {e}"
        print(f"[SENTINEL EMAIL] FAILED: {error_msg}")
        return {"success": False, "sent_to": [], "failed": email_list, "error": error_msg}
    except Exception as e:
        error_msg = f"SMTP Error: {str(e)}"
        print(f"[SENTINEL EMAIL] FAILED: {error_msg}")
        return {"success": False, "sent_to": sent_to, "failed": [r for r in email_list if r not in sent_to], "error": error_msg}

    success = len(sent_to) > 0
    return {
        "success": success,
        "sent_to": sent_to,
        "failed": failed,
        "error": last_error if failed else None
    }


# Quick standalone test
if __name__ == "__main__":
    print("--- SMTP Status Check ---")
    status = get_smtp_status()
    print(f"Status: {status}")
    print()

    if status.get("configured"):
        test_risk = {
            'severity': 'high',
            'reasons': [
                "[TEST] Manual verification: Sentinel intervention pathway active.",
                "[TEST] Simulated high-stress condition for system validation."
            ],
            'stats': {'stress': 82.0, 'sleep': 5.5, 'wellbeing': 4.5, 'dropout': 25.0, 'exam': 68.0},
            'trajectory_summary': {
                'drift_path_exam': 45.2,
                'current_path_exam': 68.0,
                'thriving_path_exam': 82.5,
                'exam_gap': 37.3,
                'years_projected': 5
            },
            'recovery_suggestions': [
                "Encourage consistent sleep of 7-8 hours. Current: 5.5h.",
                "Assess workload — reduce overcommitment and introduce breaks.",
                "Check emotional wellbeing through open conversation about stressors."
            ]
        }
        print("--- Sending Test Alert ---")
        result = send_sentinel_alert("test@example.com", "Test Guardian", "Test User", test_risk)
        print(f"Result: {result}")
    else:
        print(f"Skipping send test — SMTP not configured: {status.get('reason')}")
