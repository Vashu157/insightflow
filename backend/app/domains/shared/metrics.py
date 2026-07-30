from prometheus_client import Counter, Histogram, Gauge

# HTTP Request Metrics
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total number of HTTP requests processed",
    ["method", "endpoint", "status_code"]
)

HTTP_LATENCY_SECONDS = Histogram(
    "http_latency_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
)

# WebSocket Metrics
ACTIVE_WEBSOCKET_CONNECTIONS = Gauge(
    "active_websocket_connections",
    "Current active WebSocket connections count"
)

# Kafka & Worker Metrics
KAFKA_MESSAGES_PROCESSED_TOTAL = Counter(
    "kafka_messages_processed_total",
    "Total messages processed by Kafka consumers",
    ["topic", "status"]
)

KAFKA_PROCESSING_DURATION_SECONDS = Histogram(
    "kafka_processing_duration_seconds",
    "Kafka message processing duration in seconds",
    ["topic"],
    buckets=(0.1, 0.5, 1.0, 5.0, 10.0, 30.0, 60.0, 120.0)
)

KAFKA_CONSUMER_LAG = Gauge(
    "kafka_consumer_lag",
    "Kafka consumer lag count",
    ["topic", "group_id"]
)

# Job & Business Metrics
JOB_DURATION_SECONDS = Histogram(
    "job_duration_seconds",
    "Total execution time of long-running background jobs",
    ["job_type", "status"],
    buckets=(0.5, 1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0)
)

FAILED_JOBS_TOTAL = Counter(
    "failed_jobs_total",
    "Total count of failed background jobs",
    ["job_type"]
)

RETRY_COUNT_TOTAL = Counter(
    "retry_count_total",
    "Total count of retried background jobs",
    ["job_type"]
)

# External Service & Gemini API Metrics
GEMINI_API_DURATION_SECONDS = Histogram(
    "gemini_api_duration_seconds",
    "Gemini API invocation latency in seconds",
    ["operation", "status"],
    buckets=(0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 20.0, 30.0)
)

CIRCUIT_BREAKER_STATE = Gauge(
    "circuit_breaker_state",
    "State of circuit breaker (0=Closed, 1=Half-Open, 2=Open)",
    ["service_name"]
)
