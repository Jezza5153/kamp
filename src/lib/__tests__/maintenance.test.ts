import { describe, expect, it } from "vitest";
import { maintenanceStatements } from "@/lib/maintenance";

describe("maintenanceStatements", () => {
  const now = 1_700_000_000_000;
  const stmts = maintenanceStatements(now);

  it("prunes auth tokens, sessions, rate-limit windows, stale leads, and expired invites", () => {
    const sql = stmts.map((s) => s.sql).join(" | ");
    expect(sql).toContain("DELETE FROM auth_tokens");
    expect(sql).toContain("DELETE FROM sessions");
    expect(sql).toContain("DELETE FROM rate_limit");
    expect(sql).toContain("DELETE FROM leads");
    expect(sql).toContain("DELETE FROM owner_invites");
    expect(sql).toContain("DELETE FROM newsletter_subscribers");
    expect(stmts).toHaveLength(6);
  });

  it("expires sessions/tokens at `now` and rate-limit windows after 24h", () => {
    const session = stmts.find((s) => s.sql.includes("sessions"))!;
    expect(session.params[0]).toBe(now);

    const rl = stmts.find((s) => s.sql.includes("rate_limit"))!;
    expect(rl.params[0]).toBe(now - 24 * 60 * 60 * 1000);
  });
});
