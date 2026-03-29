"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ThemeManager {
    constructor(themesDir) {
        this.themesDir = themesDir;
    }
    listThemes() {
        if (!fs_1.default.existsSync(this.themesDir))
            return [];
        return fs_1.default
            .readdirSync(this.themesDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => {
            const dir = path_1.default.join(this.themesDir, d.name);
            const cssFiles = fs_1.default
                .readdirSync(dir)
                .filter((f) => f.endsWith('.css'))
                .map((f) => `${d.name}/${f}`);
            return { name: d.name, cssFiles };
        });
    }
    getThemeCss(themeName, file) {
        const filePath = path_1.default.join(this.themesDir, themeName, path_1.default.basename(file));
        const resolved = path_1.default.resolve(filePath);
        // Prevent directory traversal
        if (!resolved.startsWith(path_1.default.resolve(this.themesDir)))
            return null;
        if (!fs_1.default.existsSync(resolved))
            return null;
        return fs_1.default.readFileSync(resolved, 'utf-8');
    }
}
exports.ThemeManager = ThemeManager;
//# sourceMappingURL=themes.js.map