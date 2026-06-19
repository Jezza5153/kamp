import { describe, expect, it, vi } from "vitest";
import { resolveReviewRequest, validatePlaceId, writeReviewUrl } from "@/lib/reviews";

vi.mock("@/lib/cf", () => ({
  getEnv: async () => ({}),
  getPhotos: async () => null,
  getDB: async () => ({
    prepare(sql: string) {
      const stmt = {
        sql,
        binds: [] as unknown[],
        bind(...a: unknown[]) {
          stmt.binds = a;
          return stmt;
        },
        async first<T = unknown>(): Promise<T | null> {
          if (sql.includes("review_requests")) return { business_id: "toko-tjin" } as T;
          if (sql.includes("business_google")) return { business_id: "toko-tjin", place_id: "ChIJtoko" } as T;
          return null;
        },
        async all<T = unknown>() {
          return { results: [] as T[] };
        },
        async run() {
          return {};
        },
      };
      return stmt;
    },
    async batch() {
      return [];
    },
  }),
}));

describe("validatePlaceId", () => {
  it("accepts a Google place id", () => {
    expect(validatePlaceId("ChIJN1t_tDeuEmsRUsoyG83frY4")).toBe(true);
  });
  it("rejects empty, too-short, or spaced values", () => {
    expect(validatePlaceId("")).toBe(false);
    expect(validatePlaceId("abc")).toBe(false);
    expect(validatePlaceId("has space here")).toBe(false);
  });
});

describe("writeReviewUrl", () => {
  it("builds Google's canonical write-a-review deep link", () => {
    expect(writeReviewUrl("ChIJabc")).toBe(
      "https://search.google.com/local/writereview?placeid=ChIJabc"
    );
  });
});

describe("resolveReviewRequest", () => {
  it("resolves a known token to its business + place id", async () => {
    const res = await resolveReviewRequest("tok123");
    expect(res).toEqual({ businessId: "toko-tjin", placeId: "ChIJtoko" });
  });
});
