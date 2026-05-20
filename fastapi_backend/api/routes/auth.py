from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from schemas.user import UserLogin, UserRegister, Token
from core.database import get_db, User
from core.security import verify_password, get_password_hash, create_access_token
from core.config import settings

router = APIRouter()

@router.post("/register/", response_model=dict)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first()
    if user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(username=user_in.username, email=user_in.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User created successfully"}

@router.post("/login/", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_in.username).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access": access_token, "token_type": "bearer"}
