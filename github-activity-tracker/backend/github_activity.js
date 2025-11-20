const express = require('express');
const awsServerlessExpress = require('aws-serverless-express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { DateTime } = require('luxon');
const axios = require('axios');

const nowIso = () => new Date().toISOString();

// Load environment variables
dotenv.config();

// GitHub API Token Manager
// const GitHubTokenManager = require('./GitHubTokenManager');
// const tokenManager = new GitHubTokenManager();

// RDS configuration
const RDS_HOST = process.env.RDS_HOST;
const RDS_PORT = process.env.RDS_PORT;
const RDS_DATABASE = process.env.RDS_DATABASE;
const RDS_USER = process.env.RDS_USER;
const RDS_PASSWORD = process.env.RDS_PASSWORD;
if (!RDS_HOST || !RDS_PORT || !RDS_DATABASE || !RDS_USER || !RDS_PASSWORD) {
  throw new Error("RDS credentials are missing.");
}

console.log(`Using RDS Host: ${RDS_HOST}`);
console.log("RDS credentials are configured");

// Initialize PG Pool
const pool = new Pool({
  host: RDS_HOST,
  port: RDS_PORT,
  database: RDS_DATABASE,
  user: RDS_USER,
  password: RDS_PASSWORD,
  ssl: { rejectUnauthorized: false } // Required for AWS RDS
});

// Test database connection
pool.connect()
  .then(client => {
    console.log("Successfully connected to database");
    client.release();
  })
  .catch(err => {
    console.error("Error connecting to database:", err);
  });

// Initialize Express app
const app = express();
app.use(express.json());

// Adding CORS middleware to handle requests from the specific frontend origin
// CORS (Express owns CORS)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Registered routes:`, app._router.stack
    .filter(r => r.route)
    .map(r => `${r.route.path} (${Object.keys(r.route.methods).join(',')})`));
  console.log(`[${new Date().toISOString()}] Received ${req.method} request to ${req.url}, originalUrl: ${req.originalUrl}, origin: ${req.headers.origin || '(no origin)'}`);

  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Initialize database schema
async function initializeSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS repositories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS commits (
        id SERIAL PRIMARY KEY,
        repository_id INTEGER REFERENCES repositories(id),
        message TEXT,
        author TEXT,
        committed_at TIMESTAMP,
        branch TEXT,
        created_at TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS pull_requests (
        id SERIAL PRIMARY KEY,
        repository_id INTEGER REFERENCES repositories(id),
        title TEXT,
        author TEXT,
        created_at TIMESTAMP,
        state TEXT,
        number INTEGER,
        created_at_internal TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        repository_id INTEGER REFERENCES repositories(id),
        title TEXT,
        author TEXT,
        created_at TIMESTAMP,
        number INTEGER
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        repository_id INTEGER REFERENCES repositories(id),
        comment TEXT,
        author TEXT,
        created_at TIMESTAMP,
        review_id TEXT UNIQUE,
        pr_number INTEGER
      );
    `);
    console.log("Database schema initialized");
  } catch (error) {
    console.error("Error initializing schema:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

// GitHub API Headers - now using token manager
// const getHeaders = () => tokenManager.getHeaders();
const getHeaders = {
      "Accept": "application/vnd.github+json",
      "User-Agent": "github-activity-tracker/1.0",
      "X-GitHub-Api-Version": "2022-11-28",
      "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`
    }

const GRAPHQL_URL = "https://api.github.com/graphql";

// Format date function
function formatDate(dateStr) {
  try {
    if (!dateStr) {
      return DateTime.now().toUTC().toISO({ suppressMilliseconds: true });
    }
    const cleanDate = dateStr.replace('Z', '+00:00');
    const parsedDate = DateTime.fromISO(cleanDate);
    return parsedDate.toUTC().toISO({ suppressMilliseconds: true });
  } catch (error) {
    return DateTime.now().toUTC().toISO({ suppressMilliseconds: true });
  }
}

// Load repositories from config file
function loadRepositories() {
  const configFile = "config.properties";
  if (!fs.existsSync(configFile)) {
    throw new Error("config.properties not found!");
  }
  const configContent = fs.readFileSync(configFile, 'utf8');
  return configContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes('='))
    .map(line => line.split('=')[0]);
}

