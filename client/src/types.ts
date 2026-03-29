export type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
};

export type MarkdownDocument = {
  frontmatter: Record<string, unknown>;
  html: string;
  title: string;
  raw: string;
};

export type ThemeVariant = {
  mode: 'light' | 'dark';
  cssFiles: string[];
};

export type Theme = {
  name: string;
  cssFiles: string[];
  variants: ThemeVariant[];
};
