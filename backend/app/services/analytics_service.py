import os
import json
import numpy as np
import pandas as pd
from typing import Any, Dict, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.session import Session as SessionModel
from app.schemas.analytics import FilterRule, ChartConfig, DashboardSummary, AggregationRule
from app.storage.local import LocalStorageService

storage = LocalStorageService(base_path="uploads")

class AnalyticsService:
    @staticmethod
    def _clean_json(obj: Any) -> Any:
        if isinstance(obj, dict):
            return {k: AnalyticsService._clean_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [AnalyticsService._clean_json(i) for i in obj]
        elif pd.isna(obj):
            return None
        elif isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return AnalyticsService._clean_json(obj.tolist())
        elif isinstance(obj, (datetime, pd.Timestamp)):
            return obj.isoformat()
        return obj

    @staticmethod
    def _load_dataframe(db: Session, session_id: str) -> pd.DataFrame:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        file_path = storage.read(session_id, db_session.stored_filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing")
        try:
            if db_session.original_filename.endswith('.csv'):
                return pd.read_csv(file_path)
            else:
                return pd.read_excel(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")

    @staticmethod
    def _apply_filters(df: pd.DataFrame, filters: List[FilterRule]) -> pd.DataFrame:
        if not filters:
            return df
        filtered_df = df.copy()
        for rule in filters:
            col = rule.column
            if col not in filtered_df.columns:
                continue
            op = rule.operator.lower()
            val = rule.value
            
            try:
                if op == 'equals':
                    filtered_df = filtered_df[filtered_df[col] == val]
                elif op == 'not_equals':
                    filtered_df = filtered_df[filtered_df[col] != val]
                elif op == 'contains':
                    filtered_df = filtered_df[filtered_df[col].astype(str).str.contains(str(val), case=False, na=False)]
                elif op == 'gt':
                    filtered_df = filtered_df[filtered_df[col] > float(val)]
                elif op == 'lt':
                    filtered_df = filtered_df[filtered_df[col] < float(val)]
                elif op == 'between':
                    filtered_df = filtered_df[filtered_df[col].between(float(val[0]), float(val[1]))]
                elif op == 'in_list':
                    filtered_df = filtered_df[filtered_df[col].isin(val)]
            except Exception as e:
                # Silently ignore invalid filter applications (e.g. string comparison on numeric) to prevent full crash
                pass
        return filtered_df

    @staticmethod
    def get_dashboard_summary(db: Session, session_id: str) -> DashboardSummary:
        df = AnalyticsService._load_dataframe(db, session_id)
        
        numeric_cols = []
        categorical_cols = []
        datetime_cols = []
        
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                if not pd.api.types.is_bool_dtype(df[col]):
                    numeric_cols.append(str(col))
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                datetime_cols.append(str(col))
            else:
                categorical_cols.append(str(col))
                
        return DashboardSummary(
            total_rows=len(df),
            total_columns=len(df.columns),
            missing_values=int(df.isna().sum().sum()),
            duplicate_rows=int(df.duplicated().sum()),
            numeric_columns=numeric_cols,
            categorical_columns=categorical_cols,
            datetime_columns=datetime_cols
        )

    @staticmethod
    def get_charts(session_id: str) -> List[ChartConfig]:
        cache_path = storage.read(session_id, "dashboard.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r") as f:
                    data = json.load(f)
                    return [ChartConfig(**chart) for chart in data.get("charts", [])]
            except Exception:
                pass
        return []

    @staticmethod
    def save_charts(session_id: str, charts: List[ChartConfig]):
        cache_path = storage.read(session_id, "dashboard.json")
        try:
            with open(cache_path, "w") as f:
                json.dump({"charts": [c.model_dump() for c in charts]}, f)
        except Exception:
            pass

    @staticmethod
    def process_chart(db: Session, session_id: str, config: ChartConfig) -> List[Dict[str, Any]]:
        df = AnalyticsService._load_dataframe(db, session_id)
        df = AnalyticsService._apply_filters(df, config.filters or [])
        
        if df.empty:
            return []

        x = config.x_column
        y = config.y_column
        agg = (config.aggregation or "count").lower()
        
        if x not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column {x} not found")

        # Scatter needs no aggregation generally, just pairs
        if config.chart_type.lower() == 'scatter':
            if not y or y not in df.columns:
                raise HTTPException(status_code=400, detail="Scatter plot requires y_column")
            return AnalyticsService._clean_json(df[[x, y]].dropna().to_dict(orient='records'))

        # Histogram needs bins
        if config.chart_type.lower() == 'histogram':
            if not pd.api.types.is_numeric_dtype(df[x]):
                raise HTTPException(status_code=400, detail="Histogram requires a numeric x_column")
            counts, bins = np.histogram(df[x].dropna(), bins=20)
            res = [{"range": f"{bins[i]:.2f} - {bins[i+1]:.2f}", "count": counts[i]} for i in range(len(counts))]
            return AnalyticsService._clean_json(res)

        # Standard GroupBy for Bar, Line, Pie, Area
        grouped = df.groupby(x)
        
        if agg == 'count':
            agg_df = grouped.size().reset_index(name='count')
            y_out = 'count'
        else:
            if not y or y not in df.columns:
                raise HTTPException(status_code=400, detail=f"Aggregation {agg} requires a numeric y_column")
            if not pd.api.types.is_numeric_dtype(df[y]):
                raise HTTPException(status_code=400, detail="y_column must be numeric for this aggregation")
            
            if agg == 'sum':
                agg_df = grouped[y].sum().reset_index()
            elif agg == 'average':
                agg_df = grouped[y].mean().reset_index()
            elif agg == 'min':
                agg_df = grouped[y].min().reset_index()
            elif agg == 'max':
                agg_df = grouped[y].max().reset_index()
            elif agg == 'median':
                agg_df = grouped[y].median().reset_index()
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported aggregation: {agg}")
            y_out = y

        # Limit to top 100 for visualization sanity
        if len(agg_df) > 100:
            agg_df = agg_df.sort_values(by=y_out, ascending=False).head(100)

        return AnalyticsService._clean_json(agg_df.to_dict(orient='records'))

    @staticmethod
    def get_table_data(db: Session, session_id: str, limit: int, offset: int, filters: List[FilterRule], sort_column: str = None, sort_desc: bool = False) -> Dict[str, Any]:
        df = AnalyticsService._load_dataframe(db, session_id)
        total_rows = len(df)
        
        df = AnalyticsService._apply_filters(df, filters)
        filtered_rows = len(df)
        
        if sort_column and sort_column in df.columns:
            df = df.sort_values(by=sort_column, ascending=not sort_desc)
            
        paginated_df = df.iloc[offset:offset+limit]
        
        # Replace NaNs with None for JSON serialization
        paginated_df = paginated_df.replace({np.nan: None})
        
        return {
            "data": AnalyticsService._clean_json(paginated_df.to_dict(orient='records')),
            "total_rows": total_rows,
            "filtered_rows": filtered_rows,
            "columns": list(df.columns)
        }