// Get latest date
async function getLatestDate(tableName, repoId, dateField) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT ${dateField}
       FROM ${tableName}
       WHERE repository_id = $1
       ORDER BY ${dateField} DESC
       LIMIT 1`,
      [repoId]
    );
    if (result.rows.length > 0 && result.rows[0][dateField]) {
      console.log(`Latest ${tableName} date for repo_id ${repoId}: ${result.rows[0][dateField]}`);
      return new Date(result.rows[0][dateField]);
    }
    console.log(`No ${tableName} data for repo_id ${repoId}, using 30 days ago`);
    return DateTime.now().minus({ days: 30 }).toJSDate();
  } finally {
    client.release();
  }
}


// async function handleRateLimit() {
//   return await tokenManager.handleRateLimit();
// }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Get or create repository
async function getOrCreateRepository(repoName) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, name, created_at FROM repositories WHERE name = $1",
      [repoName]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    const insertResult = await client.query(
      "INSERT INTO repositories (name, created_at) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id, name, created_at",
      [repoName]
    );
    return insertResult.rows[0];
  } finally {
    client.release();
  }
}

// Delete old data
async function deleteOldData(repoId) {
  const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toJSDate();
  const client = await pool.connect();
  try {
    await client.query(
      "DELETE FROM commits WHERE repository_id = $1 AND committed_at < $2",
      [repoId, thirtyDaysAgo]
    );
    console.log(`Deleted old commits for repo_id: ${repoId}`);
    await client.query(
      "DELETE FROM pull_requests WHERE repository_id = $1 AND created_at < $2",
      [repoId, thirtyDaysAgo]
    );
    console.log(`Deleted old PRs for repo_id: ${repoId}`);
    await client.query(
      "DELETE FROM issues WHERE repository_id = $1 AND created_at < $2",
      [repoId, thirtyDaysAgo]
    );
    console.log(`Deleted old issues for repo_id: ${repoId}`);
    await client.query(
      "DELETE FROM reviews WHERE repository_id = $1 AND created_at < $2",
      [repoId, thirtyDaysAgo]
    );
    console.log(`Deleted old reviews for repo_id: ${repoId}`);
  } finally {
    client.release();
  }
}

// Clean duplicates
async function cleanDuplicateCommits(repoId) {
  console.log(`Cleaning duplicate commits for repo_id: ${repoId}`);
  const client = await pool.connect();
  try {
    await client.query(`
      DELETE FROM commits
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM commits
        WHERE repository_id = $1
        GROUP BY repository_id, message, author, committed_at, branch
      ) AND repository_id = $1
    `, [repoId]);
    console.log(`Cleaned duplicate commits for repo_id: ${repoId}`);
  } catch (error) {
    console.error(`Error cleaning duplicate commits: ${error.message}`);
  } finally {
    client.release();
  }
}

async function cleanDuplicateReviews(repoId) {
  console.log(`Cleaning duplicate reviews for repo_id: ${repoId}`);
  const client = await pool.connect();
  try {
    await client.query(`
      DELETE FROM reviews
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM reviews
        WHERE repository_id = $1
        GROUP BY repository_id, review_id, author, pr_number
      ) AND repository_id = $1
    `, [repoId]);
    console.log(`Cleaned duplicate reviews for repo_id: ${repoId}`);
  } catch (error) {
    console.error(`Error cleaning duplicate reviews: ${error.message}`);
  } finally {
    client.release();
  }
}

async function cleanDuplicatePRs(repoId) {
  console.log(`Cleaning duplicate PRs for repo_id: ${repoId}`);
  const client = await pool.connect();
  try {
    await client.query(`
      DELETE FROM pull_requests
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM pull_requests
        WHERE repository_id = $1
        GROUP BY repository_id, number
      ) AND repository_id = $1
    `, [repoId]);
    console.log(`Cleaned duplicate PRs for repo_id: ${repoId}`);
  } catch (error) {
    console.error(`Error cleaning duplicate PRs: ${error.message}`);
  } finally {
    client.release();
  }
}

async function getLatestTimestamps(repoId) {
  const [commitAt, prAt, issueAt, reviewAt] = await Promise.all([
    getLatestDate("commits", repoId, "committed_at"),
    getLatestDate("pull_requests", repoId, "created_at"),
    getLatestDate("issues", repoId, "created_at"),
    getLatestDate("reviews", repoId, "created_at"),
  ]);
  return { commitAt, prAt, issueAt, reviewAt };
}

async function insertCommits(repoId, commitData) {
  if (!commitData.length) return 0;
  const client = await pool.connect();
  try {
    const existing = await client.query(
      `SELECT repository_id, message, author, committed_at, branch
       FROM commits WHERE repository_id = $1`,
      [repoId]
    );
    const seen = new Set(
      existing.rows.map(
        c => `${c.repository_id}|${c.message}|${c.author}|${c.committed_at}|${c.branch}`
      )
    );

    const fresh = commitData.filter(c => {
      const k = `${c.repository_id}|${c.message}|${c.author}|${c.committed_at}|${c.branch}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (!fresh.length) return 0;

    try {
      await client.query(
        `INSERT INTO commits (repository_id, message, author, committed_at, branch, created_at)
         SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::timestamp[], $5::text[], $6::timestamp[])`,
        [
          fresh.map(x => x.repository_id),
          fresh.map(x => x.message),
          fresh.map(x => x.author),
          fresh.map(x => x.committed_at),
          fresh.map(x => x.branch),
          fresh.map(x => x.created_at),
        ]
      );
      return fresh.length;
    } catch (e) {
      // fallback row-by-row
      let ok = 0;
      for (const c of fresh) {
        try {
          await client.query(
            `INSERT INTO commits (repository_id, message, author, committed_at, branch, created_at)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [c.repository_id, c.message, c.author, c.committed_at, c.branch, c.created_at]
          );
          ok++;
        } catch {}
      }
      return ok;
    }
  } finally {
    client.release();
  }
}

async function insertPRs(repoId, prRows) {
  if (!prRows.length) return 0;
  const client = await pool.connect();
  try {
    const exist = await client.query(
      `SELECT number FROM pull_requests WHERE repository_id = $1 AND number = ANY($2)`,
      [repoId, prRows.map(p => p.number)]
    );
    const existingNums = new Set(exist.rows.map(r => r.number));
    const fresh = prRows.filter(p => !existingNums.has(p.number));
    if (!fresh.length) return 0;

    try {
      await client.query(
        `INSERT INTO pull_requests (repository_id, title, author, created_at, state, number, created_at_internal)
         SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::timestamp[], $5::text[], $6::int[], $7::timestamp[])`,
        [
          fresh.map(p => p.repository_id),
          fresh.map(p => p.title),
          fresh.map(p => p.author),
          fresh.map(p => p.created_at),
          fresh.map(p => p.state),
          fresh.map(p => p.number),
          fresh.map(p => p.created_at_internal),
        ]
      );
      return fresh.length;
    } catch (e) {
      let ok = 0;
      for (const p of fresh) {
        try {
          await client.query(
            `INSERT INTO pull_requests (repository_id, title, author, created_at, state, number, created_at_internal)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [p.repository_id, p.title, p.author, p.created_at, p.state, p.number, p.created_at_internal]
          );
          ok++;
        } catch {}
      }
      return ok;
    }
  } finally {
    client.release();
  }
}

