import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Keep the live release untouched while a candidate build is being prepared.
  distDir: process.env.CALIBRA_BUILD_DIR || ".calibra-build",
  experimental: { cpus: 1, serverActions: { bodySizeLimit: "50mb" } },
  webpack(config) {
    // Keep Windows build asset emission deterministic on local NTFS.
    config.parallelism = 1;
    return config;
  },
};
export default nextConfig;
