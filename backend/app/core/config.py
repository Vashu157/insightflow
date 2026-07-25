from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightFlow"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    SESSION_EXPIRY_MINUTES: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