async function insertIssues(repoId, issueRows) {
  if (!issueRows.length) return 0;
  const client = await pool.connect();
  try {
    const exist = await client.query(
      `SELECT number FROM issues WHERE repository_id = $1 AND number = ANY($2)`,
      [repoId, issueRows.map(i => i.number)]
    );
    const existing = new Set(exist.rows.map(r => r.number));
    const fresh = issueRows.filter(i => !existing.has(i.number));
    if (!fresh.length) return 0;

    try {
      await client.query(
        `INSERT INTO issues (repository_id, title, author, created_at, number)
         SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::timestamp[], $5::int[])`,
        [
          fresh.map(i => i.repository_id),
          fresh.map(i => i.title),
          fresh.map(i => i.author),
          fresh.map(i => i.created_at),
          fresh.map(i => i.number),
        ]
      );
      return fresh.length;
    } catch (e) {
      let ok = 0;
      for (const i of fresh) {
        try {
          await client.query(
            `INSERT INTO issues (repository_id, title, author, created_at, number)
             VALUES ($1,$2,$3,$4,$5)`,
            [i.repository_id, i.title, i.author, i.created_at, i.number]
          );
          ok++;
        } catch {}
      }
      return ok;
    }
  } finally {
    client.release();
  }
}

async function insertReviewsBatched(rows, batchSize = 20) {
  if (!rows.length) return 0;
  const client = await pool.connect();
  let total = 0;
  try {
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      try {
        await client.query(
          `INSERT INTO reviews (repository_id, comment, author, created_at, review_id, pr_number)
           SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::timestamp[], $5::text[], $6::int[])
           ON CONFLICT (review_id) DO NOTHING`,
          [
            batch.map(r => r.repository_id),
            batch.map(r => r.comment),
            batch.map(r => r.author),
            batch.map(r => r.created_at),
            batch.map(r => r.review_id),
            batch.map(r => r.pr_number),
          ]
        );
        total += batch.length;
      } catch (e) {
        // fallback per-row
        for (const r of batch) {
          try {
            await client.query(
              `INSERT INTO reviews (repository_id, comment, author, created_at, review_id, pr_number)
               VALUES ($1,$2,$3,$4,$5,$6)
               ON CONFLICT (review_id) DO NOTHING`,
              [r.repository_id, r.comment, r.author, r.created_at, r.review_id, r.pr_number]
            );
            total++;
          } catch {}
        }
      }
    }
    return total;
  } finally {
    client.release();
  }
}

async function queryGraphQL(query, variables = {}) {
  const t0 = Date.now();
  console.log(`[${nowIso()}] GraphQL query: ${query.slice(0, 100)}...`, variables);

  try {
    const response = await axios.post(
      GRAPHQL_URL,
      { query, variables },
      { headers: getHeaders }
    );

    const remaining = response.headers["x-ratelimit-remaining"] ?? "N/A";
    const resetTime = parseInt(response.headers["x-ratelimit-reset"] || "0", 10);
    console.log(`[${nowIso()}] GraphQL rate limit: ${remaining}, took ${Date.now() - t0}ms`);

    if (response.status !== 200) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  } catch (error) {
    console.error(`[${nowIso()}] GraphQL error: ${error.message}`);
    
    // If it's a rate limit error, try switching tokens and retry once
    if (error.response?.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
      console.log(`[${nowIso()}] Rate limit hit, attempting to switch token and retry...`);
      const switched = await tokenManager.switchToNextToken();
      if (switched) {
        console.log(`[${nowIso()}] Retrying GraphQL query with new token...`);
        const retryResponse = await axios.post(
          GRAPHQL_URL,
          { query, variables },
          { headers: getHeaders }
        );
        
        if (retryResponse.status === 200 && !retryResponse.data.errors) {
          console.log(`[${nowIso()}] GraphQL retry successful, took ${Date.now() - t0}ms`);
          return retryResponse.data.data;
        }
      }
    }
    
    throw error;
  }
}

// Note: since is GitTimestamp
const REPO_QUERY = `
query(
  $owner: String!,
  $name: String!,
  $since: GitTimestamp,
  $afterCommits: String,
  $afterPRs: String,
  $afterIssues: String,
  $afterReviews: String
) {
  repository(owner: $owner, name: $name) {
    id
    nameWithOwner

    # include the default branch name to tag those commits
    defaultBranchRef {
      name
      target {
        ... on Commit {
          history(first: 100, since: $since, after: $afterCommits) {
            nodes {
              oid
              message
              author { name user { login } }
              committedDate
            }
            pageInfo { hasNextPage endCursor }
          }
        }
      }
    }

    # Heads (branches). We'll filter in code for develop + release*
    refs(refPrefix: "refs/heads/", first: 50) {
      nodes {
        name
        target {
          ... on Commit {
            history(first: 100, since: $since) {
              nodes {
                oid
                message
                author { name user { login } }
                committedDate
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }
    }

    pullRequests(first: 100, states: [OPEN, CLOSED, MERGED], after: $afterPRs) {
      nodes {
        number
        title
        author { login }
        createdAt
        state
        reviews(first: 100, after: $afterReviews) {
          nodes {
            id
            body
            author { login }
            submittedAt
            state
            commit { oid }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
      pageInfo { hasNextPage endCursor }
    }

    issues(first: 100, states: [OPEN, CLOSED], after: $afterIssues) {
      nodes {
        number
        title
        author { login }
        createdAt
      }
      pageInfo { hasNextPage endCursor }
    }
  }
  rateLimit { remaining resetAt }
}
`;

