-- Add reviews_count to repo_users for PR review sync
ALTER TABLE repo_users
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
