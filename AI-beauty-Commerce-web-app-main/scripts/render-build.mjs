import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

console.log('[render-build] Starting Render build...');

let targetDir = process.cwd();
if (existsSync(path.join(targetDir, 'backend'))) {
  targetDir = path.join(targetDir, 'backend');
} else if (existsSync(path.join(targetDir, 'AI-beauty-Commerce-web-app-main', 'backend'))) {
  targetDir = path.join(targetDir, 'AI-beauty-Commerce-web-app-main', 'backend');
}

console.log(`[render-build] Resolved target directory: ${targetDir}`);

console.log('[render-build] Installing dependencies...');
execSync('npm install', { cwd: targetDir, stdio: 'inherit' });

console.log('[render-build] Compiling production build...');
execSync('npm run build', { cwd: targetDir, stdio: 'inherit' });

console.log('[render-build] Build completed successfully!');

