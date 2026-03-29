/**
 * Bundle script for vsce packaging.
 * Copies all runtime artifacts into extension/ so vsce can pack them.
 *
 * Run: node scripts/bundle.mjs
 */

import { cpSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const ext = join(root, "extension");

// Destinations inside extension/
const targets = [
  { src: join(root, "server", "dist"), dest: join(ext, "server-dist") },
  { src: join(root, "shared", "dist"), dest: join(ext, "shared-dist") },
  { src: join(root, "client", "dist"), dest: join(ext, "client-dist") },
  { src: join(root, "themes"), dest: join(ext, "themes") },
];

console.log("Bundling runtime artifacts into extension/ ...");

for (const { src, dest } of targets) {
  if (!existsSync(src)) {
    console.error(`  ✗ Missing: ${src}  — run "npm run build" first`);
    process.exit(1);
  }
  if (existsSync(dest)) rmSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`  ✓ ${src} → ${dest}`);
}

// Create flat node_modules for server runtime deps using npm (not pnpm)
// pnpm uses symlinks which break when copied into the VSIX
const destNodeModules = join(ext, "server-node_modules");
const tempInstallDir = join(ext, "_temp-npm-install");

if (existsSync(destNodeModules)) rmSync(destNodeModules, { recursive: true });
if (existsSync(tempInstallDir)) rmSync(tempInstallDir, { recursive: true });

// Read server's production deps (excluding workspace refs)
const serverPkg = JSON.parse(readFileSync(join(root, "server", "package.json"), "utf-8"));
const prodDeps = Object.entries(serverPkg.dependencies || {})
  .filter(([, v]) => !v.startsWith("workspace:"))
  .reduce((o, [k, v]) => ({ ...o, [k]: v }), {});

// Write a minimal package.json and install with npm for a flat layout
mkdirSync(tempInstallDir, { recursive: true });
writeFileSync(
  join(tempInstallDir, "package.json"),
  JSON.stringify({ name: "temp", private: true, dependencies: prodDeps }),
);

try {
  execSync("npm install --production --no-package-lock", {
    cwd: tempInstallDir,
    stdio: "pipe",
  });
  cpSync(join(tempInstallDir, "node_modules"), destNodeModules, { recursive: true });
  console.log("  ✓ npm install → server-node_modules (flat, self-contained)");
} catch (e) {
  console.error("  ✗ npm install failed:", e.message);
  process.exit(1);
} finally {
  if (existsSync(tempInstallDir)) rmSync(tempInstallDir, { recursive: true });
}

// Patch extension dist: fix require paths from workspace packages to bundled layout
const extJs = join(ext, "dist", "extension.js");
if (existsSync(extJs)) {
  let code = readFileSync(extJs, "utf-8");
  // require("@markdown-forge/server") → require("../server-dist/index")
  code = code.replace(
    /require\("@markdown-forge\/server"\)/g,
    'require("../server-dist/index")',
  );
  // require("@markdown-forge/shared") → require("../shared-dist/index")
  code = code.replace(
    /require\("@markdown-forge\/shared"\)/g,
    'require("../shared-dist/index")',
  );
  writeFileSync(extJs, code, "utf-8");
  console.log("  ✓ Patched extension.js require paths");
}

// Patch server-dist: fix @markdown-forge/shared requires to bundled layout
const serverDistFiles = ["index.js", "engine.js", "themes.js", "tree.js"];
for (const file of serverDistFiles) {
  const filePath = join(ext, "server-dist", file);
  if (existsSync(filePath)) {
    let code = readFileSync(filePath, "utf-8");
    if (code.includes("@markdown-forge/shared")) {
      code = code.replace(
        /require\("@markdown-forge\/shared"\)/g,
        'require("../shared-dist/index")',
      );
      writeFileSync(filePath, code, "utf-8");
      console.log(`  ✓ Patched server-dist/${file} shared requires`);
    }
  }
}

// Patch extension.js: set NODE_PATH to find deps in server-node_modules
// This must run before any require() of server code.
const extJsForModulePatch = join(ext, "dist", "extension.js");
if (existsSync(extJsForModulePatch)) {
  let code = readFileSync(extJsForModulePatch, "utf-8");
  const preamble = `
// Bundled: add server-node_modules to NODE_PATH for module resolution
const _path = require("path");
const _bundledModPath = _path.resolve(__dirname, "..", "server-node_modules");
if (require("fs").existsSync(_bundledModPath)) {
  process.env.NODE_PATH = _bundledModPath + (process.env.NODE_PATH ? _path.delimiter + process.env.NODE_PATH : "");
  require("module")._initPaths();
}
`;
  if (!code.includes("_bundledModPath")) {
    if (code.startsWith('"use strict"')) {
      code = '"use strict";' + preamble + code.slice('"use strict";'.length);
    } else {
      code = preamble + code;
    }
    writeFileSync(extJsForModulePatch, code, "utf-8");
    console.log("  ✓ Patched extension.js module resolution (NODE_PATH)");
  }
}

console.log("Done. Now run: cd extension && npx @vscode/vsce package");
