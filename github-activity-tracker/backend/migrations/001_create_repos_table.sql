-- Create repos table
CREATE TABLE IF NOT EXISTS repos (
  github_repo_id BIGINT PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on owner for faster queries
CREATE INDEX IF NOT EXISTS idx_repos_owner ON repos(owner);

-- Create index on name for faster queries
CREATE INDEX IF NOT EXISTS idx_repos_name ON repos(name);
