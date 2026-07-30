import os
import shutil
import tempfile
import boto3
from fastapi import UploadFile
from botocore.config import Config

from app.core.config import settings
from app.domains.shared.interfaces import StorageService

class S3StorageService(StorageService):
    def __init__(self, bucket_name: str = None):
        self.bucket_name = bucket_name or settings.S3_BUCKET_NAME
        
        # Configure boto3 client for S3/Supabase compatibility
        # Only initialize if access key is provided, otherwise run in local-only mode
        self.use_s3 = bool(settings.AWS_ACCESS_KEY_ID)
        
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_ENDPOINT_URL if settings.AWS_ENDPOINT_URL else None,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version='s3v4'),
                region_name='us-east-1', # Default for Supabase
                verify=False # Bypass SSL verification issues with Supabase certs
            )
        else:
            self.s3_client = None
            
        # Local upload dir for Pandas/DuckDB to read from (shares via /app mount across containers)
        self.local_tmp_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(self.local_tmp_dir, exist_ok=True)

    def save(self, session_id: str, file: UploadFile) -> str:
        s3_key = f"{session_id}/{file.filename}"
        
        local_session_dir = os.path.join(self.local_tmp_dir, session_id)
        os.makedirs(local_session_dir, exist_ok=True)
        local_file_path = os.path.join(local_session_dir, file.filename)
        
        # Save locally first for Pandas to read
        with open(local_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Upload the local file to S3
        if self.use_s3:
            self.s3_client.upload_file(
                local_file_path,
                self.bucket_name,
                s3_key
            )
        
        return local_file_path

    def delete(self, session_id: str) -> None:
        prefix = f"{session_id}/"
        if self.use_s3:
            try:
                response = self.s3_client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
                
                if 'Contents' in response:
                    for obj in response['Contents']:
                        self.s3_client.delete_object(
                            Bucket=self.bucket_name,
                            Key=obj['Key']
                        )
            except Exception as e:
                print(f"Warning: Failed to clean up S3 objects for {session_id}: {e}")
            
        # Clean up local cache if it exists
        local_session_dir = os.path.join(self.local_tmp_dir, session_id)
        if os.path.exists(local_session_dir):
            shutil.rmtree(local_session_dir)

    def get_cache_path(self, session_id: str, filename: str) -> str:
        local_session_dir = os.path.join(self.local_tmp_dir, session_id)
        os.makedirs(local_session_dir, exist_ok=True)
        return os.path.join(local_session_dir, filename)

    def read(self, session_id: str, filename: str) -> str:
        local_session_dir = os.path.join(self.local_tmp_dir, session_id)
        os.makedirs(local_session_dir, exist_ok=True)
        
        local_file_path = os.path.join(local_session_dir, filename)
        s3_key = f"{session_id}/{filename}"
        
        # If not cached locally, download it
        if not os.path.exists(local_file_path):
            if self.use_s3:
                self.s3_client.download_file(
                    self.bucket_name,
                    s3_key,
                    local_file_path
                )
            else:
                raise FileNotFoundError(f"File {filename} not found locally, and S3 is not configured.")
            
        return local_file_path
