/**
 * Route: POST /admin/sync/repos
 * Syncs all public repositories for a GitHub organization into the repos table.
 * Body: { "org": "owner" } (e.g. { "org": "mosip" }).
 */
const express = require('express');
const { syncRepos } = require('../services/syncRepos');

const router = express.Router();

router.post('/admin/sync/repos', async (req, res) => {
  const { org } = req.body || {};

  if (!org) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required field: org',
      repos_processed: 0,
    });
  }

  try {
    const reposProcessed = await syncRepos(org);

    return res.json({
      status: 'success',
      repos_processed: reposProcessed,
    });
  } catch (error) {
    console.error('Error syncing repositories:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to sync repositories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      repos_processed: 0,
    });
  }
});

module.exports = router;
