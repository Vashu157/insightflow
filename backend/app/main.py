import asyncio
import json
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from prometheus_client import make_asgi_app
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

from app.core.config import settings, get_kafka_config
from app.core.cleanup import cleanup_expired_sessions
from app.domains.shared.logging import (
    logger, current_request_id, current_correlation_id
)
from app.domains.shared.metrics import HTTP_REQUESTS_TOTAL, HTTP_LATENCY_SECONDS

from app.domains.session.router import session_router, share_router
from app.domains.profiling.router import router as profiling_router
from app.domains.ai.router import router as ai_router
from app.domains.reports.router import router as reports_router
from app.domains.export.router import router as export_router
from app.domains.jobs.router import router as jobs_router
from app.domains.jobs.ws_router import ws_router
from app.domains.health.router import health_router
from app.domains.admin.router import admin_router

from app.domains.jobs.producer import producer_client
from app.domains.shared.websocket import manager
from app.worker import KafkaWorker
from aiokafka import AIOKafkaConsumer
import os


async def consume_job_updates():
    """Consume job.updates and broadcast to WebSockets.

    Resilient to Kafka connection drops (common on free-tier Aiven, which resets
    idle connections): reconnects with backoff instead of killing the process.
    A transient Kafka error must NEVER take down the API — doing so drops
    in-flight requests (e.g. uploads) as ERR_CONNECTION_CLOSED.
    """
    backoff = 1
    while True:
        group_id = f"insightflow-ws-gateway-{uuid.uuid4()}"
        consumer = AIOKafkaConsumer(
            "job.updates",
            group_id=group_id,
            auto_offset_reset="latest",
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            **get_kafka_config()
        )
        try:
            await consumer.start()
            logger.info(f"WebSocket Gateway Kafka Consumer started on topic 'job.updates' (Group: {group_id})")
            backoff = 1  # reset after a successful connection
            async for msg in consumer:
                event = msg.value
                session_id = event.get("session_id")
                if session_id:
                    await manager.broadcast_to_session(session_id, event)
        except asyncio.CancelledError:
            logger.info("WebSocket Gateway Kafka Consumer cancelled.")
            break
        except Exception as e:
            logger.error(f"WebSocket Gateway Kafka Consumer error: {e}. Reconnecting in {backoff}s.")
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 30)
        finally:
            try:
                await consumer.stop()
            except Exception:
                pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up...", extra={"extra_info": {"event": "startup"}})
    cleanup_task = asyncio.create_task(cleanup_expired_sessions())
    await producer_client.start()
    ws_consumer_task = asyncio.create_task(consume_job_updates())

    # Optional always-on embedded Kafka worker. Default OFF: on free tiers (512MB)
    # it holds extra Kafka SSL connections and adds memory pressure, and the
    # per-job in-process fallback (see jobs/inprocess.py) already guarantees
    # execution. Enable only if you want Kafka to be the primary execution path
    # inside the web process. A separate `python -m app.worker` service still works.
    embedded_worker = None
    embedded_worker_task = None
    if os.getenv("RUN_WORKER_IN_PROCESS", "false").lower() in ("1", "true", "yes"):
        embedded_worker = KafkaWorker()
        embedded_worker_task = asyncio.create_task(embedded_worker.run_embedded())
        logger.info("Embedded Kafka job worker started (RUN_WORKER_IN_PROCESS=true).")

    yield

    logger.info("Application shutting down...", extra={"extra_info": {"event": "shutdown"}})
    cleanup_task.cancel()
    ws_consumer_task.cancel()
    if embedded_worker is not None:
        embedded_worker.shutdown_event.set()
        if embedded_worker_task is not None:
            try:
                await asyncio.wait_for(embedded_worker_task, timeout=10)
            except asyncio.TimeoutError:
                embedded_worker_task.cancel()
    await producer_client.stop()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Request Context & Prometheus Metrics Middleware
@app.middleware("http")
async def log_and_measure_requests(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    corr_id = request.headers.get("X-Correlation-ID", req_id)

    current_request_id.set(req_id)
    current_correlation_id.set(corr_id)

    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    process_time_ms = duration * 1000.0

    response.headers["X-Request-ID"] = req_id
    response.headers["X-Correlation-ID"] = corr_id

    # Record Prometheus metrics
    endpoint = request.url.path
    HTTP_REQUESTS_TOTAL.labels(method=request.method, endpoint=endpoint, status_code=response.status_code).inc()
    HTTP_LATENCY_SECONDS.labels(method=request.method, endpoint=endpoint).observe(duration)

    logger.info(
        f"{request.method} {endpoint} completed in {process_time_ms:.2f}ms",
        extra={"extra_info": {
            "method": request.method,
            "path": endpoint,
            "status_code": response.status_code,
            "duration_ms": round(process_time_ms, 2)
        }}
    )

    current_request_id.set("")
    current_correlation_id.set("")
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add SlowAPIMiddleware for rate limiting
from slowapi.middleware import SlowAPIMiddleware
app.add_middleware(SlowAPIMiddleware)

# Mount Prometheus metrics app at /metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include Routers
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])

app.include_router(session_router, prefix="/sessions", tags=["sessions"])
app.include_router(share_router, prefix="/share", tags=["share"])
app.include_router(profiling_router, tags=["profiles"])
app.include_router(reports_router, tags=["analytics"])
app.include_router(ai_router, tags=["ai"])
app.include_router(export_router, tags=["exports"])
app.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
app.include_router(ws_router, prefix="/jobs", tags=["websockets"])
app.include_router(ws_router, prefix="/api/v1/jobs", tags=["websockets"])

@app.get("/")
def read_root():
    return {
        "status": "running",
        "service": "InsightFlow API"
    }
