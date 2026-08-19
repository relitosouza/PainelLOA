import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
    webpackBuildWorker: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
export default nextConfig;

