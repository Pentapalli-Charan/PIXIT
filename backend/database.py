"""
Facade for Database Operations.
This file has been refactored. The actual logic now lives in `backend.services` 
and `backend.core` to support a clean, scalable architecture.
This file remains to ensure backward compatibility with existing imports.
"""

from backend.core.database import get_db_connection
from backend.core.init_db import create_tables
from backend.services.user_service import *
from backend.services.payment_service import *
from backend.services.history_service import *

if __name__ == "__main__":
    create_tables()
