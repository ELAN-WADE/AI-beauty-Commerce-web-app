import path from 'node:path';
import { fileURLToPath } from 'node:url';

const development = process.env.NODE_ENV === 'development';

const developmentPort = /^\d+$/.test(process.env.PORT || '') ? process.env.PORT : '3000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Browser checks must not share generated files with the user's dev preview.
  distDir: process.env.NEXT_DIST_DIR || (process.env.PLAYWRIGHT_NEXT_DIST === '1' ? '.next-browser' : development ? `.next-dev-${developmentPort}` : '.next'),
  // Keep Next's development controls clear of the original Admin entry pill.
  devIndicators: false,
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  reactStrictMode: true,
  // Keep existing VITE_* deployment settings working while migrating the
  // storefront to Next.js. Only public values are mapped into the browser.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.VITE_API_URL || 'http://localhost:3005',
    NEXT_PUBLIC_STRICT_API: process.env.NEXT_PUBLIC_STRICT_API || process.env.VITE_STRICT_API,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.VITE_SENTRY_DSN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  },
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = { ...(config.resolve.alias || {}) };
    return config;
  },
};

export default nextConfig;
