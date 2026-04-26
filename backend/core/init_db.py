from backend.core.database import get_db_connection

def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        auto_delete_days INTEGER DEFAULT 0,
        lockout_until TIMESTAMP
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
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        razorpay_signature TEXT,
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
        download_date TIMESTAMP,
        download_format TEXT,
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
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_userid ON Transactions(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_imagehistory_userid ON ImageHistory(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_downloadlogs_userid ON DownloadLogs(user_id);")
    
    conn.commit()
    conn.close()
    print("Database tables created/verified successfully via core.init_db.")

if __name__ == "__main__":
    create_tables()
