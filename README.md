# InsightFlow

InsightFlow is a production-quality AI Product Analytics platform.

## Architecture
- **Frontend**: Next.js 16, TypeScript, App Router, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.12, SQLAlchemy, Alembic
- **Database**: PostgreSQL

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)
- Python 3.12 (for local backend development)

### Running with Docker
1. Copy `.env.example` to `.env` in both `frontend` and `backend` directories.
2. Run `docker-compose up -d --build` from the root directory.
3. Access the frontend at `http://localhost:3000` and backend API at `http://localhost:8000`.

### Local Development
See `frontend/README.md` and `backend/README.md` for specific instructions.
