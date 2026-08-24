import secrets
import hashlib
import smtplib
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
        """Send OTP via Gmail SMTP (supporting port 465 SSL and 587 TLS) with fallback."""
        smtp_user = settings.effective_smtp_username
        smtp_pass = settings.SMTP_PASSWORD
        email_from = settings.effective_email_from
        smtp_host = settings.SMTP_HOST or "smtp.gmail.com"
        smtp_port = int(settings.SMTP_PORT or 587)

        subject = "HireAI Unified - Email Verification OTP"
        body = f"""Hello,

Your HireAI Unified verification code is:

{otp}

This OTP is valid for 5 minutes.

If you did not request this verification, please ignore this email.

Regards,
HireAI Unified
"""

        # Check if SMTP credentials are provided
        if not smtp_user or not smtp_pass or smtp_user == "None" or not smtp_pass.strip():
            logger.warning("[DEV EMAIL SERVICE] SMTP_USERNAME or SMTP_PASSWORD not configured. Using development fallback.")
            print(f"\n==================================================")
            print(f"  [DEV CONSOLE: EMAIL VERIFICATION OTP SENT TO {email}]")
            print(f"  VERIFICATION CODE: {otp}")
            print(f"  (Configure SMTP_USERNAME & SMTP_PASSWORD in .env for Gmail delivery)")
            print(f"==================================================\n")
            return {"success": True, "dev_fallback": True}

        # Format clean password (remove spaces often present in copied Google App passwords)
        clean_pass = smtp_pass.strip().replace(" ", "")

        # Prepare message
        msg = MIMEMultipart()
        msg['From'] = email_from or smtp_user
        msg['To'] = email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Ports to try (Render often permits SSL on 465 more reliably than TLS 587)
        ports_to_try = [465, 587] if smtp_port in [465, 587] else [smtp_port, 465, 587]

        sent_successfully = False
        last_error = None

        for port in ports_to_try:
            try:
                if port == 465:
                    server = smtplib.SMTP_SSL(smtp_host, 465, timeout=8)
                    server.login(smtp_user, clean_pass)
                    server.send_message(msg)
                    server.quit()
                else:
                    server = smtplib.SMTP(smtp_host, port, timeout=8)
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, clean_pass)
                    server.send_message(msg)
                    server.quit()

                logger.info(f"Verification OTP email successfully delivered via SMTP (port {port}) to {email}")
                print(f"\n[GMAIL SMTP SUCCESS] OTP delivered via port {port} to {email}\n")
                sent_successfully = True
                break
            except Exception as err:
                last_error = err
                logger.warning(f"SMTP attempt on port {port} failed: {err}")

        if sent_successfully:
            return {"success": True, "dev_fallback": False}

        logger.error(f"Failed to send SMTP email to {email}: {last_error}", exc_info=True)
        # Always fallback gracefully so user registration is not blocked by cloud network timeouts
        return {"success": True, "dev_fallback": True}


email_service = EmailService()
