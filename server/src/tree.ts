import fs from 'fs';
import path from 'path';
import ignore, { type Ignore } from 'ignore';
import type { TreeNode } from '../../shared/dist/index';

const ALWAYS_IGNORED = new Set(['node_modules', '.git', '.vscode', 'dist', 'out']);

function loadGitignore(root: string): Ignore {
  const ig = ignore();
  const gitignorePath = path.join(root, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    ig.add(content);
  }
  return ig;
}

export function buildTree(dir: string, relativeTo: string, ig?: Ignore): TreeNode[] {
  if (!ig) {
    ig = loadGitignore(relativeTo);
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (ALWAYS_IGNORED.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');

    // Check against .gitignore patterns
    const testPath = entry.isDirectory() ? relPath + '/' : relPath;
    if (ig.ignores(testPath)) continue;

    if (entry.isDirectory()) {
      const children = buildTree(fullPath, relativeTo, ig);
      if (children.length > 0) {
        nodes.push({ name: entry.name, path: relPath, type: 'dir', children });
      }
    } else {
      nodes.push({ name: entry.name, path: relPath, type: 'file' });
    }
  }

  // dirs first, then files, alphabetical within each group
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}
