import type { Plugin } from '@markdown-forge/shared';

/**
 * Example plugin: adds "reading time" estimate to rendered pages.
 */
const readingTimePlugin: Plugin = {
  name: 'reading-time',

  onPageRender(html: string): string {
    // Strip HTML tags to count words
    const text = html.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));

    const badge = `<div class="reading-time" style="color:#6b7280;font-size:0.875rem;margin-bottom:1.5rem;">📖 ${minutes} min read · ${words} words</div>`;
    return badge + html;
  },
};

export default readingTimePlugin;
