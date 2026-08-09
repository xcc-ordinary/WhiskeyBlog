import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
