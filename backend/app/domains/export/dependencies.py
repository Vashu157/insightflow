from app.domains.export.interfaces import IExportService
from app.domains.export.service import ExportServiceImpl
from app.domains.shared.dependencies import get_storage_service

_export_service = ExportServiceImpl(storage=get_storage_service())

def get_export_service() -> IExportService:
    return _export_service
