import { getDB, type D1Stmt } from "@/lib/cf";
import { logModeration } from "@/lib/audit";

/**
 * Owner-story editorial (migration 0008). Admin/editor-authored long-form
 * profiles, stored in D1. body is plain text rendered as escaped paragraphs.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HERO_RE = /^(https?:\/\/|\/)/;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export interface StoryInput {
  slug?: string;
  title: string;
  dek?: string;
  body: string;
  heroUrl?: string;
  author?: string;
  businessIds?: string[];
}

/** Pure validation. Slug must be clean; hero must be http(s) or a local /path. */
export function validateStory(input: StoryInput): boolean {
  if (!input.title.trim() || !input.body.trim()) return false;
  const slug = (input.slug?.trim() || slugify(input.title));
  if (!SLUG_RE.test(slug)) return false;
  const hero = (input.heroUrl ?? "").trim();
  if (hero && !HERO_RE.test(hero)) return false;
  return true;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  body: string;
  heroUrl: string | null;
  status: string;
  author: string | null;
  publishedAt: number | null;
  dateModified: number | null;
  businessIds: string[];
}

interface StoryRow {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  body: string;
  hero_url: string | null;
  status: string;
  author: string | null;
  published_at: number | null;
  date_modified: number | null;
}

function toStory(r: StoryRow, businessIds: string[] = []): Story {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    dek: r.dek,
    body: r.body,
    heroUrl: r.hero_url,
    status: r.status,
    author: r.author,
    publishedAt: r.published_at,
    dateModified: r.date_modified,
    businessIds,
  };
}

export async function getPublishedStories(): Promise<Story[]> {
  if (process.env.NEXT_PHASE === "phase-production-build") return [];
  const db = await getDB();
  if (!db) return [];
  try {
    const { results } = await db
      .prepare(`SELECT * FROM stories WHERE status = 'published' ORDER BY published_at DESC`)
      .all<StoryRow>();
    return results.map((r) => toStory(r));
  } catch {
    return [];
  }
}

export async function getStory(slug: string): Promise<Story | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const db = await getDB();
  if (!db) return null;
  try {
    const row = await db.prepare(`SELECT * FROM stories WHERE slug = ?`).bind(slug).first<StoryRow>();
    if (!row) return null;
    const { results } = await db
      .prepare(`SELECT business_id FROM story_business WHERE story_id = ?`)
      .bind(row.id)
      .all<{ business_id: string }>();
    return toStory(row, results.map((r) => r.business_id));
  } catch {
    return null;
  }
}

export async function listStories(): Promise<Story[]> {
  const db = await getDB();
  if (!db) return [];
  try {
    const { results } = await db.prepare(`SELECT * FROM stories ORDER BY created_at DESC`).all<StoryRow>();
    return results.map((r) => toStory(r));
  } catch {
    return [];
  }
}

export async function createStory(
  input: StoryInput,
  status: "draft" | "published",
  authorId: string
): Promise<{ ok: boolean; slug?: string }> {
  const db = await getDB();
  if (!db) return { ok: false };
  if (!validateStory(input)) return { ok: false };
  const slug = input.slug?.trim() || slugify(input.title);
  const now = Date.now();
  const id = crypto.randomUUID();
  const trim = (s?: string) => {
    const v = (s ?? "").trim();
    return v === "" ? null : v;
  };
  try {
    const stmts: D1Stmt[] = [
      db
        .prepare(
          `INSERT INTO stories (id, slug, title, dek, body, hero_url, status, author, author_id, published_at, date_modified, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          slug,
          input.title.trim(),
          trim(input.dek),
          input.body.trim(),
          trim(input.heroUrl),
          status,
          trim(input.author),
          authorId,
          status === "published" ? now : null,
          now,
          now
        ),
    ];
    for (const bid of input.businessIds ?? []) {
      if (bid.trim()) {
        stmts.push(
          db.prepare(`INSERT OR IGNORE INTO story_business (story_id, business_id) VALUES (?, ?)`).bind(id, bid.trim())
        );
      }
    }
    await db.batch(stmts);
    return { ok: true, slug };
  } catch {
    return { ok: false };
  }
}

export async function setStoryStatus(
  id: string,
  status: "draft" | "published" | "archived",
  adminId: string
): Promise<void> {
  const db = await getDB();
  if (!db || !id) return;
  const now = Date.now();
  await db
    .prepare(
      `UPDATE stories SET status = ?, date_modified = ?,
         published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END
       WHERE id = ?`
    )
    .bind(status, now, status, now, id)
    .run();
  await logModeration({ actorId: adminId, action: `story_${status}`, targetType: "story", targetId: id });
}

export async function deleteStory(id: string, adminId: string): Promise<void> {
  const db = await getDB();
  if (!db || !id) return;
  await db.prepare(`DELETE FROM stories WHERE id = ?`).bind(id).run(); // story_business cascades
  await logModeration({ actorId: adminId, action: "story_delete", targetType: "story", targetId: id });
}

/** Set a story's hero image (an /media/story/… key after upload, or any URL). */
export async function setStoryHero(storyId: string, heroUrl: string): Promise<void> {
  const db = await getDB();
  if (!db || !storyId) return;
  await db.prepare(`UPDATE stories SET hero_url = ?, date_modified = ? WHERE id = ?`).bind(heroUrl, Date.now(), storyId).run();
}
