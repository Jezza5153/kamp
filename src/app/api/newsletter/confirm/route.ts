import { NextRequest, NextResponse } from "next/server";
import { confirmSubscriber } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const ok = await confirmSubscriber(token);
  return NextResponse.redirect(new URL(`/nieuwsbrief?status=${ok ? "bevestigd" : "mislukt"}`, req.url));
}
