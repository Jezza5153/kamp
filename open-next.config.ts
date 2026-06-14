import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Runs the Next.js app on Cloudflare Workers. The R2 incremental cache persists
// ISR output across isolates. NOTE: no tagCache is configured, so it defaults to
// the "dummy" cache and revalidatePath()/revalidateTag() are NO-OPS in production.
// Approved owner edits therefore surface via per-page `export const revalidate`
// (ISR window), not on-demand. To get instant invalidation, add the d1-next-tag-cache
// override here + the NEXT_TAG_CACHE_D1 binding (see DEPLOY_CLOUDFLARE.md).
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
