-- Repositories synced from GitHub (one row per repo).
-- github_repo_id = GitHub API repo id; last_*_sync_at used for incremental sync.
CREATE TABLE IF NOT EXISTS repos (
  github_repo_id BIGINT PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(500) NOT NULL,
  inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_commits_sync_at TIMESTAMP,
  last_prs_sync_at TIMESTAMP,
  last_reviews_sync_at TIMESTAMP
);

-- Create index on owner for faster queries
CREATE INDEX IF NOT EXISTS idx_repos_owner ON repos(owner);

-- Create index on name for faster queries
CREATE INDEX IF NOT EXISTS idx_repos_name ON repos(name);
