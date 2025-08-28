import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  eslint: {
    // Disable ESLint during production builds to prevent formatting errors from failing builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
