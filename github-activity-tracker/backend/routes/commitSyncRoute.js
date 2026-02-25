/**
 * Route: POST /admin/sync/commits
 * Syncs commits for every repository already in the repos table. No body required.
 * Calls syncCommits(repoId) per repo with a short delay between repos to reduce rate-limit risk.
 */
const express = require('express');
const pool = require('../db/dbPool');
const { syncCommits } = require('../services/commitSyncService');
const { HTTP, STATUS } = require('../config/errorCodes');
const { DELAY_BETWEEN_REPOS_MS } = require('../config/syncConfig');

const router = express.Router();

router.post('/admin/sync/commits', async (req, res) => {
  try {
    // Load all repos; sync runs only for repos already in DB (run /admin/sync/repos first)
    const reposResult = await pool.query(
      'SELECT github_repo_id, owner, name, full_name FROM repos ORDER BY github_repo_id'
    );

    const repos = reposResult.rows;
    const totalRepos = repos.length;

    if (totalRepos === 0) {
      return res.json({
        status: STATUS.SUCCESS,
        message: 'No repositories found in database',
        repos_processed: 0,
        commits_processed: 0,
      });
    }

    let totalCommitsProcessed = 0;
    let reposProcessed = 0;

    // Process each repository
    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      const repoId = repo.github_repo_id;
      const repoName = repo.full_name || `${repo.owner}/${repo.name}`;

      try {
        console.log(`[${i + 1}/${totalRepos}] Syncing commits for ${repoName} (ID: ${repoId})`);
        const commitsProcessed = await syncCommits(repoId);
        totalCommitsProcessed += commitsProcessed;
        reposProcessed += 1;
        console.log(`✓ Completed ${repoName}: ${commitsProcessed} commits`);
      } catch (repoError) {
        console.error(`✗ Error syncing commits for ${repoName}:`, repoError.message);
        // Continue with next repo instead of failing completely
        continue;
      }

      if (i < repos.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REPOS_MS));
      }
    }

    return res.json({
      status: STATUS.SUCCESS,
      repos_processed: reposProcessed,
      total_repos: totalRepos,
      commits_processed: totalCommitsProcessed,
    });
  } catch (error) {
    console.error('Error syncing commits:', error);
    console.error('Error stack:', error.stack);

    if (error.message && error.message.includes('not found')) {
      return res.status(HTTP.NOT_FOUND).json({
        status: STATUS.ERROR,
        message: error.message,
        repos_processed: 0,
        commits_processed: 0,
      });
    }

    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({
      status: STATUS.ERROR,
      message: 'Failed to sync commits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      repos_processed: 0,
      commits_processed: 0,
    });
  }
});

module.exports = router;
