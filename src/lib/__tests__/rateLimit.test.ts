import { describe, expect, it } from "vitest";
import type { D1Database } from "@/lib/cf";
import { nextWindow, rateLimit } from "@/lib/rateLimit";

describe("nextWindow", () => {
  it("opens a fresh window when none exists", () => {
    expect(nextWindow(null, 1000, 500)).toEqual({ count: 1, window_start: 1000 });
  });
  it("increments within the active window", () => {
    expect(nextWindow({ count: 2, window_start: 1000 }, 1200, 500)).toEqual({
      count: 3,
      window_start: 1000,
    });
  });
  it("resets once the window has elapsed", () => {
    expect(nextWindow({ count: 9, window_start: 1000 }, 2000, 500)).toEqual({
      count: 1,
      window_start: 2000,
    });
  });
});

// Minimal in-memory D1 fake that emulates the `rate_limit` UPSERT … RETURNING.
function fakeDb(): D1Database {
  const store = new Map<string, { count: number; window_start: number }>();
  const db = {
    prepare() {
      let bound: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) {
          bound = args;
          return stmt;
        },
        async first<T = unknown>(): Promise<T | null> {
          // bound = [key, now, threshold, threshold, now]
          const key = String(bound[0]);
          const now = Number(bound[1]);
          const threshold = Number(bound[2]);
          const prev = store.get(key) ?? null;
          const next =
            !prev || prev.window_start <= threshold
              ? { count: 1, window_start: now }
              : { count: prev.count + 1, window_start: prev.window_start };
          store.set(key, next);
          return next as T;
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
  };
  return db as unknown as D1Database;
}

describe("rateLimit", () => {
  it("fails open when D1 is unbound", async () => {
    const r = await rateLimit(null, "k", 5, 1000, 1000);
    expect(r.allowed).toBe(true);
  });

  it("blocks once the limit is exceeded within a window, with a retry hint", async () => {
    const db = fakeDb();
    const results = [];
    for (const t of [1000, 1010, 1020, 1030]) {
      results.push(await rateLimit(db, "login:email:a@b.nl", 3, 1000, t));
    }
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterMs).toBeGreaterThan(0);
  });

  it("allows again after the window resets", async () => {
    const db = fakeDb();
    await rateLimit(db, "k", 1, 1000, 1000);
    expect((await rateLimit(db, "k", 1, 1000, 1500)).allowed).toBe(false); // same window
    expect((await rateLimit(db, "k", 1, 1000, 5000)).allowed).toBe(true); // window elapsed
  });
});
