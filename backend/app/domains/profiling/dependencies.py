from app.domains.profiling.interfaces import IProfilingService
from app.domains.profiling.service import ProfilingServiceImpl
from app.domains.shared.dependencies import get_storage_service

_profiling_service = ProfilingServiceImpl(storage=get_storage_service())

def get_profiling_service() -> IProfilingService:
    return _profiling_service
