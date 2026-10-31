import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// CLI/worker processes must use the same file priority as the Next.js API.
// Existing shell/deployment environment variables always take precedence.
const root = fileURLToPath(new URL('../../', import.meta.url));
const mode = process.env.NODE_ENV || 'development';
for (const file of [`.env.${mode}.local`, ...(mode === 'test' ? [] : ['.env.local']), `.env.${mode}`, '.env']) {
  dotenv.config({ path: path.join(root, file) });
}
