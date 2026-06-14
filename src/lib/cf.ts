import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare bindings access. Typed loosely so the public build doesn't need
 * @cloudflare/workers-types; `wrangler types` can refine later. Every accessor
 * returns null when NOT running on Workers (plain `next build` / `next dev`),
 * so callers fall back to the static seed.
 */
export interface D1Stmt {
  bind(...args: unknown[]): D1Stmt;
  all<T = unknown>(): Promise<{ results: T[] }>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface D1Database {
  prepare(query: string): D1Stmt;
  batch(stmts: D1Stmt[]): Promise<unknown>;
}
export interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | string, opts?: unknown): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: unknown } | null>;
  delete(key: string): Promise<void>;
}

export interface KampEnv {
  DB?: D1Database;
  PHOTOS?: R2Bucket;
  AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
  ADMIN_EMAILS?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

export async function getEnv(): Promise<KampEnv | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as unknown as KampEnv;
  } catch {
    return null;
  }
}

export async function getDB(): Promise<D1Database | null> {
  return (await getEnv())?.DB ?? null;
}

export async function getPhotos(): Promise<R2Bucket | null> {
  return (await getEnv())?.PHOTOS ?? null;
}
