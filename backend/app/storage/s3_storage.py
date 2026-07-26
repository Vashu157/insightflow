import os
import shutil
import tempfile
import boto3
from fastapi import UploadFile
from botocore.config import Config
from app.core.config import settings

class S3StorageService:
    def __init__(self, bucket_name: str = None):
        self.bucket_name = bucket_name or settings.S3_BUCKET_NAME
        
        # Configure boto3 client for S3/Supabase compatibility
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.AWS_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
            region_name='us-east-1', # Default for Supabase
            verify=False # Bypass SSL verification issues with Supabase certs
        )
        
        # Local tmp dir for Pandas/DuckDB to read from
        self.local_tmp_dir = os.path.join(tempfile.gettempdir(), "insightflow_uploads")
        os.makedirs(self.local_tmp_dir, exist_ok=True)

    def save(self, session_id: str, file: UploadFile) -> str:
        """
        Uploads the file stream directly to S3, caches it locally in /tmp,
        and returns the local file path for immediate processing by Pandas.
        """
        s3_key = f"{session_id}/{file.filename}"
        
        local_session_dir = os.path.join(self.local_tmp_dir, session_id)
        os.makedirs(local_session_dir, exist_ok=True)
        local_file_path = os.path.join(local_session_dir, file.filename)
        
        # Save locally first for Pandas to read
        with open(local_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Upload the local file to S3
        self.s3_client.upload_file(
            local_file_path,
            self.bucket_name,
            s3_key
        )
        
        return local_file_path

    def delete(self, session_id: str) -> None:
        """
        Deletes all objects for this session from S3, and cleans up local tmp.
        """
        prefix = f"{session_id}/"
        try:
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
            
            if 'Contents' in response:
                # Use individual delete_object calls as some S3-compatible APIs 
                # (like Supabase) have issues with bulk DeleteObjects
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
        """
        Returns a local path for caching JSON files (like profiles and dashboard summaries)
        without attempting to download them from S3.
        """
        local_session_dir = os.path.join(self.local_tmp_dir, session_id)
        os.makedirs(local_session_dir, exist_ok=True)
        return os.path.join(local_session_dir, filename)

    def read(self, session_id: str, filename: str) -> str:
        """
        Downloads the file from S3 to a local tmp directory and returns the path.
        This ensures compatibility with Pandas and DuckDB which expect local files.
        If it's already downloaded, returns the cached local path.
        """
        local_session_dir = os.path.join(self.local_tmp_dir, session_id)
        os.makedirs(local_session_dir, exist_ok=True)
        
        local_file_path = os.path.join(local_session_dir, filename)
        s3_key = f"{session_id}/{filename}"
        
        # If not cached locally, download it
        if not os.path.exists(local_file_path):
            self.s3_client.download_file(
                self.bucket_name,
                s3_key,
                local_file_path
            )
            
        return local_file_path
