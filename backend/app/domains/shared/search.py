from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.domains.shared.models import Session as SessionModel, DatasetVersion

class EnterpriseSearchService:
    @staticmethod
    def search(db: Session, query: str) -> Dict[str, List[Dict[str, Any]]]:
        results = {
            "datasets": [],
            "reports": []
        }
        
        if not query or len(query) < 2:
            return results
            
        search_term = f"%{query}%"
        
        # Search Sessions (Datasets)
        sessions = db.query(SessionModel).filter(
            or_(
                SessionModel.session_name.ilike(search_term),
                SessionModel.original_filename.ilike(search_term)
            )
        ).limit(10).all()
        
        for s in sessions:
            results["datasets"].append({
                "id": str(s.id),
                "name": s.session_name,
                "filename": s.original_filename,
                "type": "dataset"
            })
            
        # Search Dataset Versions (Changes/Summaries)
        versions = db.query(DatasetVersion).filter(
            DatasetVersion.change_summary.ilike(search_term)
        ).limit(10).all()
        
        for v in versions:
            results["datasets"].append({
                "id": str(v.id),
                "session_id": str(v.session_id),
                "name": f"Version {v.version_number} - {v.change_summary}",
                "type": "version"
            })
            
        return results
