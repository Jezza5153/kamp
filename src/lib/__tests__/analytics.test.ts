import { describe, expect, it } from "vitest";
import { isEventType, dailySalt, visitorHash } from "@/lib/analytics";

describe("isEventType", () => {
  it("accepts known event types and rejects others", () => {
    expect(isEventType("action_click")).toBe(true);
    expect(isEventType("pageview")).toBe(true);
    expect(isEventType("drop-table")).toBe(false);
  });
});

describe("cookieless visitor hashing", () => {
  it("is deterministic within a day but rotates across days", async () => {
    const ipUa = "1.2.3.4|Mozilla/5.0";
    const saltMon = await dailySalt("secret", "2026-06-15");
    const saltTue = await dailySalt("secret", "2026-06-16");

    const a = await visitorHash(saltMon, ipUa);
    const b = await visitorHash(saltMon, ipUa);
    const c = await visitorHash(saltTue, ipUa);

    expect(a).toBe(b); // same day, same visitor → same hash
    expect(a).not.toBe(c); // next day → unlinkable
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });

  it("distinguishes different visitors on the same day", async () => {
    const salt = await dailySalt("secret", "2026-06-15");
    expect(await visitorHash(salt, "1.1.1.1|UA")).not.toBe(await visitorHash(salt, "2.2.2.2|UA"));
  });
});