async function storeRepositoryData(repoName) {
  console.log(`[${nowIso()}] Processing ${repoName}...`);
  const [owner, name] = repoName.split('/');

  try {
    const repo = await getOrCreateRepository(repoName);
    const repoId = repo.id;
    console.log(`[${nowIso()}] Repository ID: ${repoId}`);

    // Hygiene
    await deleteOldData(repoId);
    await cleanDuplicateCommits(repoId);
    await cleanDuplicateReviews(repoId);
    await cleanDuplicatePRs(repoId);

    // Get latest timestamps
    const { commitAt, prAt, issueAt, reviewAt } = await getLatestTimestamps(repoId);
    const since = new Date(Math.min(
      commitAt.getTime(),
      prAt.getTime(),
      issueAt.getTime(),
      reviewAt.getTime(),
      Date.now() - 1 * 24 * 3600 * 1000
    )).toISOString();

    let commitRows = [];
    let prRows = [];
    let issueRows = [];
    let reviewRows = [];

    let afterCommits, afterPRs, afterIssues, afterReviews;
    let hasNextPage = true;

    while (hasNextPage) {
      // await handleRateLimit(); // Check rate limit before each query

      const data = await queryGraphQL(REPO_QUERY, {
        owner,
        name,
        since,
        afterCommits,
        afterPRs,
        afterIssues,
        afterReviews
      });

      const repoData = data.repository;
      if (!repoData) {
        throw new Error(`Repository ${repoName} not found or inaccessible`);
      }

      // Process commits from all branches
      const defaultBranchName = repoData.defaultBranchRef?.name;
      const allRefs = repoData.refs?.nodes || [];
      
      // Filter out default branch from refs to avoid processing it twice
      // (default branch is already processed separately)
      const otherBranches = allRefs.filter(branch => branch.name !== defaultBranchName);

      // Get commits from default branch with branch name
      const defaultBranchCommits = (repoData.defaultBranchRef?.target?.history?.nodes || []).map(c => ({
        commit: c,
        branch: defaultBranchName
      }));
      // Get commits from all other branches with their branch names
      const branchCommits = otherBranches.flatMap(branch => 
        (branch.target?.history?.nodes || []).map(c => ({
          commit: c,
          branch: branch.name
        }))
      );

      
      // Combine all commits and map to final format
      const allCommits = [...defaultBranchCommits, ...branchCommits].map(({ commit: c, branch }) => ({
        repository_id: repoId,
        message: c.message || '',
        author: c.author?.name || c.author?.user?.login || 'unknown',
        committed_at: formatDate(c.committedDate),
        branch: branch || 'unknown',
        created_at: nowIso()
      }));
      commitRows.push(...allCommits);

      // Process PRs
      const prs = repoData.pullRequests?.nodes || [];
      prRows.push(...prs.map(p => ({
        repository_id: repoId,
        title: p.title,
        author: p.author?.login || 'unknown',
        created_at: formatDate(p.createdAt),
        state: p.state,
        number: p.number,
        created_at_internal: nowIso()
      })));

      // Process reviews
      const reviews = prs.flatMap(p => p.reviews?.nodes || []).map(r => ({
        repository_id: repoId,
        comment: r.body || 'No comment',
        author: r.author?.login || 'unknown',
        created_at: formatDate(r.submittedAt),
        review_id: r.id,
        pr_number: prs.find(p => p.reviews?.nodes.includes(r))?.number,
      }));
      reviewRows.push(...reviews);

      // Process issues
      const issues = repoData.issues?.nodes || [];
      issueRows.push(...issues.map(i => ({
        repository_id: repoId,
        title: i.title,
        author: i.author?.login || 'unknown',
        created_at: formatDate(i.createdAt),
        number: i.number
      })));

      // Update pagination cursors
      hasNextPage = (
        repoData.defaultBranchRef?.target?.history?.pageInfo?.hasNextPage ||
        otherBranches.some(b => b.target?.history?.pageInfo?.hasNextPage) ||
        repoData.pullRequests?.pageInfo?.hasNextPage ||
        repoData.issues?.pageInfo?.hasNextPage ||
        prs.some(p => p.reviews?.pageInfo?.hasNextPage)
      );
      afterCommits = repoData.defaultBranchRef?.target?.history?.pageInfo?.endCursor || afterCommits;
      afterPRs = repoData.pullRequests?.pageInfo?.endCursor || afterPRs;
      afterIssues = repoData.issues?.pageInfo?.endCursor || afterIssues;
      afterReviews = prs.find(p => p.reviews?.pageInfo?.hasNextPage)?.reviews?.pageInfo?.endCursor || afterReviews;

      console.log(`[${nowIso()}] Fetched page for ${repoName}: ${allCommits.length} commits, ${prs.length} PRs, ${issues.length} issues, ${reviews.length} reviews`);
    }

    // Insert data
    const insertedCommits = await insertCommits(repoId, commitRows);
    const insertedPRs = await insertPRs(repoId, prRows);
    const insertedIssues = await insertIssues(repoId, issueRows);
    const insertedReviews = await insertReviewsBatched(reviewRows);

    console.log(`[${nowIso()}] Inserted for ${repoName}: ${insertedCommits} commits, ${insertedPRs} PRs, ${insertedIssues} issues, ${insertedReviews} reviews`);
    console.log(`[${nowIso()}] Processed ${repoName}`);
  } catch (err) {
    console.error(`[${nowIso()}] Error processing ${repoName}: ${err.message}`);
    throw err;
  }
}

// Tiny concurrency limiter (like p-limit but inline)
function createLimiter(concurrency = 4) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(resolve, reject).finally(() => {
      active--;
      next();
    });
  };
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}

