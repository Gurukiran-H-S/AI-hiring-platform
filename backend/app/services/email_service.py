import os
import secrets
import hashlib
import smtplib
import ssl
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Transactional Email and Secure OTP Verification Service."""

    @staticmethod
    def generate_otp() -> str:
        """Generate cryptographically secure random 6-digit OTP using Python secrets."""
        return str(secrets.randbelow(900000) + 100000)

    @staticmethod
    def hash_otp(otp: str) -> str:
        """Hash OTP using SHA-256 for secure storage."""
        return hashlib.sha256(otp.encode('utf-8')).hexdigest()

    @staticmethod
    def send_otp_email(email: str, otp: str) -> dict:
        """Send OTP via Resend/Brevo HTTPS API (Port 443) or Gmail SMTP with fallback."""
        smtp_user = settings.effective_smtp_username
        smtp_pass = settings.effective_smtp_password
        email_from = settings.effective_email_from
        smtp_host = os.getenv("SMTP_HOST") or settings.SMTP_HOST or "smtp.gmail.com"
        smtp_port = int(os.getenv("SMTP_PORT") or settings.SMTP_PORT or 465)
        resend_key = os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", "")
        brevo_key = os.getenv("BREVO_API_KEY") or getattr(settings, "BREVO_API_KEY", "")

        subject = "HireAI Unified - Email Verification OTP"
        body = f"""Hello,

Your HireAI Unified verification code is:

{otp}

This OTP is valid for 5 minutes.

If you did not request this verification, please ignore this email.

Regards,
HireAI Unified
"""

        # ─── 1. HTTPS EMAIL API: RESEND (Port 443 - Never Blocked by Cloud Firewalls) ───
        if resend_key and resend_key.strip():
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {resend_key.strip()}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "from": os.getenv("RESEND_FROM") or "HireAI <onboarding@resend.dev>",
                    "to": [email],
                    "subject": subject,
                    "text": body,
                }
                resp = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=6)
                if resp.status_code in [200, 201]:
                    logger.info(f"Verification OTP successfully delivered via Resend HTTPS API to {email}")
                    return {"success": True, "dev_fallback": False}
                else:
                    logger.warning(f"Resend API error: {resp.status_code} - {resp.text}")
            except Exception as resend_err:
                logger.error(f"Resend API request failed: {resend_err}")

        # ─── 2. HTTPS EMAIL API: BREVO (Port 443) ───
        if brevo_key and brevo_key.strip():
            try:
                import requests
                headers = {
                    "api-key": brevo_key.strip(),
                    "Content-Type": "application/json",
                }
                payload = {
                    "sender": {"name": "HireAI Unified", "email": email_from or smtp_user or "verify@hireai.com"},
                    "to": [{"email": email}],
                    "subject": subject,
                    "textContent": body,
                }
                resp = requests.post("https://api.brevo.com/v3/smtp/email", json=payload, headers=headers, timeout=6)
                if resp.status_code in [200, 201]:
                    logger.info(f"Verification OTP successfully delivered via Brevo HTTPS API to {email}")
                    return {"success": True, "dev_fallback": False}
                else:
                    logger.warning(f"Brevo API error: {resp.status_code} - {resp.text}")
            except Exception as brevo_err:
                logger.error(f"Brevo API request failed: {brevo_err}")

        # ─── 3. GMAIL SMTP (Ports 465 / 587) ───
        if not smtp_user or not smtp_pass or smtp_user == "None" or not smtp_pass.strip():
            logger.warning(f"[DEV EMAIL SERVICE] SMTP credentials not configured. Printing OTP to console.")
            print(f"\n==================================================")
            print(f"  [DEV CONSOLE: EMAIL VERIFICATION OTP SENT TO {email}]")
            print(f"  VERIFICATION CODE: {otp}")
            print(f"==================================================\n")
            return {"success": True, "dev_fallback": True}

        # Format clean password
        clean_pass = smtp_pass.strip().replace(" ", "")

        # Prepare message
        msg = MIMEMultipart()
        msg['From'] = email_from or smtp_user
        msg['To'] = email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Ports to try
        ports_to_try = [465, 587] if smtp_port in [465, 587] else [smtp_port, 465, 587]

        sent_successfully = False
        last_error = None

        for port in ports_to_try:
            try:
                if port == 465:
                    ctx = ssl.create_default_context()
                    server = smtplib.SMTP_SSL(smtp_host, 465, context=ctx, timeout=4)
                    server.login(smtp_user, clean_pass)
                    server.send_message(msg)
                    server.quit()
                else:
                    server = smtplib.SMTP(smtp_host, port, timeout=4)
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, clean_pass)
                    server.send_message(msg)
                    server.quit()

                logger.info(f"Verification OTP email successfully delivered via SMTP (port {port}) to {email}")
                sent_successfully = True
                break
            except Exception as err:
                last_error = err
                logger.warning(f"SMTP attempt on port {port} for user {smtp_user} failed: {err}")

        if sent_successfully:
            return {"success": True, "dev_fallback": False}

        logger.error(f"Failed to send SMTP email to {email}: {last_error}")
        return {"success": True, "dev_fallback": True}


email_service = EmailService()
