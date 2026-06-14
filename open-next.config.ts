import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Runs the Next.js app on Cloudflare Workers. The R2 incremental cache persists
// ISR output so an approved owner edit (revalidateTag) is reflected across isolates.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
