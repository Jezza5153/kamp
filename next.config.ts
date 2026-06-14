import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

// Exposes Cloudflare bindings (D1/R2/secrets) to `next dev` via getCloudflareContext.
// No-op in production (the Worker runtime provides the real bindings).
void initOpenNextCloudflareForDev();

export default nextConfig;
