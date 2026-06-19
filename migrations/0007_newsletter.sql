-- Step 5 (newsletter): self-hosted on Resend + D1. GDPR double-opt-in with a
-- consent record + an immutable subscriber event trail. No third-party ESP.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,    -- lowercased
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|confirmed|unsubscribed|bounced
  confirm_token TEXT NOT NULL,
  unsub_token   TEXT NOT NULL,           -- stable; powers one-click unsubscribe
  consent_text  TEXT NOT NULL,           -- exact opt-in copy shown (audit proof)
  consent_at    INTEGER NOT NULL,
  source        TEXT,                    -- 'footer' | 'owner:<id>' | ...
  created_at    INTEGER NOT NULL,
  confirmed_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_nl_status ON newsletter_subscribers(status);

-- Consent/audit trail (Art. 7(1)). Cascades when the subscriber is erased.
CREATE TABLE IF NOT EXISTS subscriber_events (
  id            TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  event         TEXT NOT NULL,           -- subscribe|confirm|unsubscribe|bounce
  detail        TEXT,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subevent_sub ON subscriber_events(subscriber_id);
