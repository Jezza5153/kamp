import { describe, expect, it } from "vitest";
import { isLocale, applyTranslations, TRANSLATABLE_FIELDS } from "@/lib/i18n";

describe("isLocale", () => {
  it("accepts nl/en and rejects others", () => {
    expect(isLocale("nl")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("applyTranslations", () => {
  const businesses = [
    { id: "toko-tjin", shortDescription: "Indische toko", longDescription: "Lang NL" },
    { id: "atelier", shortDescription: "Kleermaker", longDescription: "Lang NL 2" },
  ];

  it("merges EN fields onto matching businesses, leaving others untouched", () => {
    const out = applyTranslations(businesses, {
      "toko-tjin": { shortDescription: "Indonesian grocery" },
    });
    expect(out[0].shortDescription).toBe("Indonesian grocery");
    expect(out[0].longDescription).toBe("Lang NL"); // untranslated field falls back to NL
    expect(out[1]).toEqual(businesses[1]); // no translation → unchanged
  });

  it("returns the input unchanged when there are no translations", () => {
    expect(applyTranslations(businesses, {})).toEqual(businesses);
  });
});

describe("TRANSLATABLE_FIELDS", () => {
  it("covers only safe free-text fields (never name/address/url)", () => {
    expect(TRANSLATABLE_FIELDS).toContain("shortDescription");
    expect(TRANSLATABLE_FIELDS).toContain("longDescription");
    expect(TRANSLATABLE_FIELDS as readonly string[]).not.toContain("name");
    expect(TRANSLATABLE_FIELDS as readonly string[]).not.toContain("address");
  });
});
