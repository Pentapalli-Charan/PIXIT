import os

# Configuration settings
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

# We will put the database at the root of backend, or wherever it was before
DB_PATH = os.path.join(BASE_DIR, 'backend', 'database.sqlite')

# Uploads directory
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
CACHE_DIR = os.path.join(UPLOAD_DIR, 'cache')
