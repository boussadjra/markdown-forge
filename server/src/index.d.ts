import type { ServerConfig, WsMessage, Plugin } from '../../shared/dist/index';
export declare class StudioServer {
    private app;
    private httpServer;
    private wss;
    private engine;
    private themeManager;
    private config;
    private plugins;
    private treeCache;
    constructor(config: ServerConfig);
    registerPlugin(plugin: Plugin): void;
    private setupRoutes;
    private getTree;
    invalidateTree(): void;
    broadcast(message: WsMessage): void;
    start(): Promise<number>;
    stop(): Promise<void>;
}
