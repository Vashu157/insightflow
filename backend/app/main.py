import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import sessions, profiles, analytics, ai, insights
from app.core.cleanup import cleanup_expired_sessions

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background cleanup task
    cleanup_task = asyncio.create_task(cleanup_expired_sessions())
    yield
    # Shutdown: Cancel the cleanup task
    cleanup_task.cancel()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

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

@app.get("/")
def read_root():
    return {
        "status": "running",
        "service": "InsightFlow API"
    }
