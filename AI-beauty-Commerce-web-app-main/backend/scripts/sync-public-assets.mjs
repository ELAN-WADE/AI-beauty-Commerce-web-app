import { constants, copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Both Next.js entry points use the same original media. Preserve existing
// backend assets; bring over only missing media when running from the repository.
const source = fileURLToPath(new URL('../../public/', import.meta.url));
const destination = fileURLToPath(new URL('../public/', import.meta.url));
const media = /\.(svg|png|jpe?g|webp|avif|gif|ico|woff2?|mp4|webm)$/i;
let copied = 0;
function sync(from, to) {
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) sync(path.join(from, entry.name), target);
    else if (entry.isFile() && media.test(entry.name)) {
      mkdirSync(to, { recursive: true });
      try { copyFileSync(path.join(from, entry.name), target, constants.COPYFILE_EXCL); copied++; }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
    }
  }
}
if (existsSync(source)) sync(source, destination);
console.log(`Full-stack media ready (${copied} missing assets copied).`);
