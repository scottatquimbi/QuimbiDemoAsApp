import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // This disables the build-time ESLint check to avoid the deprecated options error
    // We should run ESLint manually during development instead
    ignoreDuringBuilds: true
  },
  // Use standalone output for Electron packaging with API routes
  output: 'standalone',
  images: {
    unoptimized: true
  },
  // Fix Turbopack chunk loading issues (moved to stable config)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Additional stability configurations
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['ai', 'ollama'],
  },
  // Webpack fallback for development stability
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      
      // Fix chunk loading issues
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
