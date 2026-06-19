import { NextResponse } from "next/server";
import { handleMollieWebhook } from "@/lib/giftcard";

// Mollie posts `id=tr_…` form-encoded. We NEVER trust the body — handleMollieWebhook
// re-fetches the payment with the secret key, verifies status+amount, and dedupes.
// Always return 200 so Mollie doesn't enter aggressive retry.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const fd = await req.formData().catch(() => null);
  const id = fd ? String(fd.get("id") ?? "") : "";
  if (id) await handleMollieWebhook(id);
  return new NextResponse("ok");
}
