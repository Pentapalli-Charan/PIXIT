"""
Authentication and User Management Module.

This module provides essential security functions such as email and password
validation, secure user registration with bcrypt hashing, login mechanisms with
lockout prevention, and profile management including password resets.
"""

import re
import bcrypt
from . import database

def validate_email(email):
    """
    Validates that the email format is correct using regular expressions.
    """
    regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'
    if re.fullmatch(regex, email):
        return True
    return False

def validate_password(password):
    """
    Validates that the password meets the following criteria:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character (!@#$%^&*(),.?":{}|<>)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character."
    
    return True, "Password is valid."

def register_user(username, email, password):
    """
    Handles new user registration:
    1. Validates inputs
    2. Checks strict uniqueness (Username/Email)
    3. Hashes password
    4. Inserts into DB
    """
    # 1. Validation
    if not username or not email or not password:
        return False, "All fields are required."
    
    if not validate_email(email):
        return False, "Invalid email address format."
    
    is_valid_pass, pass_msg = validate_password(password)
    if not is_valid_pass:
        return False, pass_msg

    # 2. Check Existence
    if database.get_user_by_username(username):
        return False, "Username already exists."
    if database.get_user_by_email(email):
        return False, "Email already exists."

    # 3. Hash Password
    try:
        # bcrypt.hashpw requires bytes
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except Exception as e:
        return False, f"Encryption error: {str(e)}"

    # 4. Insert into DB
    user_id, error = database.add_user(username, email, hashed)
    if user_id:
        return True, "User created successfully."
    else:
        return False, f"Database error: {error}"

import datetime

def login_user(identifier, password):
    """
    Handles user login with security checks:
    1. Checks if user exists
    2. Checks for account lockout
    3. Verifies password
    4. Manages lockout counters
    """
    # 1. Fetch User
    user = database.get_user_by_email(identifier)
    if not user:
        user = database.get_user_by_username(identifier)
    
    if not user:
        return None, "Invalid email/username or password."

    # 2. Check Lockout Status
    if user['lockout_until']:
        lockout_time = user['lockout_until']
        # SQLite timestamps are strings, parse if needed (or let Python compare if format matches)
        # Using string comparison is risky if formats differ, robust apps parse it.
        # Assuming ISO format from datetime.now() matches SQLite default
        if isinstance(lockout_time, str):
            try:
                lockout_time = datetime.datetime.fromisoformat(lockout_time)
            except ValueError:
                # If legacy timestamp format, might need adjustment. For now assume safe.
                pass
        
        if lockout_time > datetime.datetime.now():
            time_left = int((lockout_time - datetime.datetime.now()).total_seconds() / 60) + 1
            return None, f"Account locked. Try again in {time_left} minutes."
        else:
            # Lockout expired, strictly speaking we treat it as active until successful login reset?
            # Or we can auto-reset here? Let's just allow the password check to proceed.
            pass

    # 3. Verify Password
    try:
        if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            # Success
            database.reset_failed_login(user['user_id'])
            database.update_last_login(user['user_id'])
            return user, "Login successful."
        else:
            # Failure
            attempts = database.increment_failed_login(user['user_id'])
            if attempts >= 5:
                # Lockout
                database.lock_account(user['user_id'])
                return None, "Account locked due to 5 failed attempts. Please wait 15 minutes."
            
            remaining = 5 - attempts
            return None, f"Invalid password. {remaining} attempts remaining before lockout."
            
    except Exception as e:
        return None, f"Login error: {str(e)}"

def reset_password(username, email, new_password):
    """
    Handles password reset:
    1. Verifies user exists and email matches.
    2. Validates new password.
    3. Updates password in DB.
    """
    # 1. Verification
    user = database.get_user_by_username(username)
    if not user:
        return False, "User not found."
    
    if user['email'] != email:
        return False, "Email does not match our records."
    
    # 2. Validation
    is_valid, msg = validate_password(new_password)
    if not is_valid:
        return False, msg
    
    # 3. Update
    try:
        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        database.update_password(user['user_id'], hashed)
        return True, "Password reset successfully. You can now login."
    except Exception as e:
        return False, f"Reset error: {str(e)}"

def update_profile(user_id, current_password, new_username=None, new_email=None, new_password=None, auto_delete_days=None):
    """
    Updates the user's profile info after validating their current password.
    """
    user = database.get_user_by_id(user_id)
    if not user:
        return False, "User not found."

    # Verify current password
    try:
        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return False, "Incorrect current password."
    except Exception as e:
        return False, f"Password verification error: {str(e)}"

    # Validations
    if new_email and not validate_email(new_email):
        return False, "Invalid email format."
        
    hashed_new_password = None
    if new_password:
        is_valid, msg = validate_password(new_password)
        if not is_valid:
            return False, msg
        try:
            hashed_new_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        except Exception as e:
            return False, f"Encryption error: {str(e)}"

    # Perform update
    success, msg = database.update_user_profile(
        user_id=user_id,
        new_email=new_email,
        new_password_hash=hashed_new_password,
        auto_delete_days=auto_delete_days,
        new_username=new_username
    )
    
    return success, msg
