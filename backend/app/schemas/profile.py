from pydantic import BaseModel
from typing import Dict, List, Any, Optional

class DatasetSummary(BaseModel):
    total_rows: int
    total_columns: int
    memory_usage_mb: float
    duplicate_rows: int
    missing_values: int
    missing_percentage: float
    dataset_size_mb: float
    upload_time: str

class ColumnSummary(BaseModel):
    name: str
    inferred_type: str
    unique_count: int
    missing_count: int
    missing_percentage: float
    sample_values: List[Any]

class NumericStats(BaseModel):
    minimum: float
    maximum: float
    mean: float
    median: float
    std_dev: float
    variance: float
    q1: float
    q3: float
    iqr: float

class CategoricalStats(BaseModel):
    unique_count: int
    top_10_values: List[str]
    frequencies: Dict[str, int]
    percentage_distribution: Dict[str, float]

class DateStats(BaseModel):
    min_date: str
    max_date: str
    time_span_days: float

class BooleanStats(BaseModel):
    true_count: int
    false_count: int
    true_percentage: float
    false_percentage: float

class ColumnDetails(BaseModel):
    name: str
    inferred_type: str
    missing_count: int
    missing_percentage: float
    sample_values: List[Any]
    numeric_stats: Optional[NumericStats] = None
    categorical_stats: Optional[CategoricalStats] = None
    date_stats: Optional[DateStats] = None
    boolean_stats: Optional[BooleanStats] = None

class DatasetProfile(BaseModel):
    summary: DatasetSummary
    columns: List[ColumnDetails]
