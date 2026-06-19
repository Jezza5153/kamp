-- Step 4 (agenda): D1-backed events that MERGE with the curated seed
-- (src/data/events.ts). Same shape as KampEvent so /agenda renders + emits Event
-- JSON-LD for them uniformly. Admin-curated now; owner submission is a later add.
CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,        -- De Kamp|Markt|Koopzondag|Festival|Cultuur|Seizoen
  recurring    TEXT,                 -- Dutch recurrence text, e.g. "Elke vrijdag"
  when_text    TEXT NOT NULL,
  start_date   TEXT,                 -- ISO yyyy-mm-dd (drives Event JSON-LD)
  end_date     TEXT,
  where_text   TEXT NOT NULL,
  description  TEXT NOT NULL,
  url          TEXT,                 -- http(s) only — validated on write (no javascript: URIs)
  business_id  TEXT,                 -- optional link to a seed business
  status       TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  submitted_by TEXT,
  submitted_at INTEGER NOT NULL,
  reviewed_by  TEXT,
  reviewed_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status, start_date);
