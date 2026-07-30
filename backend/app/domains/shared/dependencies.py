from app.domains.shared.interfaces import StorageService
from app.domains.shared.s3_storage import S3StorageService

# We instantiate a single storage service instance here or manage it via depends
_storage_service_instance = S3StorageService()

def get_storage_service() -> StorageService:
    """Dependency injector for the storage service."""
    return _storage_service_instance
