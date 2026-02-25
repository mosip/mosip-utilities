/**
 * Route: POST /admin/sync/repos
 * Syncs all public repositories for a GitHub organization into the repos table.
 * Body: { "org": "owner" } (e.g. { "org": "mosip" }).
 */
const express = require('express');
const { syncRepos } = require('../services/syncRepos');
const { HTTP, STATUS } = require('../config/errorCodes');

const router = express.Router();

router.post('/admin/sync/repos', async (req, res) => {
  const { org } = req.body || {};

  if (!org) {
    return res.status(HTTP.BAD_REQUEST).json({
      status: STATUS.ERROR,
      message: 'Missing required field: org',
      repos_processed: 0,
    });
  }

  try {
    const reposProcessed = await syncRepos(org);

    return res.json({
      status: STATUS.SUCCESS,
      repos_processed: reposProcessed,
    });
  } catch (error) {
    console.error('Error syncing repositories:', error);
    console.error('Error stack:', error.stack);
    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({
      status: STATUS.ERROR,
      message: 'Failed to sync repositories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      repos_processed: 0,
    });
  }
});

module.exports = router;
