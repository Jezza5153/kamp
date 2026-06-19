import { getDB, type D1Database } from "@/lib/cf";
import { getMollieKey, getConfiguredSiteUrl } from "@/lib/settings";

/**
 * Kamp Cadeaukaart — append-only ledger core (migration 0009). Balance is always
 * SUM(gift_card_ledger.amount_cents). Redemption is overdraw-safe via a single
 * conditional INSERT…SELECT…WHERE (D1 has no interactive transactions).
 *
 * ⚠️ LEGALLY GATED. Mollie payment creation + the webhook are wired but FAIL-SOFT
 * (no MOLLIE_API_KEY = no payment created, nothing issued). Do NOT operate live
 * until the stichting/KvK, ring-fenced account, Mollie live approval, and PSD2 +
 * multi-purpose-voucher-VAT sign-off exist. Codes are SHA-256-hashed at rest.
 */

const MIN_CENTS = 1000; // €10
const MAX_CENTS = 15000; // €150

export function validateAmount(cents: number): boolean {
  return Number.isInteger(cents) && cents >= MIN_CENTS && cents <= MAX_CENTS;
}

/** Human-friendly, unambiguous code (no 0/O/1/I). e.g. KAMP-7QF3-9XTM. */
export function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rnd = new Uint8Array(8);
  crypto.getRandomValues(rnd);
  const body = Array.from(rnd, (b) => alphabet[b % alphabet.length]).join("");
  return `KAMP-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

export async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function balanceCents(db: D1Database, giftCardId: string): Promise<number> {
  const row = await db
    .prepare(`SELECT COALESCE(SUM(amount_cents), 0) AS bal FROM gift_card_ledger WHERE gift_card_id = ?`)
    .bind(giftCardId)
    .first<{ bal: number }>();
  return row?.bal ?? 0;
}

// ---------------------------------------------------------------------------
// Purchase (Mollie — fail-soft until configured + legally cleared)
// ---------------------------------------------------------------------------

/** Create a draft card + a Mollie payment. Returns a checkout URL when Mollie is
 *  configured; otherwise ok:false with reason 'unconfigured' (nothing is issued). */
export async function createGiftCardOrder(
  amountCents: number,
  buyerEmail: string
): Promise<{ ok: boolean; checkoutUrl?: string; reason?: string }> {
  if (!validateAmount(amountCents)) return { ok: false, reason: "bad_amount" };
  const db = await getDB();
  if (!db) return { ok: false, reason: "no_db" };
  const key = await getMollieKey();
  if (!key) return { ok: false, reason: "unconfigured" };

  const code = generateCode();
  const id = crypto.randomUUID();
  const now = Date.now();
  try {
    await db
      .prepare(
        `INSERT INTO gift_cards (id, code_hash, last4, status, initial_cents, buyer_email, created_at)
         VALUES (?, ?, ?, 'draft', ?, ?, ?)`
      )
      .bind(id, await hashCode(code), code.slice(-4), amountCents, buyerEmail.trim().toLowerCase(), now)
      .run();

    const base = (await getConfiguredSiteUrl())?.replace(/\/$/, "") ?? "https://ondernemersvandekamp.nl";
    const res = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: { currency: "EUR", value: (amountCents / 100).toFixed(2) },
        description: `Kamp Cadeaukaart ${code}`,
        redirectUrl: `${base}/cadeaukaart?besteld=1`,
        webhookUrl: `${base}/api/webhooks/mollie`,
        metadata: { giftCardId: id },
      }),
    });
    if (!res.ok) return { ok: false, reason: "mollie_error" };
    const payment = (await res.json()) as { id?: string; _links?: { checkout?: { href?: string } } };
    if (payment.id) {
      await db.prepare(`UPDATE gift_cards SET mollie_payment_id = ? WHERE id = ?`).bind(payment.id, id).run();
    }
    const checkoutUrl = payment._links?.checkout?.href;
    return checkoutUrl ? { ok: true, checkoutUrl } : { ok: false, reason: "mollie_error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Mollie webhook: re-fetch the payment (never trust the POST body), verify it's
 *  paid + amount matches the draft, dedupe, then issue the card (idempotently). */
export async function handleMollieWebhook(paymentId: string): Promise<void> {
  const db = await getDB();
  const key = await getMollieKey();
  if (!db || !key || !paymentId) return;
  try {
    // Mollie fires the webhook on EVERY status transition (open → paid …). Always
    // re-fetch the authoritative status; never dedupe before the paid check or a
    // non-paid callback would mask the real paid one (card would never issue).
    const res = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return;
    const payment = (await res.json()) as { status?: string; amount?: { value?: string }; metadata?: { giftCardId?: string } };
    if (payment.status !== "paid") return; // ignore open/expired/failed transitions
    const giftCardId = payment.metadata?.giftCardId;
    if (!giftCardId) return;

    const card = await db
      .prepare(`SELECT id, status, initial_cents FROM gift_cards WHERE id = ?`)
      .bind(giftCardId)
      .first<{ id: string; status: string; initial_cents: number }>();
    if (!card || card.status !== "draft") return; // already issued (replay) or unknown
    const paidCents = Math.round(parseFloat(payment.amount?.value ?? "0") * 100);
    if (paidCents !== card.initial_cents) return; // amount mismatch

    // issueGiftCard is idempotent (draft-only UPDATE + UNIQUE issue:<id> ledger key),
    // so a replayed paid callback is a harmless no-op — no pre-dedupe needed.
    await issueGiftCard(giftCardId, card.initial_cents);
    await db
      .prepare(`INSERT OR IGNORE INTO gift_card_webhook_events (payment_id, status, processed_at) VALUES (?, 'paid', ?)`)
      .bind(paymentId, Date.now())
      .run();
  } catch {
    // swallow — Mollie retries the webhook
  }
}

/** Flip a draft card to issued and write the +amount ledger row. Idempotent via
 *  the ledger's UNIQUE idempotency_key (one issue row per card). */
export async function issueGiftCard(giftCardId: string, amountCents: number): Promise<void> {
  const db = await getDB();
  if (!db) return;
  try {
    await db.batch([
      db.prepare(`UPDATE gift_cards SET status = 'issued' WHERE id = ? AND status = 'draft'`).bind(giftCardId),
      db
        .prepare(
          `INSERT OR IGNORE INTO gift_card_ledger (id, gift_card_id, amount_cents, kind, idempotency_key, created_at)
           VALUES (?, ?, ?, 'issue', ?, ?)`
        )
        .bind(crypto.randomUUID(), giftCardId, amountCents, `issue:${giftCardId}`, Date.now()),
    ]);
  } catch {
    // best effort
  }
}

// ---------------------------------------------------------------------------
// Balance + redemption
// ---------------------------------------------------------------------------

export async function getBalanceByCode(
  code: string
): Promise<{ found: boolean; status?: string; last4?: string; balanceCents?: number }> {
  const db = await getDB();
  if (!db) return { found: false };
  try {
    const card = await db
      .prepare(`SELECT id, status, last4 FROM gift_cards WHERE code_hash = ?`)
      .bind(await hashCode(code))
      .first<{ id: string; status: string; last4: string }>();
    if (!card) return { found: false };
    return { found: true, status: card.status, last4: card.last4, balanceCents: await balanceCents(db, card.id) };
  } catch {
    return { found: false };
  }
}

/** Overdraw-safe redemption. The conditional INSERT only writes when the live
 *  SUM still covers `amountCents`; the UNIQUE idempotency_key blocks double-spend
 *  from a retried till submit. Merchant id comes from the caller's session. */
export async function redeem(
  code: string,
  merchantBusinessId: string,
  amountCents: number,
  idempotencyKey: string
): Promise<{ ok: boolean; balanceCents?: number; reason?: string }> {
  if (!Number.isInteger(amountCents) || amountCents <= 0) return { ok: false, reason: "bad_amount" };
  if (!merchantBusinessId || !idempotencyKey) return { ok: false, reason: "bad_request" };
  const db = await getDB();
  if (!db) return { ok: false, reason: "no_db" };
  try {
    const card = await db
      .prepare(`SELECT id, status FROM gift_cards WHERE code_hash = ?`)
      .bind(await hashCode(code))
      .first<{ id: string; status: string }>();
    if (!card) return { ok: false, reason: "not_found" };
    if (card.status !== "issued") return { ok: false, reason: "not_active" };

    const ledgerId = crypto.randomUUID();
    let row: { id: string } | null;
    try {
      // ONE atomic conditional debit. The ledger IS the settlement source of truth
      // (a redeem row carries merchant_business_id + amount; payout reconciliation
      // reads `gift_card_ledger WHERE kind='redeem'`), so there's no second write to
      // race against.
      row = await db
        .prepare(
          `INSERT INTO gift_card_ledger (id, gift_card_id, amount_cents, kind, idempotency_key, merchant_business_id, created_at)
           SELECT ?, ?, ?, 'redeem', ?, ?, ?
           WHERE (SELECT COALESCE(SUM(amount_cents), 0) FROM gift_card_ledger WHERE gift_card_id = ?) >= ?
             AND (SELECT status FROM gift_cards WHERE id = ?) = 'issued'
           RETURNING id`
        )
        .bind(ledgerId, card.id, -amountCents, idempotencyKey, merchantBusinessId, Date.now(), card.id, amountCents, card.id)
        .first<{ id: string }>();
    } catch {
      // UNIQUE(idempotency_key) violation = a retried till submit. Return the prior
      // success so the cashier never re-keys with a fresh key and double-charges.
      const dup = await db
        .prepare(`SELECT id FROM gift_card_ledger WHERE idempotency_key = ? AND kind = 'redeem'`)
        .bind(idempotencyKey)
        .first<{ id: string }>();
      if (dup) return { ok: true, balanceCents: await balanceCents(db, card.id) };
      return { ok: false, reason: "error" };
    }
    if (!row) return { ok: false, reason: "insufficient" };
    return { ok: true, balanceCents: await balanceCents(db, card.id) };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function isMerchant(businessId: string): Promise<boolean> {
  const db = await getDB();
  if (!db) return false;
  try {
    const row = await db
      .prepare(`SELECT business_id FROM gift_card_merchants WHERE business_id = ? AND active = 1`)
      .bind(businessId)
      .first<{ business_id: string }>();
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function giftCardStats(): Promise<{ issued: number; outstandingCents: number; redeemedCents: number }> {
  const db = await getDB();
  if (!db) return { issued: 0, outstandingCents: 0, redeemedCents: 0 };
  try {
    const issued = await db.prepare(`SELECT COUNT(*) AS n FROM gift_cards WHERE status = 'issued'`).first<{ n: number }>();
    const out = await db.prepare(`SELECT COALESCE(SUM(amount_cents), 0) AS c FROM gift_card_ledger`).first<{ c: number }>();
    const red = await db.prepare(`SELECT COALESCE(SUM(amount_cents), 0) AS c FROM gift_card_ledger WHERE kind = 'redeem'`).first<{ c: number }>();
    return { issued: issued?.n ?? 0, outstandingCents: out?.c ?? 0, redeemedCents: Math.abs(red?.c ?? 0) };
  } catch {
    return { issued: 0, outstandingCents: 0, redeemedCents: 0 };
  }
}
