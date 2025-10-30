## GitHub Activity Tracker – Local Development Guide

### Overview
This project tracks GitHub activity for a set of repositories, stores normalized data in PostgreSQL, and serves a React (Vite) UI for exploration. The backend is implemented as a Lambda-style Express app (no built-in `app.listen`), so you will either run it with a tiny local wrapper or via a Lambda emulator.

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL instance (local or remote)
- GitHub Personal Access Token(s) with public repo access (classic or fine-grained)

### Repository Layout
- `backend/` – Lambda-style Node.js service exposing REST endpoints under `/api/*`, ingesting GitHub data into Postgres
- `frontend/` – React + Vite application consuming the backend API

### 1) Backend Setup
1. Copy `backend/.env.example` to `backend/.env` if you have one, or create `backend/.env` with at least:
   - `RDS_HOST=<your-postgres-host>`
   - `RDS_PORT=<your-postgres-port>` (e.g. 5432)
   - `RDS_DATABASE=<your-database-name>`
   - `RDS_USER=<your-db-user>`
   - `RDS_PASSWORD=<your-db-password>`
   - `GITHUB_TOKEN_1=<your-token-1>`
   - (optional) `GITHUB_TOKEN_2..GITHUB_TOKEN_5` for automatic rate-limit rotation
   - (optional) `INGEST_CONCURRENCY=2`, `INGEST_RETRIES=5`, `INGEST_MAX_REPOS=0`

2. Ensure `backend/config.properties` contains repositories to ingest in `owner/repo=owner/repo` format. Example lines exist already.

3. Install dependencies:
   - Open a terminal in `backend/`
   - Run: `npm install`

4. Run the backend locally (choose one):
   - Option A – Minimal local wrapper (recommended): Create a file `backend/local-server.js` with the following content:
     ```js
     // backend/local-server.js
     const awsServerlessExpress = require('aws-serverless-express');
     const { handler } = require('./github_activity');

     // Emulate Lambda by using aws-serverless-express's server instance
     // and dispatching incoming HTTP requests through the handler.
     const http = require('http');
     const port = process.env.PORT || 3000;

     const server = http.createServer((req, res) => {
       const event = {
         httpMethod: req.method,
         headers: req.headers,
         path: req.url,
         rawPath: req.url,
         body: '',
         isBase64Encoded: false
       };
       const context = {};
       handler(event, context).then(response => {
         res.writeHead(response.statusCode || 200, response.headers || {});
         res.end(response.body || '');
       }).catch(err => {
         res.writeHead(500, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ error: err?.message || 'Server error' }));
       });
     });

     server.listen(port, () => {
       console.log(`Backend listening on http://localhost:${port}`);
     });
     ```
     Then run: `node local-server.js`
   - Option B – Lambda emulator: Use AWS SAM CLI or Serverless Framework to map `github_activity.handler` to a local port (e.g., 3000).
The backend exposes:
- `GET /api/repositories`
- `GET /api/repository/:id`
- `GET /api/users`
- `GET /api/activity`
- `GET /api/stats/:repositoryId`
- `POST /api/addRepo` (body: `{ repoName: "owner/repo" }`)
### 2) Frontend Setup
1. Configure API base URL for the UI:
   - Create `frontend/.env` with:
     ```
     VITE_API_BASE_URL=http://localhost:3000
     ```
2. Install and run:
   - Open a terminal in `frontend/`
   - `npm install`
   - `npm run dev`
   - Open `http://localhost:5173`

### 3) Ingesting/Refreshing Data
- On backend start, it initializes schema and can ingest for repos from `config.properties`.
- To add a repo via UI backend: `POST http://localhost:3000/api/addRepo` with `{ repoName: "owner/repo" }`.

### Troubleshooting
- Connection errors at startup: verify `RDS_*` variables and database reachability (SSL is enabled by default).
- Rate limits: add more `GITHUB_TOKEN_*` tokens to rotate automatically.
- CORS: backend sets permissive headers; ensure `VITE_API_BASE_URL` matches your backend port.

---

## Workflow Design

### 1. Initial Load
	@@ -64,6 +167,7 @@
*   Vite
*   Supabase
*   Node.js
*   Express.js
*   Chart.js
*   Lucide React
*   Tailwind CSS