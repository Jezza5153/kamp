import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Runs the Next.js app on Cloudflare Workers.
//
// NOTE: the R2 incremental cache + D1 tag cache overrides are intentionally
// disabled for now. `opennextjs-cloudflare deploy` pre-populates the R2 cache at
// deploy time, and that R2 write step timed out from the deploy environment,
// blocking the worker upload. Falling back to OpenNext defaults — pages still
// serve correctly via SSG + each page's `export const revalidate` ISR window
// (the original design baseline). To re-enable instant invalidation + persistent
// ISR cache, restore the two overrides below and deploy from a network where the
// R2 cache populate succeeds (see DEPLOY_CLOUDFLARE.md):
//   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
//   import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
//   incrementalCache: r2IncrementalCache, tagCache: d1NextTagCache,
export default defineCloudflareConfig({});
