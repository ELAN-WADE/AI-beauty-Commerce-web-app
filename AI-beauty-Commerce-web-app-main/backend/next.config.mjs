import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const development = process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  // Pin tracing to this app (the repo nests lockfiles; inference picks wrong roots).
  outputFileTracingRoot: backendDir,
  // Phase 2 low-bandwidth diet: dedupe barrel imports (lucide alone ships
  // hundreds of icons) so route bundles stay small on 3G.
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@hugeicons/react'],
  },
  images: {
    // Product packshots are same-origin `public/` files; modern formats for
    // any future remote/optimized images. No markup changes needed today.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      ...(process.env.PUBLIC_MEDIA_URL ? (() => {
        const url = new URL(process.env.PUBLIC_MEDIA_URL);
        return [{ protocol: url.protocol.slice(0, -1), hostname: url.hostname, port: url.port, pathname: `${url.pathname.replace(/\/$/, '')}/**` }];
      })() : []),
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // API returns JSON only: deny everything by default.
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS is also enforced at the reverse proxy; harmless to repeat here.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Batch-1 page hardening (Part VII): mirrors the deployed SPA policy.
        // script 'unsafe-inline' is required for Next hydration; camera=(self)
        // preserves the AI skin scan (getUserMedia) while denying third parties.
        source: '/((?!api/).*)',
        headers: [
          { key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self'${development ? ' ws: wss:' : ''}; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'${development ? '' : '; upgrade-insecure-requests'}` },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
