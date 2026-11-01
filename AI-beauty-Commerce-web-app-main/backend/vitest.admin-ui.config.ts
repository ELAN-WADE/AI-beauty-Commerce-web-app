import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node', include: ['tests/admin-mfa.browser.ts'], testTimeout: 15000 },
});
