import uuid
import os
import pandas as pd
from datetime import datetime, timedelta
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.session import Session as SessionModel
from app.schemas.session import SessionResponse, DatasetPreviewResponse
from app.storage.s3_storage import S3StorageService
from app.core.config import settings

storage = S3StorageService()

class SessionService:
    @staticmethod
    def process_upload(db: Session, file: UploadFile) -> SessionResponse:
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Unsupported file type. Only CSV and Excel are allowed.")
            
        session_id = str(uuid.uuid4())
        
        try:
            file_path = storage.save(session_id, file)
            
            # Read file with Pandas
            if file.filename.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
                
            if df.empty:
                storage.delete(session_id)
                raise HTTPException(status_code=400, detail="The uploaded file is empty.")
                
            row_count = len(df)
            column_count = len(df.columns)
            file_size = os.path.getsize(file_path)
            
            # Save to DB
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
            
            return db_session
            
        except HTTPException:
            storage.delete(session_id)
            raise
        except Exception as e:
            import traceback
            traceback.print_exc()
            storage.delete(session_id)
            raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    @staticmethod
    def get_session(db: Session, session_id: str) -> SessionResponse:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update last accessed
        db_session.last_accessed = datetime.utcnow()
        db.commit()
        db.refresh(db_session)
        
        return db_session

    @staticmethod
    def get_preview(db: Session, session_id: str, limit: int = 20, offset: int = 0) -> DatasetPreviewResponse:
        db_session = SessionService.get_session(db, session_id)
        
        file_path = storage.read(session_id, db_session.stored_filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing from storage")
            
        try:
            if db_session.original_filename.endswith('.csv'):
                df = pd.read_csv(file_path, skiprows=range(1, offset + 1), nrows=limit)
            else:
                df = pd.read_excel(file_path, skiprows=range(1, offset + 1), nrows=limit)
                
            # Replace NaNs for JSON serialization
            df = df.fillna("")
            
            return DatasetPreviewResponse(
                total_rows=db_session.row_count,
                total_columns=db_session.column_count,
                columns=list(df.columns),
                data_types={col: str(dtype) for col, dtype in df.dtypes.items()},
                data=df.to_dict(orient="records")
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading dataset: {str(e)}")

    @staticmethod
    def delete_session(db: Session, session_id: str) -> dict:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if db_session:
            db.delete(db_session)
            db.commit()
            
        storage.delete(session_id)
        return {"status": "success", "message": "Session deleted"}
