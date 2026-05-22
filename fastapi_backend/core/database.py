import logging
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.sql import func
from core.config import settings

logger = logging.getLogger("pixit.database")

# Enforce PostgreSQL Only
db_url = settings.SQLALCHEMY_DATABASE_URL
if not db_url or not (db_url.startswith("postgresql") or db_url.startswith("postgres")):
    logger.critical("SQLite or invalid database URL detected. PIXIT is configured to run on PostgreSQL only.")
    raise ValueError("Invalid Database URL: Only PostgreSQL is supported in this deployment.")

# Standard PostgreSQL engine configuration
engine = create_engine(
    db_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Forgot password reset fields
    reset_token = Column(String, nullable=True, index=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, default="Untitled Stylization")
    original_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="projects")
    stylizations = relationship("Stylization", back_populates="project", cascade="all, delete-orphan")

class Stylization(Base):
    __tablename__ = "stylizations"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    style_applied = Column(String, nullable=False)
    processed_url = Column(String, nullable=False)
    settings_json = Column(JSON, nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="stylizations")

# Create tables automatically at import
try:
    Base.metadata.create_all(bind=engine)
    logger.info("PostgreSQL database tables initialized successfully.")
except Exception as e:
    logger.critical(f"Failed to initialize PostgreSQL tables: {e}")

# Automated Schema Upgrade Check to append missing columns (e.g. created_at, reset_token)
def upgrade_db_schema():
    from sqlalchemy import text
    try:
        with engine.begin() as conn:
            # Upgrade users table columns if they do not exist
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE"))
            logger.info("PostgreSQL database schema verification completed successfully.")
    except Exception as e:
        logger.error(f"PostgreSQL database schema verification failed: {e}")

# Trigger schema check
upgrade_db_schema()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Startup Database connection validation helper
def verify_db_connection():
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("SELECT 1"))
            logger.info("Successfully established connection to Render PostgreSQL Database.")
            print("Successfully established connection to Render PostgreSQL Database.")
            return True
    except Exception as e:
        logger.critical(f"Failed to connect to PostgreSQL Database: {e}")
        print(f"DATABASE CONNECTION FAILURE: {e}")
        return False
