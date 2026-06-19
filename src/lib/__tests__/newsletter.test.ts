import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cf", () => ({
  getEnv: async () => ({}),
  getPhotos: async () => null,
  getDB: async () => ({
    prepare(sql: string) {
      let bound: unknown[] = [];
      const stmt = {
        bind(...a: unknown[]) {
          bound = a;
          return stmt;
        },
        async first<T = unknown>(): Promise<T | null> {
          if (sql.includes("SELECT id, status FROM newsletter_subscribers WHERE email")) {
            const email = bound[0];
            if (email === "confirmed@kamp.nl") return { id: "x", status: "confirmed" } as T;
            if (email === "bounced@kamp.nl") return { id: "y", status: "bounced" } as T;
            return null;
          }
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

import { subscribe, validateEmail } from "@/lib/newsletter";

describe("validateEmail", () => {
  it("accepts a valid address and rejects junk", () => {
    expect(validateEmail("a@b.nl")).toBe(true);
    expect(validateEmail("nope")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("subscribe", () => {
  it("issues a confirm token for a new address", async () => {
    const r = await subscribe("new@kamp.nl", "footer", "consent");
    expect(r.ok).toBe(true);
    expect(r.confirmToken).toBeTruthy();
  });

  it("does NOT re-send for an already-confirmed address", async () => {
    const r = await subscribe("confirmed@kamp.nl", "footer", "consent");
    expect(r.ok).toBe(true);
    expect(r.confirmToken).toBeUndefined();
  });

  it("never resurrects a bounced address", async () => {
    const r = await subscribe("bounced@kamp.nl", "footer", "consent");
    expect(r.ok).toBe(true);
    expect(r.confirmToken).toBeUndefined();
  });

  it("rejects an invalid address", async () => {
    expect((await subscribe("nope", "footer", "consent")).ok).toBe(false);
  });
});
