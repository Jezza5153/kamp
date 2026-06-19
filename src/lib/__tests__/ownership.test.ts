import { describe, expect, it, vi } from "vitest";
import { canEdit } from "@/lib/auth";

// Security regression test (Backend Master Plan §7/§10): an owner may edit ONLY
// their own business; an admin may edit any; everyone else nothing. We mock the
// Cloudflare seam so `canEdit` runs against a known owner_business fixture, and
// stub the Next request APIs that auth.ts imports at module load.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("redirect");
  },
}));
vi.mock("@/lib/cf", () => {
  const owned: Record<string, string[]> = { p1: ["atelier-misura-sartoria"] };
  return {
    getEnv: async () => ({}),
    getPhotos: async () => null,
    getDB: async () => ({
      prepare() {
        let bound: unknown[] = [];
        const stmt = {
          bind(...args: unknown[]) {
            bound = args;
            return stmt;
          },
          // SELECT business_id FROM owner_business WHERE profile_id = ?
          async all() {
            const pid = String(bound[0]);
            return { results: (owned[pid] ?? []).map((business_id) => ({ business_id })) };
          },
          async first() {
            return null;
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
  };
});

describe("canEdit — owner isolation", () => {
  it("an admin can edit any business", async () => {
    expect(await canEdit({ id: "x", email: "a@kamp.nl", role: "admin" }, "toko-tjin")).toBe(true);
  });

  it("an owner can edit their own business but not another's", async () => {
    const owner = { id: "p1", email: "o@kamp.nl", role: "owner" as const };
    expect(await canEdit(owner, "atelier-misura-sartoria")).toBe(true);
    expect(await canEdit(owner, "toko-tjin")).toBe(false);
  });

  it("an owner with no linked business can edit nothing", async () => {
    expect(await canEdit({ id: "p2", email: "n@kamp.nl", role: "owner" }, "atelier-misura-sartoria")).toBe(
      false
    );
  });
});
