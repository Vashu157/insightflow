import os
import json
import numpy as np
import pandas as pd
from typing import Any, Dict
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.session import Session as SessionModel
from app.schemas.profile import DatasetProfile, DatasetSummary, ColumnDetails, NumericStats, CategoricalStats, DateStats, BooleanStats
from app.storage.local import LocalStorageService

storage = LocalStorageService(base_path="uploads")

class ProfilerService:
    @staticmethod
    def _clean_json(obj: Any) -> Any:
        """Helper to recursively convert NumPy/Pandas types to JSON serializable native Python types."""
        if isinstance(obj, dict):
            return {k: ProfilerService._clean_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [ProfilerService._clean_json(i) for i in obj]
        elif pd.isna(obj):
            return None
        elif isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return ProfilerService._clean_json(obj.tolist())
        elif isinstance(obj, (datetime, pd.Timestamp)):
            return obj.isoformat()
        return obj

    @staticmethod
    def generate_profile(db: Session, session_id: str) -> DatasetProfile:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")

        cache_path = storage.read(session_id, "profile.json")
        
        # Check cache
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r") as f:
                    data = json.load(f)
                    return DatasetProfile(**data)
            except Exception:
                pass # Fallback to generation if cache read fails
        
        # Generation
        file_path = storage.read(session_id, db_session.stored_filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing")

        try:
            if db_session.original_filename.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")

        if df.empty:
            raise HTTPException(status_code=400, detail="Dataset is empty")

        total_rows = len(df)
        total_cols = len(df.columns)
        missing_count = int(df.isna().sum().sum())
        missing_perc = (missing_count / (total_rows * total_cols)) * 100 if total_rows > 0 else 0
        memory_usage = float(df.memory_usage(deep=True).sum() / (1024 * 1024))
        
        summary = DatasetSummary(
            total_rows=total_rows,
            total_columns=total_cols,
            memory_usage_mb=round(memory_usage, 2),
            duplicate_rows=int(df.duplicated().sum()),
            missing_values=missing_count,
            missing_percentage=round(missing_perc, 2),
            dataset_size_mb=round(db_session.file_size / (1024 * 1024), 2),
            upload_time=db_session.upload_time.isoformat()
        )

        columns_details = []
        
        for col in df.columns:
            series = df[col]
            missing_col = int(series.isna().sum())
            unique_vals = series.nunique(dropna=True)
            
            # Subsample to avoid large payload
            sample_vals = series.dropna().head(5).tolist()

            col_detail = {
                "name": str(col),
                "inferred_type": "unknown",
                "missing_count": missing_col,
                "missing_percentage": round((missing_col / total_rows) * 100, 2) if total_rows > 0 else 0,
                "sample_values": sample_vals
            }

            if pd.api.types.is_bool_dtype(series) or (series.dropna().isin([True, False, 0, 1]).all() and unique_vals <= 2):
                col_detail["inferred_type"] = "boolean"
                true_c = int((series == True).sum() + (series == 1).sum())
                false_c = int((series == False).sum() + (series == 0).sum())
                valid_c = true_c + false_c
                col_detail["boolean_stats"] = BooleanStats(
                    true_count=true_c,
                    false_count=false_c,
                    true_percentage=round((true_c / valid_c) * 100, 2) if valid_c > 0 else 0,
                    false_percentage=round((false_c / valid_c) * 100, 2) if valid_c > 0 else 0
                )
            
            elif pd.api.types.is_numeric_dtype(series):
                col_detail["inferred_type"] = "numeric"
                if not series.dropna().empty:
                    # Convert to float specifically to avoid numpy boolean issues if any sneaks in
                    float_series = series.astype(float)
                    q1 = float_series.quantile(0.25)
                    q3 = float_series.quantile(0.75)
                    col_detail["numeric_stats"] = NumericStats(
                        minimum=float(float_series.min()),
                        maximum=float(float_series.max()),
                        mean=float(float_series.mean()),
                        median=float(float_series.median()),
                        std_dev=float(float_series.std()) if pd.notna(float_series.std()) else 0.0,
                        variance=float(float_series.var()) if pd.notna(float_series.var()) else 0.0,
                        q1=float(q1),
                        q3=float(q3),
                        iqr=float(q3 - q1)
                    )
            
            elif pd.api.types.is_datetime64_any_dtype(series):
                col_detail["inferred_type"] = "date"
                if not series.dropna().empty:
                    min_dt = series.min()
                    max_dt = series.max()
                    col_detail["date_stats"] = DateStats(
                        min_date=min_dt.isoformat(),
                        max_date=max_dt.isoformat(),
                        time_span_days=float((max_dt - min_dt).days)
                    )
            
            else:
                # Try converting to datetime first
                try:
                    dt_series = pd.to_datetime(series, errors='ignore')
                    if pd.api.types.is_datetime64_any_dtype(dt_series):
                        col_detail["inferred_type"] = "date"
                        if not dt_series.dropna().empty:
                            min_dt = dt_series.min()
                            max_dt = dt_series.max()
                            col_detail["date_stats"] = DateStats(
                                min_date=min_dt.isoformat(),
                                max_date=max_dt.isoformat(),
                                time_span_days=float((max_dt - min_dt).days)
                            )
                        columns_details.append(col_detail)
                        continue
                except:
                    pass

                # Categorical fallback
                col_detail["inferred_type"] = "categorical"
                val_counts = series.value_counts(dropna=True).head(10)
                frequencies = val_counts.to_dict()
                perc_dist = (val_counts / len(series.dropna()) * 100).to_dict()
                
                col_detail["categorical_stats"] = CategoricalStats(
                    unique_count=unique_vals,
                    top_10_values=[str(k) for k in frequencies.keys()],
                    frequencies={str(k): int(v) for k, v in frequencies.items()},
                    percentage_distribution={str(k): round(float(v), 2) for k, v in perc_dist.items()}
                )

            columns_details.append(col_detail)

        profile_data = ProfilerService._clean_json({
            "summary": summary.model_dump(),
            "columns": columns_details
        })
        
        # Save to cache
        try:
            with open(cache_path, "w") as f:
                json.dump(profile_data, f)
        except Exception as e:
            print(f"Warning: Failed to cache profile: {e}")

        return DatasetProfile(**profile_data)

    @staticmethod
    def get_column_profile(db: Session, session_id: str, column_name: str) -> ColumnDetails:
        profile = ProfilerService.generate_profile(db, session_id)
        for col in profile.columns:
            if col.name == column_name:
                return col
        raise HTTPException(status_code=404, detail=f"Column '{column_name}' not found in dataset")
