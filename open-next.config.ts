import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// Runs the Next.js app on Cloudflare Workers.
// - r2IncrementalCache persists ISR output across isolates.
// - d1NextTagCache makes revalidatePath()/revalidateTag() actually take effect in
//   production (previously the dummy no-op cache). It requires the
//   NEXT_TAG_CACHE_D1 binding in wrangler.jsonc; `opennextjs-cloudflare deploy`
//   populates the tag table. Approved owner edits then surface on demand instead
//   of only via each page's `export const revalidate` ISR window.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
});
