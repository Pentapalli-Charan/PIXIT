import sqlite3
from backend.core.config import DB_PATH

def get_db_connection():
    """Returns a new SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
