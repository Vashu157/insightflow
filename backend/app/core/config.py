from pydantic_settings import BaseSettings
from typing import Optional
import os
import ssl
import tempfile
import logging

logger = logging.getLogger("app.core.config")

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
    
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,https://insightflow-beryl.vercel.app"
    
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_SECURITY_PROTOCOL: Optional[str] = None
    KAFKA_CA_CERT: Optional[str] = None
    KAFKA_ACCESS_CERT: Optional[str] = None
    KAFKA_ACCESS_KEY: Optional[str] = None
    KAFKA_SASL_USERNAME: Optional[str] = None
    KAFKA_SASL_PASSWORD: Optional[str] = None
    KAFKA_SASL_MECHANISM: str = "SCRAM-SHA-256"
    KAFKA_CHECK_HOSTNAME: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

def get_kafka_config() -> dict:
    """Generates configuration args for AIOKafka consumer and producer."""
    config = {
        "bootstrap_servers": settings.KAFKA_BOOTSTRAP_SERVERS
    }
    
    protocol = (settings.KAFKA_SECURITY_PROTOCOL or "").strip().upper()
    if protocol:
        config["security_protocol"] = protocol
        
        if protocol in ("SSL", "SASL_SSL"):
            ssl_context = ssl.create_default_context(purpose=ssl.Purpose.SERVER_AUTH)
            
            # Load CA Certificate if provided
            if settings.KAFKA_CA_CERT:
                ca_cert_str = settings.KAFKA_CA_CERT.strip()
                if ca_cert_str.startswith('"') and ca_cert_str.endswith('"'):
                    ca_cert_str = ca_cert_str[1:-1]
                if ca_cert_str.startswith("'") and ca_cert_str.endswith("'"):
                    ca_cert_str = ca_cert_str[1:-1]
                ca_cert_str = ca_cert_str.replace('\\n', '\n')
                
                with tempfile.NamedTemporaryFile(delete=False, mode='w', suffix='.pem') as tmp_ca:
                    tmp_ca.write(ca_cert_str)
                    ca_path = tmp_ca.name
                ssl_context.load_verify_locations(cafile=ca_path)
                logger.info("Kafka SSL CA certificate loaded from environment.")
                
            # Load Access Certificate and Private Key (Option A Client Cert Auth)
            if settings.KAFKA_ACCESS_CERT and settings.KAFKA_ACCESS_KEY:
                cert_str = settings.KAFKA_ACCESS_CERT.strip().replace('\\n', '\n')
                key_str = settings.KAFKA_ACCESS_KEY.strip().replace('\\n', '\n')
                
                if cert_str.startswith('"') and cert_str.endswith('"'):
                    cert_str = cert_str[1:-1]
                if cert_str.startswith("'") and cert_str.endswith("'"):
                    cert_str = cert_str[1:-1]
                    
                if key_str.startswith('"') and key_str.endswith('"'):
                    key_str = key_str[1:-1]
                if key_str.startswith("'") and key_str.endswith("'"):
                    key_str = key_str[1:-1]
                
                with tempfile.NamedTemporaryFile(delete=False, mode='w', suffix='.crt') as tmp_cert:
                    tmp_cert.write(cert_str)
                    cert_path = tmp_cert.name
                    
                with tempfile.NamedTemporaryFile(delete=False, mode='w', suffix='.key') as tmp_key:
                    tmp_key.write(key_str)
                    key_path = tmp_key.name
                    
                ssl_context.load_cert_chain(certfile=cert_path, keyfile=key_path)
                logger.info("Kafka SSL Client certificate and private key loaded from environment.")
            
            # Disable hostname check if specified
            if not settings.KAFKA_CHECK_HOSTNAME:
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                
            config["ssl_context"] = ssl_context
            
        if protocol in ("SASL_PLAINTEXT", "SASL_SSL"):
            config["sasl_mechanism"] = settings.KAFKA_SASL_MECHANISM or "SCRAM-SHA-256"
            config["sasl_plain_username"] = settings.KAFKA_SASL_USERNAME
            config["sasl_plain_password"] = settings.KAFKA_SASL_PASSWORD
            
    return config

