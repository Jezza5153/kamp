import { describe, expect, it } from "vitest";
import { validateEvent, type EventInput } from "@/lib/events";

const base: EventInput = {
  title: "Kerstmarkt op De Kamp",
  category: "Seizoen",
  whenText: "14 december, 12.00–18.00",
  where: "De Kamp, Amersfoort",
  description: "Sfeervolle kerstmarkt met streeklekkernijen.",
  url: "https://example.nl",
  startDate: "2026-12-14",
};

describe("validateEvent", () => {
  it("accepts a complete event", () => {
    expect(validateEvent(base)).toBe(true);
  });

  it("accepts an event with no url/dates (a recurring evergreen item)", () => {
    expect(validateEvent({ ...base, url: undefined, startDate: undefined, endDate: undefined })).toBe(true);
  });

  it("rejects a missing required field", () => {
    expect(validateEvent({ ...base, title: "  " })).toBe(false);
    expect(validateEvent({ ...base, where: "" })).toBe(false);
    expect(validateEvent({ ...base, description: "" })).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(validateEvent({ ...base, category: "Borrel" })).toBe(false);
  });

  it("rejects a non-http(s) url (no javascript: href XSS)", () => {
    expect(validateEvent({ ...base, url: "javascript:alert(1)" })).toBe(false);
    expect(validateEvent({ ...base, url: "ftp://x" })).toBe(false);
  });

  it("rejects a malformed or impossible date", () => {
    expect(validateEvent({ ...base, startDate: "14-12-2026" })).toBe(false);
    expect(validateEvent({ ...base, endDate: "soon" })).toBe(false);
    expect(validateEvent({ ...base, startDate: "2026-13-45" })).toBe(false); // impossible month/day
    expect(validateEvent({ ...base, startDate: "2026-02-31" })).toBe(false); // rolls over → rejected
  });

  it("rejects an end date before the start date", () => {
    expect(validateEvent({ ...base, startDate: "2026-12-14", endDate: "2026-12-10" })).toBe(false);
    expect(validateEvent({ ...base, startDate: "2026-12-14", endDate: "2026-12-14" })).toBe(true);
  });
});
