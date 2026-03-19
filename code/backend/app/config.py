from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "Financial SLM API"
    DEBUG: bool = True
    
    # Authentication
    AUTH_SECRET_KEY: str = "change_this_to_a_secure_random_key"
    AUTH_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # Increased to 24 hours
    
    # Admin Credentials (Default provided, but should be overridden in .env)
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    
    # External Services
    GOOGLE_API_KEY: str
    
    # Email 2FA
    GMAIL_SENDER: str | None = None
    GMAIL_APP_PASSWORD: str | None = None
    
    # Vector DB
    CHROMA_DB_PATH: str = "./chroma_db"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
