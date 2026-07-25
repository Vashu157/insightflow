import os
import shutil
from fastapi import UploadFile

class LocalStorageService:
    def __init__(self, base_path: str = "uploads"):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    def save(self, session_id: str, file: UploadFile) -> str:
        session_dir = os.path.join(self.base_path, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        file_path = os.path.join(session_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

    def delete(self, session_id: str) -> None:
        session_dir = os.path.join(self.base_path, session_id)
        if os.path.exists(session_dir):
            shutil.rmtree(session_dir)

    def read(self, session_id: str, filename: str) -> str:
        return os.path.join(self.base_path, session_id, filename)
