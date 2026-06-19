-- Owner-ops (Backend Master Plan, Step 2): inbound lead funnel + admin invites
-- + moderation audit. This is the keystone that finally gives owner_business a
-- UI writer: an admin invites an email -> business, and ownership binds when
-- that exact email logs in via magic link (claim-time binding, see invites.ts).

-- Inbound business-listing applications (replaces the mailto: /aanmelden flow).
CREATE TABLE IF NOT EXISTS leads (
  id            TEXT PRIMARY KEY,
  business_id   TEXT,                    -- optional: a claim of an existing seed id
  business_name TEXT NOT NULL,
  contact_name  TEXT NOT NULL,
  email         TEXT NOT NULL,           -- lowercased
  phone         TEXT,
  address       TEXT,
  story         TEXT,
  instagram     TEXT,
  consent_text  TEXT NOT NULL,           -- exact consent copy shown (audit proof)
  consent_at    INTEGER NOT NULL,
  confirm_token TEXT,                    -- double-opt-in
  confirmed_at  INTEGER,
  status        TEXT NOT NULL DEFAULT 'new', -- new|confirmed|approved|rejected|converted
  source        TEXT,                    -- 'web' | 'qr' | 'owner:<id>'
  created_at    INTEGER NOT NULL,
  reviewed_by   TEXT,
  reviewed_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email  ON leads(email);

-- Single-use claim invite. Ownership binds only when this exact email logs in.
CREATE TABLE IF NOT EXISTS owner_invites (
  token       TEXT PRIMARY KEY,          -- 64-hex
  email       TEXT NOT NULL,             -- lowercased; ownership binds on email match
  business_id TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,          -- +14 days
  claimed_at  INTEGER,                   -- set once (idempotent)
  created_by  TEXT NOT NULL,             -- admin profile id
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invites_email ON owner_invites(email);

-- Immutable audit of every moderation decision (approve/reject/invite/claim/purge).
CREATE TABLE IF NOT EXISTS moderation_log (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT NOT NULL,             -- profile id or 'system'
  action      TEXT NOT NULL,             -- 'invite'|'claim'|'approve_lead'|'reject_lead'|...
  target_type TEXT NOT NULL,             -- 'business'|'lead'|'override'|'media'|...
  target_id   TEXT NOT NULL,
  business_id TEXT,
  detail      TEXT,                      -- JSON
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_modlog_target ON moderation_log(target_type, target_id);

-- Lets us look up the owners of a business (admin "who owns this?").
CREATE INDEX IF NOT EXISTS idx_owner_business_business ON owner_business(business_id);

-- NOTE: the plan's moderation claim-lock columns + nudge_log are deferred to the
-- owner-ops moderation/freshness milestones that actually use them.
