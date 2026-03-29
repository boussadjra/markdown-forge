import type { TreeNode, MarkdownDocument, Theme } from './types';

const BASE = '';

export async function fetchTree(): Promise<TreeNode[]> {
  const res = await fetch(`${BASE}/api/tree`);
  if (!res.ok) throw new Error('Failed to fetch tree');
  return res.json();
}

export async function fetchFile(path: string): Promise<MarkdownDocument> {
  const res = await fetch(`${BASE}/api/file?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error('Failed to fetch file');
  return res.json();
}

export async function saveFile(
  path: string,
  content: string,
): Promise<MarkdownDocument> {
  const res = await fetch(`${BASE}/api/file?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to save file');
  return res.json();
}

export async function fetchThemes(): Promise<Theme[]> {
  const res = await fetch(`${BASE}/api/themes`);
  if (!res.ok) throw new Error('Failed to fetch themes');
  return res.json();
}
