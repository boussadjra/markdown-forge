import * as vscode from 'vscode';
import * as path from 'path';
import { StudioServer } from '@markdown-forge/server';
import type { Plugin } from '@markdown-forge/shared';

let server: StudioServer | null = null;
let fileWatcher: vscode.FileSystemWatcher | null = null;
let actualPort: number | null = null;

function setServerRunning(running: boolean): void {
  vscode.commands.executeCommand('setContext', 'markdownForge.serverRunning', running);
}

export function activate(context: vscode.ExtensionContext) {
  setServerRunning(false);

  // --- Serve Command ---
  const serveCmd = vscode.commands.registerCommand('markdownForge.serve', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('Open a workspace folder first.');
      return;
    }

    if (server) {
      vscode.window.showInformationMessage('Markdown Forge is already running.');
      openBrowser(actualPort ?? getPort());
      return;
    }

    const config = vscode.workspace.getConfiguration('markdownForge');
    const port = config.get<number>('port', 4200);
    const theme = config.get<string>('theme', 'default');
    const autoReload = config.get<boolean>('autoReload', true);

    const workspaceRoot = workspaceFolder.uri.fsPath;
    const extensionRoot = context.extensionPath;
    const themesDir = path.join(extensionRoot, 'themes');
    const pluginsDir = path.join(extensionRoot, 'plugins');

    server = new StudioServer({
      port,
      workspaceRoot,
      theme,
      themesDir,
      pluginsDir,
    });

    try {
      actualPort = await server.start();
      setServerRunning(true);
      vscode.window.showInformationMessage(`Markdown Forge running on port ${actualPort}`);

      // Determine initial file to open
      const activeFile = vscode.window.activeTextEditor?.document;
      let filePath = '';
      if (activeFile && activeFile.languageId === 'markdown') {
        filePath = path.relative(workspaceRoot, activeFile.uri.fsPath).replace(/\\/g, '/');
      }

      openBrowser(actualPort, filePath);

      // File watching
      if (autoReload) {
        fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.md');

        fileWatcher.onDidChange((uri) => {
          const rel = path.relative(workspaceRoot, uri.fsPath).replace(/\\/g, '/');
          server?.broadcast({ type: 'file-changed', path: rel });
        });

        fileWatcher.onDidCreate(() => {
          server?.invalidateTree();
          server?.broadcast({ type: 'tree-changed' });
        });

        fileWatcher.onDidDelete(() => {
          server?.invalidateTree();
          server?.broadcast({ type: 'tree-changed' });
        });

        context.subscriptions.push(fileWatcher);
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to start server: ${err}`);
      server = null;
      actualPort = null;
      setServerRunning(false);
    }
  });

  // --- Open in Browser Command (for already-running server) ---
  const openCmd = vscode.commands.registerCommand('markdownForge.openInBrowser', async () => {
    if (!server || !actualPort) {
      vscode.window.showErrorMessage('Server is not running. Use "Serve as Website" first.');
      return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const activeFile = vscode.window.activeTextEditor?.document;
    let filePath = '';
    if (activeFile && activeFile.languageId === 'markdown' && workspaceRoot) {
      filePath = path.relative(workspaceRoot, activeFile.uri.fsPath).replace(/\\/g, '/');
    }

    openBrowser(actualPort, filePath);
  });

  // --- Stop Command ---
  const stopCmd = vscode.commands.registerCommand('markdownForge.stop', async () => {
    if (!server) {
      vscode.window.showInformationMessage('Markdown Forge is not running.');
      return;
    }

    await server.stop();
    server = null;
    actualPort = null;
    fileWatcher?.dispose();
    fileWatcher = null;
    setServerRunning(false);
    vscode.window.showInformationMessage('Markdown Forge stopped.');
  });

  // --- Export Command (placeholder) ---
  const exportCmd = vscode.commands.registerCommand('markdownForge.exportSite', async () => {
    vscode.window.showInformationMessage('Export feature coming soon.');
  });

  context.subscriptions.push(serveCmd, openCmd, stopCmd, exportCmd);

  // --- Extensibility API ---
  return {
    registerPlugin(plugin: Plugin): void {
      server?.registerPlugin(plugin);
    },
  };
}

export function deactivate(): Promise<void> | undefined {
  if (server) {
    const s = server;
    server = null;
    actualPort = null;
    fileWatcher?.dispose();
    fileWatcher = null;
    setServerRunning(false);
    return s.stop();
  }
}

function getPort(): number {
  return vscode.workspace.getConfiguration('markdownForge').get<number>('port', 4200);
}

async function openBrowser(port: number, filePath?: string): Promise<void> {
  let url = `http://localhost:${port}`;
  if (filePath) {
    url += `?file=${encodeURIComponent(filePath)}`;
  }
  await vscode.env.openExternal(vscode.Uri.parse(url));
}
