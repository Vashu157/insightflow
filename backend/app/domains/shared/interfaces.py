from abc import ABC, abstractmethod
from fastapi import UploadFile

class StorageService(ABC):
    @abstractmethod
    def save(self, session_id: str, file: UploadFile) -> str:
        """Uploads the file and returns a local file path for processing."""
        pass

    @abstractmethod
    def delete(self, session_id: str) -> None:
        """Deletes all objects/files for this session."""
        pass

    @abstractmethod
    def get_cache_path(self, session_id: str, filename: str) -> str:
        """Returns a local path for caching JSON files without downloading them."""
        pass

    @abstractmethod
    def read(self, session_id: str, filename: str) -> str:
        """Downloads the file to a local tmp directory and returns the path."""
        pass
