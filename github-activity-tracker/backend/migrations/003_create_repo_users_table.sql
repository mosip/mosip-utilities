-- Create repo_users table
CREATE TABLE IF NOT EXISTS repo_users (
  repo_id BIGINT NOT NULL,
  user_id INTEGER NOT NULL,
  commits_count INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP,
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (repo_id, user_id),
  FOREIGN KEY (repo_id) REFERENCES repos(github_repo_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES github_users(id) ON DELETE CASCADE
);

-- Create index on repo_id for faster queries
CREATE INDEX IF NOT EXISTS idx_repo_users_repo_id ON repo_users(repo_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_repo_users_user_id ON repo_users(user_id);
