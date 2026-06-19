-- Step 6 (owner-story): editorial long-form profiles of De Kamp makers.
-- Admin/editor-authored, stored in D1. body is plain text (blank-line-separated
-- paragraphs), rendered React-escaped — no HTML/markdown injection surface.
CREATE TABLE IF NOT EXISTS stories (
  id            TEXT PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  dek           TEXT,                 -- short answer-first lede (good for AEO)
  body          TEXT NOT NULL,        -- plain text; paragraphs split on blank lines
  hero_url      TEXT,                 -- optional image (http(s) or /media/… path)
  status        TEXT NOT NULL DEFAULT 'draft', -- draft|published|archived
  author        TEXT,                 -- display name (E-E-A-T)
  author_id     TEXT,                 -- profile id (audit)
  published_at  INTEGER,
  date_modified INTEGER,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status, published_at);

-- Which businesses a story features (links story <-> seed business ids).
CREATE TABLE IF NOT EXISTS story_business (
  story_id    TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  PRIMARY KEY (story_id, business_id)
);
CREATE INDEX IF NOT EXISTS idx_story_business_biz ON story_business(business_id);
