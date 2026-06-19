-- Launch hardening (Backend Master Plan, Step 1).
-- A single generic sliding-window rate limiter. The plan sketched two identical
-- tables (login_throttle + rate_limit); they have the same shape, so this
-- consolidates them into one, scoped by key (e.g. 'login:email:<addr>').
-- Defence-in-depth alongside Turnstile + the Cloudflare WAF.
CREATE TABLE IF NOT EXISTS rate_limit (
  key          TEXT PRIMARY KEY,        -- '<scope>:<identifier>', e.g. 'login:email:foo@bar.nl'
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL         -- epoch-ms when the current window opened
);
-- Supports the nightly prune of stale windows (DELETE WHERE window_start < ?).
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit(window_start);
