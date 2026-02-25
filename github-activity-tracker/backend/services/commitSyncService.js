const githubClient = require('../utils/githubClient');
const pool = require('../db/dbPool');
const { POSTGRES } = require('../config/errorCodes');

/**
 * Sync commits for a single repository.
 * - Fetches commits from GitHub API with pagination
 * - Upserts GitHub users into github_users table
 * - Updates repo_users with commit counts and timestamps
 * - Inserts commit events into activity_events table
 *
 * @param {number|string} repoId - The github_repo_id from the repos table
 * @returns {Promise<number>} Total number of commits processed
 */
async function syncCommits(repoId) {
  if (!repoId) {
    throw new Error('Repository ID is required for syncCommits');
  }

  // Fetch repo owner, name, and last sync timestamp from repos table
  const repoResult = await pool.query(
    'SELECT owner, name, last_commits_sync_at FROM repos WHERE github_repo_id = $1',
    [repoId]
  );
  console.log(`Fetched repo details for repoId ${repoId}:`, repoResult.rows);
  console.log(`Repo query result for repoId ${repoId}:`, repoResult);
  if (repoResult.rows.length === 0) {
    throw new Error(`Repository with ID ${repoId} not found`);
  }

  const { owner, name, last_commits_sync_at } = repoResult.rows[0];
  if (!owner || !name) {
    throw new Error(`Repository ${repoId} missing owner or name`);
  }

  // Incremental sync: only fetch commits after last sync; first run = last 1 year
  let sinceDate = null;
  if (last_commits_sync_at) {
    sinceDate = new Date(last_commits_sync_at);
  } else {
    sinceDate = new Date();
    sinceDate.setFullYear(sinceDate.getFullYear() - 1);
  }
  const sinceISO = sinceDate.toISOString();

  console.log(`Syncing commits for ${owner}/${name} (repoId: ${repoId})${last_commits_sync_at ? ` since last sync: ${last_commits_sync_at}` : ' (initial sync, last 1 year)'}`);

  const perPage = 100;
  let page = 1;
  let totalProcessed = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      console.log(`Fetching commits for ${owner}/${name}, page: ${page}`);
      const params = {
        per_page: perPage,
        page,
        since: sinceISO,
      };
      const response = await githubClient.get(`/repos/${owner}/${name}/commits`, {
        params,
      });

      const commits = response.data || [];
      console.log(`Fetched ${commits.length} commits from GitHub API`);

      if (!Array.isArray(commits) || commits.length === 0) {
        console.log(`No more commits found. Total processed: ${totalProcessed}`);
        break;
      }

      console.log(`Processing ${commits.length} commits from page ${page}`);

      let shouldStopPagination = false;
      for (const commit of commits) {
        // Ignore commits where commit.author is null
        if (!commit.author) {
          console.log(`Skipping commit ${commit.sha} - author is null`);
          continue;
        }

        try {
          const commitSha = commit.sha;
          const commitDate = commit.commit?.author?.date || commit.commit?.committer?.date;

          if (!commitDate) {
            console.log(`Skipping commit ${commitSha} - no commit date`);
            continue;
          }

          // Filter by since date (additional check in case API doesn't filter perfectly)
          const commitDateObj = new Date(commitDate);
          if (commitDateObj < sinceDate) {
            // Since commits are ordered by date desc, we can stop pagination
            shouldStopPagination = true;
            break;
          }

          // Extract GitHub author details
          const {
            login,
            id: github_user_id,
            avatar_url,
            html_url,
            type,
          } = commit.author;

          if (!github_user_id) {
            console.log(`Skipping commit ${commitSha} - author has no ID`);
            continue;
          }

          // Ensure user exists; get our internal id for foreign keys
          const userResult = await pool.query(
            `
              INSERT INTO github_users (github_user_id, login, avatar_url, html_url, type)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (github_user_id)
              DO UPDATE SET
                login = EXCLUDED.login,
                avatar_url = EXCLUDED.avatar_url,
                html_url = EXCLUDED.html_url,
                type = EXCLUDED.type
              RETURNING id
            `,
            [github_user_id, login, avatar_url || null, html_url || null, type || null]
          );

          const userId = userResult.rows[0].id;

          // Bump commit count and update first/last seen for this repo+user
          await pool.query(
            `
              INSERT INTO repo_users (repo_id, user_id, commits_count, first_seen_at, last_seen_at)
              VALUES ($1, $2, 1, $3, $3)
              ON CONFLICT (repo_id, user_id)
              DO UPDATE SET
                commits_count = repo_users.commits_count + 1,
                last_seen_at = GREATEST(repo_users.last_seen_at, EXCLUDED.last_seen_at),
                first_seen_at = LEAST(repo_users.first_seen_at, EXCLUDED.first_seen_at)
            `,
            [repoId, userId, commitDate]
          );

          // Record commit as an activity event (skip if already present)
          try {
            await pool.query(
              `
                INSERT INTO activity_events (event_type, event_id, repo_id, user_id, html_url, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (event_type, event_id) DO NOTHING
              `,
              ['commit', commitSha, repoId, userId, commit.html_url || null, commitDate]
            );
          } catch (eventError) {
            // If unique constraint violation, skip (already processed)
            if (eventError.code === POSTGRES.UNIQUE_VIOLATION) {
              console.log(`Commit ${commitSha} already exists in activity_events, skipping`);
            } else {
              throw eventError;
            }
          }

          totalProcessed += 1;
        } catch (commitError) {
          console.error(
            `Error processing commit ${commit.sha || 'unknown'}:`,
            commitError.message
          );
          // Continue processing other commits instead of failing completely
        }
      }

      if (shouldStopPagination || commits.length < perPage) {
        if (shouldStopPagination) {
          console.log(`Reached commits older than since date. Total processed: ${totalProcessed}`);
        } else {
          console.log(`Reached last page. Total processed: ${totalProcessed}`);
        }
        break;
      }

      page += 1;
    } catch (apiError) {
      console.error(`Error fetching commits from GitHub API:`, apiError.message);
      if (apiError.response) {
        console.error(`GitHub API status: ${apiError.response.status}`);
        console.error(`GitHub API response:`, apiError.response.data);
      }
      throw apiError;
    }
  }

  console.log(`Completed syncing commits for ${owner}/${name}. Total processed: ${totalProcessed}`);

  // Mark repo as synced so next run can use incremental since date
  await pool.query(
    'UPDATE repos SET last_commits_sync_at = NOW() WHERE github_repo_id = $1',
    [repoId]
  );

  return totalProcessed;
}

module.exports = {
  syncCommits,
};
