import os
import json
import duckdb
import pandas as pd
from io import BytesIO
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session as DBSession

from app.database.database import get_db
from app.models.session import Session
from app.storage.s3_storage import S3StorageService

router = APIRouter()
storage = S3StorageService()


def _load_dataframe(db_session, file_path: str) -> pd.DataFrame:
    """Load a dataframe from a session's stored file."""
    if db_session.original_filename.endswith('.csv'):
        return pd.read_csv(file_path)
    else:
        return pd.read_excel(file_path)


def _stream_csv(df: pd.DataFrame, filename: str = "export.csv") -> StreamingResponse:
    stream = BytesIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def _stream_excel(df: pd.DataFrame, filename: str = "export.xlsx") -> StreamingResponse:
    stream = BytesIO()
    df.to_excel(stream, index=False, engine='openpyxl')
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/sessions/{session_id}/export/data")
def export_dataset(
    session_id: str,
    format: str = Query("csv", description="Format: 'csv' or 'excel'"),
    db: DBSession = Depends(get_db)
):
    """Export the raw dataset as CSV or Excel."""
    db_session = db.query(Session).filter(Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    file_path = storage.read(session_id, db_session.stored_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset file missing")

    # Fast path: return raw CSV directly if already a CSV file
    if format == "csv" and db_session.original_filename.endswith(".csv"):
        return FileResponse(file_path, media_type="text/csv", filename=db_session.original_filename)

    # Load dataframe for conversion (e.g., Excel → CSV)
    try:
        df = _load_dataframe(db_session, file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")

    if format == "csv":
        return _stream_csv(df, filename=db_session.original_filename.rsplit('.', 1)[0] + ".csv")
    elif format == "excel":
        return _stream_excel(df, filename=db_session.original_filename.rsplit('.', 1)[0] + ".xlsx")

    raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv' or 'excel'.")


class SQLExportRequest(BaseModel):
    sql_query: str
    format: str = "csv"


@router.post("/sessions/{session_id}/export/query")
def export_sql_query(
    session_id: str,
    request: SQLExportRequest,
    db: DBSession = Depends(get_db)
):
    """Execute a SQL query against the dataset and export the results."""
    db_session = db.query(Session).filter(Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    file_path = storage.read(session_id, db_session.stored_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset file missing")

    try:
        df = _load_dataframe(db_session, file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")

    # Apply SQL query via DuckDB
    try:
        conn = duckdb.connect(database=':memory:')
        # Register the dataframe so SQL can reference it as "df"
        conn.register("df", df)
        # Strip markdown code blocks if any
        clean_sql = request.sql_query.replace('```sql', '').replace('```', '').strip()
        # Prevent injection: only allow SELECT statements
        if not clean_sql.lower().strip().startswith("select"):
            raise HTTPException(status_code=400, detail="Only SELECT queries are permitted for exports.")
        result_df = conn.execute(clean_sql).df()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL execution failed: {e}")

    if request.format == "csv":
        return _stream_csv(result_df, filename="query_export.csv")
    elif request.format == "excel":
        return _stream_excel(result_df, filename="query_export.xlsx")

    raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv' or 'excel'.")


@router.get("/sessions/{session_id}/export/report")
def export_analyst_report(session_id: str):
    """Export the AI Business Analyst report as JSON."""
    report_path = storage.read(session_id, "insights_report.json")
    if not os.path.exists(report_path):
        raise HTTPException(
            status_code=404,
            detail="No AI report found. Please generate the Business Analyst report first."
        )

    return FileResponse(
        report_path,
        media_type="application/json",
        filename=f"insightflow_report_{session_id[:8]}.json"
    )
