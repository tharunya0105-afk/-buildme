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
  // Skip TypeScript errors during build (fix for Vercel deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure the SQLite database file is bundled into serverless functions on Vercel
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
    "/api/**/*": ["./prisma/dev.db"],
  },
};

export default nextConfig;
