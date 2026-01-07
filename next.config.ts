import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows the build to finish even if there are TypeScript type errors
    ignoreBuildErrors: true,
  }
};

export default nextConfig;