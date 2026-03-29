/**
 * Bundle script for vsce packaging.
 * Copies all runtime artifacts into extension/ so vsce can pack them.
 *
 * Run: node scripts/bundle.mjs
 */

import { cpSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ext = join(root, 'extension');

// Destinations inside extension/
const targets = [
  { src: join(root, 'server', 'dist'), dest: join(ext, 'server-dist') },
  { src: join(root, 'shared', 'dist'), dest: join(ext, 'shared-dist') },
  { src: join(root, 'client', 'dist'), dest: join(ext, 'client-dist') },
  { src: join(root, 'themes'),         dest: join(ext, 'themes') },
];

console.log('Bundling runtime artifacts into extension/ ...');

for (const { src, dest } of targets) {
  if (!existsSync(src)) {
    console.error(`  ✗ Missing: ${src}  — run "npm run build" first`);
    process.exit(1);
  }
  if (existsSync(dest)) rmSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`  ✓ ${src} → ${dest}`);
}

// Copy server runtime node_modules (express, ws, markdown-it, etc.)
const serverNodeModules = join(root, 'server', 'node_modules');
const destNodeModules = join(ext, 'server-node_modules');

if (existsSync(serverNodeModules)) {
  if (existsSync(destNodeModules)) rmSync(destNodeModules, { recursive: true });
  cpSync(serverNodeModules, destNodeModules, { recursive: true });
  console.log(`  ✓ server/node_modules → ${destNodeModules}`);
}

// Patch extension dist: fix require paths from dev layout to bundled layout
const extJs = join(ext, 'dist', 'extension.js');
if (existsSync(extJs)) {
  let code = readFileSync(extJs, 'utf-8');
  // require("../../server/dist/index") → require("../server-dist/index")
  code = code.replace(
    /require\("\.\.\/\.\.\/server\/dist\/index"\)/g,
    'require("../server-dist/index")'
  );
  writeFileSync(extJs, code, 'utf-8');
  console.log('  ✓ Patched extension.js require paths');
}

// Patch server-dist: fix client dist path resolution
// The server already handles both bundled and dev layout via fs.existsSync check

// Patch server-dist: fix node_modules resolution for bundled layout
// Add NODE_PATH so server can find its deps from server-node_modules/
const serverIndexJs = join(ext, 'server-dist', 'index.js');
if (existsSync(serverIndexJs)) {
  let code = readFileSync(serverIndexJs, 'utf-8');
  // Prepend module path setup at the very top (after "use strict" if present)
  const preamble = `\n// Bundled: add server-node_modules to module search path\nconst _bundledModPath = require("path").join(__dirname, "..", "server-node_modules");\nif (require("fs").existsSync(_bundledModPath)) { module.paths.unshift(_bundledModPath); }\n`;
  if (!code.includes('_bundledModPath')) {
    if (code.startsWith('"use strict"')) {
      code = '"use strict";' + preamble + code.slice('"use strict";'.length);
    } else {
      code = preamble + code;
    }
    writeFileSync(serverIndexJs, code, 'utf-8');
    console.log('  ✓ Patched server-dist/index.js module resolution');
  }
}

console.log('Done. Now run: cd extension && npx @vscode/vsce package');
