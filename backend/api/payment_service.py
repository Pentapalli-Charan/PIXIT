from backend.core.database import get_db_connection

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
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE Transactions
        SET razorpay_payment_id = ?, razorpay_signature = ?, payment_status = ?
        WHERE transaction_id = ?
    """, (rzp_payment_id, rzp_signature, status, transaction_id))
    conn.commit()
    conn.close()

def get_transaction_details(transaction_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Transactions WHERE transaction_id = ?", (transaction_id,))
    details = cursor.fetchone()
    conn.close()
    return dict(details) if details else None

def get_all_transactions(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Transactions WHERE user_id = ? ORDER BY transaction_date DESC", (user_id,))
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return transactions
