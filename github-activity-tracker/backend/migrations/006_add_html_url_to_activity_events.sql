-- Add html_url to activity_events to store links for events (e.g., PR URL)
ALTER TABLE activity_events
  ADD COLUMN IF NOT EXISTS html_url TEXT;

