-- One row per activity event (commit, pr, review). event_type + event_id = unique per event.
-- created_at = when the event happened on GitHub; inserted_at = when we stored it in DB.
CREATE TABLE IF NOT EXISTS activity_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  repo_id BIGINT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  html_url TEXT,
  inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repo_id) REFERENCES repos(github_repo_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES github_users(id) ON DELETE CASCADE,
  UNIQUE (event_type, event_id)
);

-- Create index on event_type and event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_events_event_type_event_id ON activity_events(event_type, event_id);

-- Create index on repo_id for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_events_repo_id ON activity_events(repo_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at);
