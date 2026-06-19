-- Step 3 (Google reviews) — buildable slice: place_id seam + review-acquisition
-- funnel. ToS-critical: place_id is the ONLY Google-derived value persisted;
-- review text / author / per-review rating are NEVER stored. The OAuth + cached
-- aggregate columns exist for the (GBP-API-approval-gated) connect flow but stay
-- unused until that access is granted.
CREATE TABLE IF NOT EXISTS business_google (
  business_id          TEXT PRIMARY KEY,
  place_id             TEXT,             -- cache-exempt per Places policy
  gbp_account_id       TEXT,
  gbp_location_id      TEXT,
  gbp_connected        INTEGER NOT NULL DEFAULT 0,
  oauth_refresh_enc    TEXT,             -- AES-GCM(refresh token) — set on connect (deferred)
  oauth_scope          TEXT,
  token_expires_at     INTEGER,
  cached_rating        REAL,             -- a NUMBER (a fact), never review text
  cached_count         INTEGER,
  last_synced          INTEGER,
  review_link_override TEXT,             -- manual Maps URL if the deep-link fails
  updated_at           INTEGER NOT NULL
);

-- Review-acquisition funnel: opaque tokens behind QR cards / short links.
CREATE TABLE IF NOT EXISTS review_requests (
  token        TEXT PRIMARY KEY,
  business_id  TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  scanned_at   INTEGER,
  converted_at INTEGER                   -- best-effort; reviews are off-site
);
CREATE INDEX IF NOT EXISTS idx_reviewreq_biz ON review_requests(business_id);

-- OAuth CSRF state for the deferred GBP connect flow (+10 min TTL).
CREATE TABLE IF NOT EXISTS oauth_states (
  state       TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  profile_id  TEXT NOT NULL,
  expires_at  INTEGER NOT NULL
);
