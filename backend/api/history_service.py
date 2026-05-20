import datetime
from backend.core.database import get_db_connection

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
    cursor.execute("UPDATE ImageHistory SET is_premium = TRUE, transaction_id = ? WHERE image_id = ?", (transaction_id, image_id))
    conn.commit()
    conn.close()

def log_download(user_id, image_id, format):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO DownloadLogs (user_id, image_id, format) VALUES (?, ?, ?)", (user_id, image_id, format))
    conn.commit()
    conn.close()

def check_download_rate_limit(user_id, max_per_day=50):
    conn = get_db_connection()
    cursor = conn.cursor()
    one_day_ago = datetime.datetime.now() - datetime.timedelta(days=1)
    cursor.execute("SELECT COUNT(*) as count FROM DownloadLogs WHERE user_id = ? AND download_time > ?", (user_id, one_day_ago))
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

def update_download_metadata(image_id, download_format):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE ImageHistory SET download_date = ?, download_format = ? WHERE image_id = ?", (datetime.datetime.now(), download_format, image_id))
    conn.commit()
    conn.close()

def get_recent_history(user_id, limit=6):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ImageHistory WHERE user_id = ? ORDER BY processing_date DESC LIMIT ?", (user_id, limit))
    history = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return history

def get_all_processing_history(user_id, sort_by='processing_date', order='DESC', style_filter='All', payment_filter='All', limit=None, offset=0):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT ih.*, t.payment_status FROM ImageHistory ih LEFT JOIN Transactions t ON ih.transaction_id = t.transaction_id WHERE ih.user_id = ?"
    params = [user_id]
    
    if style_filter != 'All':
        query += " AND ih.style_applied = ?"
        params.append(style_filter)
    if payment_filter == 'Paid':
        query += " AND ih.is_premium = TRUE"
    elif payment_filter == 'Free Preview':
        query += " AND ih.is_premium = FALSE"
        
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
