import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // trailingSlash can break App Router chunk URLs (e.g., _next/static/chunks)
  // Disable it to avoid ChunkLoadError timeouts in development and production
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Ensure @ alias works in both TS and JS files across all environments
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

export default nextConfig;
