import pandas as pd
from typing import Dict, Any

class PromptBuilder:
    @staticmethod
    def build_sql_prompt(df: pd.DataFrame, question: str) -> str:
        """
        Creates a safe prompt containing metadata about the dataset, 
        instructing the AI to generate a DuckDB-compatible SQL query.
        """
        # Extract schema
        columns = df.columns.tolist()
        dtypes = {col: str(df[col].dtype) for col in columns}
        
        # Get a few safe sample values for context (avoiding entire dataframe dump)
        # Using .head(3) converted to dict
        samples = df.head(3).to_dict(orient="records")
        
        prompt = f"""
You are an expert Data Analyst and SQL Developer. Your task is to generate a SQL query to answer the user's question based on the provided dataset schema.

The dataset is currently loaded into a table named `df`.
You MUST write standard SQL that is compatible with DuckDB to query this table `df`.

DATASET SCHEMA:
Columns and Types:
{dtypes}

SAMPLE DATA (first 3 rows):
{samples}

RULES:
1. ONLY return the raw SQL query. Do not include markdown formatting (like ```sql).
2. The table name to query is EXACTLY `df`.
3. Do not attempt to query any other tables.
4. Only use SELECT statements. 
5. If the question cannot be answered with the available columns, return exactly: "ERROR: Insufficient data to answer this question."

USER QUESTION:
{question}

SQL QUERY:
"""
        return prompt

    @staticmethod
    def build_explanation_prompt(question: str, sql: str, results: Dict[str, Any]) -> str:
        """
        Creates a prompt asking the AI to interpret the results of the executed SQL.
        """
        prompt = f"""
You are an expert Data Analyst presenting findings to a business stakeholder.
A user asked a question about their dataset, we generated and ran a SQL query, and here are the results.

USER QUESTION: 
{question}

SQL EXECUTED:
{sql}

QUERY RESULTS (Max 50 rows shown):
{results}

Your task is to explain the results in plain English.
- Summarize the key findings in a clear, concise manner.
- Highlight the most important numbers or trends.
- Do NOT hallucinate data. Only reference numbers that appear in the QUERY RESULTS.
- Do NOT simply restate the SQL query. Focus on the business meaning.
- Format your response using Markdown (e.g., bullet points, bold text).

EXPLANATION:
"""
        return prompt
