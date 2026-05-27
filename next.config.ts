import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      ".next/cache/webpack/**/*",
      ".git/**/*",
    ],
  },
};

export default nextConfig;
