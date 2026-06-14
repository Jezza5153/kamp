-- De Kamp backend — D1 schema (auth + owner editing + moderation).
-- The businesses themselves stay in src/data/businesses.ts (the seed); this DB
-- only stores logins, ownership links, pending/approved overrides, media, tokens.

-- Logins (owners + admins)
CREATE TABLE IF NOT EXISTS profiles (
  id          TEXT PRIMARY KEY,                 -- uuid
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'owner',     -- 'owner' | 'admin'
  created_at  INTEGER NOT NULL
);

-- Which business(es) a profile may edit (many-to-many supports owner + manager)
CREATE TABLE IF NOT EXISTS owner_business (
  profile_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,                     -- references the seed business id
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (profile_id, business_id)
);

-- Field edits — never touch the live value; merged on read only when approved.
CREATE TABLE IF NOT EXISTS business_overrides (
  id           TEXT PRIMARY KEY,                 -- uuid
  business_id  TEXT NOT NULL,
  fields       TEXT NOT NULL,                    -- JSON of changed fields
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  submitted_by TEXT,
  submitted_at INTEGER NOT NULL,
  reviewed_by  TEXT,
  reviewed_at  INTEGER,
  reason       TEXT
);
CREATE INDEX IF NOT EXISTS idx_overrides_business ON business_overrides(business_id, status);

-- Uploaded photos (land private + pending; promoted to public bucket on approve).
CREATE TABLE IF NOT EXISTS business_media (
  id           TEXT PRIMARY KEY,
  business_id  TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'hero',     -- hero | gallery
  r2_key       TEXT NOT NULL,
  public_url   TEXT,                             -- set on approval
  status       TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  submitted_by TEXT,
  submitted_at INTEGER NOT NULL,
  reviewed_by  TEXT,
  reviewed_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_media_business ON business_media(business_id, status);

-- One-time magic-link tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  token       TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  used        INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

-- Server-side sessions (cookie holds the session id)
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  profile_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_profile ON sessions(profile_id);
