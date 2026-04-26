import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend import database
import os
import sqlite3

def test_database():
    print("Testing Database Implementation...")
    
    # 1. Re-create tables (safe to run multiple times)
    print("1. Creating tables...")
    database.create_tables()
    
    # 2. Add a Test User
    print("2. Adding Test User...")
    username = "testuser_db_verify"
    email = "test_verify@example.com"
    password_hash = "hashed_secret"
    
    # Cleanup if exists
    user = database.get_user_by_username(username)
    if user:
         print("   User exists, skipping insert (or could delete).")
         user_id = user['user_id']
    else:
        user_id, error = database.add_user(username, email, password_hash)
        if user_id:
            print(f"   User added with ID: {user_id}")
        else:
            print(f"   Failed to add user: {error}")
            return

    # 3. Test Transactions
    print("3. Adding Transaction...")
    trans_id = database.add_transaction(user_id, 99.99, "Completed", "Credit Card")
    print(f"   Transaction added with ID: {trans_id}")
    
    # Verify Transaction
    conn = database.get_db_connection()
    row = conn.execute("SELECT * FROM Transactions WHERE transaction_id = ?", (trans_id,)).fetchone()
    conn.close()
    print(f"   Verified Transaction: Amount={row['amount']}, Status={row['payment_status']}")

    # 4. Test Image History
    print("4. Adding Image History...")
    img_id = database.add_image_history(user_id, "/tmp/orig.jpg", "/tmp/proc.jpg", "Cartoon")
    print(f"   Image History added with ID: {img_id}")
    
    # Verify Image History
    conn = database.get_db_connection()
    row = conn.execute("SELECT * FROM ImageHistory WHERE image_id = ?", (img_id,)).fetchone()
    conn.close()
    print(f"   Verified Image History: Style={row['style_applied']}")
    
    print("\nDatabase verification successful!")

if __name__ == "__main__":
    if os.path.exists("database.sqlite"):
        print("database.sqlite found.")
    test_database()
