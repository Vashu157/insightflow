import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any

from app.domains.shared.database import get_db
from app.domains.profiling.schemas import DatasetProfile, ColumnSummary, ColumnDetails
from app.domains.profiling.interfaces import IProfilingService
from app.domains.profiling.dependencies import get_profiling_service
from app.domains.shared.dependencies import get_storage_service

router = APIRouter()

@router.get("/sessions/{session_id}/profile", response_model=DatasetProfile)
def get_dataset_profile(
    session_id: str, 
    db: Session = Depends(get_db),
    storage = Depends(get_storage_service)
) -> Any:
    """Get the full generated dataset profile from cache."""
    cache_path = storage.get_cache_path(session_id, "profile.json")
    if not os.path.exists(cache_path):
        raise HTTPException(status_code=404, detail="Profile not generated yet or generation failed.")
    try:
        with open(cache_path, "r") as f:
            data = json.load(f)
            return DatasetProfile(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load profile: {e}")

@router.get("/sessions/{session_id}/columns", response_model=List[ColumnSummary])
def get_dataset_columns(
    session_id: str, 
    db: Session = Depends(get_db),
    storage = Depends(get_storage_service)
) -> Any:
    """Get summary information for all columns in the dataset from cache."""
    cache_path = storage.get_cache_path(session_id, "profile.json")
    if not os.path.exists(cache_path):
        raise HTTPException(status_code=404, detail="Profile not generated yet.")
    try:
        with open(cache_path, "r") as f:
            data = json.load(f)
            profile = DatasetProfile(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load profile: {e}")
        
    summaries = []
    for col in profile.columns:
        summaries.append(ColumnSummary(
            name=col.name,
            inferred_type=col.inferred_type,
            unique_count=col.categorical_stats.unique_count if col.categorical_stats else (
                len(set(col.sample_values))
            ),
            missing_count=col.missing_count,
            missing_percentage=col.missing_percentage,
            sample_values=col.sample_values
        ))
    return summaries

@router.get("/sessions/{session_id}/columns/{column_name}", response_model=ColumnDetails)
def get_column_details(
    session_id: str, 
    column_name: str, 
    db: Session = Depends(get_db),
    storage = Depends(get_storage_service)
) -> Any:
    """Get detailed profiling statistics for a specific column from cache."""
    cache_path = storage.get_cache_path(session_id, "profile.json")
    if not os.path.exists(cache_path):
        raise HTTPException(status_code=404, detail="Profile not generated yet.")
    try:
        with open(cache_path, "r") as f:
            data = json.load(f)
            profile = DatasetProfile(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load profile: {e}")
        
    for col in profile.columns:
        if col.name == column_name:
            return col
    raise HTTPException(status_code=404, detail=f"Column '{column_name}' not found in dataset")
