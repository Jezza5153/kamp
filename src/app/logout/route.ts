import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await logout();
  return NextResponse.redirect(new URL("/", req.url));
}
