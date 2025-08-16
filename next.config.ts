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
  // Clean configuration for standalone builds
  trailingSlash: false,
  // Fix Turbopack chunk loading issues (moved to stable config)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Ensure static optimization works correctly
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['ai', 'ollama'],
  },
  // Webpack fallback for development stability
  webpack: (config, { dev, isServer }) => {
    // Race condition debugging
    if (dev) {
      console.log(`🔧 [RACE DEBUG] Webpack config called - dev: ${dev}, isServer: ${isServer}, timestamp: ${new Date().toISOString()}`);
      console.log(`🔧 [RACE DEBUG] Cache directory exists: ${require('fs').existsSync('.next/cache')}`);
      
      // Add compilation start/end hooks for race condition detection
      config.plugins = config.plugins || [];
      config.plugins.push({
        apply: (compiler: any) => {
          compiler.hooks.compilation.tap('RaceConditionDebug', () => {
            console.log(`🔧 [RACE DEBUG] Compilation started at ${new Date().toISOString()}`);
          });
          
          compiler.hooks.done.tap('RaceConditionDebug', (stats: any) => {
            console.log(`🔧 [RACE DEBUG] Compilation finished at ${new Date().toISOString()}`);
            if (stats.hasErrors()) {
              console.log(`🚨 [RACE DEBUG] Compilation had errors - potential cache race condition`);
            }
          });
        }
      });
    }
    
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
