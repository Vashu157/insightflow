import os
import json
import uuid
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Any, Dict, List, Callable
from fastapi import HTTPException
from sqlalchemy.orm import Session
from google import genai

from app.domains.shared.models import Session as SessionModel
from app.domains.reports.schemas import (
    FilterRule, ChartConfig, DashboardSummary, AggregationRule, BusinessReport
)
from app.domains.reports.recommendations import RecommendationEngine
from app.domains.shared.interfaces import StorageService
from app.domains.reports.interfaces import IReportService
from app.domains.shared.logging import logger, current_session_id
from app.core.config import settings
from app.core.circuit_breaker import gemini_circuit_breaker
from app.domains.shared.metrics import GEMINI_API_DURATION_SECONDS
import time

class ReportServiceImpl(IReportService):
    def __init__(self, storage: StorageService):
        self.storage = storage

    def _clean_json(self, obj: Any) -> Any:
        if isinstance(obj, dict):
            return {k: self._clean_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._clean_json(i) for i in obj]
        elif pd.isna(obj):
            return None
        elif isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return self._clean_json(obj.tolist())
        elif isinstance(obj, (datetime, pd.Timestamp)):
            return obj.isoformat()
        return obj

    def _load_dataframe(self, db: Session, session_id: str) -> pd.DataFrame:
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
        file_path = self.storage.read(session_id, db_session.stored_filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing")
        try:
            if db_session.original_filename.endswith('.csv'):
                return pd.read_csv(file_path)
            else:
                return pd.read_excel(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")

    def _apply_filters(self, df: pd.DataFrame, filters: List[FilterRule]) -> pd.DataFrame:
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
            except Exception:
                pass
        return filtered_df

    def get_dashboard_summary(self, db: Session, session_id: str) -> DashboardSummary:
        df = self._load_dataframe(db, session_id)
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

    def get_charts(self, session_id: str) -> List[ChartConfig]:
        cache_path = self.storage.get_cache_path(session_id, "dashboard.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r") as f:
                    data = json.load(f)
                    return [ChartConfig(**chart) for chart in data.get("charts", [])]
            except Exception:
                pass
        return []

    def save_charts(self, session_id: str, charts: List[ChartConfig]):
        cache_path = self.storage.get_cache_path(session_id, "dashboard.json")
        try:
            with open(cache_path, "w") as f:
                json.dump({"charts": [c.model_dump() for c in charts]}, f)
        except Exception:
            pass

    def process_chart(self, db: Session, session_id: str, config: ChartConfig) -> List[Dict[str, Any]]:
        df = self._load_dataframe(db, session_id)
        df = self._apply_filters(df, config.filters or [])
        if df.empty:
            return []
        x = config.x_column
        y = config.y_column
        agg = (config.aggregation or "count").lower()
        if x not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column {x} not found")

        if config.chart_type.lower() == 'scatter':
            if not y or y not in df.columns:
                raise HTTPException(status_code=400, detail="Scatter plot requires y_column")
            return self._clean_json(df[[x, y]].dropna().to_dict(orient='records'))

        if config.chart_type.lower() == 'histogram':
            if not pd.api.types.is_numeric_dtype(df[x]):
                raise HTTPException(status_code=400, detail="Histogram requires a numeric x_column")
            counts, bins = np.histogram(df[x].dropna(), bins=20)
            res = [{"range": f"{bins[i]:.2f} - {bins[i+1]:.2f}", "count": counts[i]} for i in range(len(counts))]
            return self._clean_json(res)

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

        if len(agg_df) > 100:
            agg_df = agg_df.sort_values(by=y_out, ascending=False).head(100)

        return self._clean_json(agg_df.to_dict(orient='records'))

    def get_table_data(self, db: Session, session_id: str, limit: int, offset: int, filters: List[FilterRule], sort_column: str = None, sort_desc: bool = False) -> Dict[str, Any]:
        df = self._load_dataframe(db, session_id)
        total_rows = len(df)
        df = self._apply_filters(df, filters)
        filtered_rows = len(df)
        if sort_column and sort_column in df.columns:
            df = df.sort_values(by=sort_column, ascending=not sort_desc)
        paginated_df = df.iloc[offset:offset+limit]
        paginated_df = paginated_df.replace({np.nan: None})
        return {
            "data": self._clean_json(paginated_df.to_dict(orient='records')),
            "total_rows": total_rows,
            "filtered_rows": filtered_rows,
            "columns": list(df.columns)
        }

    # AI Business Analyst part
    def _get_client(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="Gemini API key is missing. Please configure GEMINI_API_KEY in your environment.")
        return genai.Client(api_key=api_key)

    def generate_report(self, db: Session, session_id: str, force_refresh: bool = False, progress_callback: Callable[[int], None] = None) -> Dict[str, Any]:
        cache_path = self.storage.get_cache_path(session_id, "insights_report.json")
        current_session_id.set(session_id)
        
        if not force_refresh:
            if os.path.exists(cache_path):
                try:
                    with open(cache_path, "r") as f:
                        cached = json.load(f)
                        return {"report": cached["report"], "generated_at": cached["generated_at"], "is_cached": True}
                except Exception:
                    pass

        profile_path = self.storage.get_cache_path(session_id, "profile.json")
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=400, detail="Data profile not found. Please ensure the dataset was successfully profiled.")
        
        try:
            with open(profile_path, "r") as f:
                profile_data = json.load(f)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to load dataset profile.")
            
        logger.info(f"Generating AI Business Report for session {session_id}")
        
        if progress_callback:
            progress_callback(10)

        prompt = f"""
You are an expert AI Business Analyst. I am providing you with the statistical profile of a dataset.
Your task is to analyze these statistics and generate a comprehensive Business Report.

DATASET PROFILE SUMMARY:
Row count: {profile_data.get('summary', {}).get('total_rows')}
Column count: {profile_data.get('summary', {}).get('total_columns')}

COLUMNS:
"""
        for stats in profile_data.get("columns", [])[:20]:
            col = stats.get('name')
            prompt += f"- {col} (Type: {stats.get('inferred_type')}): Missing {stats.get('missing_percentage', 0)}%\n"
            if stats.get('inferred_type') == 'numeric' and 'numeric_stats' in stats:
                num_stats = stats['numeric_stats']
                prompt += f"  Min: {num_stats.get('minimum')}, Max: {num_stats.get('maximum')}, Mean: {num_stats.get('mean')}\n"
            elif stats.get('inferred_type') == 'categorical' and 'categorical_stats' in stats:
                cat_stats = stats['categorical_stats']
                prompt += f"  Unique Values: {cat_stats.get('unique_count')}. Top Value: {cat_stats.get('top_10_values', [''])[0] if cat_stats.get('top_10_values') else 'N/A'}\n"

        prompt += """
REQUIREMENTS:
1. Executive Summary: Provide an overview, key observations, data quality issues, and health.
2. Insights: Create at least 3 cards (Trend, Distribution, Performance).
3. Recommendations: Provide at least 2 actionable business recommendations based ONLY on the data.
4. Anomalies: Identify any statistical anomalies (e.g., highly skewed distributions, high missing rates). If none, create 1 card stating data is clean.
5. Suggested Questions: 4 follow-up questions the user should ask in the AI chat.

DO NOT hallucinate. Only reference the metrics provided above.
Respond exactly matching the required JSON schema.
"""

        try:
            if progress_callback:
                progress_callback(50)
            
            client = self._get_client()
            
            def _call_gemini():
                start_t = time.time()
                try:
                    res = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                        config={
                            "response_mime_type": "application/json",
                            "response_schema": BusinessReport,
                            "temperature": 0.2
                        }
                    )
                    GEMINI_API_DURATION_SECONDS.labels(operation="generate_report", status="success").observe(time.time() - start_t)
                    return res
                except Exception as g_err:
                    GEMINI_API_DURATION_SECONDS.labels(operation="generate_report", status="error").observe(time.time() - start_t)
                    raise g_err

            response = gemini_circuit_breaker.call(_call_gemini)
            
            report_json = response.text
            report_dict = json.loads(report_json)
            validated_report = BusinessReport(**report_dict)
            
            payload = {
                "report": validated_report.model_dump(),
                "generated_at": datetime.utcnow().isoformat()
            }
            
            try:
                with open(cache_path, "w") as f:
                    json.dump(payload, f)
            except Exception:
                pass
            
            if progress_callback:
                progress_callback(100)
            
            logger.info("Report generation completed successfully")
            current_session_id.set("")
            
            return {"report": payload["report"], "generated_at": payload["generated_at"], "is_cached": False}
            
        except Exception as e:
            logger.error(f"Failed to generate Business Report: {str(e)}", exc_info=True)
            current_session_id.set("")
            raise HTTPException(status_code=500, detail=f"Failed to generate Business Report: {str(e)}")

    def get_visualization_recommendations(self, db: Session, session_id: str) -> List[ChartConfig]:
        summary = self.get_dashboard_summary(db, session_id)
        return RecommendationEngine.suggest_visualizations(summary)
