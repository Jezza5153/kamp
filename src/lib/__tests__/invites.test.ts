import { describe, expect, it } from "vitest";
import type { D1Database } from "@/lib/cf";
import { claimInvitesForEmail } from "@/lib/invites";

interface Invite {
  token: string;
  email: string;
  business_id: string;
  claimed: boolean;
}

// Fake D1 that serves owner_invites by the bound email and records batched writes.
function fakeDb(invites: Invite[]): { db: D1Database; batched: { sql: string; binds: unknown[] }[] } {
  const batched: { sql: string; binds: unknown[] }[] = [];
  const db = {
    prepare(sql: string) {
      const stmt = {
        sql,
        binds: [] as unknown[],
        bind(...args: unknown[]) {
          stmt.binds = args;
          return stmt;
        },
        async all<T = unknown>() {
          const email = stmt.binds[0];
          const rows = invites
            .filter((i) => i.email === email && !i.claimed)
            .map((i) => ({ token: i.token, business_id: i.business_id }));
          return { results: rows as T[] };
        },
        async first<T = unknown>(): Promise<T | null> {
          return null;
        },
        async run() {
          return {};
        },
      };
      return stmt;
    },
    async batch(stmts: { sql: string; binds: unknown[] }[]) {
      batched.push(...stmts.map((s) => ({ sql: s.sql, binds: s.binds })));
      return [];
    },
  };
  return { db: db as unknown as D1Database, batched };
}

describe("claimInvitesForEmail — ownership binds only on email match", () => {
  const invites: Invite[] = [
    { token: "t1", email: "owner@kamp.nl", business_id: "toko-tjin", claimed: false },
  ];

  it("binds owner_business for an invite whose email matches the login", async () => {
    const { db, batched } = fakeDb(invites);
    const n = await claimInvitesForEmail(db, "p1", "owner@kamp.nl");
    expect(n).toBe(1);
    const ob = batched.find((s) => s.sql.includes("owner_business"));
    expect(ob?.binds.slice(0, 2)).toEqual(["p1", "toko-tjin"]);
  });

  it("binds NOTHING when a different email logs in (no invite hijack)", async () => {
    const { db, batched } = fakeDb(invites);
    const n = await claimInvitesForEmail(db, "attacker", "someone-else@evil.nl");
    expect(n).toBe(0);
    expect(batched).toHaveLength(0);
  });

  it("is case-insensitive on the login email", async () => {
    const { db } = fakeDb(invites);
    expect(await claimInvitesForEmail(db, "p1", "OWNER@KAMP.NL")).toBe(1);
  });
});
