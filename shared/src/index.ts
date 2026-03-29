// ─── Tree ────────────────────────────────────────────────────

export type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
};

// ─── Theme ───────────────────────────────────────────────────

export type Theme = {
  name: string;
  cssFiles: string[];
};

// ─── Plugin ──────────────────────────────────────────────────

export interface Plugin {
  name: string;
  extendMarkdown?(md: unknown): void;
  onTreeGenerated?(tree: TreeNode[]): TreeNode[];
  onPageRender?(html: string): string;
}

// ─── Frontmatter ─────────────────────────────────────────────

export type MarkdownDocument = {
  frontmatter: Record<string, unknown>;
  html: string;
  title: string;
};

// ─── WebSocket Messages ──────────────────────────────────────

export type WsMessage =
  | { type: 'file-changed'; path: string }
  | { type: 'tree-changed' }
  | { type: 'reload' };

// ─── Server Config ───────────────────────────────────────────

export type ServerConfig = {
  port: number;
  workspaceRoot: string;
  theme: string;
  themesDir: string;
  pluginsDir: string;
};
