import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import type { ServerConfig, WsMessage, Plugin, TreeNode } from '../../shared/dist/index';
import { MarkdownEngine } from './engine';
import { buildTree } from './tree';
import { ThemeManager } from './themes';

export class StudioServer {
  private app = express();
  private httpServer: http.Server;
  private wss: WebSocketServer;
  private engine: MarkdownEngine;
  private themeManager: ThemeManager;
  private config: ServerConfig;
  private plugins: Plugin[] = [];
  private treeCache: TreeNode[] | null = null;

  constructor(config: ServerConfig) {
    this.config = config;
    this.engine = new MarkdownEngine();
    this.themeManager = new ThemeManager(config.themesDir);
    this.httpServer = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.setupRoutes();
  }

  registerPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
    this.engine.registerPlugin(plugin);
    this.treeCache = null;
  }

  private setupRoutes(): void {
    this.app.use(express.json());

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

      const resolved = path.resolve(this.config.workspaceRoot, filePath);
      // Prevent directory traversal outside workspace
      if (!resolved.startsWith(path.resolve(this.config.workspaceRoot))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (!fs.existsSync(resolved) || !resolved.endsWith('.md')) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const source = fs.readFileSync(resolved, 'utf-8');
      const doc = this.engine.render(source);
      res.json({ ...doc, raw: source });
    });

    this.app.put('/api/file', (req, res) => {
      const filePath = req.query['path'];
      if (typeof filePath !== 'string' || !filePath) {
        res.status(400).json({ error: 'Missing path query parameter' });
        return;
      }

      const resolved = path.resolve(this.config.workspaceRoot, filePath);
      if (!resolved.startsWith(path.resolve(this.config.workspaceRoot))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
      if (!resolved.endsWith('.md')) {
        res.status(400).json({ error: 'Only .md files can be saved' });
        return;
      }

      const { content } = req.body as { content?: string };
      if (typeof content !== 'string') {
        res.status(400).json({ error: 'Missing content in body' });
        return;
      }

      fs.writeFileSync(resolved, content, 'utf-8');
      const doc = this.engine.render(content);
      res.json({ ...doc, raw: content });
    });

    this.app.get('/api/themes', (_req, res) => {
      res.json(this.themeManager.listThemes());
    });

    // Theme CSS assets
    this.app.get('/themes/:theme/:file', (req, res) => {
      const css = this.themeManager.getThemeCss(req.params['theme']!, req.params['file']!);
      if (!css) {
        res.status(404).send('Not found');
        return;
      }
      res.type('text/css').send(css);
    });

    // Serve highlight.js theme CSS files for code syntax themes
    this.app.get('/hljs-themes/:file', (req, res) => {
      const fileName = req.params['file']!;
      // Sanitize: only allow alphanumeric, dashes, dots
      if (!/^[a-zA-Z0-9._-]+\.css$/.test(fileName)) {
        res.status(400).send('Invalid file name');
        return;
      }
      const hljsStylesDir = path.join(
        path.dirname(require.resolve('highlight.js/package.json')),
        'styles',
      );
      const filePath = path.resolve(hljsStylesDir, fileName);
      if (!filePath.startsWith(hljsStylesDir) || !fs.existsSync(filePath)) {
        res.status(404).send('Not found');
        return;
      }
      res.type('text/css').sendFile(filePath);
    });

    // Client static files — served from the built client dist
    const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
    if (fs.existsSync(clientDist)) {
      this.app.use(express.static(clientDist));
      // SPA fallback
      this.app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  private getTree(): TreeNode[] {
    if (!this.treeCache) {
      this.treeCache = buildTree(this.config.workspaceRoot, this.config.workspaceRoot);
    }
    return this.treeCache;
  }

  invalidateTree(): void {
    this.treeCache = null;
  }

  broadcast(message: WsMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, () => {
        const addr = this.httpServer.address();
        const port = typeof addr === 'object' && addr ? addr.port : this.config.port;
        resolve(port);
      });
      this.httpServer.on('error', reject);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss.close();
      this.httpServer.close((err) => (err ? reject(err) : resolve()));
    });
  }
}
