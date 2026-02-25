## GitHub Activity Tracker – Local Development Guide

### Overview
This project tracks GitHub activity for a set of repositories, stores normalized data in PostgreSQL, and serves a React (Vite) UI for exploration. The backend is a standard Express.js API that syncs repositories, commits, pull requests, and PR reviews from GitHub into the database.

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL instance (local or remote)
- GitHub Personal Access Token with `repo` scope (classic or fine-grained with repository access)

### Repository Layout
- `backend/` – Node.js Express service exposing admin sync endpoints and using PostgreSQL
- `frontend/` – React + Vite application consuming the backend API

---

### 1) Backend Setup

1. **Environment variables**  
   Copy `backend/.env.example` to `backend/.env` and set:
   - `RDS_HOST` – PostgreSQL host
   - `RDS_PORT` – e.g. `5432`
   - `RDS_DATABASE` – Database name
   - `RDS_USER` – Database user
   - `RDS_PASSWORD` – Database password
   - `GITHUB_TOKEN` – GitHub Personal Access Token

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Run database migrations** (required before first run and after pulling new migrations)
   ```bash
   npm run migrate
   ```
   Uses `RDS_*` from `.env`. Run once per environment (local, staging, production).

4. **Start the backend**
   ```bash
   npm start
   ```
   Server runs at `http://localhost:3000` (or `PORT` from env).

#### Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info and list of endpoints |
| POST | `/admin/sync/repos` | Sync repositories for a GitHub organization. Body: `{ "org": "owner" }` |
| POST | `/admin/sync/commits` | Sync commits for all repositories in the database |
| POST | `/admin/sync/prs` | Sync pull requests for all repositories in the database |
| POST | `/admin/sync/reviews` | Sync PR reviews for all repositories in the database |

**Sync order:** Run repos first (to populate the DB), then commits, PRs, and reviews as needed.

---

### 2) Frontend Setup

1. **API base URL**  
   Create `frontend/.env` (or copy from `frontend/.env.example`):
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```

2. **Install and run**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`.

---

### 3) Ingesting / Refreshing Data

1. **Repositories** – Sync repos for an organization:
   ```bash
   curl -X POST http://localhost:3000/admin/sync/repos -H "Content-Type: application/json" -d "{\"org\": \"mosip\"}"
   ```
2. **Commits, PRs, reviews** – Call the corresponding endpoints; they process all repos already in the database:
   - `POST /admin/sync/commits`
   - `POST /admin/sync/prs`
   - `POST /admin/sync/reviews`

Optional: `backend/config.properties` can list `owner/repo=owner/repo` entries for reference; the app syncs repos by organization via the API.

---

### 4) Database Migrations

- Migrations live in `backend/migrations/`. Run them in every environment (local, staging, production) before using the app or after pulling new migration files.
- **Command** (from `backend/`):
  ```bash
  npm run migrate
  ```
- The script uses `RDS_HOST`, `RDS_PORT`, `RDS_DATABASE`, `RDS_USER`, and `RDS_PASSWORD` from `.env` (or from the environment in production).

---

### 5) Troubleshooting

- **Connection errors** – Check `RDS_*` variables and that the database is reachable (and SSL if required).
- **GitHub rate limits** – Use a token with sufficient rate limit; avoid running all syncs in quick succession.
- **CORS** – Backend allows cross-origin requests; ensure `VITE_API_BASE_URL` in the frontend matches your backend URL and port.

---

### Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Chart.js, Lucide React
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (e.g. Supabase or any Postgres instance)
