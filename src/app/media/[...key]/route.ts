import { canEdit, getCurrentUser } from "@/lib/auth";
import { getPhotos } from "@/lib/cf";
import { mediaByKey } from "@/lib/media";

// Access is per-request (live D1 status + session), so never prerender/cache the route itself.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const key = (await ctx.params).key.join("/");
  const photos = await getPhotos();
  if (!photos) return new Response("Unavailable", { status: 503 });

  const rec = await mediaByKey(key);
  if (!rec) return new Response("Not found", { status: 404 });

  if (rec.status === "pending") {
    // Pending bytes are visible only to the owning account / admins.
    const user = await getCurrentUser();
    if (!user || !(await canEdit(user, rec.business_id)))
      return new Response("Not found", { status: 404 });
  } else if (rec.status !== "approved") {
    // rejected / superseded → gone (404, don't reveal existence)
    return new Response("Not found", { status: 404 });
  }

  const obj = await photos.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  // Read the Content-Type from the metadata we stored on upload (never sniff).
  // Buffer the object rather than calling writeHttpMetadata(headers)/streaming
  // .body: under the dev platform-proxy those don't serialise across the RPC
  // boundary, and images are ≤5MB so a buffered Response is fine on Workers too.
  const buf = await obj.arrayBuffer();
  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType ?? "application/octet-stream");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Disposition", "inline");
  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);
  headers.set(
    "Cache-Control",
    rec.status === "approved"
      ? "public, max-age=31536000, immutable"
      : "private, no-store" // a pending image must never be cached anywhere
  );
  return new Response(buf, { headers });
}
