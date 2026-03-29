"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownEngine = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const highlight_js_1 = __importDefault(require("highlight.js"));
class MarkdownEngine {
    constructor() {
        this.plugins = [];
        this.md = new markdown_it_1.default({
            html: true,
            linkify: true,
            typographer: true,
            highlight: (str, lang) => {
                if (lang && highlight_js_1.default.getLanguage(lang)) {
                    return `<pre class="hljs"><code>${highlight_js_1.default.highlight(str, { language: lang }).value}</code></pre>`;
                }
                return `<pre class="hljs"><code>${this.md.utils.escapeHtml(str)}</code></pre>`;
            },
        });
    }
    registerPlugin(plugin) {
        this.plugins.push(plugin);
        if (plugin.extendMarkdown) {
            plugin.extendMarkdown(this.md);
        }
    }
    render(source) {
        const { data: frontmatter, content } = (0, gray_matter_1.default)(source);
        let html = this.md.render(content);
        // Run post-render plugin hooks
        for (const plugin of this.plugins) {
            if (plugin.onPageRender) {
                html = plugin.onPageRender(html);
            }
        }
        const title = (typeof frontmatter['title'] === 'string' ? frontmatter['title'] : undefined) ??
            this.extractTitle(content) ??
            'Untitled';
        return { frontmatter, html, title };
    }
    extractTitle(content) {
        const match = /^#\s+(.+)$/m.exec(content);
        return match?.[1]?.trim();
    }
}
exports.MarkdownEngine = MarkdownEngine;
//# sourceMappingURL=engine.js.map