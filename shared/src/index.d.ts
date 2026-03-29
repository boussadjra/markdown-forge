export type TreeNode = {
    name: string;
    path: string;
    type: 'file' | 'dir';
    children?: TreeNode[];
};
export type Theme = {
    name: string;
    cssFiles: string[];
};
export interface Plugin {
    name: string;
    extendMarkdown?(md: unknown): void;
    onTreeGenerated?(tree: TreeNode[]): TreeNode[];
    onPageRender?(html: string): string;
}
export type MarkdownDocument = {
    frontmatter: Record<string, unknown>;
    html: string;
    title: string;
};
export type WsMessage = {
    type: 'file-changed';
    path: string;
} | {
    type: 'tree-changed';
} | {
    type: 'reload';
};
export type ServerConfig = {
    port: number;
    workspaceRoot: string;
    theme: string;
    themesDir: string;
    pluginsDir: string;
};
