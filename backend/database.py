"""
SQLite Database Management Module.

This module encapsulates all database operations, managing the SQLite connection,
schema initialization, and the execution of parameterized queries. It handles user profiles,
transactions, and image processing histories while strictly preventing SQL injection.
"""

import sqlite3
import datetime
import os

DB_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.sqlite')

def get_db_connection():
    conn = sqlite3.connect(DB_NAME, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Enable foreign key support
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    );
    """)
    
    # 2. Transactions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_status TEXT NOT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method TEXT,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    );
    """)
    
    # 3. ImageHistory Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ImageHistory (
        image_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        original_image_path TEXT NOT NULL,
        processed_image_path TEXT NOT NULL,
        style_applied TEXT NOT NULL,
        processing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_premium BOOLEAN DEFAULT FALSE,
        transaction_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES Transactions(transaction_id) ON DELETE SET NULL
    );
    """)
    
    # 4. DownloadLogs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS DownloadLogs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image_id INTEGER NOT NULL,
        format TEXT NOT NULL,
        download_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (image_id) REFERENCES ImageHistory(image_id) ON DELETE CASCADE
    );
    """)
    
    # Create indexes for frequently accessed columns
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_userid ON Transactions(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_imagehistory_userid ON ImageHistory(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_downloadlogs_userid ON DownloadLogs(user_id);")
    
    # Migrations (for existing databases)
    cursor.execute("PRAGMA table_info(Users)")
    columns = [row['name'] for row in cursor.fetchall()]
    
    # Rename id to user_id if present (legacy schema support)
    if 'id' in columns and 'user_id' not in columns:
        try:
            cursor.execute("ALTER TABLE Users RENAME COLUMN id TO user_id")
            print("Migrated: Renamed 'id' to 'user_id' in Users table.")
            # Refresh columns list
            columns.append('user_id')
            columns.remove('id')
        except Exception as e:
            print(f"Migration error (rename id): {e}")

    if 'last_login' not in columns:
        try:
            cursor.execute("ALTER TABLE Users ADD COLUMN last_login TIMESTAMP")
            print("Migrated: Added last_login column to Users table.")
        except Exception as e:
            print(f"Migration error (last_login): {e}")

    if 'created_at' not in columns:
        try:
            cursor.execute("ALTER TABLE Users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            print("Migrated: Added created_at column to Users table.")
        except Exception as e:
            print(f"Migration error (created_at): {e}")
            
    if 'failed_login_attempts' not in columns:
        try:
            cursor.execute("ALTER TABLE Users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0")
            print("Migrated: Added failed_login_attempts column to Users table.")
        except Exception as e:
            print(f"Migration error (failed_login_attempts): {e}")
            
    if 'auto_delete_days' not in columns:
        try:
            cursor.execute("ALTER TABLE Users ADD COLUMN auto_delete_days INTEGER DEFAULT 0")
            print("Migrated: Added auto_delete_days column to Users table.")
        except Exception as e:
            print(f"Migration error (auto_delete_days): {e}")
            
    if 'lockout_until' not in columns:
        try:
            cursor.execute("ALTER TABLE Users ADD COLUMN lockout_until TIMESTAMP")
            print("Migrated: Added lockout_until column to Users table.")
        except Exception as e:
            print(f"Migration error (lockout_until): {e}")

    # Migrations for Transactions
    cursor.execute("PRAGMA table_info(Transactions)")
    txn_columns = [row['name'] for row in cursor.fetchall()]

    if 'razorpay_order_id' not in txn_columns:
        try:
            cursor.execute("ALTER TABLE Transactions ADD COLUMN razorpay_order_id TEXT")
            print("Migrated: Added razorpay_order_id column to Transactions table.")
        except Exception as e:
            print(f"Migration error (razorpay_order_id): {e}")

    if 'razorpay_payment_id' not in txn_columns:
        try:
            cursor.execute("ALTER TABLE Transactions ADD COLUMN razorpay_payment_id TEXT")
            print("Migrated: Added razorpay_payment_id column to Transactions table.")
        except Exception as e:
            print(f"Migration error (razorpay_payment_id): {e}")

    if 'razorpay_signature' not in txn_columns:
        try:
            cursor.execute("ALTER TABLE Transactions ADD COLUMN razorpay_signature TEXT")
            print("Migrated: Added razorpay_signature column to Transactions table.")
        except Exception as e:
            print(f"Migration error (razorpay_signature): {e}")

    # Migrations for ImageHistory
    cursor.execute("PRAGMA table_info(ImageHistory)")
    img_history_columns = [row['name'] for row in cursor.fetchall()]
    
    if 'download_date' not in img_history_columns:
        try:
            cursor.execute("ALTER TABLE ImageHistory ADD COLUMN download_date TIMESTAMP")
            print("Migrated: Added download_date column to ImageHistory table.")
        except Exception as e:
            print(f"Migration error (download_date): {e}")
            
    if 'download_format' not in img_history_columns:
        try:
            cursor.execute("ALTER TABLE ImageHistory ADD COLUMN download_format TEXT")
            print("Migrated: Added download_format column to ImageHistory table.")
        except Exception as e:
            print(f"Migration error (download_format): {e}")
            
    if 'is_premium' not in img_history_columns:
        try:
            cursor.execute("ALTER TABLE ImageHistory ADD COLUMN is_premium BOOLEAN DEFAULT FALSE")
            print("Migrated: Added is_premium column to ImageHistory table.")
        except Exception as e:
            print(f"Migration error (is_premium): {e}")

    if 'transaction_id' not in img_history_columns:
        try:
            cursor.execute("ALTER TABLE ImageHistory ADD COLUMN transaction_id INTEGER REFERENCES Transactions(transaction_id) ON DELETE SET NULL")
            print("Migrated: Added transaction_id column to ImageHistory table.")
        except Exception as e:
            print(f"Migration error (transaction_id): {e}")

    conn.commit()
    conn.close()
    print("Database tables created/verified successfully.")

# --- Helper Functions for Data Management ---

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
    cursor.execute("""
        UPDATE Users SET last_login = ? WHERE user_id = ?
    """, (datetime.datetime.now(), user_id))
    conn.commit()
    conn.close()

def increment_failed_login(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Users 
        SET failed_login_attempts = failed_login_attempts + 1 
        WHERE user_id = ?
    """, (user_id,))
    conn.commit()
    
    # Return new count
    cursor.execute("SELECT failed_login_attempts FROM Users WHERE user_id = ?", (user_id,))
    attempts = cursor.fetchone()['failed_login_attempts']
    conn.close()
    return attempts

def reset_failed_login(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Users 
        SET failed_login_attempts = 0, lockout_until = NULL 
        WHERE user_id = ?
    """, (user_id,))
    conn.commit()
    conn.close()

def lock_account(user_id, duration_minutes=15):
    conn = get_db_connection()
    cursor = conn.cursor()
    lockout_time = datetime.datetime.now() + datetime.timedelta(minutes=duration_minutes)
    cursor.execute("""
        UPDATE Users 
        SET lockout_until = ? 
        WHERE user_id = ?
    """, (lockout_time, user_id))
    conn.commit()
    conn.close()
    return lockout_time

def add_transaction(user_id, amount, payment_status, payment_method, razorpay_order_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO Transactions (user_id, amount, payment_status, payment_method, razorpay_order_id)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, amount, payment_status, payment_method, razorpay_order_id))
    conn.commit()
    transaction_id = cursor.lastrowid
    conn.close()
    return transaction_id

def update_transaction_payment(transaction_id, rzp_payment_id, rzp_signature, status):
    """
    Updates the transaction with payment details after successful verification.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Transactions
        SET razorpay_payment_id = ?, razorpay_signature = ?, payment_status = ?
        WHERE transaction_id = ?
    """, (rzp_payment_id, rzp_signature, status, transaction_id))
    conn.commit()
    conn.close()

def add_image_history(user_id, original_path, processed_path, style, is_premium=False, transaction_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO ImageHistory (user_id, original_image_path, processed_image_path, style_applied, is_premium, transaction_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, original_path, processed_path, style, is_premium, transaction_id))
    conn.commit()
    image_id = cursor.lastrowid
    conn.close()
    return image_id

def update_image_history_premium(image_id, transaction_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE ImageHistory 
        SET is_premium = TRUE, transaction_id = ? 
        WHERE image_id = ?
    """, (transaction_id, image_id))
    conn.commit()
    conn.close()

def log_download(user_id, image_id, format):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO DownloadLogs (user_id, image_id, format)
        VALUES (?, ?, ?)
    """, (user_id, image_id, format))
    conn.commit()
    conn.close()

def check_download_rate_limit(user_id, max_per_day=50):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    one_day_ago = datetime.datetime.now() - datetime.timedelta(days=1)
    
    cursor.execute("""
        SELECT COUNT(*) as count FROM DownloadLogs 
        WHERE user_id = ? AND download_time > ?
    """, (user_id, one_day_ago))
    
    result = cursor.fetchone()
    conn.close()
    
    return result['count'] < max_per_day

def get_purchased_images(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ih.*, t.amount, t.transaction_date, t.payment_status 
        FROM ImageHistory ih
        LEFT JOIN Transactions t ON ih.transaction_id = t.transaction_id
        WHERE ih.user_id = ? AND ih.is_premium = TRUE
        ORDER BY ih.processing_date DESC
    """, (user_id,))
    images = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return images

def get_transaction_details(transaction_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM Transactions WHERE transaction_id = ?
    """, (transaction_id,))
    details = cursor.fetchone()
    conn.close()
    if details:
        return dict(details)
    return None

def get_all_transactions(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM Transactions 
        WHERE user_id = ? 
        ORDER BY transaction_date DESC
    """, (user_id,))
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return transactions

def update_download_metadata(image_id, download_format):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE ImageHistory 
        SET download_date = ?, download_format = ? 
        WHERE image_id = ?
    """, (datetime.datetime.now(), download_format, image_id))
    conn.commit()
    conn.close()

def get_user_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return dict(user)
    return None

def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE user_id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return dict(user)
    return None

def update_password(user_id, password_hash):
    """
    Updates the password for a user and resets lockout/failed attempts.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Users 
        SET password_hash = ?, failed_login_attempts = 0, lockout_until = NULL 
        WHERE user_id = ?
    """, (password_hash, user_id))
    conn.commit()
    conn.close()

