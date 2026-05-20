import re
import bcrypt
import datetime
from backend.services import user_service

def validate_email(email):
    regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'
    if re.fullmatch(regex, email):
        return True
    return False

def validate_password(password):
    if len(password) < 8: return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password): return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password): return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password): return False, "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password): return False, "Password must contain at least one special character."
    return True, "Password is valid."

def register_user(username, email, password):
    if not username or not email or not password: return False, "All fields are required."
    if not validate_email(email): return False, "Invalid email address format."
    is_valid_pass, pass_msg = validate_password(password)
    if not is_valid_pass: return False, pass_msg

    if user_service.get_user_by_username(username): return False, "Username already exists."
    if user_service.get_user_by_email(email): return False, "Email already exists."

    try:
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except Exception as e:
        return False, f"Encryption error: {str(e)}"

    user_id, error = user_service.add_user(username, email, hashed)
    if user_id:
        return True, "User created successfully."
    else:
        return False, f"Database error: {error}"

def login_user(identifier, password):
    user = user_service.get_user_by_email(identifier)
    if not user:
        user = user_service.get_user_by_username(identifier)
    
    if not user: return None, "Invalid email/username or password."

    if user['lockout_until']:
        lockout_time = user['lockout_until']
        if isinstance(lockout_time, str):
            try: lockout_time = datetime.datetime.fromisoformat(lockout_time)
            except ValueError: pass
        if isinstance(lockout_time, datetime.datetime) and lockout_time > datetime.datetime.now():
            time_left = int((lockout_time - datetime.datetime.now()).total_seconds() / 60) + 1
            return None, f"Account locked. Try again in {time_left} minutes."

    try:
        if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            user_service.reset_failed_login(user['user_id'])
            user_service.update_last_login(user['user_id'])
            return user, "Login successful."
        else:
            attempts = user_service.increment_failed_login(user['user_id'])
            if attempts >= 5:
                user_service.lock_account(user['user_id'])
                return None, "Account locked due to 5 failed attempts. Please wait 15 minutes."
            remaining = 5 - attempts
            return None, f"Invalid password. {remaining} attempts remaining before lockout."
    except Exception as e:
        return None, f"Login error: {str(e)}"

def reset_password(username, email, new_password):
    user = user_service.get_user_by_username(username)
    if not user: return False, "User not found."
    if user['email'] != email: return False, "Email does not match our records."
    
    is_valid, msg = validate_password(new_password)
    if not is_valid: return False, msg
    
    try:
        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_service.update_password(user['user_id'], hashed)
        return True, "Password reset successfully. You can now login."
    except Exception as e:
        return False, f"Reset error: {str(e)}"

def update_profile(user_id, current_password, new_username=None, new_email=None, new_password=None, auto_delete_days=None):
    user = user_service.get_user_by_id(user_id)
    if not user: return False, "User not found."

    try:
        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return False, "Incorrect current password."
    except Exception as e:
        return False, f"Password verification error: {str(e)}"

    if new_email and not validate_email(new_email): return False, "Invalid email format."
        
    hashed_new_password = None
    if new_password:
        is_valid, msg = validate_password(new_password)
        if not is_valid: return False, msg
        try: hashed_new_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        except Exception as e: return False, f"Encryption error: {str(e)}"

    success, msg = user_service.update_user_profile(
        user_id=user_id, new_email=new_email, new_password_hash=hashed_new_password,
        auto_delete_days=auto_delete_days, new_username=new_username
    )
    return success, msg
