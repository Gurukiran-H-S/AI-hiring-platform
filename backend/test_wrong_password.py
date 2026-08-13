import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.utils.jwt_handler import hash_password, verify_password

def main():
    print("==================================================")
    print("WRONG PASSWORD AUTHENTICATION TEST")
    print("==================================================")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "test_cand_db@example.com").first()
        if user:
            user.hashed_password = hash_password("correctpassword123")
            db.commit()

        # Test password check
        valid = verify_password("correctpassword123", user.hashed_password)
        print(f"1. Correct Password Check: {valid}")
        assert valid is True

        invalid = verify_password("wrongpassword999", user.hashed_password)
        print(f"2. Wrong Password Check: {invalid}")
        assert invalid is False

        print("\n==================================================")
        print("WRONG PASSWORD AUTHENTICATION PASSED PERFECTLY!")
        print("==================================================")
    finally:
        db.close()

if __name__ == "__main__":
    main()
