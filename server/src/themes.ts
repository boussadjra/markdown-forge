import fs from 'fs';
import path from 'path';
import type { Theme } from '../../shared/dist/index';

export class ThemeManager {
  private themesDir: string;

  constructor(themesDir: string) {
    this.themesDir = themesDir;
  }

  listThemes(): Theme[] {
    if (!fs.existsSync(this.themesDir)) return [];

    return fs
      .readdirSync(this.themesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => {
        const dir = path.join(this.themesDir, d.name);
        const cssFiles = fs
          .readdirSync(dir)
          .filter((f) => f.endsWith('.css'))
          .map((f) => `${d.name}/${f}`);
        return { name: d.name, cssFiles };
      });
  }

  getThemeCss(themeName: string, file: string): string | null {
    const filePath = path.join(this.themesDir, themeName, path.basename(file));
    const resolved = path.resolve(filePath);
    // Prevent directory traversal
    if (!resolved.startsWith(path.resolve(this.themesDir))) return null;
    if (!fs.existsSync(resolved)) return null;
    return fs.readFileSync(resolved, 'utf-8');
  }
}
