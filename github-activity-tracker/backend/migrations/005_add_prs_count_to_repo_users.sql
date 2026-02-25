-- Add prs_count to repo_users for PR sync
ALTER TABLE repo_users
  ADD COLUMN IF NOT EXISTS prs_count INTEGER DEFAULT 0;
