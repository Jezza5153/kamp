/**
 * Client-side event beacon (cookieless). Fire-and-forget; never blocks the UI.
 * Usage from a client component:  import { track } from "@/lib/track";
 *   track("action_click", business.id, { kind: "reserveren" });
 * Wire pageviews via Cloudflare Web Analytics (no code) and conversion events here.
 */
export function track(type: string, businessId?: string, detail?: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ type, businessId, detail });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/collect", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/collect", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // ignore — analytics must never break the page
  }
}
