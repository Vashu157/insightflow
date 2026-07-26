# InsightFlow 🚀

InsightFlow is an AI-powered Product Analytics Platform. It allows users to upload datasets (CSV, Excel), instantly profile them, query them using natural language via an AI Assistant, and generate comprehensive Executive Business Reports using an AI Business Analyst.

![Screenshot Placeholder](https://via.placeholder.com/1000x500?text=InsightFlow+Dashboard)

## Features 🌟
- **Session Management**: Temporary datasets tied to secure, auto-expiring sessions.
- **Data Profiling**: High-performance statistical profiling (missing values, distributions, unique counts).
- **Interactive Dashboards**: Draggable, resizable charting interface.
- **AI SQL Assistant**: Natural language to safe SQL (DuckDB) executed entirely locally.
- **AI Business Analyst**: Proactive executive reporting with insights, anomalies, and recommendations.
- **Shareable Reports**: Secure, read-only report generation for external stakeholders.
- **Data Exports**: Export datasets and AI results to CSV, Excel, or JSON.

---

## Architecture Diagram 🏗️

```mermaid
graph TD
    Client[Web Browser] -->|React/Next.js| Frontend[Frontend (Next.js 16)]
    Frontend -->|REST API| Backend[Backend (FastAPI)]
    
    sublayer_1[Storage & Compute]
    Backend -->|SQL Queries| DuckDB[(DuckDB - In-Memory)]
    Backend -->|Session Metadata| Postgres[(PostgreSQL)]
    Backend -->|File Storage| LocalDisk[Local File System]
    
    sublayer_2[External Services]
    Backend -->|Prompts| Gemini[Google Gemini AI]
```

---

## Technology Stack 💻
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts
- **Backend**: FastAPI (Python 3.12), SQLAlchemy, Alembic, DuckDB, Pandas, NumPy
- **Database**: PostgreSQL (Metadata), Local Disk (Dataset files/Caches)
- **AI**: Google Gemini Pro (Structured JSON Generation)

---

## Folder Structure 📂
```
.
├── backend/
│   ├── app/
│   │   ├── ai/          # Gemini AI services & Pydantic output schemas
│   │   ├── core/        # Config, Logging, Background Cleanup Jobs
│   │   ├── database/    # Postgres connection and models
│   │   ├── routers/     # API Endpoints (Sessions, Insights, Share, Export)
│   │   ├── schemas/     # Pydantic validation models
│   │   └── services/    # Business logic (Profiling, Session processing)
│   ├── uploads/         # Local dataset storage
│   └── tests/           # Pytest API tests
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js Routes (/datasets, /share)
│   │   ├── components/  # React Components (UI, Analyst, Assistant)
│   │   ├── hooks/       # React Query Data Fetching
│   │   └── lib/         # Utilities and Axios configuration
│   └── tests/           # Vitest and Playwright Tests
└── docker-compose.yml   # Local dev environment
```

---

## Environment Variables 🔐

### Backend (`backend/.env`)
```env
PROJECT_NAME="InsightFlow API"
DATABASE_URL="postgresql://user:password@db:5432/insightflow"
GEMINI_API_KEY="your-gemini-key"
SESSION_EXPIRY_MINUTES=60
LOG_LEVEL="INFO"
MAX_UPLOAD_SIZE_MB=50
```

### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

---

## Setup & Running Locally 🏃

### Docker Setup (Recommended)
The easiest way to run the entire stack locally is using Docker Compose.

1. Clone the repository.
2. Copy `.env.example` to `.env` in both the `frontend` and `backend` folders and populate the Gemini Key.
3. Run:
   ```bash
   docker-compose up -d --build
   ```
4. Access the frontend at `http://localhost:3000`.
5. Access the backend API docs at `http://localhost:8000/docs`.

### Local Setup (Without Docker)
1. **Database**: Ensure PostgreSQL is running and update `DATABASE_URL`.
2. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## Deployment Guide 🚀

### Deploying the Backend (Render / Fly.io / Railway)
1. Provision a managed **PostgreSQL** database (e.g., Neon or Supabase).
2. Create a new Web Service pointing to the `backend/` directory.
3. Ensure the Build Command is `pip install -r requirements.txt && alembic upgrade head`.
4. Ensure the Start Command is `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
5. Add all environment variables (including the production `DATABASE_URL`).
6. *Note*: Since the application uses local disk storage (`/uploads`), ensure your deployment provider supports a persistent disk volume, OR transition `LocalStorageService` to S3 for fully stateless deployment.

### Deploying the Frontend (Vercel)
1. Import the repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Set the Environment Variable: `NEXT_PUBLIC_API_URL` to your deployed backend URL.
4. Deploy!

---

## API Documentation 📚
Once the backend is running, fully interactive Swagger documentation is available at:
`http://localhost:8000/docs`

Key Routes:
- `POST /sessions/upload` - Upload a dataset.
- `GET /profiles/{session_id}` - Get dataset profile metadata.
- `POST /ai/query` - Ask a natural language question.
- `POST /sessions/{id}/share` - Generate a public share link.
- `GET /sessions/{id}/export/data` - Export filtered data.

---

## Future Improvements 🔮
- **S3 Storage**: Migrate from `LocalStorageService` to AWS S3 for truly stateless, infinitely scalable deployments.
- **Authentication**: Add Clerk or NextAuth for permanent user accounts and saved workspaces.
- **Advanced Predictive Models**: Integrate time-series forecasting via statsmodels or Prophet into the AI reports.
