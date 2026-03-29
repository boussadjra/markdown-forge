import fs from 'fs';
import path from 'path';
import type { Theme } from '@markdown-forge/shared';

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
        const allFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.css'));

        // Base CSS files (no -dark or -light suffix)
        const cssFiles = allFiles
          .filter((f) => !/-dark\.css$/.test(f) && !/-light\.css$/.test(f))
          .map((f) => `${d.name}/${f}`);

        // Detect variants
        const variants: Theme['variants'] = [];
        const darkFiles = allFiles.filter((f) => /-dark\.css$/.test(f));
        const lightFiles = allFiles.filter((f) => /-light\.css$/.test(f));

        if (darkFiles.length > 0) {
          variants.push({ mode: 'dark', cssFiles: darkFiles.map((f) => `${d.name}/${f}`) });
        }
        if (lightFiles.length > 0) {
          variants.push({ mode: 'light', cssFiles: lightFiles.map((f) => `${d.name}/${f}`) });
        }

        return { name: d.name, cssFiles, variants };
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
