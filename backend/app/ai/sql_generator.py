import os
from google import genai
from fastapi import HTTPException
from app.core.config import settings

class SQLGenerator:
    """
    Handles communication with Google Gemini to generate SQL and explanations.
    """
    
    @classmethod
    def get_client(cls):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise HTTPException(status_code=500, detail="Gemini API key is missing. Please configure GEMINI_API_KEY in your environment.")
        return genai.Client(api_key=api_key)

    @classmethod
    def generate_sql(cls, prompt: str) -> str:
        client = cls.get_client()
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI failed to generate SQL: {str(e)}")

    @classmethod
    def generate_explanation(cls, prompt: str) -> str:
        client = cls.get_client()
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            return "I generated the data, but encountered an error while trying to write the explanation."
