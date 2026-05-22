import logging
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import bcrypt
from core.config import settings

logger = logging.getLogger("pixit.security")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        logger.info(f"[DEBUG SECURITY] verify_password starting. plain_len={len(plain_password)}")
        
        # Ensure we decode/encode standard types
        if isinstance(hashed_password, bytes):
            hashed_bytes = hashed_password
        else:
            hashed_bytes = hashed_password.encode('utf-8')
            
        plain_bytes = plain_password.encode('utf-8')
        
        # Run bcrypt checkpw
        result = bcrypt.checkpw(plain_bytes, hashed_bytes)
        logger.info(f"[DEBUG SECURITY] verify_password comparison successful: {result}")
        return result
    except Exception as e:
        logger.error(f"[DEBUG SECURITY] verify_password raised exception: {e}")
        return False

def get_password_hash(password: str) -> str:
    # Generate bcrypt salt and hash
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
