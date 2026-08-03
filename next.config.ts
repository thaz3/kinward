import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Local setup uses http://127.0.0.1:3000 (see README). Allow that host for
  // dev HMR and for Server Actions when Origin is opaque/null (e.g. embedded
  // preview browsers) or when forwarded-host and Origin disagree.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      allowedOrigins: ["127.0.0.1:3000", "localhost:3000", "null"],
    },
  },
};

export default nextConfig;
