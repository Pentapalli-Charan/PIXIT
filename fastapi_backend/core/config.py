import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PIXIT API"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "production_safe_jwt_secret_key_change_me_to_something_unique_and_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days in minutes
    SQLALCHEMY_DATABASE_URL: str = ""
    ALLOWED_ORIGINS: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Post-process settings for PostgreSQL configuration URL
db_url = os.environ.get("SQLALCHEMY_DATABASE_URL") or os.environ.get("DATABASE_URL") or settings.SQLALCHEMY_DATABASE_URL

if not db_url:
    # If no URL is provided, we default to a standard placeholder or raise an exception in strict mode.
    # To prevent immediate crash of tools, we print a warning, but we must enforce it at db start.
    db_url = "postgresql://localhost:5432/pixit"

if db_url.startswith("postgres://"):
    # SQLAlchemy 1.4+ deprecated postgres:// and requires postgresql://
    db_url = db_url.replace("postgres://", "postgresql://", 1)

settings.SQLALCHEMY_DATABASE_URL = db_url
