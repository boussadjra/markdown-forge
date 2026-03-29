"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTree = buildTree;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const IGNORED = new Set(['node_modules', '.git', '.vscode', 'dist', 'out']);
function buildTree(dir, relativeTo) {
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    const nodes = [];
    for (const entry of entries) {
        if (IGNORED.has(entry.name) || entry.name.startsWith('.'))
            continue;
        const fullPath = path_1.default.join(dir, entry.name);
        const relPath = path_1.default.relative(relativeTo, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
            const children = buildTree(fullPath, relativeTo);
            if (children.length > 0) {
                nodes.push({ name: entry.name, path: relPath, type: 'dir', children });
            }
        }
        else if (entry.name.endsWith('.md')) {
            nodes.push({ name: entry.name, path: relPath, type: 'file' });
        }
    }
    // dirs first, then files, alphabetical within each group
    nodes.sort((a, b) => {
        if (a.type !== b.type)
            return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    return nodes;
}
//# sourceMappingURL=tree.js.map