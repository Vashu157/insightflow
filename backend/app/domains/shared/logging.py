import logging
import json
import sys
import os
from datetime import datetime
from contextvars import ContextVar

current_job_id: ContextVar[str] = ContextVar("job_id", default="")
current_session_id: ContextVar[str] = ContextVar("session_id", default="")

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        
        job_id = current_job_id.get()
        if job_id:
            log_record["job_id"] = job_id
            
        session_id = current_session_id.get()
        if session_id:
            log_record["session_id"] = session_id
            
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
