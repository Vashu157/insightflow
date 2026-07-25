FROM python:3.12-slim

WORKDIR /app

# System dependencies removed to avoid network issues. psycopg2-binary will use precompiled wheels.

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


