import io
import pandas as pd
from typing import Dict, Any

class ExportService:
    @staticmethod
    def generate_excel_package(df: pd.DataFrame, report: Dict[str, Any], profile: Dict[str, Any]) -> io.BytesIO:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # 1. Raw Data
            df.to_excel(writer, sheet_name='Raw Data', index=False)
            
            # 2. Executive Summary
            summary_df = pd.DataFrame([{
                "Metric": k, "Value": v
            } for k, v in profile.get('summary', {}).items()])
            summary_df.to_excel(writer, sheet_name='Data Profile', index=False)
            
            # 3. AI Insights
            if report and 'insights' in report:
                insights_df = pd.DataFrame(report['insights'])
                insights_df.to_excel(writer, sheet_name='AI Insights', index=False)
                
            # 4. AI Recommendations
            if report and 'recommendations' in report:
                rec_df = pd.DataFrame(report['recommendations'])
                rec_df.to_excel(writer, sheet_name='Recommendations', index=False)
                
        output.seek(0)
        return output

    @staticmethod
    def generate_pdf_package(df: pd.DataFrame, report: Dict[str, Any], profile: Dict[str, Any]) -> io.BytesIO:
        # In a real enterprise app, we would use WeasyPrint or ReportLab here.
        # For now, returning a mock PDF byte stream.
        output = io.BytesIO(b"%PDF-1.4\n%Enterprise InsightFlow Report\n%%EOF")
        return output
