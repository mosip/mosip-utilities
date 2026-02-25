const express = require('express');
const pool = require('../db/db');
const { syncPRs } = require('../services/prSyncService');

const router = express.Router();

// POST /admin/sync/prs - syncs PRs for all repositories in database
router.post('/admin/sync/prs', async (req, res) => {
  try {
    // Fetch all repositories from database
    const reposResult = await pool.query(
      'SELECT github_repo_id, owner, name, full_name FROM repos ORDER BY github_repo_id'
    );

    const repos = reposResult.rows;
    const totalRepos = repos.length;

    if (totalRepos === 0) {
      return res.json({
        status: 'success',
        message: 'No repositories found in database',
        repos_processed: 0,
        prs_processed: 0,
      });
    }

    let totalPRsProcessed = 0;
    let reposProcessed = 0;

    // Process each repository
    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      const repoId = repo.github_repo_id;
      const repoName = repo.full_name || `${repo.owner}/${repo.name}`;

      try {
        console.log(`[${i + 1}/${totalRepos}] Syncing PRs for ${repoName} (ID: ${repoId})`);
        const prsProcessed = await syncPRs(repoId);
        totalPRsProcessed += prsProcessed;
        reposProcessed += 1;
        console.log(`✓ Completed ${repoName}: ${prsProcessed} PRs`);
      } catch (repoError) {
        console.error(`✗ Error syncing PRs for ${repoName}:`, repoError.message);
        // Continue with next repo instead of failing completely
        continue;
      }

      // Small delay between repos to avoid rate limits (except for the last one)
      if (i < repos.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    return res.json({
      status: 'success',
      repos_processed: reposProcessed,
      total_repos: totalRepos,
      prs_processed: totalPRsProcessed,
    });
  } catch (error) {
    console.error('Error syncing PRs:', error);
    console.error('Error stack:', error.stack);

    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        prs_processed: 0,
      });
    }

    const is422 = error.statusCode === 422 || error.response?.status === 422;
    if (is422) {
      const message =
        error.message ||
        error.response?.data?.message ||
        'GitHub rejected the search request (validation failed). Your token may not have access to this repository.';
      return res.status(422).json({
        status: 'error',
        message,
        prs_processed: 0,
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Failed to sync pull requests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      prs_processed: 0,
    });
  }
});

module.exports = router;
