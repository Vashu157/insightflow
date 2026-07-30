import pytest
import pandas as pd
from app.domains.profiling.data_quality import DataQualityAnalyzer
from app.domains.reports.recommendations import RecommendationEngine
from app.domains.reports.schemas import DashboardSummary
from app.domains.shared.ai_cache import AICacheManager

def test_data_quality_analyzer():
    # Mock dataframe with missing values and duplicates
    data = {
        "id": [1, 2, 3, 4, 4],
        "value": [10.5, None, 20.1, 1000.0, 1000.0]  # Includes outlier and None
    }
    df = pd.DataFrame(data)
    
    results = DataQualityAnalyzer.analyze(df)
    
    assert "score" in results
    assert results["score"] < 100
    assert results["missing_pct"] > 0
    assert results["duplicate_pct"] > 0
    
    # Should identify issues
    assert len(results["issues"]) >= 2
    assert any("duplicate" in issue.lower() for issue in results["issues"])
    assert any("missing" in issue.lower() for issue in results["issues"])

def test_recommendation_engine():
    summary = DashboardSummary(
        total_rows=100,
        total_columns=4,
        missing_values=0,
        duplicate_rows=0,
        numeric_columns=["sales", "profit"],
        categorical_columns=["region", "category"],
        datetime_columns=["date"]
    )
    
    charts = RecommendationEngine.suggest_visualizations(summary)
    
    # Should suggest Bar (cat vs num), Pie (cat dist), Line (date vs num), Scatter (num vs num)
    assert len(charts) == 4
    
    types = [c.chart_type.lower() for c in charts]
    assert "bar" in types
    assert "pie" in types
    assert "line" in types
    assert "scatter" in types

def test_ai_cache_key_generation():
    key1 = AICacheManager._generate_cache_key("session_123", "Analyze profit", 1)
    key2 = AICacheManager._generate_cache_key("session_123", "Analyze profit", 1)
    key3 = AICacheManager._generate_cache_key("session_123", "Analyze profit", 2)
    key4 = AICacheManager._generate_cache_key("session_456", "Analyze profit", 1)
    
    assert key1 == key2  # Same inputs = same key
    assert key1 != key3  # Different version = different key
    assert key1 != key4  # Different session = different key
