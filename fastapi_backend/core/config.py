from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PIXIT API"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_FOR_PRODUCTION_CHANGE_THIS"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days in minutes
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./pixit.db"
    ALLOWED_ORIGINS: list[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

settings = Settings()
