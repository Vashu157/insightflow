from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightFlow"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    SESSION_EXPIRY_MINUTES: int = 60
    GEMINI_API_KEY: str = ""
    
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_ENDPOINT_URL: str = ""
    S3_BUCKET_NAME: str = "datasets"
    
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
