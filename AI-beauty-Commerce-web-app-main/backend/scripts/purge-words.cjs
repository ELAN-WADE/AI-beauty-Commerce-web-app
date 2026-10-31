const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const dirsToScan = [
  path.resolve(repoRoot, 'src'),
  path.resolve(repoRoot, 'backend/src'),
  path.resolve(repoRoot, 'public'),
  path.resolve(repoRoot, 'backend/public')
];

function getFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist', 'drizzle'].includes(entry.name)) continue;
      getFiles(fullPath, list);
    } else if (/\.(tsx|ts|html|json|svg)$/.test(entry.name)) {
      list.push(fullPath);
    }
  }
  return list;
}

const allFiles = [];
dirsToScan.forEach(d => getFiles(d, allFiles));

let totalFilesModified = 0;
let totalReplacements = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Melanin rich / melanin-rich variations
  content = content.replace(/\bMelanin-rich\b/g, 'Natural');
  content = content.replace(/\bmelanin-rich\b/g, 'natural');
  content = content.replace(/\bMelanin-Rich\b/g, 'Natural');
  content = content.replace(/\bMELANIN-RICH\b/g, 'NATURAL');
  content = content.replace(/\bMelanin rich\b/g, 'Natural');
  content = content.replace(/\bmelanin rich\b/g, 'natural');
  content = content.replace(/\bMelanin Rich\b/g, 'Natural');

  // 2. Specific Melanin titles/tags
  content = content.replace(/\b#MelaninGlowRoutine\b/g, '#NaturalGlowRoutine');
  content = content.replace(/\b#MelaninGlow\b/g, '#NaturalGlow');
  content = content.replace(/\bMelanin Defense\b/g, 'Natural Defense');
  content = content.replace(/\bmelanin defense\b/g, 'natural defense');
  content = content.replace(/\bMELANIN DEFENSE\b/g, 'NATURAL DEFENSE');

  content = content.replace(/\bMelanin Radiance\b/g, 'Natural Radiance');
  content = content.replace(/\bMelanin Luminosity\b/g, 'Natural Luminosity');
  content = content.replace(/\bMelanin Glow\b/g, 'Natural Glow');
  content = content.replace(/\bmelanin glow\b/g, 'natural glow');
  content = content.replace(/\bMelanin Barrier\b/g, 'Natural Barrier');
  content = content.replace(/\bmelanin barrier\b/g, 'natural barrier');

  // 3. General melanin occurrences in prose / content
  content = content.replace(/\bMelanin\b/g, 'Natural');
  content = content.replace(/\bmelanin\b/g, 'natural');
  content = content.replace(/\bMELANIN\b/g, 'NATURAL');

  // 4. Clinical variations
  content = content.replace(/\bClinical-grade\b/g, 'Natural-grade');
  content = content.replace(/\bclinical-grade\b/g, 'natural-grade');
  content = content.replace(/\bClinical-Grade\b/g, 'Natural-Grade');
  content = content.replace(/\bCLINICAL-GRADE\b/g, 'NATURAL-GRADE');

  content = content.replace(/\bClinical\b/g, 'Natural');
  content = content.replace(/\bclinical\b/g, 'natural');
  content = content.replace(/\bCLINICAL\b/g, 'NATURAL');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalFilesModified++;
    console.log('Updated:', path.relative(repoRoot, file));
  }
}

console.log(`\n🎉 Completed word purge: ${totalFilesModified} files updated.`);

