import pandas as pd
import numpy as np
from typing import Dict, Any, List

class DataQualityAnalyzer:
    @staticmethod
    def analyze(df: pd.DataFrame) -> Dict[str, Any]:
        total_rows = len(df)
        if total_rows == 0:
            return {"score": 0, "issues": ["Dataset is empty"]}
            
        issues = []
        
        # 1. Missingness
        missing_count = df.isna().sum().sum()
        total_cells = total_rows * len(df.columns)
        missing_pct = (missing_count / total_cells) * 100 if total_cells > 0 else 0
        
        if missing_pct > 20:
            issues.append(f"High missingness: {missing_pct:.1f}% of data is missing.")
        elif missing_pct > 5:
            issues.append(f"Moderate missingness: {missing_pct:.1f}% of data is missing.")
            
        # 2. Duplicates
        duplicate_count = df.duplicated().sum()
        duplicate_pct = (duplicate_count / total_rows) * 100
        
        if duplicate_pct > 10:
            issues.append(f"High duplicate rate: {duplicate_pct:.1f}% of rows are duplicates.")
            
        # 3. Outliers (Z-score > 3)
        outlier_cols = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            series = df[col].dropna()
            if len(series) > 10:
                mean = series.mean()
                std = series.std()
                if std > 0:
                    outliers = ((series - mean).abs() > 3 * std).sum()
                    if outliers / len(series) > 0.05:
                        outlier_cols.append(col)
        
        if outlier_cols:
            issues.append(f"High outlier presence in columns: {', '.join(outlier_cols[:3])}{' and others' if len(outlier_cols) > 3 else ''}.")
            
        # Score Calculation
        score = 100
        score -= missing_pct * 1.5
        score -= duplicate_pct * 2
        score -= len(outlier_cols) * 5
        
        score = max(0, min(100, score))
        
        return {
            "score": round(score, 1),
            "missing_pct": round(missing_pct, 1),
            "duplicate_pct": round(duplicate_pct, 1),
            "issues": issues
        }
