import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const api = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL;
    const isHttps = !!api && /^https:\/\//.test(api);
    const isLocal = !!api && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(api);
    // Production deploys must point at the real HTTPS API: otherwise the
    // storefront would silently run on mocks or a dead localhost backend.
    // Localhost is only acceptable for non-production builds.
    if (mode === 'production') {
      if (!isHttps) {
        throw new Error('Production build requires VITE_API_URL set to the HTTPS backend URL.');
      }
    } else if (!isHttps && !isLocal) {
      throw new Error('Build requires VITE_API_URL (HTTPS, or http://localhost for local builds).');
    }
  }
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  preview: {
    port: 5173,
    host: true,
  },
  esbuild: {
    sourcemap: false,
    legalComments: 'none',
  }
  }
})
