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

1.  **App Mounts:** The React application starts.
2.  **Fetch Repositories:** The `useEffect` hook in `App.tsx` calls Supabase to retrieve the list of repositories.
3.  **Display Sidebar:** The `Sidebar` component renders the list of repositories.

### 2. User Interaction

1.  **Select Repository:** User selects a repository from the `Sidebar`.
2.  **Select Date Range:** User selects a date range from the dropdown.
3.  **Enter GitHub Username:** User enters a GitHub username in the input field.
4.  **Click Search:** User clicks the "Search" button.
5.  **Apply Custom Dates:** If "Custom Range" is selected, the user picks start and end dates and clicks "Apply".
6.  **Add Repository:** User enters a new repository name and clicks "Run".

### 3. Data Fetching and Filtering

1.  **Trigger Data Fetch:** Selecting a repository, clicking "Search", or applying custom dates sets `shouldFetchData` to `true`.
2.  **`useGitHubActivity` Hook:** This hook is triggered when `shouldFetchData` changes.
3.  **Construct Supabase Queries:** The hook constructs Supabase queries based on:
    *   Selected repository (`selectedRepo`)
    *   Date range (`dateRange`, `startDate`, `endDate`)
    *   GitHub username (`searchUsername`)
4.  **Fetch Data:** The hook fetches commits, pull requests, issues, and reviews from Supabase.

### 4. Data Processing and Rendering

1.  **Process Data:** The fetched data is transformed into a unified `activities` array.
2.  **Render Statistics:** The `StatsCard` components display summary statistics (total commits, PRs, issues).
3.  **Render Chart:** The `ActivityChart` component visualizes activity data over time.
4.  **Render User Stats:** The `UserActivityStats` component displays user-specific statistics.
5.  **Render Activity Table:** The `ActivityTable` component displays a detailed table of activities.

### 5. Adding a New Repository

1.  **User Input:** User enters a new repository name in the input field.
2.  **Click Run:** User clicks the "Run" button.
3.  **Send API Request:** The frontend sends a POST request to the `/api/addRepo` endpoint with the repository name.
4.  **Backend Processing:**
    - The Node.js backend validates the repository name.
    - It appends the repository name to the `config.properties` file.
    - It executes the `github_activity.py` script.
5.  **Node Script:** The Node js script fetches activity data from the GitHub API and stores it in Supabase.
6.  **Response:** The backend sends a success or error message back to the frontend.

### 6. Key Components

*   **App.tsx:** Main component that manages state, renders the UI, and orchestrates data fetching.
*   **Sidebar.tsx:** Displays the list of repositories and handles repository selection.
*   **StatsCard.tsx:** Displays summary statistics.
*   **ActivityChart.tsx:** Visualizes activity data over time.
*   **UserActivityStats.tsx:** Displays user-specific activity statistics.
*   **ActivityTable.tsx:** Displays a detailed table of activities.
*   **useGitHubActivity (lib/hooks.ts):** Custom hook that fetches and filters activity data from Supabase.
*   **supabase (lib/supabase.ts):** Supabase client for interacting with the database.
*   **api/index.ts:** Node.js backend that provides the `/api/addRepo` endpoint.
*   **github_activity.py:** Python script that fetches data from the GitHub API and stores it in Supabase.

### 7. Technologies Used

*   React
*   Vite
*   Supabase
*   Node.js
*   Express.js
*   Chart.js
*   Lucide React
*   Tailwind CSS
