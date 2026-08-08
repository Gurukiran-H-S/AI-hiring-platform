"""
Standalone Development SMTP Test Script
Validates Gmail SMTP Credentials from .env and tests authentication.
Run with: python test_email.py
"""

import sys
import smtplib
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

from app.config import settings

def test_smtp_connection():
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.effective_smtp_username
    smtp_pass = settings.SMTP_PASSWORD
    email_from = settings.effective_email_from

    print("\n========== SMTP CONFIG ==========")
    print(f"SMTP_HOST: {smtp_host}")
    print(f"SMTP_PORT: {smtp_port}")
    print(f"SMTP_USERNAME: {smtp_user if smtp_user else 'None'}")
    print(f"SMTP_PASSWORD SET: {bool(smtp_pass)}")
    print(f"EMAIL_FROM: {email_from}")
    print("=================================\n")

    # Validate missing variables
    missing = []
    if not smtp_host: missing.append("SMTP_HOST")
    if not smtp_user: missing.append("SMTP_USERNAME / SMTP_USER")
    if not smtp_pass: missing.append("SMTP_PASSWORD")

    if missing:
        print(f"ERROR: Missing environment variables: {', '.join(missing)}")
        print("\nPlease update backend/.env with your Gmail account & Google App Password:")
        print("SMTP_HOST=smtp.gmail.com")
        print("SMTP_PORT=587")
        print("SMTP_USERNAME=your_gmail@gmail.com")
        print("SMTP_PASSWORD=your_16_char_app_password")
        print("EMAIL_FROM=your_gmail@gmail.com\n")
        return False

    try:
        print(f"Connecting to {smtp_host}:{smtp_port}...")
        server = smtplib.SMTP(smtp_host, int(smtp_port), timeout=20)
        server.ehlo()
        print("Starting TLS encryption...")
        server.starttls()
        server.ehlo()

        print(f"Authenticating as {smtp_user}...")
        server.login(smtp_user, smtp_pass)
        server.quit()

        print("\nSMTP LOGIN SUCCESS\n")
        return True

    except Exception as e:
        print(f"\nSMTP LOGIN FAILED: {e}")
        print("Tip: Make sure you are using a 16-character Google App Password (not your standard Google login password).")
        print("Generate one at: https://myaccount.google.com/apppasswords\n")
        return False


if __name__ == "__main__":
    test_smtp_connection()
