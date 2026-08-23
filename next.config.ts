import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // The editorial desk accepts an 8 MB cover image. Server Actions default to
  // 1 MB, which otherwise aborts the request and surfaces as "Failed to fetch".
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  // Playwright uses a loopback hostname while Next's dev server serves the
  // browser bundle locally. Keep this explicit so development HMR and client
  // event handlers work in the reproducible local E2E environment.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/derivatives/**",
      },
    ],
  },
};

export default nextConfig;
