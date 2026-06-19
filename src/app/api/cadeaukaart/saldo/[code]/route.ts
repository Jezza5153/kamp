import { NextResponse } from "next/server";
import { getDB } from "@/lib/cf";
import { rateLimit } from "@/lib/rateLimit";
import { getBalanceByCode } from "@/lib/giftcard";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const db = await getDB();
  // Hard rate limit — a balance endpoint is a code-guessing oracle.
  const rl = await rateLimit(db, `saldo:${code}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ found: false }, { status: 429, headers: NO_STORE });
  const res = await getBalanceByCode(code);
  return NextResponse.json(res, { headers: NO_STORE });
}
