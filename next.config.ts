import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    // Owner photo uploads ride a Server Action; default body cap is 1MB.
    // 6mb > MAX_BYTES (5mb) + multipart overhead. See src/lib/media.ts.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

// Exposes Cloudflare bindings (D1/R2/secrets) to `next dev` via getCloudflareContext.
// No-op in production (the Worker runtime provides the real bindings).
void initOpenNextCloudflareForDev();

export default nextConfig;
