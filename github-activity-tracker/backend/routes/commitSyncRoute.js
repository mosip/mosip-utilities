const express = require('express');
const pool = require('../db/db');
const { syncCommits } = require('../services/commitSyncService');

const router = express.Router();

// POST /admin/sync/commits - syncs commits for all repositories in database
router.post('/admin/sync/commits', async (req, res) => {
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

      // Small delay between repos to avoid rate limits (except for the last one)
      if (i < repos.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    return res.json({
      status: 'success',
      repos_processed: reposProcessed,
      total_repos: totalRepos,
      commits_processed: totalCommitsProcessed,
    });
  } catch (error) {
    console.error('Error syncing commits:', error);
    console.error('Error stack:', error.stack);

    // Handle specific error cases
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
        repos_processed: 0,
        commits_processed: 0,
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Failed to sync commits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      repos_processed: 0,
      commits_processed: 0,
    });
  }
});

module.exports = router;
