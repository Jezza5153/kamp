import { NextResponse } from "next/server";
import { createGiftCardOrder } from "@/lib/giftcard";

// ⚠️ Inert until MOLLIE_API_KEY is set AND the legal/entity track is cleared.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const fd = await req.formData();
  const amountCents = Math.round(Number(fd.get("amount") ?? 0) * 100); // euros → cents
  const email = String(fd.get("email") ?? "");
  const res = await createGiftCardOrder(amountCents, email);
  if (res.ok && res.checkoutUrl) return NextResponse.json({ ok: true, checkoutUrl: res.checkoutUrl });
  return NextResponse.json({ ok: false, reason: res.reason ?? "error" }, { status: 400 });
}
