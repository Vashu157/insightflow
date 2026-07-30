import json
from typing import List, Dict, Any
import os
from app.domains.shared.interfaces import StorageService

class AIMemoryService:
    def __init__(self, storage: StorageService):
        self.storage = storage
        
    def add_interaction(self, session_id: str, role: str, content: str) -> None:
        cache_path = self.storage.get_cache_path(session_id, "ai_memory.json")
        memory = []
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r") as f:
                    memory = json.load(f)
            except Exception:
                pass
                
        memory.append({
            "role": role,
            "content": content
        })
        
        # Keep last 10 interactions to avoid token limits
        memory = memory[-10:]
        
        try:
            with open(cache_path, "w") as f:
                json.dump(memory, f)
        except Exception:
            pass
            
    def get_context(self, session_id: str) -> List[Dict[str, Any]]:
        cache_path = self.storage.get_cache_path(session_id, "ai_memory.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r") as f:
                    return json.load(f)
            except Exception:
                return []
        return []
