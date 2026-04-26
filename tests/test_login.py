import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend import auth
from backend import database
import time
import datetime

def run_tests():
    print("Running Secure Login Tests...")
    
    # Setup: Create a fresh user for valid testing
    username = "loginTestUser"
    email = "logintest@example.com"
    password = "StrongPass1!"
    
    # Ensure clean state (delete if exists or ignore error)
    # We'll just try to register, if exists we proceed
    auth.register_user(username, email, password)
    
    # 1. Test Successful Login
    print("\n--- 1. Testing Successful Login ---")
    user, msg = auth.login_user(username, password)
    if user:
        print(f"[OK] Login successful: {msg}")
    else:
        print(f"[FAIL] Login failed for valid user: {msg}")

    # 2. Test Failed Login & Lockout Counter
    print("\n--- 2. Testing Lockout Mechanism ---")
    
    # Reset first to be sure
    u = database.get_user_by_username(username)
    database.reset_failed_login(u['user_id'])
    
    # Fail 5 times
    for i in range(1, 6):
        user, msg = auth.login_user(username, "WrongPass")
        if not user:
            print(f"[OK] Attempt {i} failed as expected. Message: {msg}")
        else:
            print(f"[FAIL] Unexpected success on attempt {i}")

    # 3. Test Lockout Enforcement
    print("\n--- 3. Testing Lockout Enforcement ---")
    # At this point, account should be locked. Even correct password should fail.
    user, msg = auth.login_user(username, password)
    if not user and "Account locked" in msg:
        print(f"[OK] Account verified locked: {msg}")
    elif user:
        print(f"[FAIL] User was able to login despite lockout!")
    else:
        print(f"[FAIL] Login failed but message was unexpected: {msg}")

    # 4. Test Lockout Expiration (Simulation)
    print("\n--- 4. Testing Lockout Expiration ---")
    # Manually expire the lock
    u = database.get_user_by_username(username)
    past_time = datetime.datetime.now() - datetime.timedelta(minutes=20)
    
    conn = database.get_db_connection()
    conn.execute("UPDATE Users SET lockout_until = ? WHERE user_id = ?", (past_time, u['user_id']))
    conn.commit()
    conn.close()
    
    user, msg = auth.login_user(username, password)
    if user:
        print(f"[OK] User can login after lockout expired.")
    else:
        print(f"[FAIL] User still cannot login after lockout reset: {msg}")

    print("\nLogin Tests Completed.")

if __name__ == "__main__":
    database.create_tables() # Ensure DB state
    run_tests()
