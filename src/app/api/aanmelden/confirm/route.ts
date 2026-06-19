import { NextRequest, NextResponse } from "next/server";
import { confirmLead } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const ok = await confirmLead(token);
  return NextResponse.redirect(new URL(`/aanmelden?confirmed=${ok ? "1" : "0"}`, req.url));
}