def get_user_stats(user_id):
    """
    Returns counts of transactions and image history for a specific user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get transaction count
    cursor.execute("SELECT COUNT(*) as count FROM Transactions WHERE user_id = ?", (user_id,))
    transaction_count = cursor.fetchone()['count']
    
    # Get image history count
    cursor.execute("SELECT COUNT(*) as count FROM ImageHistory WHERE user_id = ?", (user_id,))
    image_count = cursor.fetchone()['count']
    
    # Get total spent (optional)
    cursor.execute("SELECT SUM(amount) as total FROM Transactions WHERE user_id = ? AND payment_status = 'Completed'", (user_id,))
    total_spent = cursor.fetchone()['total'] or 0.0
    
    # Get favorite style
    cursor.execute("""
        SELECT style_applied, COUNT(*) as c 
        FROM ImageHistory 
        WHERE user_id = ? 
        GROUP BY style_applied 
        ORDER BY c DESC 
        LIMIT 1
    """, (user_id,))
    fav_row = cursor.fetchone()
    favorite_style = fav_row['style_applied'] if fav_row else "None yet"
    
    conn.close()
    
    return {
        "transaction_count": transaction_count,
        "image_count": image_count,
        "total_spent": total_spent,
        "favorite_style": favorite_style
    }

def get_recent_history(user_id, limit=6):
    """
    Returns the most recent image history for a user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM ImageHistory 
        WHERE user_id = ? 
        ORDER BY processing_date DESC 
        LIMIT ?
    """, (user_id, limit))
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

def get_all_processing_history(user_id, sort_by='processing_date', order='DESC', style_filter='All', payment_filter='All', limit=None, offset=0):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT ih.*, t.payment_status 
        FROM ImageHistory ih
        LEFT JOIN Transactions t ON ih.transaction_id = t.transaction_id
        WHERE ih.user_id = ?
    """
    params = [user_id]
    
    if style_filter != 'All':
        query += " AND ih.style_applied = ?"
        params.append(style_filter)
        
    if payment_filter == 'Paid':
        query += " AND ih.is_premium = TRUE"
    elif payment_filter == 'Free Preview':
        query += " AND ih.is_premium = FALSE"
        
    # Safe sorting
    allowed_sorts = {'processing_date', 'style_applied', 'is_premium'}
    sort_col = sort_by if sort_by in allowed_sorts else 'processing_date'
    sort_order = 'DESC' if order.upper() == 'DESC' else 'ASC'
    
    query += f" ORDER BY ih.{sort_col} {sort_order}"
    
    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
    cursor.execute(query, params)
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

def delete_processing_history(user_id, image_id=None):
    """
    Deletes history and returns file paths so they can be removed from disk.
    If image_id is None, deletes ALL history for the user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if image_id:
        cursor.execute("SELECT original_image_path, processed_image_path FROM ImageHistory WHERE user_id = ? AND image_id = ?", (user_id, image_id))
    else:
        cursor.execute("SELECT original_image_path, processed_image_path FROM ImageHistory WHERE user_id = ?", (user_id,))
        
    files_to_delete = [dict(row) for row in cursor.fetchall()]
    
    if image_id:
        cursor.execute("DELETE FROM ImageHistory WHERE user_id = ? AND image_id = ?", (user_id, image_id))
    else:
        cursor.execute("DELETE FROM ImageHistory WHERE user_id = ?", (user_id,))
        
    conn.commit()
    conn.close()
    return files_to_delete

def update_user_profile(user_id, new_email=None, new_password_hash=None, auto_delete_days=None, new_username=None):
    """Updates user completely flexibly."""
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
        success = True
        msg = "Profile updated successfully."
    except sqlite3.IntegrityError:
        success = False
        msg = "Username or email already exists."
    finally:
        conn.close()
        
    return success, msg

if __name__ == "__main__":
    create_tables()
