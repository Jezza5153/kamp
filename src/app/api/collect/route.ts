import { NextResponse } from "next/server";
import { getDB, getEnv } from "@/lib/cf";
import { rateLimit } from "@/lib/rateLimit";
import { isEventType, dailySalt, visitorHash, recordEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { type?: string; businessId?: string; detail?: unknown }
    | null;
  if (!body || typeof body.type !== "string" || !isEventType(body.type)) {
    return new NextResponse(null, { status: 204 });
  }

  const db = await getDB();
  const ip = req.headers.get("cf-connecting-ip") ?? "0";
  const ua = req.headers.get("user-agent") ?? "";

  // Cheap bot filter + flood guard.
  if (/bot|crawler|spider|preview|monitor/i.test(ua)) return new NextResponse(null, { status: 204 });
  const rl = await rateLimit(db, `collect:${ip}`, 200, 60 * 60 * 1000);
  if (!rl.allowed) return new NextResponse(null, { status: 204 });

  const secret = (await getEnv())?.AUTH_SECRET ?? "kamp-analytics";
  const dateKey = new Date().toISOString().slice(0, 10);
  const vh = await visitorHash(await dailySalt(secret, dateKey), `${ip}|${ua}`);

  await recordEvent(body.type, {
    businessId: typeof body.businessId === "string" ? body.businessId.slice(0, 80) : undefined,
    detail: body.detail,
    visitorHash: vh,
  });
  return new NextResponse(null, { status: 204 });
}