// Retry wrapper with exponential backoff + jitter
async function withRetry(taskFn, { tries = 3, baseMs = 2000, capMs = 60000 } = {}) {
  let attempt = 0;
  let delay = baseMs;
  while (true) {
    try {
      return await taskFn();
    } catch (e) {
      attempt++;
      if (attempt >= tries) throw e;

      // If the error carries GitHub rate headers, honor them
      const h = e?.response?.headers || {};
      const ra = h['retry-after'];
      const reset = h['x-ratelimit-reset'];
      let waitMs = delay;
      if (ra) waitMs = parseInt(ra, 10) * 1000;
      else if (reset) {
        const ms = parseInt(reset, 10) * 1000 - Date.now();
        if (ms > 0) waitMs = ms + 500;
      }
      // jitter
      waitMs = Math.min(capMs, Math.round(waitMs * (0.8 + Math.random() * 0.4)));

      console.warn(`[${nowIso()}] Retry in ${Math.ceil(waitMs/1000)}s (attempt ${attempt}/${tries}): ${e?.message || e}`);
      await sleep(waitMs);
      delay = Math.min(capMs, delay * 2);
    }
  }
}

// Main initialization function
let _initDone = false;
let _initPromise = null;
// Throttle ingestion to avoid overlapping runs on every request
let _ingestInFlight = false;
let _lastIngestAt = 0;
const INGEST_MIN_INTERVAL_MS = parseInt(process.env.INGEST_MIN_INTERVAL_MS || '1800000', 10); // default 30 minutes
async function initialize({ force = false } = {}) {
  if (_initDone && !force) return;
  if (_initPromise && !force) {
    await _initPromise;
    return;
  }

  _initPromise = (async () => {
    const t0 = Date.now();
    try {
      await initializeSchema();

      const repos = loadRepositories();
      if (!Array.isArray(repos) || repos.length === 0) {
        console.log(`[${nowIso()}] No repositories to ingest. Done.`);
        _initDone = true;
        return;
      }

      const concurrency = Number(process.env.INGEST_CONCURRENCY || 2);
      const maxRetries = Number(process.env.INGEST_RETRIES || 5);
      const maxRepos = Number(process.env.INGEST_MAX_REPOS || 0);

      const toIngest = maxRepos > 0 ? repos.slice(0, maxRepos) : repos;
      console.log(`[${nowIso()}] Ingest start: ${toIngest.length}/${repos.length} repos, conc=${concurrency}, retries=${maxRetries}`);

      const limit = createLimiter(concurrency);
      const tasks = toIngest.map(repo =>
        limit(async () => {
          const start = Date.now();
          try {
            // await handleRateLimit();
            await withRetry(() => storeRepositoryData(repo), { tries: maxRetries });
            console.log(`[${nowIso()}] ✅ Ingested ${repo} in ${Date.now() - start}ms`);
            return { repo, ok: true };
          } catch (e) {
            console.error(`[${nowIso()}] ❌ Failed ${repo}: ${e.message}`);
            return { repo, ok: false, error: e.message || String(e) };
          }
        })
      );

      const results = await Promise.allSettled(tasks);
      const flat = results.map(r => (r.status === 'fulfilled' ? r.value : r.reason));
      const ok = flat.filter(r => r.ok).length;
      const fail = flat.length - ok;

      console.log(`[${nowIso()}] Initialization complete in ${Date.now() - t0}ms. Success=${ok}, Failed=${fail}`);
      if (fail) {
        const list = flat.filter(r => !r.ok).map(r => `${r.repo}: ${r.error}`);
        console.warn(`Failures (${fail}):\n- ${list.join('\n- ')}`);
      }

      _initDone = true;
    } catch (err) {
      console.error(`[${nowIso()}] Initialization error: ${err.message}`);
      _initDone = false;
      throw err;
    }
  })();

  await _initPromise;
}

// GET /api/repositories?offset=0&limit=25&q=mosip&order=created_at&dir=desc
app.get('/api/repositories', async (req, res) => {
  const origin = req.headers.origin || '*';
  const t0 = Date.now();

  try {
    // Parse & clamp inputs
    const {
      offset = '0',
      limit = '',
      q = '',
      order = 'created_at', // or 'name'
      dir = 'desc'          // 'asc' | 'desc'
    } = req.query;

    const off = Math.max(0, parseInt(String(offset), 10) || 0);
    const lim = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 200));
    const safeOrder = (['created_at', 'name'].includes(String(order))) ? String(order) : 'created_at';
    const safeDir = (String(dir).toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    const params = [];
    let idx = 1;

    // Optional search by repo name (ILIKE)
    let where = '';
    if (q) {
      where = `WHERE name ILIKE $${idx++}`;
      params.push(`%${q}%`);
    }

    // Single query with total count window function
    const sql = `
      SELECT id, name, created_at, COUNT(*) OVER() AS total
      FROM repositories
      ${where}
      ORDER BY ${safeOrder} ${safeDir}
      OFFSET $${idx++}
      LIMIT $${idx++}
    `;
    params.push(off, lim);

    const result = await pool.query(sql, params);

    const total = result.rows[0]?.total ? Number(result.rows[0].total) : 0;
    const data = result.rows.map(({ total: _t, ...r }) => r);

    console.log(
      `[${new Date().toISOString()}] [origin: ${origin}] Repositories fetched: ${data.length}/total=${total}, ` +
      `q="${q}", order=${safeOrder} ${safeDir}, offset=${off}, limit=${lim}, ${Date.now() - t0}ms`
    );

    res.set('Cache-Control', 'private, max-age=30'); // tiny cache for UI snappiness
    return res.json({
      data,
      meta: {
        total,
        offset: off,
        limit: lim,
        hasMore: off + data.length < total,
        order: safeOrder,
        dir: safeDir,
        q
      }
    });
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [origin: ${origin}] Error fetching repositories:`,
      err?.message || err
    );
    return res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// GET /api/repository/:id
app.get('/api/repository/:id', async (req, res) => {
  const origin = req.headers.origin || '*';
  const { id } = req.params;
  const t0 = Date.now();

  // Optional lightweight validation (digits or uuid-ish). Skip if your IDs are arbitrary strings.
  const isProbablyValid =
    /^[0-9]+$/.test(id) || /^[0-9a-fA-F-]{8,}$/.test(id);
  if (!isProbablyValid) {
    console.warn(`[${new Date().toISOString()}] [origin: ${origin}] Bad repo id: "${id}"`);
    return res.status(400).json({ error: 'Invalid repository id' });
  }

  try {
    const query = 'SELECT id, name, created_at FROM repositories WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      console.log(`[${new Date().toISOString()}] [origin: ${origin}] Repo not found: ${id}`);
      return res.status(404).json({ error: 'Repository not found' });
    }

    const row = result.rows[0];

    // Build a simple weak ETag from stable fields
    const etag = `W/"${Buffer.from(`${row.id}|${row.name}|${new Date(row.created_at).toISOString()}`).toString('base64')}"`;
    if (req.headers['if-none-match'] === etag) {
      res.set('ETag', etag);
      res.set('Cache-Control', 'private, max-age=60');
      return res.status(304).end();
    }

    res.set('ETag', etag);
    res.set('Cache-Control', 'private, max-age=60');

    console.log(
      `[${new Date().toISOString()}] [origin: ${origin}] Repo fetched: ${row.id} (${Date.now() - t0}ms)`
    );
    return res.json(row);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [origin: ${origin}] Error fetching repository:`,
      err?.message || err
    );
    return res.status(500).json({ error: 'Failed to fetch repository' });
  }
});

