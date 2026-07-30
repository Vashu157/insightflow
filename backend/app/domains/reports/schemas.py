from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class FilterRule(BaseModel):
    column: str
    operator: str  # equals, not_equals, contains, gt, lt, between, in_list
    value: Any

class AggregationRule(BaseModel):
    column: str
    function: str  # count, sum, average, min, max, median

class ChartConfig(BaseModel):
    id: str
    title: str
    chart_type: str  # Bar, Line, Pie, Histogram, Scatter, Area
    x_column: str
    y_column: Optional[str] = None
    aggregation: Optional[str] = None # For backward compatibility in API
    aggregations: Optional[List[AggregationRule]] = None
    filters: Optional[List[FilterRule]] = []
    
    # Grid layout positioning (React-Grid-Layout)
    x: int = 0
    y: int = 0
    w: int = 4
    h: int = 3

class ChartResponse(BaseModel):
    config: ChartConfig
    data: List[Dict[str, Any]]
    
class DashboardSummary(BaseModel):
    total_rows: int
    total_columns: int
    missing_values: int
    duplicate_rows: int
    numeric_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]

class FilterRequest(BaseModel):
    filters: List[FilterRule]

class GroupByRequest(BaseModel):
    groupby_columns: List[str]
    aggregations: List[AggregationRule]
    filters: Optional[List[FilterRule]] = []

class TableRequest(BaseModel):
    filters: Optional[List[FilterRule]] = []
    limit: int = 50
    offset: int = 0
    sort_column: Optional[str] = None
    sort_desc: bool = False

class TableResponse(BaseModel):
    data: List[Dict[str, Any]]
    total_rows: int

class FilterRule(BaseModel):
    column: str
    operator: str  # equals, not_equals, contains, gt, lt, between, in_list
    value: Any

class AggregationRule(BaseModel):
    column: str
    function: str  # count, sum, average, min, max, median

class ChartConfig(BaseModel):
    id: str
    title: str
    chart_type: str  # Bar, Line, Pie, Histogram, Scatter, Area
    x_column: str
    y_column: Optional[str] = None
    aggregation: Optional[str] = None # For backward compatibility in API
    aggregations: Optional[List[AggregationRule]] = None
    filters: Optional[List[FilterRule]] = []
    
    # Grid layout positioning (React-Grid-Layout)
    x: int = 0
    y: int = 0
    w: int = 4
    h: int = 3

class ChartResponse(BaseModel):
    config: ChartConfig
    data: List[Dict[str, Any]]
    
class DashboardSummary(BaseModel):
    total_rows: int
    total_columns: int
    missing_values: int
    duplicate_rows: int
    numeric_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]

class FilterRequest(BaseModel):
    filters: List[FilterRule]

class GroupByRequest(BaseModel):
    groupby_columns: List[str]
    aggregations: List[AggregationRule]
    filters: Optional[List[FilterRule]] = []

class TableRequest(BaseModel):
    filters: Optional[List[FilterRule]] = []
    limit: int = 50
    offset: int = 0
    sort_column: Optional[str] = None
    sort_desc: bool = False

class TableResponse(BaseModel):
    data: List[Dict[str, Any]]
    total_rows: int
    filtered_rows: int
    columns: List[str]


from datetime import datetime


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


class BusinessReportResponse(BaseModel):
    session_id: str
    report: BusinessReport
    generated_at: datetime
    is_cached: bool
