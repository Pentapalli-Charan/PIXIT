import logging
import sys
from core.database import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pixit.reset_db")

def reset_database():
    print("\n=======================================================")
    print("WARNING: This will drop ALL tables and delete ALL data!")
    print(f"Target Database: {engine.url.render_as_string(hide_password=True)}")
    print("=======================================================\n")
    
    confirm = input("Type 'yes' to confirm database reset: ")
    if confirm.lower() != "yes":
        print("Reset cancelled.")
        sys.exit(0)
        
    try:
        logger.info("Dropping all existing tables...")
        # Drop tables in reverse order of creation/relationships
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped successfully.")
        
        logger.info("Creating all tables from scratch...")
        Base.metadata.create_all(bind=engine)
        logger.info("All tables recreated successfully with correct schema columns.")
        
        print("\nDatabase reset completed successfully!")
    except Exception as e:
        logger.error(f"Failed to reset database: {e}")
        print(f"\nError: {e}")
        sys.exit(1)

if __name__ == "__main__":
    reset_database()
