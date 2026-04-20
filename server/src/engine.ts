import MarkdownIt from 'markdown-it';
import matter from 'gray-matter';
import hljs from 'highlight.js';
import type { MarkdownDocument, Plugin } from '@markdown-forge/shared';

export class MarkdownEngine {
  private md: MarkdownIt;
  private plugins: Plugin[] = [];

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        }
        return `<pre class="hljs"><code>${this.md.utils.escapeHtml(str)}</code></pre>`;
      },
    });

    // Render mermaid fences as <pre class="mermaid"> for client-side rendering.
    // We keep the raw source in a data attribute so the client can re-render
    // (e.g. on theme change) after mermaid replaces the inner HTML with SVG.
    const defaultFence = this.md.renderer.rules['fence']!;
    this.md.renderer.rules['fence'] = (tokens, idx, options, env, self) => {
      const token = tokens[idx]!;
      const info = (token.info || '').trim().toLowerCase();
      if (info === 'mermaid') {
        const escaped = this.md.utils.escapeHtml(token.content);
        return `<pre class="mermaid" data-mermaid-src="${escaped}">${escaped}</pre>\n`;
      }
      return defaultFence(tokens, idx, options, env, self);
    };

    // Add heading IDs for anchor links / table of contents
    this.md.renderer.rules['heading_open'] = (tokens, idx) => {
      const token = tokens[idx];
      const tag = token.tag; // h1, h2, etc.
      const inline = tokens[idx + 1];
      const text = inline?.children
        ?.filter((t) => t.type === 'text' || t.type === 'code_inline')
        .map((t) => t.content)
        .join('') ?? '';
      const id = this.slugify(text);
      return `<${tag} id="${id}">`;
    };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  registerPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
    if (plugin.extendMarkdown) {
      plugin.extendMarkdown(this.md);
    }
  }

  render(source: string): MarkdownDocument {
    const { data: frontmatter, content } = matter(source);

    let html = this.md.render(content);

    // Run post-render plugin hooks
    for (const plugin of this.plugins) {
      if (plugin.onPageRender) {
        html = plugin.onPageRender(html);
      }
    }

    const title =
      (typeof frontmatter['title'] === 'string' ? frontmatter['title'] : undefined) ??
      this.extractTitle(content) ??
      'Untitled';

    return { frontmatter, html, title };
  }

  private extractTitle(content: string): string | undefined {
    const match = /^#\s+(.+)$/m.exec(content);
    return match?.[1]?.trim();
  }
}
