#!/usr/bin/env node
/**
 * Deploy preflight (Backend Master Plan, Step 1). Runs before `deploy:cf` and
 * fails fast on the classic "deployed with the placeholder id" footgun, and on a
 * missing required binding. Cheap, dependency-free, and self-documenting.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fail = (msg) => {
  console.error(`\n✖ preflight failed: ${msg}\n`);
  process.exit(1);
};

const wrangler = readFileSync(join(root, "wrangler.jsonc"), "utf8");

if (wrangler.includes("REPLACE_WITH_")) {
  fail(
    "wrangler.jsonc still has a REPLACE_WITH_ placeholder.\n" +
      "  Run: wrangler d1 create kamp-db --jurisdiction eu\n" +
      "  Then paste the real database_id into BOTH the DB and NEXT_TAG_CACHE_D1 bindings."
  );
}

for (const binding of ['"DB"', '"PHOTOS"', '"NEXT_INC_CACHE_R2_BUCKET"', '"NEXT_TAG_CACHE_D1"']) {
  if (!wrangler.includes(binding)) fail(`wrangler.jsonc is missing the ${binding} binding.`);
}

// Reminder, not a hard gate: jurisdiction is set at resource-creation time and
// isn't visible in wrangler.jsonc, so we can only nudge.
console.log("✓ preflight: wrangler config looks deploy-ready.");
console.log(
  "  Reminder: D1 + R2 must have been created with --jurisdiction eu (GDPR), and\n" +
    "  secrets AUTH_SECRET / RESEND_API_KEY / ADMIN_EMAILS set via `wrangler secret put`."
);
