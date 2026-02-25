-- GitHub users (committers, PR authors, reviewers). id = internal PK; github_user_id = GitHub API user id.
CREATE TABLE IF NOT EXISTS github_users (
  id SERIAL PRIMARY KEY,
  github_user_id BIGINT UNIQUE NOT NULL,
  login VARCHAR(255),
  avatar_url TEXT,
  html_url TEXT,
  type VARCHAR(50),
  inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on github_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_github_users_github_user_id ON github_users(github_user_id);

-- Create index on login for faster queries
CREATE INDEX IF NOT EXISTS idx_github_users_login ON github_users(login);
