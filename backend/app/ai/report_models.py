from pydantic import BaseModel, Field
from typing import List, Optional

class ExecutiveSummary(BaseModel):
    dataset_overview: str
    key_observations: List[str]
    data_quality_issues: List[str]
    overall_health: str

class InsightCard(BaseModel):
    title: str
    category: str  # e.g., "Performance", "Quality", "Trend", "Distribution", "Anomaly"
    description: str
    supporting_evidence: str
    confidence: str  # e.g., "High", "Medium", "Low"
    suggested_next_action: str
    severity: str  # e.g., "Info", "Warning", "Critical"

class Recommendation(BaseModel):
    title: str
    description: str
    impact: str  # e.g., "High", "Medium", "Low"

class BusinessReport(BaseModel):
    executive_summary: ExecutiveSummary
    insights: List[InsightCard]
    recommendations: List[Recommendation]
    anomalies: List[InsightCard]
    suggested_questions: List[str]
