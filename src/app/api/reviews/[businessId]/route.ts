import { NextResponse } from "next/server";
import { getBusinessGoogle } from "@/lib/reviews";
import { fetchPlaceReviews } from "@/lib/places";

// Live Google reviews for a business. force-dynamic + no-store so review content
// is fetched fresh per request and NEVER enters the ISR/static cache (Places ToS).
export const dynamic = "force-dynamic";

const EMPTY = { rating: null, total: null, reviews: [], mapsUrl: null };
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await ctx.params;
  const g = await getBusinessGoogle(businessId);
  if (!g?.place_id) return NextResponse.json(EMPTY, { headers: NO_STORE });
  const data = await fetchPlaceReviews(g.place_id);
  return NextResponse.json(data ?? EMPTY, { headers: NO_STORE });
}
