import os
from app.database import SessionLocal, create_tables
from app.models.user import User, UserRole
from app.utils.jwt_handler import hash_password

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@gmail.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin@123")

def seed_admin():
    """Create the default admin user if not present.
    The password is hashed using the existing security utility.
    """
    create_tables()
    with SessionLocal() as db:
        if db.query(User).filter(User.email == ADMIN_EMAIL).first():
            print("✅ Admin user already present")
            return
        admin = User(
            email=ADMIN_EMAIL,
            full_name="Platform Administrator",
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        print("✅ Admin user created (email / password stored in DB)")

if __name__ == "__main__":
    seed_admin()
