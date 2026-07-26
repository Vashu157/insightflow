import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
import time

from app.core.config import settings
from app.routers import sessions, profiles, analytics, ai, insights, exports, share
from app.core.cleanup import cleanup_expired_sessions
from app.core.logging import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background cleanup task
    logger.info("Application starting up...", extra={"extra_info": {"event": "startup"}})
    cleanup_task = asyncio.create_task(cleanup_expired_sessions())
    yield
    # Shutdown: Cancel the cleanup task
    logger.info("Application shutting down...", extra={"extra_info": {"event": "shutdown"}})
    cleanup_task.cancel()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Request Timing & Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} completed in {process_time:.2f}ms",
        extra={"extra_info": {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(process_time, 2)
        }}
    )
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this to the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(profiles.router, tags=["profiles"])
app.include_router(analytics.router, tags=["analytics"])
app.include_router(ai.router, tags=["ai"])
app.include_router(insights.router, tags=["insights"])
app.include_router(exports.router, tags=["exports"])
app.include_router(share.router, tags=["share"])

@app.get("/")
def read_root():
    return {
        "status": "running",
        "service": "InsightFlow API"
    }
