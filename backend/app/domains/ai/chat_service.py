import os
import json
import uuid
import time
import pandas as pd
import duckdb
import numpy as np
from datetime import datetime
from typing import List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.session import Session as SessionModel
from app.storage.s3_storage import S3StorageService
from app.schemas.ai import ChatMessage
from app.ai.prompt_builder import PromptBuilder
from app.ai.sql_generator import SQLGenerator
from app.ai.sql_validator import SQLValidator

storage = S3StorageService()

class ChatService:
    
    @staticmethod
    def _clean_json(obj: Any) -> Any:
        if isinstance(obj, dict):
            return {k: ChatService._clean_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [ChatService._clean_json(i) for i in obj]
        elif pd.isna(obj):
            return None
        elif isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return ChatService._clean_json(obj.tolist())
        elif isinstance(obj, (datetime, pd.Timestamp)):
            return obj.isoformat()
        return obj

    @staticmethod
    def get_history(session_id: str) -> List[ChatMessage]:
        history_path = storage.get_cache_path(session_id, "chat_history.json")
        if os.path.exists(history_path):
            try:
                with open(history_path, "r") as f:
                    data = json.load(f)
                    return [ChatMessage(**msg) for msg in data.get("messages", [])]
            except Exception:
                pass
        return []

    @staticmethod
    def save_history(session_id: str, messages: List[ChatMessage]):
        history_path = storage.get_cache_path(session_id, "chat_history.json")
        try:
            with open(history_path, "w") as f:
                json.dump({"messages": [m.model_dump() for m in messages]}, f, default=str)
        except Exception:
            pass

    @staticmethod
    def process_query(db: Session, session_id: str, question: str) -> ChatMessage:
        # 1. Load Dataset
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
            
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

        # Ensure column names are duckdb-safe (no spaces/weird chars if possible, though duckdb handles quotes)
        # We rely on Gemini using double quotes for complex column names.

        # 2. Build Prompt & Generate SQL
        sql_prompt = PromptBuilder.build_sql_prompt(df, question)
        raw_sql = SQLGenerator.generate_sql(sql_prompt)
        
        if raw_sql.startswith("ERROR:"):
            return ChatMessage(
                id=str(uuid.uuid4()),
                role="ai",
                content=raw_sql,
                timestamp=datetime.utcnow()
            )

        # 3. Validate SQL
        valid_sql = SQLValidator.validate(raw_sql)

        # 4. Execute SQL via DuckDB
        start_time = time.time()
        try:
            # duckdb automatically queries local DataFrames by name, so `df` is accessible here
            result_df = duckdb.query(valid_sql).df()
            execution_time = (time.time() - start_time) * 1000
        except Exception as e:
            # If execution fails, return a graceful error message
            return ChatMessage(
                id=str(uuid.uuid4()),
                role="ai",
                content=f"I generated a SQL query, but it failed to execute against the dataset. Error: {str(e)}",
                sql_query=valid_sql,
                timestamp=datetime.utcnow()
            )

        row_count = len(result_df)
        
        # Limit results for the AI prompt and frontend display
        # We don't want to send 100,000 rows back to the frontend table or the AI token context.
        display_df = result_df.head(50)
        
        # Clean data for JSON serialization
        display_df = display_df.replace({np.nan: None})
        
        results_payload = {
            "columns": list(display_df.columns),
            "data": ChatService._clean_json(display_df.to_dict(orient="records"))
        }

        # 5. Generate Explanation
        explanation_prompt = PromptBuilder.build_explanation_prompt(question, valid_sql, results_payload)
        explanation = SQLGenerator.generate_explanation(explanation_prompt)

        # 6. Construct Response
        ai_message = ChatMessage(
            id=str(uuid.uuid4()),
            role="ai",
            content=explanation,
            timestamp=datetime.utcnow(),
            sql_query=valid_sql,
            execution_time_ms=round(execution_time, 2),
            row_count=row_count,
            results=results_payload
        )

        # 7. Update History
        history = ChatService.get_history(session_id)
        user_msg = ChatMessage(
            id=str(uuid.uuid4()),
            role="user",
            content=question,
            timestamp=datetime.utcnow()
        )
        history.append(user_msg)
        history.append(ai_message)
        ChatService.save_history(session_id, history)

        return ai_message
