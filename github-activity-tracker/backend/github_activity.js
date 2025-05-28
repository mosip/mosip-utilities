const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { DateTime } = require('luxon');
const axios = require('axios');

// Load environment variables
dotenv.config();

// GitHub API Token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  throw new Error("GitHub token is missing.");
}

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
  password: RDS_PASSWORD
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

// GitHub API Headers
const HEADERS = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json'
};

// Format date function (unchanged)
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

// Load repositories from config file (unchanged)
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

// Get latest date (unchanged)
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

// Check rate limit (unchanged)
async function checkRateLimit() {
  try {
    const response = await axios.get("https://api.github.com/rate_limit", { headers: HEADERS });
    if (response.status === 200) {
      const remaining = response.data.resources.core.remaining;
      const resetTime = response.data.resources.core.reset;
      return { remaining, resetTime };
    }
    return { remaining: null, resetTime: null };
  } catch (error) {
    console.error("Error checking rate limit:", error.message);
    return { remaining: null, resetTime: null };
  }
}

// Handle rate limit (unchanged)
async function handleRateLimit() {
  const { remaining, resetTime } = await checkRateLimit();
  if (remaining !== null && remaining < 20) {
    const waitTime = Math.max(resetTime - Math.floor(Date.now() / 1000), 0) + 5;
    console.log(`Rate limit low (${remaining} remaining). Waiting ${waitTime} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    return true;
  }
  return false;
}

// Fetch paginated data (unchanged)
async function fetchPaginatedData(url, params = {}, maxRetries = 5) {
  let items = [];
  let page = 1;
  let retryCount = 0;
  let retryDelay = 5000;
  while (true) {
    const queryParams = { ...params, page, per_page: 100 };
    try {
      const response = await axios.get(url, { headers: HEADERS, params: queryParams });
      console.log(`Rate limit remaining: ${response.headers['x-ratelimit-remaining'] || 'N/A'}`);
      if (response.status === 403 && response.headers['x-ratelimit-remaining'] && parseInt(response.headers['x-ratelimit-remaining']) === 0) {
        const resetTime = parseInt(response.headers['x-ratelimit-reset'] || 0);
        const waitTime = Math.max(resetTime - Math.floor(Date.now() / 1000), 0) + 5;
        console.log(`Rate limit reached. Waiting ${waitTime} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        continue;
      }
      if (response.status !== 200) {
        retryCount++;
        if (retryCount > maxRetries) {
          console.log(`Max retries reached for ${url}. Last status: ${response.status}`);
          break;
        }
        console.log(`Error fetching ${url}: ${response.status}, retry ${retryCount}/${maxRetries} in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2;
        continue;
      }
      const newItems = response.data;
      console.log(`Fetched ${newItems.length} items from ${url}, page ${page}`);
      if (!newItems || newItems.length === 0) {
        console.log(`Completed ${page} pages for ${url}`);
        break;
      }
      items = items.concat(newItems);
      if (newItems.length < 100) {
        console.log(`Completed ${page} pages for ${url}`);
        break;
      }
      page += 1;
      retryCount = 0;
      retryDelay = 5000;
    } catch (error) {
      retryCount++;
      if (retryCount > maxRetries) {
        console.log(`Max retries reached for ${url} due to exception: ${error.message}`);
        break;
      }
      console.log(`Exception fetching ${url}: ${error.message}, retry ${retryCount}/${maxRetries} in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retryDelay *= 2;
    }
  }
  return items;
}

// Get or create repository (modified to include created_at)
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

// Delete old data (unchanged)
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

// Clean duplicates (unchanged)
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

// Fetch commits for branch (unchanged)
async function fetchCommitsForBranch(branch, baseUrl, latestCommitDate, repoId) {
  const commitsUrl = `${baseUrl}/commits`;
  const sinceDate = new Date(Math.min(
    latestCommitDate.getTime(),
    DateTime.now().minus({ days: 30 }).toJSDate().getTime()
  ));
  const params = { sha: branch.name, since: sinceDate.toISOString() };
  const commits = await fetchPaginatedData(commitsUrl, params);
  return commits
    .filter(c => new Date(formatDate(c.commit.author.date)) >= sinceDate)
    .map(c => ({
      repository_id: repoId,
      message: c.commit.message,
      author: c.commit.author.name,
      committed_at: formatDate(c.commit.author.date),
      branch: branch.name,
      created_at: DateTime.now().toUTC().toISO({ suppressMilliseconds: true })
    }));
}

// Fetch reviews for PR (unchanged)
async function fetchReviewsForPR(pr, baseUrl, repoId) {
  const reviewsUrl = `${baseUrl}/pulls/${pr.number}/reviews`;
  const prReviews = await fetchPaginatedData(reviewsUrl);
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT review_id
       FROM reviews
       WHERE repository_id = $1 AND pr_number = $2`,
      [repoId, pr.number]
    );
    const existingReviewIds = new Set(result.rows.map(row => String(row.review_id)));
    const newReviews = prReviews.filter(r => !existingReviewIds.has(String(r.id)));
    const reviewsData = newReviews.map(r => ({
      repository_id: repoId,
      comment: r.body || "No comment",
      author: r.user.login,
      created_at: formatDate(r.submitted_at),
      review_id: String(r.id),
      pr_number: pr.number
    }));
    console.log(`Fetched ${reviewsData.length} new reviews for PR #${pr.number} (filtered from ${prReviews.length} total)`);
    return reviewsData;
  } finally {
    client.release();
  }
}