app.get('/api/users', async (req, res) => {
  const origin = req.headers.origin || '*';
  const t0 = Date.now();
  const { q = '', limit = '500' } = req.query;

  // Clamp limit to avoid huge payloads
  const lim = Math.min(1000, Math.max(1, parseInt(String(limit), 10) || 500));

  try {
    const params = [];
    const predicates = [];

    // optional search
    if (q) {
      params.push(`%${q}%`);
      predicates.push(`author ILIKE $${params.length}`);
    }

    // always exclude null/empty authors
    predicates.push(`author IS NOT NULL`);
    predicates.push(`author <> ''`);

    const whereSql = predicates.length ? `WHERE ${predicates.join(' AND ')}` : '';

    const sql = `
      SELECT DISTINCT author
      FROM (
        SELECT author FROM commits
        UNION ALL
        SELECT author FROM pull_requests
        UNION ALL
        SELECT author FROM issues
        UNION ALL
        SELECT author FROM reviews
      ) AS all_authors
      ${whereSql}
      ORDER BY author ASC
      LIMIT $${params.length + 1}
    `;

    params.push(lim);

    // ✅ Log SQL & parameters for debugging
    console.log(`[${new Date().toISOString()}] SQL: ${sql.trim().replace(/\s+/g, ' ')}`);
    console.log(`[${new Date().toISOString()}] Params: ${JSON.stringify(params)}`);

    const result = await pool.query(sql, params);
    const authors = result.rows.map(r => r.author);

    console.log(
      `[${new Date().toISOString()}] [origin: ${origin}] Fetched ${authors.length} unique authors in ${Date.now() - t0}ms`
    );

    res.json(authors);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] [origin: ${origin}] Error fetching users:`,
      err?.message || err
    );
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


app.get('/api/activity', async (req, res) => {
  const { repo, dateRange, startDate, endDate, username, repos, users } = req.query;
  
  
  try {
    const params = [];
    let idx = 1;

    // Build date predicate used inside each subquery
    let datePred = ''; // No date filter if dateRange is 'all'
    let dateParamIdx = null;
    
    if (dateRange && dateRange !== 'all' && dateRange !== 'custom') {
      const map = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
      const interval = map[dateRange] || '30 days';
      dateParamIdx = idx;
      datePred = `AND committed_at >= NOW() - $${idx}::interval`;
      params.push(interval); 
      idx++;
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateParamIdx = idx;
      datePred = `AND committed_at BETWEEN $${idx} AND $${idx + 1}`;
      params.push(startDate, endDate); 
      idx += 2;
    }
    // If dateRange is 'all', datePred remains empty (no date filtering)

    // Build UNION query with optional date filtering
    // Note: For commits, we use committed_at; for others, we use created_at
    const unionBlock = `
      SELECT 
        c.id::text AS id, r.name AS repo_name, 'commit' AS type,
        c.author::text AS author, c.committed_at AS created_at,
        c.branch::text AS branch, c.message::text AS message, NULL::text AS state
      FROM commits c
      JOIN repositories r ON c.repository_id = r.id
      ${datePred ? datePred.replace('committed_at', 'c.committed_at') : ''}

      UNION ALL

      SELECT 
        p.id::text, r.name, 'pull_request',
        p.author::text, p.created_at,
        NULL::text, p.title::text, p.state::text
      FROM pull_requests p
      JOIN repositories r ON p.repository_id = r.id
      ${datePred ? datePred.replace('committed_at', 'p.created_at') : ''}

      UNION ALL

      SELECT 
        i.id::text, r.name, 'issue',
        i.author::text, i.created_at,
        NULL::text, i.title::text, NULL::text
      FROM issues i
      JOIN repositories r ON i.repository_id = r.id
      ${datePred ? datePred.replace('committed_at', 'i.created_at') : ''}

      UNION ALL

      SELECT 
        v.id::text, r.name, 'review',
        v.author::text, v.created_at,
        NULL::text, v.comment::text, NULL::text
      FROM reviews v
      JOIN repositories r ON v.repository_id = r.id
      ${datePred ? datePred.replace('committed_at', 'v.created_at') : ''}
    `;

    // Outer filters for repo(s) and user(s)
    const outerFilters = [];
    if (repo && repo !== 'all') {
      outerFilters.push(`repo_name = $${idx}`); params.push(repo); idx++;
    } else if (repos) {
      outerFilters.push(`repo_name = ANY($${idx}::text[])`); params.push(repos.split(',')); idx++;
    }

    if (username) {
      outerFilters.push(`author = $${idx}`); params.push(username); idx++;
    } else if (users) {
      outerFilters.push(`author = ANY($${idx}::text[])`); params.push(users.split(',')); idx++;
    }

    const whereOuter = outerFilters.length ? `WHERE ${outerFilters.join(' AND ')}` : '';

    const query = `
      SELECT *
      FROM (
        ${unionBlock}
      ) AS s
      ${whereOuter}
      ORDER BY created_at DESC
    `;

    console.log(`[${new Date().toISOString()}] Executing activity query:`, query, params);
    const result = await pool.query(query, params);
    console.log(`[${new Date().toISOString()}] Fetched ${result.rows.length} activity records`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});


app.get('/api/stats/:repositoryId', async (req, res) => {
  const origin = req.headers.origin || '*';
  const { repositoryId } = req.params;
  const { dateRange, startDate, endDate } = req.query;

  try {
    const params = [repositoryId];
    let whereTime = '';
    let idx = 2;

    if (dateRange && dateRange !== 'all' && dateRange !== 'custom') {
      const map = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
      const interval = map[dateRange] || '30 days';
      whereTime = `WHERE created_at >= NOW() - $${idx}::interval`;
      params.push(interval); idx++;
    } else if (dateRange === 'custom' && startDate && endDate) {
      whereTime = `WHERE created_at BETWEEN $${idx} AND $${idx + 1}`;
      params.push(startDate, endDate); idx += 2;
    } // else no time filter

    const sql = `
      WITH all_items AS (
        SELECT 'commit'::text AS type, committed_at AS created_at
        FROM commits
        WHERE repository_id = $1
        UNION ALL
        SELECT 'issue', created_at
        FROM issues
        WHERE repository_id = $1
        UNION ALL
        SELECT 'pull_request', created_at
        FROM pull_requests
        WHERE repository_id = $1
        UNION ALL
        SELECT 'review', created_at
        FROM reviews
        WHERE repository_id = $1
      )
      SELECT
        COUNT(*) FILTER (WHERE type = 'commit')       AS commits,
        COUNT(*) FILTER (WHERE type = 'issue')        AS issues,
        COUNT(*) FILTER (WHERE type = 'pull_request') AS pull_requests,
        COUNT(*) FILTER (WHERE type = 'review')       AS reviews
      FROM all_items
      ${whereTime}
    `;

    const t0 = Date.now();
    const result = await pool.query(sql, params);
    const row = result.rows[0] || { commits: 0, issues: 0, pull_requests: 0, reviews: 0 };

    console.log(
      `[${new Date().toISOString()}] [origin: ${origin}] Stats repo=${repositoryId} ` +
      `range=${dateRange || 'all'} took ${Date.now() - t0}ms`
    );

    res.json({
      commits: Number(row.commits) || 0,
      issues: Number(row.issues) || 0,
      pullRequests: Number(row.pull_requests) || 0,
      reviews: Number(row.reviews) || 0
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] [origin: ${origin}] Error fetching stats:`, err);
    res.status(500).json({ error: 'Failed to fetch repository stats' });
  }
});

