import type { Theme } from '../../shared/dist/index';
export declare class ThemeManager {
    private themesDir;
    constructor(themesDir: string);
    listThemes(): Theme[];
    getThemeCss(themeName: string, file: string): string | null;
}
