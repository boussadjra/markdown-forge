# Markdown Forge

A VS Code extension that serves Markdown files as a live documentation website in the browser.

## Features

- **Live Preview** — Serve markdown files as a beautiful website
- **Sidebar Navigation** — Browse all markdown files in your workspace
- **Live Reload** — Changes reflect instantly via WebSocket
- **Theming** — Switch themes dynamically, create custom themes
- **Extensibility** — Plugin system for markdown rendering, sidebar, and layout
- **Export** — Export to static HTML site

## Architecture

```
/extension   → VS Code extension (activation, commands, file watching)
/server      → HTTP + WebSocket server (Express, markdown-it)
/client      → Web UI (Vue 3 + Vite + Tailwind CSS)
/shared      → Shared types and contracts
/themes      → CSS themes
/plugins     → Example plugins
```

## Development

```bash
npm install
npm run build
```

Then press F5 in VS Code to launch the extension in debug mode.

## Usage

1. Open a workspace with markdown files
2. Open Command Palette → **Markdown Forge: Serve as Website**
3. Browser opens with your documentation site
