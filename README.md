# University Data Integration System (University DataHub)

A modern, unified **Student Lifecycle & Academic Analytics** platform structured with a strictly separated **Next.js Frontend** and **Express.js Backend**, prepared for **PostgreSQL**.

## Project Architecture

```text
EducationUniversitySystems/
├── frontend/          # Next.js 14 + TypeScript + Tailwind CSS + Recharts + Lucide React
│   ├── app/           # App Router pages (dashboard, students, lifecycle, data-sources, integration, analytics, alumni, reports, notifications, settings)
│   ├── components/    # Modular UI (layout, dashboard, students, lifecycle, integration, analytics, alumni, ui)
│   ├── data/          # Separated realistic mock data (mock-data.ts)
│   ├── lib/           # REST API client (api.ts) & formatting helpers (utils.ts)
│   ├── types/         # Shared frontend TypeScript models (index.ts)
│   └── .env.example   # Frontend environment configuration template
│
├── backend/           # Node.js + Express.js + TypeScript REST API foundation
│   ├── src/
│   │   ├── config/        # Environment & PostgreSQL pool setup (database.ts)
│   │   ├── controllers/   # Request handlers (student, analytics, alumni, integration)
│   │   ├── services/      # Business logic layer ready for PostgreSQL queries
│   │   ├── routes/        # Modular Express REST endpoints (/api/*)
│   │   ├── middleware/    # Logger, auth foundation, and centralized error handling
│   │   ├── models/        # Domain models & PostgreSQL DDL schema (schema.sql)
│   │   ├── app.ts         # Express app configuration
│   │   └── server.ts      # Server entry point
│   └── .env.example   # Backend environment configuration template
│
└── README.md
```

## Running Independently

### 1. Frontend (`/frontend`)

```bash
cd frontend
npm install
npm run dev
```

Configure `frontend/.env.local` using `NEXT_PUBLIC_API_URL` when connecting to the live Express API.

### 2. Backend (`/backend`)

```bash
cd backend
npm install
npm run dev
```

Copy `backend/.env.example` to `backend/.env` to configure `PORT`, `CORS_ORIGIN`, and future PostgreSQL database credentials (`DB_ENABLED`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
