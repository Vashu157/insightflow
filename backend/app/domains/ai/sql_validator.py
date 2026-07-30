import re
from fastapi import HTTPException

class SQLValidator:
    """
    Ensures that the generated SQL is safe, read-only, and does not attempt 
    to interact with the host system or external databases.
    """
    
    # List of strictly forbidden SQL keywords (case-insensitive)
    FORBIDDEN_KEYWORDS = [
        r'\bINSERT\b', r'\bUPDATE\b', r'\bDELETE\b', r'\bDROP\b', 
        r'\bALTER\b', r'\bTRUNCATE\b', r'\bEXEC\b', r'\bEXECUTE\b',
        r'\bCREATE\b', r'\bREPLACE\b', r'\bGRANT\b', r'\bREVOKE\b',
        r'\bATTACH\b', r'\bDETACH\b', r'\bPRAGMA\b', r'\bCOPY\b',
        r'\bCALL\b', r'\bMERGE\b', r'\bLOAD\b', r'\bINSTALL\b',
        # Prevent accessing other duckdb functions that can read/write files
        r'\bread_csv\b', r'\bread_parquet\b', r'\bwrite_csv\b', r'\bwrite_parquet\b'
    ]
    
    # Only allow single statements (no semicolons separating statements)
    # We strip trailing whitespace and a single trailing semicolon first.
    
    @classmethod
    def validate(cls, sql: str) -> str:
        if not sql:
            raise HTTPException(status_code=400, detail="Generated SQL is empty.")
            
        sql_clean = sql.strip()
        
        # Remove markdown formatting if the model accidentally included it
        if sql_clean.startswith("```sql"):
            sql_clean = sql_clean[6:]
        if sql_clean.startswith("```"):
            sql_clean = sql_clean[3:]
        if sql_clean.endswith("```"):
            sql_clean = sql_clean[:-3]
            
        sql_clean = sql_clean.strip()
        
        # Remove a single trailing semicolon if it exists
        if sql_clean.endswith(";"):
            sql_clean = sql_clean[:-1].strip()
            
        # Prevent multiple statements
        if ";" in sql_clean:
            raise HTTPException(status_code=400, detail="Multiple SQL statements are not allowed for security reasons.")
            
        # Ensure it's a SELECT statement
        if not sql_clean.upper().startswith("SELECT") and not sql_clean.upper().startswith("WITH"):
            raise HTTPException(status_code=400, detail="Only SELECT statements are allowed.")
            
        # Check for forbidden keywords
        for pattern in cls.FORBIDDEN_KEYWORDS:
            if re.search(pattern, sql_clean, re.IGNORECASE):
                raise HTTPException(status_code=400, detail=f"Forbidden SQL keyword detected. Query rejected.")
                
        # To run query in DuckDB against a pandas DataFrame named 'df', the FROM clause must reference 'df'
        # The AI is instructed to query 'df', but we do a soft check here.
        if "from df" not in sql_clean.lower() and "from \"df\"" not in sql_clean.lower():
             pass # We don't hard fail here because it could be a CTE that uses FROM df later, but we rely on DuckDB sandboxing
             
        return sql_clean
