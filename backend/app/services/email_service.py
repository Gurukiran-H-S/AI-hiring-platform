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
        """Send OTP via Gmail SMTP with STARTTLS or fallback in dev console."""
        smtp_user = settings.effective_smtp_username
        smtp_pass = settings.SMTP_PASSWORD
        email_from = settings.effective_email_from
        smtp_host = settings.SMTP_HOST
        smtp_port = settings.SMTP_PORT
        use_dev_fallback = (
            settings.DEBUG
            or settings.ENVIRONMENT.lower() == "development"
            or settings.SMTP_FALLBACK_ON_FAILURE
        )

        subject = "HireAI Unified - Email Verification OTP"
        body = f"""Hello,

Your HireAI Unified verification code is:

{otp}

This OTP is valid for 5 minutes.

If you did not request this verification, please ignore this email.

Regards,
HireAI Unified
"""

        # Log configuration status (never print password)
        logger.info(
            f"SMTP CONFIG: Host={smtp_host}, Port={smtp_port}, User={smtp_user}, PasswordSet={bool(smtp_pass)}, "
            f"From={email_from}, DevelopmentFallback={use_dev_fallback}"
        )

        # Check if SMTP credentials are provided
        if not smtp_user or not smtp_pass or smtp_user == "None":
            logger.warning("[DEV EMAIL SERVICE] SMTP_USERNAME or SMTP_PASSWORD not configured. Printing OTP to console.")
            print(f"\n==================================================")
            print(f"  [DEV CONSOLE: EMAIL VERIFICATION OTP SENT TO {email}]")
            print(f"  VERIFICATION CODE: {otp}")
            print(f"  (Configure SMTP_USERNAME & SMTP_PASSWORD in .env for Gmail delivery)")
            print(f"==================================================\n")
            return {"success": True, "dev_fallback": True}

        try:
            msg = MIMEMultipart()
            msg['From'] = email_from
            msg['To'] = email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(smtp_host, int(smtp_port), timeout=20)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            server.quit()

            logger.info(f"Verification OTP email successfully delivered via SMTP to {email}")
            print(f"\n[GMAIL SMTP SUCCESS] OTP delivered to {email}\n")
            return {"success": True, "dev_fallback": False}

        except Exception as e:
            logger.error(f"Failed to send SMTP email to {email}: {e}", exc_info=True)
            print(f"\n[SMTP SEND FAILURE]: {e}")

            if use_dev_fallback:
                logger.warning("Using development OTP fallback due to SMTP failure.")
                print(f"==================================================")
                print(f"  [DEV FALLBACK CONSOLE OTP FOR {email}] ")
                print(f"  VERIFICATION CODE: {otp}")
                print(f"==================================================\n")
                return {"success": True, "dev_fallback": True}
            return {"success": False, "dev_fallback": False}


email_service = EmailService()
