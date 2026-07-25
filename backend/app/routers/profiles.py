from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Any

from app.database.database import get_db
from app.schemas.profile import DatasetProfile, ColumnSummary, ColumnDetails
from app.services.profiler_service import ProfilerService

router = APIRouter()

@router.get("/sessions/{session_id}/profile", response_model=DatasetProfile)
def get_dataset_profile(session_id: str, db: Session = Depends(get_db)) -> Any:
    """Get the full generated dataset profile."""
    return ProfilerService.generate_profile(db, session_id)

@router.get("/sessions/{session_id}/columns", response_model=List[ColumnSummary])
def get_dataset_columns(session_id: str, db: Session = Depends(get_db)) -> Any:
    """Get summary information for all columns in the dataset."""
    profile = ProfilerService.generate_profile(db, session_id)
    summaries = []
    for col in profile.columns:
        summaries.append(ColumnSummary(
            name=col.name,
            inferred_type=col.inferred_type,
            unique_count=col.categorical_stats.unique_count if col.categorical_stats else (
                len(set(col.sample_values)) # fallback unique estimate if not categorical
            ),
            missing_count=col.missing_count,
            missing_percentage=col.missing_percentage,
            sample_values=col.sample_values
        ))
    return summaries

@router.get("/columns/{session_id}/{column_name}", response_model=ColumnDetails)
def get_column_details(session_id: str, column_name: str, db: Session = Depends(get_db)) -> Any:
    """Get detailed profiling statistics for a specific column."""
    return ProfilerService.get_column_profile(db, session_id, column_name)
