/**
 * Axios instance for GitHub REST API. Uses GITHUB_TOKEN from .env for authentication.
 * Use for endpoints like /repos/:owner/:repo/commits, /orgs/:org/repos, /search/issues.
 */
const axios = require('axios');
require('dotenv').config();

const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  },
});

module.exports = githubClient;
