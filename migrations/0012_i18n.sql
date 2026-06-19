-- Step 8 (i18n) — translation store. Approved owner text (NL) is the source;
-- machine (DeepL) EN translations are merged on read when locale=en. source_hash
-- detects drift: when the NL source changes, the EN row is marked stale.
CREATE TABLE IF NOT EXISTS business_translations (
  business_id TEXT NOT NULL,
  locale      TEXT NOT NULL,           -- 'en'
  field       TEXT NOT NULL,           -- shortDescription | longDescription | subcategory
  value       TEXT NOT NULL,
  source_hash TEXT NOT NULL,           -- SHA-256 of the NL source at translate time
  status      TEXT NOT NULL DEFAULT 'machine', -- machine | reviewed | rejected
  stale       INTEGER NOT NULL DEFAULT 0,
  engine      TEXT,                    -- 'deepl'
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (business_id, locale, field)
);
CREATE INDEX IF NOT EXISTS idx_biztrans_serve ON business_translations(locale, status, stale);
