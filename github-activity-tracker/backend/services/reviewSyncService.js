const axios = require('axios');
require('dotenv').config();
const pool = require('../db/dbPool');
const { POSTGRES } = require('../config/errorCodes');

const GRAPHQL_URL = 'https://api.github.com/graphql';
const PR_PAGE_SIZE = 50;
const REVIEW_PAGE_SIZE = 100;

/**
 * Run a GitHub GraphQL query. Uses GITHUB_TOKEN (Bearer). Throws if response contains errors.
 */
async function graphql(query, variables = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for GraphQL API');
  const { data } = await axios.post(
    GRAPHQL_URL,
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (data.errors && data.errors.length) {
    const err = new Error(data.errors.map((e) => e.message).join('; '));
    err.graphqlErrors = data.errors;
    throw err;
  }
  return data.data;
}

// Fetch one page of PRs with their reviews (for counting and event creation)
const QUERY_PR_PAGE = `
  query($owner: String!, $name: String!, $prCursor: String, $prFirst: Int!, $reviewFirst: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: $prFirst, after: $prCursor, orderBy: {field: CREATED_AT, direction: DESC}) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          url
          author { login }
          reviews(first: $reviewFirst) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              submittedAt
              author {
                login
                ... on User { databaseId avatarUrl url }
                ... on Bot { databaseId avatarUrl url }
              }
            }
          }
        }
      }
    }
  }
`;

// Fetch next page of reviews for a single PR (when a PR has many reviews)
const QUERY_PR_REVIEWS_PAGE = `
  query($prId: ID!, $reviewCursor: String, $reviewFirst: Int!) {
    node(id: $prId) {
      ... on PullRequest {
        reviews(first: $reviewFirst, after: $reviewCursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            submittedAt
            author {
              login
              ... on User { databaseId avatarUrl url }
              ... on Bot { databaseId avatarUrl url }
            }
          }
        }
      }
    }
  }
`;

/**
 * Sync PR reviews for a single repository using GitHub GraphQL API.
 * - Fetches PRs and their reviews with pagination
 * - Ignores reviews where reviewer is the PR author
 * - Upserts reviewers into github_users and repo_users (reviews_count)
 * - Inserts review events into activity_events
 *
 * @param {number|string} repoId - The github_repo_id from the repos table
 * @returns {Promise<number>} Total number of reviews processed
 */
async function syncReviews(repoId) {
  if (!repoId) {
    throw new Error('Repository ID is required for syncReviews');
  }

  const repoResult = await pool.query(
    'SELECT owner, name, last_reviews_sync_at FROM repos WHERE github_repo_id = $1',
    [repoId]
  );
  if (repoResult.rows.length === 0) {
    throw new Error(`Repository with ID ${repoId} not found`);
  }

  const { owner, name, last_reviews_sync_at } = repoResult.rows[0];
  if (!owner || !name) {
    throw new Error(`Repository ${repoId} missing owner or name`);
  }

  // Determine since date: use last_reviews_sync_at if exists, otherwise 1 year ago
  let sinceDate = null;
  if (last_reviews_sync_at) {
    sinceDate = new Date(last_reviews_sync_at);
  } else {
    sinceDate = new Date();
    sinceDate.setFullYear(sinceDate.getFullYear() - 1);
  }

  let totalProcessed = 0;
  let prCursor = null;

  // Paginate pull requests
  while (true) {
    const prVariables = {
      owner,
      name,
      prFirst: PR_PAGE_SIZE,
      prCursor: prCursor || null,
      reviewFirst: REVIEW_PAGE_SIZE,
    };

    const data = await graphql(QUERY_PR_PAGE, prVariables);
    const repo = data?.repository;
    if (!repo) break;

    const prConnection = repo.pullRequests;
    const prs = prConnection?.nodes || [];
    const prPageInfo = prConnection?.pageInfo || {};

    for (const pr of prs) {
      const prAuthorLogin = pr.author?.login || null;
      const prUrl = pr.url || null;

      let reviewCursor = null;
      let reviews = pr.reviews?.nodes || [];
      let reviewPageInfo = pr.reviews?.pageInfo || {};

      // Paginate reviews for this PR
      while (true) {
        for (const review of reviews) {
          const reviewer = review.author;
          if (!reviewer || !reviewer.login) continue;
          // Don't count self-reviews (author reviewing their own PR)
          if (prAuthorLogin && reviewer.login === prAuthorLogin) continue;

          const githubUserId = reviewer.databaseId;
          if (githubUserId == null) continue;

          const submittedAt = review.submittedAt;
          if (!submittedAt) continue;

          // Filter by since date if provided
          if (sinceDate) {
            const reviewDate = new Date(submittedAt);
            if (reviewDate < sinceDate) continue;
          }

          try {
            const login = reviewer.login;
            const avatarUrl = reviewer.avatarUrl || null;
            const htmlUrl = reviewer.url || null;
            const type = reviewer.__typename === 'Bot' ? 'Bot' : 'User';

            // Upsert reviewer into github_users
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
              [githubUserId, login, avatarUrl, htmlUrl, type]
            );
            const userId = userResult.rows[0].id;

            // Upsert into repo_users: increment reviews_count, update first_seen_at / last_seen_at
            await pool.query(
              `
              INSERT INTO repo_users (repo_id, user_id, reviews_count, first_seen_at, last_seen_at)
              VALUES ($1, $2, 1, $3, $3)
              ON CONFLICT (repo_id, user_id)
              DO UPDATE SET
                reviews_count = repo_users.reviews_count + 1,
                last_seen_at = GREATEST(repo_users.last_seen_at, EXCLUDED.last_seen_at),
                first_seen_at = LEAST(COALESCE(repo_users.first_seen_at, EXCLUDED.first_seen_at), EXCLUDED.first_seen_at)
            `,
              [repoId, userId, submittedAt]
            );

            // Insert into activity_events; unique on (event_type, event_id)
            await pool.query(
              `
              INSERT INTO activity_events (event_type, event_id, repo_id, user_id, html_url, created_at)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (event_type, event_id)
              DO UPDATE SET html_url = COALESCE(activity_events.html_url, EXCLUDED.html_url)
            `,
              ['review', String(review.id), repoId, userId, prUrl, submittedAt]
            );

            totalProcessed += 1;
          } catch (err) {
            if (err.code === POSTGRES.UNIQUE_VIOLATION) continue;
            console.error(`Error processing review ${review.id}:`, err.message);
          }
        }

        if (!reviewPageInfo.hasNextPage) break;
        reviewCursor = reviewPageInfo.endCursor;

        const reviewData = await graphql(QUERY_PR_REVIEWS_PAGE, {
          prId: pr.id,
          reviewCursor,
          reviewFirst: REVIEW_PAGE_SIZE,
        });
        const node = reviewData?.node;
        if (!node || !node.reviews) break;
        reviews = node.reviews.nodes || [];
        reviewPageInfo = node.reviews.pageInfo || {};
      }
    }

    if (!prPageInfo.hasNextPage) break;
    prCursor = prPageInfo.endCursor;
  }

  // Mark repo as synced for incremental runs
  await pool.query(
    'UPDATE repos SET last_reviews_sync_at = NOW() WHERE github_repo_id = $1',
    [repoId]
  );

  return totalProcessed;
}

module.exports = {
  syncReviews,
};
