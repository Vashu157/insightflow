import os
import json
import duckdb
import pandas as pd
from typing import Dict, Any, List, Optional
from io import BytesIO
from fastapi import HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.domains.shared.models import Session as SessionModel
from app.domains.shared.interfaces import StorageService
from app.domains.export.interfaces import IExportService
from app.domains.export.schemas import SQLExportRequest

class ExportServiceImpl(IExportService):
    def __init__(self, storage: StorageService):
        self.storage = storage

    def _load_dataframe(self, db_session, file_path: str) -> pd.DataFrame:
        if db_session.original_filename.endswith('.csv'):
            return pd.read_csv(file_path)
        else:
            return pd.read_excel(file_path)

    def _stream_csv(self, df: pd.DataFrame, filename: str = "export.csv") -> StreamingResponse:
        stream = BytesIO()
        df.to_csv(stream, index=False)
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    def _stream_excel(self, df: pd.DataFrame, filename: str = "export.xlsx") -> StreamingResponse:
        stream = BytesIO()
        df.to_excel(stream, index=False, engine='openpyxl')
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    def export_dataset(self, db: Session, session_id: str, format: str) -> Any:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")

        file_path = self.storage.read(session_id, db_session.stored_filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing")

        if format == "csv" and db_session.original_filename.endswith(".csv"):
            return FileResponse(file_path, media_type="text/csv", filename=db_session.original_filename)

        try:
            df = self._load_dataframe(db_session, file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")

        if format == "csv":
            return self._stream_csv(df, filename=db_session.original_filename.rsplit('.', 1)[0] + ".csv")
        elif format == "excel":
            return self._stream_excel(df, filename=db_session.original_filename.rsplit('.', 1)[0] + ".xlsx")

        raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv' or 'excel'.")

    def export_sql_query(self, db: Session, session_id: str, request: SQLExportRequest) -> Any:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")

        file_path = self.storage.read(session_id, db_session.stored_filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing")

        try:
            df = self._load_dataframe(db_session, file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")

        try:
            conn = duckdb.connect(database=':memory:')
            conn.register("df", df)
            clean_sql = request.sql_query.replace('```sql', '').replace('```', '').strip()
            if not clean_sql.lower().strip().startswith("select"):
                raise HTTPException(status_code=400, detail="Only SELECT queries are permitted for exports.")
            result_df = conn.execute(clean_sql).df()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"SQL execution failed: {e}")

        if request.format == "csv":
            return self._stream_csv(result_df, filename="query_export.csv")
        elif request.format == "excel":
            return self._stream_excel(result_df, filename="query_export.xlsx")

        raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv' or 'excel'.")

    def export_analyst_report(self, session_id: str) -> Any:
        report_path = self.storage.read(session_id, "insights_report.json")
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
