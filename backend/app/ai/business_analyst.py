import json
import os
from datetime import datetime
from google import genai
from pydantic import ValidationError
from fastapi import HTTPException
from app.core.config import settings
from app.storage.local import LocalStorageService
from app.ai.report_models import BusinessReport

storage = LocalStorageService(base_path="uploads")

class BusinessAnalyst:
    @classmethod
    def get_client(cls):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="Gemini API key is missing. Please configure GEMINI_API_KEY in your environment.")
        return genai.Client(api_key=api_key)

    @classmethod
    def get_cached_report(cls, session_id: str):
        cache_path = storage.read(session_id, "insights_report.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r") as f:
                    data = json.load(f)
                    return data
            except Exception:
                pass
        return None

    @classmethod
    def save_report(cls, session_id: str, report_dict: dict):
        cache_path = storage.read(session_id, "insights_report.json")
        try:
            with open(cache_path, "w") as f:
                json.dump(report_dict, f)
        except Exception:
            pass

    @classmethod
    def generate_report(cls, session_id: str, force_refresh: bool = False):
        if not force_refresh:
            cached = cls.get_cached_report(session_id)
            if cached:
                return {"report": cached["report"], "generated_at": cached["generated_at"], "is_cached": True}

        profile_path = storage.read(session_id, "profile.json")
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=400, detail="Data profile not found. Please ensure the dataset was successfully profiled.")
        
        try:
            with open(profile_path, "r") as f:
                profile_data = json.load(f)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to load dataset profile.")

        # Construct a dense prompt focusing entirely on the statistics
        # Note: We use json.dumps() to format the profile cleanly but restrict to top columns to save tokens.
        
        prompt = f"""
You are an expert AI Business Analyst. I am providing you with the statistical profile of a dataset.
Your task is to analyze these statistics and generate a comprehensive Business Report.

DATASET PROFILE SUMMARY:
Row count: {profile_data.get('summary', {}).get('total_rows')}
Column count: {profile_data.get('summary', {}).get('total_columns')}

COLUMNS:
"""
        # Append limited column stats
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

        client = cls.get_client()
        
        try:
            # Instruct Gemini to return the response exactly mapping to our Pydantic BusinessReport model
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": BusinessReport,
                    "temperature": 0.2
                }
            )
            
            # The response text will be a JSON string that perfectly maps to BusinessReport
            report_json = response.text
            report_dict = json.loads(report_json)
            
            # Validate with Pydantic
            validated_report = BusinessReport(**report_dict)
            
            payload = {
                "report": validated_report.model_dump(),
                "generated_at": datetime.utcnow().isoformat()
            }
            
            cls.save_report(session_id, payload)
            
            return {"report": payload["report"], "generated_at": payload["generated_at"], "is_cached": False}
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate Business Report: {str(e)}")
