const githubClient = require('../utils/githubClient');
const pool = require('../db/dbPool');
const { GITHUB, POSTGRES } = require('../config/errorCodes');

/**
 * Sync pull requests for a single repository.
 * - Fetches PRs from GitHub Search API with pagination
 * - Upserts GitHub users into github_users table
 * - Updates repo_users with prs_count and timestamps
 * - Inserts PR events into activity_events table
 *
 * @param {number|string} repoId - The github_repo_id from the repos table
 * @returns {Promise<number>} Total number of PRs processed
 */
async function syncPRs(repoId) {
  if (!repoId) {
    throw new Error('Repository ID is required for syncPRs');
  }

  // Fetch repo owner, name, and last sync timestamp from repos table
  const repoResult = await pool.query(
    'SELECT owner, name, last_prs_sync_at FROM repos WHERE github_repo_id = $1',
    [repoId]
  );

  if (repoResult.rows.length === 0) {
    throw new Error(`Repository with ID ${repoId} not found`);
  }

  const { owner, name, last_prs_sync_at } = repoResult.rows[0];
  if (!owner || !name) {
    throw new Error(`Repository ${repoId} missing owner or name`);
  }

  // Incremental sync: only PRs created after last sync; first run = last 1 year
  let sinceDate = null;
  if (last_prs_sync_at) {
    sinceDate = new Date(last_prs_sync_at);
  } else {
    sinceDate = new Date();
    sinceDate.setFullYear(sinceDate.getFullYear() - 1);
  }
  const sinceDateStr = sinceDate.toISOString().split('T')[0]; // YYYY-MM-DD format for GitHub Search API

  const perPage = 100;
  const maxPage = 10; // Search API cap: 1000 results = 10 pages × 100
  let page = 1;
  let totalProcessed = 0;

  while (page <= maxPage) {
    try {
      let q = `repo:${owner}/${name} type:pr created:>=${sinceDateStr}`;
      const response = await githubClient.get('/search/issues', {
        params: {
          q,
          per_page: perPage,
          page,
        },
      });

      const items = response.data?.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        break;
      }

      let shouldStopPagination = false;
      for (const pr of items) {
        const prId = pr.id;
        const prNumber = pr.number;
        const createdAt = pr.created_at;
        const author = pr.user;

        if (!author || !author.id) {
          continue;
        }

        // Filter by since date (additional check in case API doesn't filter perfectly)
        if (sinceDate) {
          const prDate = new Date(createdAt);
          if (prDate < sinceDate) {
            // Since PRs are ordered by created desc, we can stop pagination
            shouldStopPagination = true;
            break;
          }
        }

        try {
          const {
            login,
            id: github_user_id,
            avatar_url,
            html_url,
            type,
          } = author;

          // Upsert into github_users using github_user_id as unique key
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

          // Upsert into repo_users using (repo_id, user_id) as unique key
          // Increment prs_count, update first_seen_at and last_seen_at
          await pool.query(
            `
              INSERT INTO repo_users (repo_id, user_id, prs_count, first_seen_at, last_seen_at)
              VALUES ($1, $2, 1, $3, $3)
              ON CONFLICT (repo_id, user_id)
              DO UPDATE SET
                prs_count = repo_users.prs_count + 1,
                last_seen_at = GREATEST(repo_users.last_seen_at, EXCLUDED.last_seen_at),
                first_seen_at = LEAST(COALESCE(repo_users.first_seen_at, EXCLUDED.first_seen_at), EXCLUDED.first_seen_at)
            `,
            [repoId, userId, createdAt]
          );

          // Insert into activity_events; prevent duplicates via unique (event_type, event_id)
          await pool.query(
            `
              INSERT INTO activity_events (event_type, event_id, repo_id, user_id, html_url, created_at)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (event_type, event_id)
              DO UPDATE SET
                html_url = COALESCE(activity_events.html_url, EXCLUDED.html_url)
            `,
            ['pr', String(prId), repoId, userId, pr.html_url || null, createdAt]
          );

          totalProcessed += 1;
        } catch (prError) {
          if (prError.code === POSTGRES.UNIQUE_VIOLATION) {
            // Unique constraint on activity_events - skip duplicate
            continue;
          }
          console.error(`Error processing PR #${prNumber} (id ${prId}):`, prError.message);
        }
      }

      if (shouldStopPagination || items.length < perPage) {
        break;
      }
      page += 1;
    } catch (apiError) {
      console.error('Error fetching PRs from GitHub API:', apiError.message);
      if (apiError.response) {
        console.error('GitHub API status:', apiError.response.status);
        console.error('GitHub API response:', apiError.response.data);
        if (apiError.response.status === GITHUB.VALIDATION_FAILED) {
          const msg = apiError.response.data?.message || 'Validation Failed';
          const hint =
            'Your token may not have access to this repository, or the repo owner/name may be invalid.';
          const err = new Error(`${msg}. ${hint}`);
          err.statusCode = GITHUB.VALIDATION_FAILED;
          err.githubResponse = apiError.response.data;
          throw err;
        }
      }
      throw apiError;
    }
  }

  // Update last_prs_sync_at only after successful sync
  await pool.query(
    'UPDATE repos SET last_prs_sync_at = NOW() WHERE github_repo_id = $1',
    [repoId]
  );

  return totalProcessed;
}

module.exports = {
  syncPRs,
};
