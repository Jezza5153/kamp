import { describe, expect, it } from "vitest";
import { maintenanceStatements } from "@/lib/maintenance";

describe("maintenanceStatements", () => {
  const now = 1_700_000_000_000;
  const stmts = maintenanceStatements(now);

  it("prunes auth tokens, sessions, and stale rate-limit windows", () => {
    const sql = stmts.map((s) => s.sql).join(" | ");
    expect(sql).toContain("DELETE FROM auth_tokens");
    expect(sql).toContain("DELETE FROM sessions");
    expect(sql).toContain("DELETE FROM rate_limit");
    expect(stmts).toHaveLength(3);
  });

  it("expires sessions/tokens at `now` and rate-limit windows after 24h", () => {
    const session = stmts.find((s) => s.sql.includes("sessions"))!;
    expect(session.params[0]).toBe(now);

    const rl = stmts.find((s) => s.sql.includes("rate_limit"))!;
    expect(rl.params[0]).toBe(now - 24 * 60 * 60 * 1000);
  });
});
