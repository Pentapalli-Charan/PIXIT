import datetime
import sqlite3
from backend.core.database import get_db_connection

def add_user(username, email, password_hash):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Users (username, email, password_hash, failed_login_attempts) 
            VALUES (?, ?, ?, 0)
        """, (username, email, password_hash))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id, None
    except sqlite3.IntegrityError as e:
        return None, str(e)
    except Exception as e:
        return None, str(e)

def update_last_login(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Users SET last_login = ? WHERE user_id = ?", (datetime.datetime.now(), user_id))
    conn.commit()
    conn.close()

def increment_failed_login(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    cursor.execute("SELECT failed_login_attempts FROM Users WHERE user_id = ?", (user_id,))
    attempts = cursor.fetchone()['failed_login_attempts']
    conn.close()
    return attempts

def reset_failed_login(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Users SET failed_login_attempts = 0, lockout_until = NULL WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

def lock_account(user_id, duration_minutes=15):
    conn = get_db_connection()
    cursor = conn.cursor()
    lockout_time = datetime.datetime.now() + datetime.timedelta(minutes=duration_minutes)
    cursor.execute("UPDATE Users SET lockout_until = ? WHERE user_id = ?", (lockout_time, user_id))
    conn.commit()
    conn.close()
    return lockout_time

def get_user_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def update_password(user_id, password_hash):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Users SET password_hash = ?, failed_login_attempts = 0, lockout_until = NULL WHERE user_id = ?", (password_hash, user_id))
    conn.commit()
    conn.close()

def update_user_profile(user_id, new_email=None, new_password_hash=None, auto_delete_days=None, new_username=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    updates = []
    params = []
    if new_email:
        updates.append("email = ?")
        params.append(new_email)
    if new_password_hash:
        updates.append("password_hash = ?")
        params.append(new_password_hash)
    if auto_delete_days is not None:
        updates.append("auto_delete_days = ?")
        params.append(auto_delete_days)
    if new_username:
        updates.append("username = ?")
        params.append(new_username)
        
    if not updates:
        return True, "No updates provided."
        
    query = f"UPDATE Users SET {', '.join(updates)} WHERE user_id = ?"
    params.append(user_id)
    
    try:
        cursor.execute(query, params)
        conn.commit()
        success, msg = True, "Profile updated successfully."
    except sqlite3.IntegrityError:
        success, msg = False, "Username or email already exists."
    finally:
        conn.close()
        
    return success, msg

def get_user_stats(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM Transactions WHERE user_id = ?", (user_id,))
    transaction_count = cursor.fetchone()['count']
    cursor.execute("SELECT COUNT(*) as count FROM ImageHistory WHERE user_id = ?", (user_id,))
    image_count = cursor.fetchone()['count']
    cursor.execute("SELECT SUM(amount) as total FROM Transactions WHERE user_id = ? AND payment_status = 'Completed'", (user_id,))
    total_spent = cursor.fetchone()['total'] or 0.0
    cursor.execute("SELECT style_applied, COUNT(*) as c FROM ImageHistory WHERE user_id = ? GROUP BY style_applied ORDER BY c DESC LIMIT 1", (user_id,))
    fav_row = cursor.fetchone()
    favorite_style = fav_row['style_applied'] if fav_row else "None yet"
    conn.close()
    return {
        "transaction_count": transaction_count,
        "image_count": image_count,
        "total_spent": total_spent,
        "favorite_style": favorite_style
    }
