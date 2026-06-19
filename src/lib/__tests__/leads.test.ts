import { describe, expect, it } from "vitest";
import { validateLead, type LeadInput } from "@/lib/leads";

const base: LeadInput = {
  businessName: "Toko Tjin",
  contactName: "Tjin",
  email: "tjin@kamp.nl",
  consentText: "Ik geef toestemming…",
};

describe("validateLead", () => {
  it("accepts a complete application", () => {
    expect(validateLead(base)).toBe(true);
  });

  it("rejects a missing business name", () => {
    expect(validateLead({ ...base, businessName: "  " })).toBe(false);
  });

  it("rejects a missing contact name", () => {
    expect(validateLead({ ...base, contactName: "" })).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(validateLead({ ...base, email: "not-an-email" })).toBe(false);
  });

  it("rejects a missing consent string", () => {
    expect(validateLead({ ...base, consentText: "" })).toBe(false);
  });
});
