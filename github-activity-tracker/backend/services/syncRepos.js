const githubClient = require('../utils/githubClient');
const pool = require('../db/dbPool');

/**
 * Sync all public repositories for a GitHub organization into the `repos` table.
 * - Uses /orgs/{org}/repos with per_page=100 and page for pagination
 * - Upserts on github_repo_id
 * - Requires migrations to be run first (e.g. npm run migrate) so the repos table exists.
 *
 * @param {string} org GitHub organization login (e.g., "mosip")
 * @returns {Promise<number>} total number of repos processed
 */
async function syncRepos(org) {
  if (!org) {
    throw new Error('Organization name is required for syncRepos');
  }

  const perPage = 100;
  let page = 1;
  let totalProcessed = 0;

  // Paginate through all public repos for the org (GitHub returns up to 100 per page)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      console.log(`Fetching repos for org: ${org}, page: ${page}`);
      const response = await githubClient.get(`/orgs/${org}/repos`, {
        params: {
          per_page: perPage,
          page,
          type: 'public',
        },
      });

      const repos = response.data || [];
      console.log(`Fetched ${repos.length} repos from GitHub API`);

      if (!Array.isArray(repos) || repos.length === 0) {
        console.log(`No more repos found. Total processed: ${totalProcessed}`);
        break;
      }

      console.log(`Processing ${repos.length} repos from page ${page}`);

      for (const repo of repos) {
        console.log(`Processing repo: ${repo.full_name} (ID: ${repo.id})`);
        try {
          const {
            id: github_repo_id,
            owner,
            name,
            full_name,
          } = repo;

          const ownerLogin = owner && owner.login ? owner.login : null;

          // Insert or update by GitHub repo id so re-syncs stay idempotent
          await pool.query(
            `
              INSERT INTO repos (github_repo_id, owner, name, full_name)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (github_repo_id)
              DO UPDATE SET
                owner = EXCLUDED.owner,
                name = EXCLUDED.name,
                full_name = EXCLUDED.full_name;
            `,
            [github_repo_id, ownerLogin, name, full_name]
          );

          totalProcessed += 1;
        } catch (dbError) {
          console.error(
            `Error inserting repo ${repo.full_name || repo.name || repo.id}:`,
            dbError.message
          );
          console.error('Repo data:', JSON.stringify(repo, null, 2));
          throw dbError;
        }
      }

      if (repos.length < perPage) {
        console.log(`Reached last page. Total processed: ${totalProcessed}`);
        break;
      }

      page += 1;
    } catch (apiError) {
      console.error(`Error fetching repos from GitHub API:`, apiError.message);
      if (apiError.response) {
        console.error(`GitHub API status: ${apiError.response.status}`);
        console.error(`GitHub API response:`, apiError.response.data);
      }
      throw apiError;
    }
  }

  return totalProcessed;
}

module.exports = {
  syncRepos,
};

