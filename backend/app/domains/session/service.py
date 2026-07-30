import uuid
import os
import json
import secrets
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.domains.shared.models import Session as SessionModel, DatasetVersion
from app.domains.session.schemas import SessionResponse, DatasetPreviewResponse
from app.domains.shared.interfaces import StorageService
from app.domains.session.interfaces import ISessionService
from app.core.config import settings
from app.domains.shared.logging import logger

class SessionServiceImpl(ISessionService):
    def __init__(self, storage: StorageService):
        self.storage = storage

    def process_upload(self, db: Session, file: UploadFile) -> SessionResponse:
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and Excel are allowed.")
            
        session_id = str(uuid.uuid4())
        logger.info(f"Processing upload for session {session_id}")
        
        try:
            file_path = self.storage.save(session_id, file)
            
            if file.filename.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
                
            if df.empty:
                self.storage.delete(session_id)
                raise HTTPException(status_code=400, detail="The uploaded file is empty.")
                
            row_count = len(df)
            column_count = len(df.columns)
            file_size = os.path.getsize(file_path)
            
            expires_at = datetime.utcnow() + timedelta(minutes=settings.SESSION_EXPIRY_MINUTES)
            db_session = SessionModel(
                id=session_id,
                session_name=f"Dataset {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                original_filename=file.filename,
                stored_filename=file.filename,
                file_type=file.content_type or 'application/octet-stream',
                file_size=file_size,
                row_count=row_count,
                column_count=column_count,
                expires_at=expires_at
            )
            
            db.add(db_session)
            db.commit()
            db.refresh(db_session)
            
            # Create Version 1
            v1 = DatasetVersion(
                session_id=session_id,
                version_number=1,
                created_by="system",
                change_summary="Initial upload",
                file_path=file.filename,
                row_count=row_count,
                schema_snapshot={col: str(dtype) for col, dtype in df.dtypes.items()}
            )
            db.add(v1)
            db.commit()

            
            return db_session
            
        except HTTPException:
            self.storage.delete(session_id)
            raise
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}", exc_info=True)
            self.storage.delete(session_id)
            raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    def get_session(self, db: Session, session_id: str) -> SessionResponse:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        db_session.last_accessed = datetime.utcnow()
        db.commit()
        db.refresh(db_session)
        
        return db_session

    def get_preview(self, db: Session, session_id: str, limit: int = 20, offset: int = 0) -> DatasetPreviewResponse:
        db_session = self.get_session(db, session_id)
        
        file_path = self.storage.read(session_id, db_session.stored_filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing from storage")
            
        try:
            if db_session.original_filename.endswith('.csv'):
                df = pd.read_csv(file_path, skiprows=range(1, offset + 1), nrows=limit)
            else:
                df = pd.read_excel(file_path, skiprows=range(1, offset + 1), nrows=limit)
                
            df = df.fillna("")
            
            return DatasetPreviewResponse(
                total_rows=db_session.row_count,
                total_columns=db_session.column_count,
                columns=list(df.columns),
                data_types={col: str(dtype) for col, dtype in df.dtypes.items()},
                data=df.to_dict(orient="records")
            )
        except Exception as e:
            logger.error(f"Error reading dataset: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error reading dataset: {str(e)}")

    def delete_session(self, db: Session, session_id: str) -> dict:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if db_session:
            db.delete(db_session)
            db.commit()
            
        self.storage.delete(session_id)
        logger.info(f"Session {session_id} deleted")
        return {"status": "success", "message": "Session deleted"}

    def generate_share_link(self, db: Session, session_id: str) -> Dict[str, str]:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        if db_session.is_shared and db_session.share_token:
            return {"share_token": db_session.share_token}
            
        token = secrets.token_urlsafe(32)
        db_session.is_shared = 1
        db_session.share_token = token
        db.commit()
        
        return {"share_token": token}

    def get_shared_report(self, db: Session, token: str) -> Dict[str, Any]:
        db_session = db.query(SessionModel).filter(SessionModel.share_token == token).first()
        if not db_session or not db_session.is_shared:
            raise HTTPException(status_code=404, detail="Shared report not found or expired")
            
        session_id = str(db_session.id)
        
        profile_data = {}
        profile_path = self.storage.read(session_id, "profile.json")
        if os.path.exists(profile_path):
            try:
                with open(profile_path, "r") as f:
                    profile_data = json.load(f)
            except: pass
            
        insights_data = {}
        insights_path = self.storage.read(session_id, "insights_report.json")
        if os.path.exists(insights_path):
            try:
                with open(insights_path, "r") as f:
                    insights_data = json.load(f)
            except: pass
            
        charts_data = []
        charts_path = self.storage.read(session_id, "dashboard.json")
        if os.path.exists(charts_path):
            try:
                with open(charts_path, "r") as f:
                    charts_data = json.load(f).get("charts", [])
            except: pass

        return {
            "session": {
                "name": db_session.session_name,
                "filename": db_session.original_filename,
                "upload_time": db_session.upload_time,
                "expires_at": db_session.expires_at,
                "rows": db_session.row_count,
                "columns": db_session.column_count
            },
            "profile": profile_data.get("summary", {}),
            "insights": insights_data.get("report", {}),
            "charts": charts_data
        }

    def list_versions(self, db: Session, session_id: str) -> list:
        db_session = self.get_session(db, session_id)
        versions = db.query(DatasetVersion).filter(DatasetVersion.session_id == session_id).order_by(DatasetVersion.version_number.desc()).all()
        return versions

    def create_version(self, db: Session, session_id: str, change_summary: str, file_path: str, row_count: int, schema_snapshot: dict = None) -> DatasetVersion:
        db_session = self.get_session(db, session_id)
        latest_version = db.query(DatasetVersion).filter(DatasetVersion.session_id == session_id).order_by(DatasetVersion.version_number.desc()).first()
        v_num = (latest_version.version_number + 1) if latest_version else 1
        
        new_version = DatasetVersion(
            session_id=session_id,
            version_number=v_num,
            created_by="system",
            change_summary=change_summary,
            file_path=file_path,
            row_count=row_count,
            schema_snapshot=schema_snapshot
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)
        return new_version

    def restore_version(self, db: Session, session_id: str, version_id: str) -> dict:
        db_session = self.get_session(db, session_id)
        version = db.query(DatasetVersion).filter(DatasetVersion.id == version_id, DatasetVersion.session_id == session_id).first()
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
            
        # Here we would logic to copy version.file_path to db_session.stored_filename
        # but for now we just update session reference
        db_session.stored_filename = version.file_path
        db_session.row_count = version.row_count
        db.commit()
        
        # Create a new version representing the restore
        self.create_version(db, session_id, f"Restored from version {version.version_number}", version.file_path, version.row_count, version.schema_snapshot)
        
        return {"status": "success", "message": f"Restored to version {version.version_number}"}

