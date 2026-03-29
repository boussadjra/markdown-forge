"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudioServer = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ws_1 = require("ws");
const engine_1 = require("./engine");
const tree_1 = require("./tree");
const themes_1 = require("./themes");
class StudioServer {
    constructor(config) {
        this.app = (0, express_1.default)();
        this.plugins = [];
        this.treeCache = null;
        this.config = config;
        this.engine = new engine_1.MarkdownEngine();
        this.themeManager = new themes_1.ThemeManager(config.themesDir);
        this.httpServer = http_1.default.createServer(this.app);
        this.wss = new ws_1.WebSocketServer({ server: this.httpServer });
        this.setupRoutes();
    }
    registerPlugin(plugin) {
        this.plugins.push(plugin);
        this.engine.registerPlugin(plugin);
        this.treeCache = null;
    }
    setupRoutes() {
        this.app.use(express_1.default.json());
        // --- API routes ---
        this.app.get('/api/tree', (_req, res) => {
            let tree = this.getTree();
            for (const plugin of this.plugins) {
                if (plugin.onTreeGenerated) {
                    tree = plugin.onTreeGenerated(tree);
                }
            }
            res.json(tree);
        });
        this.app.get('/api/file', (req, res) => {
            const filePath = req.query['path'];
            if (typeof filePath !== 'string' || !filePath) {
                res.status(400).json({ error: 'Missing path query parameter' });
                return;
            }
            const resolved = path_1.default.resolve(this.config.workspaceRoot, filePath);
            // Prevent directory traversal outside workspace
            if (!resolved.startsWith(path_1.default.resolve(this.config.workspaceRoot))) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            if (!fs_1.default.existsSync(resolved) || !resolved.endsWith('.md')) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            const source = fs_1.default.readFileSync(resolved, 'utf-8');
            const doc = this.engine.render(source);
            res.json(doc);
        });
        this.app.put('/api/file', (req, res) => {
            const filePath = req.query['path'];
            if (typeof filePath !== 'string' || !filePath) {
                res.status(400).json({ error: 'Missing path query parameter' });
                return;
            }
            const resolved = path_1.default.resolve(this.config.workspaceRoot, filePath);
            if (!resolved.startsWith(path_1.default.resolve(this.config.workspaceRoot))) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            if (!resolved.endsWith('.md')) {
                res.status(400).json({ error: 'Only .md files can be saved' });
                return;
            }
            const { content } = req.body;
            if (typeof content !== 'string') {
                res.status(400).json({ error: 'Missing content in body' });
                return;
            }
            fs_1.default.writeFileSync(resolved, content, 'utf-8');
            const doc = this.engine.render(content);
            res.json(doc);
        });
        this.app.get('/api/themes', (_req, res) => {
            res.json(this.themeManager.listThemes());
        });
        // Theme CSS assets
        this.app.get('/themes/:theme/:file', (req, res) => {
            const css = this.themeManager.getThemeCss(req.params['theme'], req.params['file']);
            if (!css) {
                res.status(404).send('Not found');
                return;
            }
            res.type('text/css').send(css);
        });
        // Client static files — served from the built client dist
        const clientDist = path_1.default.join(__dirname, '..', '..', 'client', 'dist');
        if (fs_1.default.existsSync(clientDist)) {
            this.app.use(express_1.default.static(clientDist));
            // SPA fallback
            this.app.get('*', (_req, res) => {
                res.sendFile(path_1.default.join(clientDist, 'index.html'));
            });
        }
    }
    getTree() {
        if (!this.treeCache) {
            this.treeCache = (0, tree_1.buildTree)(this.config.workspaceRoot, this.config.workspaceRoot);
        }
        return this.treeCache;
    }
    invalidateTree() {
        this.treeCache = null;
    }
    broadcast(message) {
        const data = JSON.stringify(message);
        for (const client of this.wss.clients) {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(data);
            }
        }
    }
    start() {
        return new Promise((resolve, reject) => {
            this.httpServer.listen(this.config.port, () => {
                const addr = this.httpServer.address();
                const port = typeof addr === 'object' && addr ? addr.port : this.config.port;
                resolve(port);
            });
            this.httpServer.on('error', reject);
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            this.wss.close();
            this.httpServer.close((err) => (err ? reject(err) : resolve()));
        });
    }
}
exports.StudioServer = StudioServer;
//# sourceMappingURL=index.js.map