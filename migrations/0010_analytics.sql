-- Step 10 (analytics): cookieless, consent-free event collector. visitor_hash is
-- a daily-salted HMAC of IP+UA — not linkable across days, no PII stored.
CREATE TABLE IF NOT EXISTS analytics_events (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,          -- pageview|action_click|claim|newsletter_confirm|giftcard_paid|review_scan|story_view|search
  business_id  TEXT,
  visitor_hash TEXT,                   -- daily-salted; NULL for server events
  detail       TEXT,                   -- JSON
  created_at   INTEGER NOT NULL        -- prune to ≤ ~35 days
);
CREATE INDEX IF NOT EXISTS idx_aevt_time ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_aevt_type ON analytics_events(type, created_at);
