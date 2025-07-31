import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Exclude API routes from static export
  exportPathMap: async function () {
    return {
      '/': { page: '/' }
    }
  }
};

export default nextConfig;
