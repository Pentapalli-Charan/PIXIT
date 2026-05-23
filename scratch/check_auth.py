import logging
from sqlalchemy import create_engine, text
from core.config import settings
import bcrypt
from passlib.context import CryptContext

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pixit.diag")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_raw_bcrypt(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        logger.error(f"Raw bcrypt verification raised error: {e}")
        return False

def verify_passlib(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception as e:
        logger.error(f"Passlib verification raised error: {e}")
        return False

def main():
    print(f"Connecting to database: {settings.SQLALCHEMY_DATABASE_URL}")
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Find users
            result = conn.execute(text("SELECT username, email, hashed_password FROM users"))
            users = result.fetchall()
            
            if not users:
                print("No users found in database.")
                return
                
            print(f"Found {len(users)} users:")
            for u in users:
                username, email, hashed = u
                print(f"- Username: {username}, Email: {email}")
                print(f"  Hash: {hashed}")
                
                # Test with test password
                test_pass = "Test12345"
                raw_ok = verify_raw_bcrypt(test_pass, hashed)
                passlib_ok = verify_passlib(test_pass, hashed)
                
                print(f"  Raw bcrypt verify('{test_pass}'): {raw_ok}")
                print(f"  Passlib verify('{test_pass}'): {passlib_ok}")
                
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    main()
