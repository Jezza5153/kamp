import { NextResponse } from "next/server";
import { resolveReviewRequest, writeReviewUrl } from "@/lib/reviews";

// Public review-acquisition redirect: a counter QR / short link points here, we
// stamp the scan, then bounce the visitor straight to Google's write-a-review
// page. Never cached (per-token write).
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const res = await resolveReviewRequest(token);
  if (!res) return NextResponse.redirect(new URL("/", req.url));
  const dest = res.placeId
    ? writeReviewUrl(res.placeId)
    : new URL(`/ondernemers/${res.businessId}`, req.url).toString();
  return NextResponse.redirect(dest);
}
