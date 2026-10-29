import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["escpos", "escpos-network"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
