from app.domains.reports.interfaces import IReportService
from app.domains.reports.service import ReportServiceImpl
from app.domains.shared.dependencies import get_storage_service

_report_service = ReportServiceImpl(storage=get_storage_service())

def get_report_service() -> IReportService:
    return _report_service
