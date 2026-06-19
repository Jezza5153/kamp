import { describe, expect, it } from "vitest";
import { slugify, validateStory, type StoryInput } from "@/lib/stories";

const base: StoryInput = {
  title: "De kleermaker van Atelier Misura",
  body: "Eerste alinea.\n\nTweede alinea.",
};

describe("slugify", () => {
  it("makes a clean url slug", () => {
    expect(slugify("De Kleermaker van Atelier Misura")).toBe("de-kleermaker-van-atelier-misura");
  });
  it("strips diacritics and punctuation", () => {
    expect(slugify("Café & Crème — Brûlée!")).toBe("cafe-creme-brulee");
  });
  it("collapses and trims dashes", () => {
    expect(slugify("  a -- b  ")).toBe("a-b");
  });
});

describe("validateStory", () => {
  it("accepts a story with a title and body", () => {
    expect(validateStory(base)).toBe(true);
  });
  it("derives a valid slug from the title when none is given", () => {
    expect(validateStory({ ...base, slug: undefined })).toBe(true);
  });
  it("rejects a missing title or body", () => {
    expect(validateStory({ ...base, title: " " })).toBe(false);
    expect(validateStory({ ...base, body: "" })).toBe(false);
  });
  it("rejects a malformed explicit slug", () => {
    expect(validateStory({ ...base, slug: "Not A Slug!" })).toBe(false);
  });
  it("rejects a non-http(s)/non-path hero url", () => {
    expect(validateStory({ ...base, heroUrl: "javascript:alert(1)" })).toBe(false);
    expect(validateStory({ ...base, heroUrl: "/media/x.jpg" })).toBe(true);
    expect(validateStory({ ...base, heroUrl: "https://x/y.jpg" })).toBe(true);
  });
});
