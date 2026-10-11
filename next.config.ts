import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Allow large file uploads
  serverExternalPackages: ["bcryptjs"],
  // Enforce strict TypeScript checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Ensure the SQLite database file is bundled into serverless functions on Vercel
  outputFileTracingIncludes: {
    "/*": ["./prisma/dev.db"],
    "/**/*": ["./prisma/dev.db"],
    "/api/**/*": ["./prisma/dev.db"],
  },
};

export default nextConfig;
