import re
import os
from fastapi import HTTPException, UploadFile, status

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
ALLOWED_MIME_TYPES = {
    "text/csv",
    "text/plain",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream"
}

def validate_upload_file(file: UploadFile) -> None:
    # 1. Extension check
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: CSV, XLSX."
        )

    # 2. Content Type check
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{file.content_type}' for dataset upload."
        )

    # 3. File Size Check (seek end to verify size safely)
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)  # Reset pointer

    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
        )

def sanitize_user_input(prompt: str) -> str:
    """Sanitize user query against basic prompt injection / control character attacks."""
    if not prompt:
        return ""
    # Strip null bytes and non-printable control characters
    sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', prompt)
    return sanitized.strip()
