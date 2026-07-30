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

from app.domains.shared.models import Session as SessionModel
from app.domains.shared.interfaces import StorageService
from app.domains.ai.schemas import ChatMessage
from app.domains.ai.interfaces import IAIService
from app.domains.ai.prompt_builder import PromptBuilder
from app.domains.ai.sql_generator import SQLGenerator
from app.domains.ai.sql_validator import SQLValidator
from app.domains.shared.logging import logger

class AIServiceImpl(IAIService):
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

    def get_history(self, session_id: str) -> List[ChatMessage]:
        history_path = self.storage.get_cache_path(session_id, "chat_history.json")
        if os.path.exists(history_path):
            try:
                with open(history_path, "r") as f:
                    data = json.load(f)
                    return [ChatMessage(**msg) for msg in data.get("messages", [])]
            except Exception:
                pass
        return []

    def save_history(self, session_id: str, messages: List[ChatMessage]):
        history_path = self.storage.get_cache_path(session_id, "chat_history.json")
        try:
            with open(history_path, "w") as f:
                json.dump({"messages": [m.model_dump() for m in messages]}, f, default=str)
        except Exception:
            pass

    def process_query(self, db: Session, session_id: str, question: str) -> ChatMessage:
        logger.info(f"Processing AI query for session {session_id}")
        db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        file_path = self.storage.read(session_id, db_session.stored_filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file missing")
            
        try:
            if db_session.original_filename.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read dataset: {e}")

        sql_prompt = PromptBuilder.build_sql_prompt(df, question)
        raw_sql = SQLGenerator.generate_sql(sql_prompt)
        
        if raw_sql.startswith("ERROR:"):
            return ChatMessage(
                id=str(uuid.uuid4()),
                role="ai",
                content=raw_sql,
                timestamp=datetime.utcnow()
            )

        valid_sql = SQLValidator.validate(raw_sql)

        start_time = time.time()
        try:
            result_df = duckdb.query(valid_sql).df()
            execution_time = (time.time() - start_time) * 1000
        except Exception as e:
            return ChatMessage(
                id=str(uuid.uuid4()),
                role="ai",
                content=f"I generated a SQL query, but it failed to execute against the dataset. Error: {str(e)}",
                sql_query=valid_sql,
                timestamp=datetime.utcnow()
            )

        row_count = len(result_df)
        display_df = result_df.head(50)
        display_df = display_df.replace({np.nan: None})
        
        results_payload = {
            "columns": list(display_df.columns),
            "data": self._clean_json(display_df.to_dict(orient="records"))
        }

        explanation_prompt = PromptBuilder.build_explanation_prompt(question, valid_sql, results_payload)
        explanation = SQLGenerator.generate_explanation(explanation_prompt)

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

        history = self.get_history(session_id)
        user_msg = ChatMessage(
            id=str(uuid.uuid4()),
            role="user",
            content=question,
            timestamp=datetime.utcnow()
        )
        history.append(user_msg)
        history.append(ai_message)
        self.save_history(session_id, history)

        return ai_message
