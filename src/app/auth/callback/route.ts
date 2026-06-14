import { NextRequest, NextResponse } from "next/server";
import { completeLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const role = await completeLogin(token);
  const dest =
    role === "admin" ? "/admin" : role === "owner" ? "/beheer" : "/login?error=1";
  return NextResponse.redirect(new URL(dest, req.url));
}
