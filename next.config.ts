import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "**.nanobanana.ai",
      },
      {
        protocol: "https",
        hostname: "images.nanobanana.dev",
      },
    ],
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
