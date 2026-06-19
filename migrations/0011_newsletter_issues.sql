-- Step 5b (newsletter sending): issues + a per-recipient delivery ledger so a
-- send is idempotent and resumable (re-running skips already-sent recipients).
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id         TEXT PRIMARY KEY,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,           -- plain text; blank-line-separated paragraphs
  status     TEXT NOT NULL DEFAULT 'draft', -- draft|sending|sent
  created_by TEXT,
  created_at INTEGER NOT NULL,
  sent_at    INTEGER
);

CREATE TABLE IF NOT EXISTS newsletter_deliveries (
  issue_id      TEXT NOT NULL REFERENCES newsletter_issues(id) ON DELETE CASCADE,
  subscriber_id TEXT NOT NULL REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'sent', -- sent|failed
  sent_at       INTEGER,
  PRIMARY KEY (issue_id, subscriber_id)
);
