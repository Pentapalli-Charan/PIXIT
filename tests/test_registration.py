import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend import auth
from backend import database
import os

def run_tests():
    print("Running Registration System Tests...")
    
    # Setup: Ensure fresh state for these tests (optional, but good for uniqueness tests)
    # For this script we will use unique random suffixes to avoid collisions if DB persists
    import random
    suffix = str(random.randint(1000, 9999))
    
    valid_user = f"testUser{suffix}"
    valid_email = f"test{suffix}@example.com"
    valid_pass = "Test@1234" # Meets all criteria

    # 1. Test Password Validation
    print("\n--- 1. Testing Password Validation ---")
    weak_passwords = [
        ("short", "at least 8 characters"),
        ("nouppercase1", "uppercase letter"),
        ("NOLOWERCASE1", "lowercase letter"),
        ("NoDigit!", "one digit"),
        ("NoSpecialChar1", "special character")
    ]
    
    for pwd, reason in weak_passwords:
        is_valid, msg = auth.validate_password(pwd)
        if not is_valid:
            print(f"[OK] Correctly rejected weak password '{pwd}': {msg}")
        else:
            print(f"[FAIL] Accepted weak password '{pwd}'")

    is_valid, msg = auth.validate_password(valid_pass)
    if is_valid:
        print(f"[OK] Correctly accepted strong password")
    else:
        print(f"[FAIL] Rejected strong password: {msg}")

    # 2. Test Email Validation
    print("\n--- 2. Testing Email Validation ---")
    invalid_emails = ["plainaddress", "#@%^%#$@#$@#.com", "@example.com", "Joe Smith <email@example.com>", "email.example.com", "test1@gmail"] # test1@gmail (missing .com)
    for email in invalid_emails:
        if not auth.validate_email(email):
            print(f"[OK] Correctly rejected invalid email '{email}'")
        else:
            print(f"[FAIL] Accepted invalid email '{email}'")
            
    if auth.validate_email(valid_email):
         print(f"[OK] Correctly accepted valid email '{valid_email}'")

    # 3. Test Registration Flow
    print("\n--- 3. Testing Registration Flow ---")
    
    # A. Successful Registration
    success, msg = auth.register_user(valid_user, valid_email, valid_pass)
    if success:
        print(f"[OK] Successful registration: {msg}")
    else:
        print(f"[FAIL] Failed valid registration: {msg}")

    # B. Duplicate Username
    success, msg = auth.register_user(valid_user, "other@example.com", valid_pass)
    if not success and "Username already exists" in msg:
        print(f"[OK] Correctly blocked duplicate username: {msg}")
    else:
        print(f"[FAIL] duplicate username check: {success}, {msg}")

    # C. Duplicate Email
    success, msg = auth.register_user("otherUser", valid_email, valid_pass)
    if not success and "Email already exists" in msg:
        print(f"[OK] Correctly blocked duplicate email: {msg}")
    else:
        print(f"[FAIL] duplicate email check: {success}, {msg}")

    print("\nTests Completed.")

if __name__ == "__main__":
    # Ensure tables exist
    database.create_tables()
    run_tests()
