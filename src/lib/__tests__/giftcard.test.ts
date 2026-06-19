import { describe, expect, it } from "vitest";
import { validateAmount, hashCode, generateCode } from "@/lib/giftcard";

describe("validateAmount", () => {
  it("accepts €10–€150 in whole cents", () => {
    expect(validateAmount(1000)).toBe(true);
    expect(validateAmount(2500)).toBe(true);
    expect(validateAmount(15000)).toBe(true);
  });
  it("rejects out-of-range or non-integer amounts", () => {
    expect(validateAmount(999)).toBe(false);
    expect(validateAmount(15001)).toBe(false);
    expect(validateAmount(2500.5)).toBe(false);
    expect(validateAmount(0)).toBe(false);
  });
});

describe("hashCode", () => {
  it("is deterministic, case-insensitive, and 64 hex chars", async () => {
    const a = await hashCode("KAMP-7QF3-9XTM");
    const b = await hashCode("kamp-7qf3-9xtm");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
  it("differs for different codes", async () => {
    expect(await hashCode("KAMP-AAAA-BBBB")).not.toBe(await hashCode("KAMP-AAAA-BBBC"));
  });
});

describe("generateCode", () => {
  it("uses the KAMP-XXXX-XXXX format with an unambiguous alphabet", () => {
    const code = generateCode();
    expect(code).toMatch(/^KAMP-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });
});
