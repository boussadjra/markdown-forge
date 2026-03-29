import type { MarkdownDocument, Plugin } from '../../shared/dist/index';
export declare class MarkdownEngine {
    private md;
    private plugins;
    constructor();
    registerPlugin(plugin: Plugin): void;
    render(source: string): MarkdownDocument;
    private extractTitle;
}
