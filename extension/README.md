# Markdown Forge

Serve your Markdown files as a live documentation website directly from VS Code.

## Features

- **Live Preview** — Instantly serve any folder of Markdown files as a browseable documentation site
- **Hot Reload** — Changes in your editor are reflected in the browser in real time via WebSocket
- **7 UI Themes** — Default, GitHub, Minimal, Dark, Dracula, Nord, and Solarized
- **13 Code Themes** — Syntax highlighting powered by highlight.js with 13 selectable themes
- **Dark Mode** — Toggle between light and dark modes
- **In-Browser Editing** — Edit Markdown files directly in the browser and save back to disk
- **Full File Tree** — Browse all workspace files with .gitignore-aware filtering
- **Static Export** — Export your documentation as a standalone static site

## Usage

1. Open a folder containing Markdown files
2. Open any `.md` file
3. Click the **globe icon** in the editor title bar (or run `Markdown Forge: Serve as Website`)
4. Your browser opens at `http://localhost:4200` with your docs site

## Commands

| Command | Description |
|---------|-------------|
| `Markdown Forge: Serve as Website` | Start the documentation server |
| `Markdown Forge: Open in Browser` | Open the running site in your browser |
| `Markdown Forge: Stop Server` | Stop the server |
| `Markdown Forge: Export as Static Site` | Export to a static HTML site |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `markdownForge.port` | `4200` | Server port |
| `markdownForge.theme` | `default` | Active UI theme |
| `markdownForge.autoReload` | `true` | Auto-reload on file changes |

## License

MIT
