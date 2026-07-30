import uuid
from typing import List
from app.domains.reports.schemas import ChartConfig, DashboardSummary

class RecommendationEngine:
    @staticmethod
    def suggest_visualizations(summary: DashboardSummary) -> List[ChartConfig]:
        suggestions = []
        
        # Suggest a bar chart for categorical vs numeric
        if summary.categorical_columns and summary.numeric_columns:
            cat_col = summary.categorical_columns[0]
            num_col = summary.numeric_columns[0]
            
            suggestions.append(ChartConfig(
                id=str(uuid.uuid4()),
                title=f"Total {num_col} by {cat_col}",
                chart_type="Bar",
                x_column=cat_col,
                y_column=num_col,
                aggregation="sum",
                w=6, h=4
            ))
            
            # Suggest a pie chart for categorical count
            suggestions.append(ChartConfig(
                id=str(uuid.uuid4()),
                title=f"Distribution of {cat_col}",
                chart_type="Pie",
                x_column=cat_col,
                aggregation="count",
                w=4, h=4
            ))
            
        # Suggest a line chart for datetime vs numeric
        if summary.datetime_columns and summary.numeric_columns:
            dt_col = summary.datetime_columns[0]
            num_col = summary.numeric_columns[0]
            
            suggestions.append(ChartConfig(
                id=str(uuid.uuid4()),
                title=f"{num_col} over Time ({dt_col})",
                chart_type="Line",
                x_column=dt_col,
                y_column=num_col,
                aggregation="average",
                w=8, h=4
            ))
            
        # Suggest a scatter plot for two numerics
        if len(summary.numeric_columns) >= 2:
            num1 = summary.numeric_columns[0]
            num2 = summary.numeric_columns[1]
            
            suggestions.append(ChartConfig(
                id=str(uuid.uuid4()),
                title=f"{num1} vs {num2}",
                chart_type="Scatter",
                x_column=num1,
                y_column=num2,
                w=6, h=4
            ))
            
        return suggestions
