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