// helper: normalize "repoName" input to "owner/repo"
function normalizeRepoInput(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Accept full URLs like https://github.com/mosip/mosip(.git)
  const urlMatch = trimmed.match(/^https?:\/\/github\.com\/([^\/\s]+)\/([^\/\s]+)(?:\.git)?\/?$/i);
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2]}`;

  // Accept owner/repo
  const orMatch = trimmed.match(/^([^\/\s]+)\/([^\/\s]+)$/);
  if (orMatch) return `${orMatch[1]}/${orMatch[2]}`;

  return null;
}

// Dedicated endpoint to trigger ingestion
async function ingestHandler(req, res) {
  const t0 = Date.now();
  
  try {
    console.log(`[${nowIso()}] Manual ingestion triggered via /api/ingest`);
    await triggerIngestionIfNeeded();
    console.log(`[${nowIso()}] Ingestion completed in ${Date.now() - t0}ms`);
    return res.json({ success: true, message: 'Ingestion triggered successfully' });
  } catch (err) {
    console.error(`[${nowIso()}] Error triggering ingestion:`, err.message);
    return res.status(500).json({ error: 'Failed to trigger ingestion', message: err.message });
  }
}

app.post('/api/ingest', ingestHandler);
app.get('/api/ingest', ingestHandler);

app.post('/api/addRepo', async (req, res) => {
  const origin = req.headers.origin || '*';
  const t0 = Date.now();
  const { repoName } = req.body || {};
  const { sync } = req.query; // optional ?sync=true to wait for ingestion

  // Validate & normalize
  const normalized = normalizeRepoInput(repoName || '');
  if (!normalized) {
    return res.status(400).json({ error: 'Invalid repository. Use "owner/repo" or a GitHub URL.' });
  }

  try {
    // Idempotent get-or-create
    // getOrCreateRepository should upsert (by unique "name" or "github_id") and return the row
    const repo = await getOrCreateRepository(normalized);

    // If the repo already exists, you might want to short-circuit ingestion unless forced:
    // const alreadyIndexedRecently = ... (optional freshness check)

    // Run ingestion either async (fast 202) or sync (await)
    const runIngestion = async () => {
      try {
        await storeRepositoryData(normalized); // your existing function
      } catch (e) {
        // Log but don't crash the server; clients can re-trigger
        console.error(`[${nowIso()}] [origin: ${origin}] storeRepositoryData failed for ${normalized}:`, e?.message || e);
      }
    };

    if (String(sync).toLowerCase() === 'true') {
      await runIngestion();
      console.log(`[${new Date().toISOString()}] [origin: ${origin}] addRepo (sync) ${normalized} in ${Date.now() - t0}ms`);
      return res.json({ success: true, repository: repo, ingested: true });
    } else {
      // fire-and-forget (don’t block request)
      setImmediate(runIngestion);
      console.log(`[${new Date().toISOString()}] [origin: ${origin}] addRepo (async) ${normalized} in ${Date.now() - t0}ms`);
      // 202 Accepted is semantically correct when background work continues
      res.status(202).json({ success: true, repository: repo, ingested: false, message: 'Ingestion scheduled' });
    }
  } catch (err) {
    // Map common GitHub problems if getOrCreateRepository/storeRepositoryData throws those through
    const status = err?.response?.status;
    if (status === 404) {
      return res.status(404).json({ error: 'GitHub repository not found or no access' });
    }
    if (status === 403) {
      return res.status(403).json({ error: 'Access forbidden by GitHub (check token scopes or rate limits)' });
    }
    console.error(`[${new Date().toISOString()}] [origin: ${origin}] Error adding repository ${repoName}:`, err?.message || err);
    res.status(500).json({ error: 'Failed to add repository' });
  }
});

// Create the server for Lambda
const server = awsServerlessExpress.createServer(app);

// Initialize schema only (fast, required for queries)
let _schemaInitDone = false;
let _schemaInitPromise = null;

async function ensureSchema() {
  console.log(`[${nowIso()}] Ensuring schema initialization...`);

  if (_schemaInitDone) return;
  if (_schemaInitPromise) {
    await _schemaInitPromise;
    return;
  }
  
  _schemaInitPromise = (async () => {
    try {
      await initializeSchema();
      _schemaInitDone = true;
      console.log(`[${nowIso()}] Schema initialization complete`);
    } catch (err) {
      console.error(`[${nowIso()}] Schema initialization error:`, err.message);
      throw err;
    }
  })();
  
  await _schemaInitPromise;
}

// Store the ingestion promise to prevent garbage collection in Lambda
let _ingestionPromise = null;

// Separate function to trigger ingestion (can be called from Lambda handler)
async function triggerIngestionIfNeeded() {
  const now = Date.now();
  if (_ingestInFlight) {
    console.log(`[${nowIso()}] Ingestion already in flight, skipping trigger`);
    // Return the existing promise if one is running
    return _ingestionPromise || Promise.resolve();
  }
  
  if (now - _lastIngestAt < INGEST_MIN_INTERVAL_MS) {
    console.log(`[${nowIso()}] Ingestion recently ran (${Math.round((now - _lastIngestAt)/1000)}s ago), skipping trigger`);
    return Promise.resolve();
  }
  
  console.log(`[${nowIso()}] Triggering repository ingestion (force)`);
  _ingestInFlight = true;
  
  // Store the promise to prevent garbage collection in Lambda
  _ingestionPromise = (async () => {
    try {
      await initialize({ force: true });
      console.log(`[${nowIso()}] Repository ingestion completed successfully`);
    } catch (err) {
      console.error(`[${nowIso()}] Background initialization error:`, err.message);
      throw err;
    } finally {
      _ingestInFlight = false;
      _lastIngestAt = Date.now();
      _ingestionPromise = null;
    }
  })();
  
  return _ingestionPromise;
}

// Lambda handler
exports.handler = async (event, context) => {
  console.log(`[${new Date().toISOString()}] Lambda invoked with event:`, JSON.stringify(event));
  console.log(`[${new Date().toISOString()}] event.path: ${event.path}, event.rawPath: ${event.rawPath}`);
  try {
    if (event.rawPath && event.path !== event.rawPath) event.path = event.rawPath;

    // Wait for schema initialization (fast)
    await ensureSchema();

    // Trigger ingestion on first invocation if AUTO_INGEST_ON_START is enabled
    // Note: In Lambda, we need to be careful about execution time
    // The ingestion will be triggered asynchronously to avoid blocking the request
    const shouldIngest = (!_initDone && process.env.AUTO_INGEST_ON_START !== 'false') ||
                         event.queryStringParameters?.ingest === 'true';
    if (shouldIngest && event.path !== '/api/ingest') {
      // Trigger ingestion asynchronously - it will run in the background
      // Store the promise to prevent garbage collection in Lambda
      // Note: In Lambda, the execution context may persist between invocations,
      // allowing background tasks to complete. However, for guaranteed execution,
      // use the dedicated /api/ingest endpoint or CloudWatch Events.
      console.log(`[${nowIso()}] Triggering background ingestion on Lambda invocation`);
      const ingestionPromise = triggerIngestionIfNeeded();
      // Ensure the promise is tracked (stored in _ingestionPromise internally)
      ingestionPromise.catch(err => {
        console.error(`[${nowIso()}] Background ingestion error:`, err.message);
      });
      // Note: We don't await here to avoid blocking the request, but the promise
      // is stored internally to prevent garbage collection
    }

    const response = await awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
    console.log(`[${new Date().toISOString()}] Response headers:`, response.headers);
    return response;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Lambda handler error:`, error.message);
    const origin = event.headers?.origin || '*';
    return {
      statusCode: 500,
      headers: {
        //'Access-Control-Allow-Origin': '*',
        //'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
        //'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Server initialization failed' })
    };
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing pool...');
  await pool.end();
});
