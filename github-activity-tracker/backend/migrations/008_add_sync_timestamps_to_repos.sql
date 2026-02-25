-- Add sync timestamp columns to repos table for incremental sync
ALTER TABLE repos
  ADD COLUMN IF NOT EXISTS last_commits_sync_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_prs_sync_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_reviews_sync_at TIMESTAMP;
