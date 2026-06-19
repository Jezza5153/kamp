import { NextResponse } from "next/server";
import { getDB } from "@/lib/cf";
import { rateLimit } from "@/lib/rateLimit";
import { getBalanceByCode } from "@/lib/giftcard";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const db = await getDB();
  // Anti-enumeration: throttle the CALLER, not the guessed code (keying on the code
  // gives every guess a fresh bucket — no protection). 30 lookups/hour/IP.
  const ip = req.headers.get("cf-connecting-ip") ?? "0";
  const rl = await rateLimit(db, `saldo:ip:${ip}`, 30, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ found: false }, { status: 429, headers: NO_STORE });
  const res = await getBalanceByCode(code);
  return NextResponse.json(res, { headers: NO_STORE });
}
