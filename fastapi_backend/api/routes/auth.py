import logging
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas.user import UserRegister, UserLogin, Token, ForgotPasswordRequest, ResetPasswordRequest
from core.database import get_db, User
from core.security import verify_password, get_password_hash, create_access_token
from core.config import settings

router = APIRouter()
logger = logging.getLogger("pixit.auth")

@router.post("/register/", response_model=dict)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    logger.info(f"[DEBUG AUTH] Registration request received for username: {user_in.username}")
    
    # Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    
    if existing_user:
        logger.warning(f"[DEBUG AUTH] Registration failed: Username or email already registered: {user_in.username} / {user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Username or email is already registered."
        )
    
    try:
        hashed_password = get_password_hash(user_in.password)
        logger.info(f"[DEBUG AUTH] Generated hash length for registration: {len(hashed_password)}, preview: {hashed_password[:15]}...")
        
        db_user = User(
            username=user_in.username, 
            email=user_in.email, 
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"[DEBUG AUTH] User registration completed successfully: {user_in.username}")
        return {"message": "User registered successfully."}
    except Exception as e:
        db.rollback()
        logger.error(f"[DEBUG AUTH] Registration database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database transaction error during registration."
        )

@router.post("/login/", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    logger.info(f"[DEBUG AUTH] Login request received. Identifier: {user_in.username}")
    
    user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.username)
    ).first()
    
    if not user:
        logger.warning(f"[DEBUG AUTH] User lookup failed. No user found for: {user_in.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect username, email, or password."
        )
        
    logger.info(f"[DEBUG AUTH] User found: id={user.id}, username={user.username}, email={user.email}")
    logger.info(f"[DEBUG AUTH] Stored hash preview: {user.hashed_password[:15]}... (length={len(user.hashed_password)})")
    
    verified = verify_password(user_in.password, user.hashed_password)
    logger.info(f"[DEBUG AUTH] Password verification result: {verified}")
    
    if not verified:
        logger.warning(f"[DEBUG AUTH] Password verification failed for: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect username, email, or password."
        )
    
    try:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        logger.info(f"[DEBUG AUTH] JWT token created successfully for user: {user.username}")
        return {"access": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"[DEBUG AUTH] JWT token creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate secure auth session."
        )

@router.post("/forgot-password/", response_model=dict)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    logger.info(f"Password reset request received for email: {payload.email}")
    
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user:
        logger.info(f"Password reset skipped: Email '{payload.email}' not found (silent response).")
        return {"message": "If your email is registered, a password reset token has been sent."}
    
    try:
        token = secrets.token_hex(16)
        expiration = datetime.now(timezone.utc) + timedelta(hours=1)
        
        user.reset_token = token
        user.reset_token_expires = expiration
        db.commit()
        
        logger.info(f"\n======================================================\n"
                    f"SIMULATED EMAIL DISPATCH FOR PASSWORD RESET\n"
                    f"To: {user.email}\n"
                    f"Token: {token}\n"
                    f"Expiration: {expiration}\n"
                    f"======================================================\n")
        
        print(f"PASSWORD RESET TOKEN FOR {user.email}: {token}")
        
        return {"message": "If your email is registered, a password reset token has been sent."}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to generate forgot password token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database transaction error during reset request."
        )

@router.post("/reset-password/", response_model=dict)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    logger.info("Executing password reset confirmation.")
    
    user = db.query(User).filter(User.reset_token == payload.token).first()
    
    if not user:
        logger.warning("Password reset failed: Invalid reset token.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )
    
    now = datetime.now(timezone.utc)
    expires = user.reset_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
        
    if now > expires:
        logger.warning(f"Password reset failed: Token has expired for user: {user.username}")
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset token has expired."
        )
    
    try:
        user.hashed_password = get_password_hash(payload.new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        logger.info(f"Password successfully reset for user: {user.username}")
        return {"message": "Your password has been successfully reset."}
    except Exception as e:
        db.rollback()
        logger.error(f"Password reset database failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database transaction error during password update."
        )
