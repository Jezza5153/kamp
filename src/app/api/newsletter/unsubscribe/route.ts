import { NextRequest, NextResponse } from "next/server";
import { unsubscribe } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

// GET: the footer/email link (redirects to a friendly page).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const ok = await unsubscribe(token);
  return NextResponse.redirect(new URL(`/nieuwsbrief?status=${ok ? "uitgeschreven" : "mislukt"}`, req.url));
}

// POST: RFC 8058 one-click unsubscribe (List-Unsubscribe-Post header).
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  await unsubscribe(token);
  return new NextResponse(null, { status: 204 });
}
