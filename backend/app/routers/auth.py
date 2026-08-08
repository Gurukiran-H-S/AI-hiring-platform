"""Authentication router - Register, Login, Refresh, Send OTP, Verify OTP."""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta
from uuid import UUID
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.user import User, CandidateProfile, RecruiterProfile, UserRole, EmailVerification
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate
from app.utils.jwt_handler import hash_password, verify_password, create_tokens, decode_token
from app.middleware.auth_middleware import get_current_user
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class SendOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


@router.post("/send-otp")
async def send_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    """Generate 6-digit OTP, store SHA-256 hash, and deliver via email/SMTP."""
    otp = email_service.generate_otp()
    otp_hash = email_service.hash_otp(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # Invalidate previous unexpired OTPs for this email
    db.query(EmailVerification).filter(EmailVerification.email == req.email).delete()

    record = EmailVerification(
        email=req.email,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        is_verified=False
    )
    db.add(record)
    db.commit()

    send_result = email_service.send_otp_email(req.email, otp)
    if not send_result.get("success"):
        logger.warning(f"Failed to deliver OTP to {req.email}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to send verification email right now. Please try again later.",
        )

    if send_result.get("dev_fallback"):
        logger.info(f"Development OTP fallback active for {req.email}")
        return {
            "message": "Verification OTP sent using development fallback.",
            "email": req.email,
            "expires_in": "5 minutes",
            "dev_fallback": True,
        }

    return {"message": "Verification OTP sent successfully", "email": req.email, "expires_in": "5 minutes"}


@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify 6-digit OTP with attempt limits and expiry validation."""
    record = db.query(EmailVerification).filter(
        EmailVerification.email == req.email,
        EmailVerification.is_verified == False
    ).order_by(EmailVerification.created_at.desc()).first()

    if not record:
        raise HTTPException(status_code=400, detail="No active OTP request found for this email.")

    if datetime.utcnow() > record.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")

    if record.attempts >= 5:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please request a new OTP.")

    # Check OTP hash match
    submitted_hash = email_service.hash_otp(req.otp.strip())
    if submitted_hash != record.otp_hash:
        record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid OTP code. {5 - record.attempts} attempts remaining.")

    record.is_verified = True
    db.commit()

    # Mark user email verified if account already created
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        user.is_verified = True
        db.commit()

    return {"message": "Email verified successfully!", "verified": True}


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (candidate/recruiter)."""
    # Check existing email
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Must verify email OTP first
    verification = db.query(EmailVerification).filter(
        EmailVerification.email == user_data.email,
        EmailVerification.is_verified == True,
    ).order_by(EmailVerification.created_at.desc()).first()

    if not verification:
        raise HTTPException(
            status_code=400,
            detail="Email not verified. Please verify your OTP before registering.",
        )

    # Create user
    try:
        hashed_password = hash_password(user_data.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role,
        phone=getattr(user_data, 'phone', None),
        location=getattr(user_data, 'location', None),
        is_verified=False,
    )
    db.add(user)
    db.flush()

    # Create role-specific profile
    if user.role == UserRole.CANDIDATE:
        profile = CandidateProfile(user_id=user.id)
        db.add(profile)
    elif user.role == UserRole.RECRUITER:
        profile = RecruiterProfile(user_id=user.id)
        db.add(profile)

    db.commit()
    db.refresh(user)

    tokens = create_tokens(str(user.id), user.email, user.role.value)

    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
        "user": UserResponse.model_validate(user) if hasattr(UserResponse, 'model_validate') else UserResponse.from_orm(user),
    }


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get JWT tokens."""
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    user.last_login = datetime.utcnow()
    db.commit()

    tokens = create_tokens(str(user.id), user.email, user.role.value)

    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
        "user": UserResponse.model_validate(user) if hasattr(UserResponse, 'model_validate') else UserResponse.from_orm(user),
    }


@router.post("/refresh")
async def refresh_token(refresh_token: str = Query(...), db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == UUID(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    tokens = create_tokens(str(user.id), user.email, user.role.value)
    return {"access_token": tokens["access_token"], "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user profile."""
    for field, value in update_data.dict(exclude_none=True).items():
        setattr(current_user, field, value)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password."""
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    try:
        current_user.hashed_password = hash_password(new_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    db.commit()
    return {"message": "Password updated successfully"}