// Store repository data (unchanged)
async function storeRepositoryData(repoName) {
  console.log(`Processing ${repoName}...`);
  const baseUrl = `https://api.github.com/repos/${repoName}`;
  try {
    const repoId = (await getOrCreateRepository(repoName)).id;
    console.log(`Repository ID: ${repoId}`);
    await deleteOldData(repoId);
    await cleanDuplicateCommits(repoId);
    await cleanDuplicateReviews(repoId);
    await cleanDuplicatePRs(repoId);
    const latestCommitDate = await getLatestDate("commits", repoId, "committed_at");
    const latestPrDate = await getLatestDate("pull_requests", repoId, "created_at");
    const latestIssueDate = await getLatestDate("issues", repoId, "created_at");
    const latestReviewDate = await getLatestDate("reviews", repoId, "created_at");
    // Process commits
    console.log(`Starting commits at ${Date.now() / 1000}`);
    const branchesUrl = `${baseUrl}/branches`;
    const branches = await fetchPaginatedData(branchesUrl);
    console.log(`Processing branches: ${branches.map(b => b.name).join(', ')}`);
    const commitDataList = await Promise.all(
      branches.map(branch => fetchCommitsForBranch(branch, baseUrl, latestCommitDate, repoId))
    );
    const commitData = commitDataList.flat();
    if (commitData.length > 0) {
      const client = await pool.connect();
      try {
        const existingCommits = await client.query(
          `SELECT repository_id, message, author, committed_at, branch
           FROM commits
           WHERE repository_id = $1`,
          [repoId]
        );
        const existingKeys = new Set(
          existingCommits.rows.map(c => `${c.repository_id}|${c.message}|${c.author}|${c.committed_at}|${c.branch}`)
        );
        const newCommitData = commitData.filter(commit => {
          const key = `${commit.repository_id}|${commit.message}|${commit.author}|${commit.committed_at}|${commit.branch}`;
          if (existingKeys.has(key)) {
            console.log(`Skipping duplicate commit: ${key}`);
            return false;
          }
          existingKeys.add(key);
          return true;
        });
        if (newCommitData.length > 0) {
          try {
            await client.query(
              `INSERT INTO commits (repository_id, message, author, committed_at, branch, created_at)
               SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::timestamp[], $5::text[], $6::timestamp[])`,
              [
                newCommitData.map(c => c.repository_id),
                newCommitData.map(c => c.message),
                newCommitData.map(c => c.author),
                newCommitData.map(c => c.committed_at),
                newCommitData.map(c => c.branch),
                newCommitData.map(c => c.created_at)
              ]
            );
            console.log(`Stored ${newCommitData.length} new commits at ${Date.now() / 1000}`);
          } catch (error) {
            console.error(`Error inserting commits: ${error.message}`);
            let successfulInserts = 0;
            for (const commit of newCommitData) {
              try {
                await client.query(
                  `INSERT INTO commits (repository_id, message, author, committed_at, branch, created_at)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    commit.repository_id,
                    commit.message,
                    commit.author,
                    commit.committed_at,
                    commit.branch,
                    commit.created_at
                  ]
                );
                successfulInserts++;
              } catch (innerError) {
                console.error(`Error inserting individual commit: ${innerError.message}`);
              }
            }
            console.log(`Individually inserted ${successfulInserts}/${newCommitData.length} commits`);
          }
        }
      } finally {
        client.release();
      }
    }
    console.log(`Finished commits at ${Date.now() / 1000}`);
    // Process pull requests
    console.log(`Starting PRs at ${Date.now() / 1000}`);
    const prStates = ["open", "closed"];
    for (const state of prStates) {
      const prsUrl = `${baseUrl}/pulls`;
      const sinceDate = new Date(Math.min(
        latestPrDate.getTime(),
        DateTime.now().minus({ days: 30 }).toJSDate().getTime()
      ));
      const params = { state, sort: "updated", direction: "desc" };
      const prs = await fetchPaginatedData(prsUrl, params);
      const filteredPrs = prs.filter(p => new Date(formatDate(p.created_at)) >= sinceDate);
      console.log(`Filtered from ${prs.length} to ${filteredPrs.length} ${state} PRs based on date`);
      const prData = filteredPrs.map(p => ({
        repository_id: repoId,
        title: p.title,
        author: p.user.login,
        created_at: formatDate(p.created_at),
        state: p.state,
        number: p.number,
        created_at_internal: DateTime.now().toUTC().toISO({ suppressMilliseconds: true })
      }));
      if (prData.length > 0) {
        const client = await pool.connect();
        try {
          const existingPrs = await client.query(
            `SELECT repository_id, number
             FROM pull_requests
             WHERE repository_id = $1 AND number = ANY($2)`,
            [repoId, prData.map(p => p.number)]
          );
          const existingPrNumbers = new Set(existingPrs.rows.map(pr => pr.number));
          const newPrData = prData.filter(pr => !existingPrNumbers.has(pr.number));
          if (newPrData.length > 0) {
            try {
              await client.query(
                `INSERT INTO pull_requests (repository_id, title, author, created_at, state, number, created_at_internal)
                 SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::timestamp[], $5::text[], $6::int[], $7::timestamp[])`,
                [
                  newPrData.map(p => p.repository_id),
                  newPrData.map(p => p.title),
                  newPrData.map(p => p.author),
                  newPrData.map(p => p.created_at),
                  newPrData.map(p => p.state),
                  newPrData.map(p => p.number),
                  newPrData.map(p => p.created_at_internal)
                ]
              );
              console.log(`Stored ${newPrData.length} new ${state} PRs`);
            } catch (error) {
              console.error(`Error inserting ${state} PRs: ${error.message}`);
              let successfulInserts = 0;
              for (const pr of newPrData) {
                try {
                  await client.query(
                    `INSERT INTO pull_requests (repository_id, title, author, created_at, state, number, created_at_internal)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                      pr.repository_id,
                      pr.title,
                      pr.author,
                      pr.created_at,
                      pr.state,
                      pr.number,
                      pr.created_at_internal
                    ]
                  );
                  successfulInserts++;
                } catch (innerError) {
                  console.error(`Error inserting individual PR: ${innerError.message}`);
                }
              }
              console.log(`Individually inserted ${successfulInserts}/${newPrData.length} ${state} PRs`);
            }
          } else {
            console.log(`No new ${state} PRs to store after filtering duplicates`);
          }
        } finally {
          client.release();
        }
      } else {
        console.log(`No ${state} PRs to store after date filtering`);
      }
    }
    console.log(`Finished PRs at ${Date.now() / 1000}`);
    // Process issues
    console.log(`Starting issues at ${Date.now() / 1000}`);
    const sinceIssueDate = new Date(Math.min(
      latestIssueDate.getTime(),
      DateTime.now().minus({ days: 30 }).toJSDate().getTime()
    ));
    const issuesUrl = `${baseUrl}/issues`;
    const issueParams = { sort: "updated", direction: "desc", since: sinceIssueDate.toISOString() };
    const issues = await fetchPaginatedData(issuesUrl, issueParams);
    const issueData = issues
      .filter(i => !i.pull_request)
      .map(i => ({
        repository_id: repoId,
        title: i.title,
        author: i.user.login,
        created_at: formatDate(i.created_at),
        number: i.number
      }));
    if (issueData.length > 0) {
      const client = await pool.connect();
      try {
        const existingIssues = await client.query(
          `SELECT repository_id, number
           FROM issues
           WHERE repository_id = $1 AND number = ANY($2)`,
          [repoId, issueData.map(i => i.number)]
        );
        const existingIssueNumbers = new Set(existingIssues.rows.map(issue => issue.number));
        const newIssueData = issueData.filter(issue => !existingIssueNumbers.has(issue.number));
        if (newIssueData.length > 0) {
          try {
            await client.query(
              `INSERT INTO issues (repository_id, title, author, created_at, number)
               SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::timestamp[], $5::int[])`,
              [
                newIssueData.map(i => i.repository_id),
                newIssueData.map(i => i.title),
                newIssueData.map(i => i.author),
                newIssueData.map(i => i.created_at),
                newIssueData.map(i => i.number)
              ]
            );
            console.log(`Stored ${newIssueData.length} new issues`);
          } catch (error) {
            console.error(`Error inserting issues: ${error.message}`);
            let successfulInserts = 0;
            for (const issue of newIssueData) {
              try {
                await client.query(
                  `INSERT INTO issues (repository_id, title, author, created_at, number)
                   VALUES ($1, $2, $3, $4, $5)`,
                  [
                    issue.repository_id,
                    issue.title,
                    issue.author,
                    issue.created_at,
                    issue.number
                  ]
                );
                successfulInserts++;
              } catch (innerError) {
                console.error(`Error inserting individual issue: ${innerError.message}`);
              }
            }
            console.log(`Individually inserted ${successfulInserts}/${newIssueData.length} issues`);
          }
        } else {
          console.log("No new issues to store after filtering duplicates");
        }
      } finally {
        client.release();
      }
    }
    console.log(`Finished issues at ${Date.now() / 1000}`);
    // Process reviews
    console.log(`Starting reviews at ${Date.now() / 1000}`);
    const sinceReviewDate = new Date(Math.min(
      latestReviewDate.getTime(),
      DateTime.now().minus({ days: 30 }).toJSDate().getTime()
    ));
    const recentPrsOpen = await fetchPaginatedData(`${baseUrl}/pulls?state=open&sort=updated&direction=desc`);
    const recentPrsClosed = await fetchPaginatedData(`${baseUrl}/pulls?state=closed&sort=updated&direction=desc`);
    const filteredPrsClosed = recentPrsClosed.filter(
      pr => new Date(formatDate(pr.updated_at)) >= sinceReviewDate
    );
    const allRecentPrs = [...recentPrsOpen, ...filteredPrsClosed];
    console.log(
      `Found ${allRecentPrs.length} recent PRs for review processing ` +
      `(${recentPrsOpen.length} open, ${filteredPrsClosed.length} recently closed)`
    );
    const batchSize = 5;
    const allReviewData = [];
    for (let i = 0; i < allRecentPrs.length; i += batchSize) {
      const batchPrs = allRecentPrs.slice(i, i + batchSize);
      console.log(
        `Processing reviews for PR batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allRecentPrs.length / batchSize)} ` +
        `(PRs #${batchPrs.map(pr => pr.number).join(', ')})`
      );
      await handleRateLimit();
      const batchReviews = await Promise.all(
        batchPrs.map(pr => fetchReviewsForPR(pr, baseUrl, repoId))
      );
      allReviewData.push(...batchReviews.flat());
    }
    console.log(`Total new reviews fetched across all PRs: ${allReviewData.length}`);
    if (allReviewData.length > 0) {
      const insertBatchSize = 20;
      const client = await pool.connect();
      try {
        for (let j = 0; j < allReviewData.length; j += insertBatchSize) {
          const batch = allReviewData.slice(j, j + insertBatchSize);
          const batchNum = Math.floor(j / insertBatchSize) + 1;
          const totalBatches = Math.ceil(allReviewData.length / insertBatchSize);
          console.log(`Inserting review batch ${batchNum}/${totalBatches} with ${batch.length} reviews`);
          try {
            await client.query(
              `INSERT INTO reviews (repository_id, comment, author, created_at, review_id, pr_number)
               SELECT * FROM UNNEST ($1::int[], $2::text[], $3::text[], $4::timestamp[], $5::text[], $6::int[])`,
              [
                batch.map(r => r.repository_id),
                batch.map(r => r.comment),
                batch.map(r => r.author),
                batch.map(r => r.created_at),
                batch.map(r => r.review_id),
                batch.map(r => r.pr_number)
              ]
            );
            console.log(`Successfully inserted review batch ${batchNum}/${totalBatches}`);
          } catch (error) {
            console.error(`Error inserting review batch ${batchNum}: ${error.message}`);
            let successfulInserts = 0;
            for (const review of batch) {
              try {
                await client.query(
                  `INSERT INTO reviews (repository_id, comment, author, created_at, review_id, pr_number)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    review.repository_id,
                    review.comment,
                    review.author,
                    review.created_at,
                    review.review_id,
                    review.pr_number
                  ]
                );
                successfulInserts++;
              } catch (innerError) {
                console.error(`Error inserting individual review: ${innerError.message}`);
              }
            }
            console.log(`Individually inserted ${successfulInserts}/${batch.length} reviews`);
          }
        }
      } finally {
        client.release();
      }
    } else {
      console.log("No new reviews to store");
    }
    console.log(`Finished reviews at ${Date.now() / 1000}`);
    console.log(`✅ Processed ${repoName}`);
  } catch (error) {
    console.error(`❌ Error processing ${repoName}: ${error.message}`);
    console.error(error.stack);
  }
}

// API Endpoints
// API Endpoints
app.get('/api/repositories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, created_at FROM repositories ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching repositories:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.get('/api/repository/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, name, created_at FROM repositories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching repository:', err);
    res.status(500).json({ error: 'Failed to fetch repository' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT author FROM commits LIMIT 500');
    res.json(result.rows.map(row => row.author));
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/activity', async (req, res) => {
  const { repo, dateRange, startDate, endDate, username, repos, users } = req.query;
  try {
    let query = `
      SELECT 
        c.id, r.name as repo_name, 'commit' as type, c.author, c.committed_at as created_at, c.branch, c.message
      FROM commits c
      JOIN repositories r ON c.repository_id = r.id
      WHERE 1=1
      UNION ALL
      SELECT 
        p.id, r.name as repo_name, 'pull_request' as type, p.author, p.created_at, NULL as branch, p.title, p.state
      FROM pull_requests p
      JOIN repositories r ON p.repository_id = r.id
      WHERE 1=1
      UNION ALL
      SELECT 
        i.id, r.name as repo_name, 'issue' as type, i.author, i.created_at, NULL as branch, i.title
      FROM issues i
      JOIN repositories r ON i.repository_id = r.id
      WHERE 1=1
      UNION ALL
      SELECT 
        v.id, r.name as repo_name, 'review' as type, v.author, v.created_at, NULL as branch, v.comment
      FROM reviews v
      JOIN repositories r ON v.repository_id = r.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (repo && repo !== 'all') {
      query += ` AND r.name = $${paramIndex}`;
      params.push(repo);
      paramIndex++;
    } else if (repos) {
      const repoList = repos.split(',');
      query += ` AND r.name = ANY($${paramIndex}::text[])`;
      params.push(repoList);
      paramIndex++;
    }

    if (username) {
      query += ` AND author = $${paramIndex}`;
      params.push(username);
      paramIndex++;
    } else if (users) {
      const userList = users.split(',');
      query += ` AND author = ANY($${paramIndex}::text[])`;
      params.push(userList);
      paramIndex++;
    }

    if (dateRange && dateRange !== 'all' && dateRange !== 'custom') {
      let interval;
      switch (dateRange) {
        case '7d':
          interval = '7 days';
          break;
        case '30d':
          interval = '30 days';
          break;
        case '90d':
          interval = '90 days';
          break;
        default:
          interval = '30 days';
      }
      query += ` AND created_at >= NOW() - INTERVAL $${paramIndex}`;
      params.push(interval);
      paramIndex++;
    } else if (dateRange === 'custom' && startDate && endDate) {
      query += ` AND created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.get('/api/stats/:repositoryId', async (req, res) => {
  const { repositoryId } = req.params;
  try {
    const [commits, issues, pullRequests, reviews] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM commits WHERE repository_id = $1', [repositoryId]),
      pool.query('SELECT COUNT(*) as count FROM issues WHERE repository_id = $1', [repositoryId]),
      pool.query('SELECT COUNT(*) as count FROM pull_requests WHERE repository_id = $1', [repositoryId]),
      pool.query('SELECT COUNT(*) as count FROM reviews WHERE repository_id = $1', [repositoryId])
    ]);
    res.json({
      commits: parseInt(commits.rows[0].count, 10),
      issues: parseInt(issues.rows[0].count, 10),
      pullRequests: parseInt(pullRequests.rows[0].count, 10),
      reviews: parseInt(reviews.rows[0].count, 10)
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch repository stats' });
  }
});

app.post('/api/addRepo', async (req, res) => {
  const { repoName } = req.body;
  if (!repoName) {
    return res.status(400).json({ error: 'Repository name is required' });
  }
  try {
    const repo = await getOrCreateRepository(repoName);
    await storeRepositoryData(repoName);
    res.json({ success: true, repository: repo });
  } catch (err) {
    console.error('Error adding repository:', err);
    res.status(500).json({ error: 'Failed to add repository' });
  }
});

// Main function (modified to run on server start)
async function startServer() {
  try {
    await initializeSchema();
    // Run initial data ingestion
    const repos = loadRepositories();
    for (const repo of repos) {
      try {
        await storeRepositoryData(repo);
      } catch (error) {
        console.error(`Failed to process ${repo}: ${error.message}`);
      }
    }
    // Start Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error.message);
    process.exit(1);
  }
}

// Run the server
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  await pool.end();
  process.exit(0);
});