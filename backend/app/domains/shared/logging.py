import logging
import json
import sys
import os
from datetime import datetime
from contextvars import ContextVar

current_request_id: ContextVar[str] = ContextVar("request_id", default="")
current_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")
current_job_id: ContextVar[str] = ContextVar("job_id", default="")
current_session_id: ContextVar[str] = ContextVar("session_id", default="")
current_event_id: ContextVar[str] = ContextVar("event_id", default="")
current_trace_id: ContextVar[str] = ContextVar("trace_id", default="")
current_span_id: ContextVar[str] = ContextVar("span_id", default="")
current_service_name: ContextVar[str] = ContextVar("service_name", default=os.environ.get("SERVICE_NAME", "insightflow-api"))

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "log_level": record.levelname,
            "service_name": current_service_name.get(),
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include ContextVar values if present
        req_id = current_request_id.get()
        if req_id:
            log_record["request_id"] = req_id

        corr_id = current_correlation_id.get()
        if corr_id:
            log_record["correlation_id"] = corr_id

        job_id = current_job_id.get()
        if job_id:
            log_record["job_id"] = job_id

        session_id = current_session_id.get()
        if session_id:
            log_record["session_id"] = session_id

        event_id = current_event_id.get()
        if event_id:
            log_record["event_id"] = event_id

        trace_id = current_trace_id.get()
        if trace_id:
            log_record["trace_id"] = trace_id

        span_id = current_span_id.get()
        if span_id:
            log_record["span_id"] = span_id

        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        if hasattr(record, "extra_info"):
            log_record.update(record.extra_info)

        return json.dumps(log_record)

def setup_logging():
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()

    logger = logging.getLogger("insightflow")
    logger.setLevel(log_level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    return logger

logger = setup_logging()
