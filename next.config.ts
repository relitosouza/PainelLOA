import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next 16 bloqueia recursos do modo dev acessados por outro host; o painel é aberto pelo IP da máquina na rede.
  allowedDevOrigins: ["172.16.49.102"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
export default nextConfig;

