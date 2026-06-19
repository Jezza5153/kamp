-- Step 7 (cadeaukaart): append-only gift-card ledger. Balance is ALWAYS
-- SUM(gift_card_ledger.amount_cents) — never a mutable balance column.
-- ⚠️ LEGALLY GATED: do not operate live until the stichting/KvK, ring-fenced
-- account, Mollie live approval, and PSD2 + voucher-VAT sign-off exist. The code
-- is fail-soft (no Mollie key = no payments) so this schema is safe to apply.
CREATE TABLE IF NOT EXISTS gift_cards (
  id                TEXT PRIMARY KEY,
  code_hash         TEXT NOT NULL UNIQUE,   -- SHA-256(code); only last4 ever in clear
  last4             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'draft', -- draft|issued|expired|void
  initial_cents     INTEGER NOT NULL,       -- €10–€150
  buyer_email       TEXT,
  mollie_payment_id TEXT,
  expires_at        INTEGER,
  created_at        INTEGER NOT NULL
);

-- THE source of truth. +amount on issue, -amount on redeem. Never updated.
CREATE TABLE IF NOT EXISTS gift_card_ledger (
  id                   TEXT PRIMARY KEY,
  gift_card_id         TEXT NOT NULL REFERENCES gift_cards(id),
  amount_cents         INTEGER NOT NULL,    -- +issue, -redeem, -void
  kind                 TEXT NOT NULL,       -- issue|redeem|void
  idempotency_key      TEXT NOT NULL UNIQUE,
  merchant_business_id TEXT,                -- set on redeem (from the till session)
  created_at           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gcledger_card ON gift_card_ledger(gift_card_id);

CREATE TABLE IF NOT EXISTS redemptions (
  id                   TEXT PRIMARY KEY,
  gift_card_id         TEXT NOT NULL REFERENCES gift_cards(id),
  merchant_business_id TEXT NOT NULL,
  amount_cents         INTEGER NOT NULL,
  ledger_id            TEXT NOT NULL,
  payout_id            TEXT,                -- stamped when settled (prevents double-pay)
  created_at           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_redemptions_merchant ON redemptions(merchant_business_id, payout_id);

-- Which businesses may redeem (onboarded merchants + payout IBAN).
CREATE TABLE IF NOT EXISTS gift_card_merchants (
  business_id  TEXT PRIMARY KEY,
  iban         TEXT NOT NULL,
  display_name TEXT NOT NULL,
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   INTEGER NOT NULL
);

-- Mollie webhook idempotency/dedupe.
CREATE TABLE IF NOT EXISTS gift_card_webhook_events (
  payment_id   TEXT PRIMARY KEY,
  status       TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);
