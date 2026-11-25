/**
 * The library's stylesheet as a module whose default export is its text, as Vite's `?raw` gives
 * it to the playground's theme export. Applied to the stand-in files raw/*.css.txt that
 * next.config.ts aliases `@contui/ui/theme.css?raw` and `@contui/ui/tokens.css?raw` to.
 */
const { readFileSync } = require('node:fs');
const path = require('node:path');

module.exports = function rawCssLoader() {
    const name = path.basename(this.resourcePath).replace(/\.txt$/, '');
    const file = path.join(__dirname, '..', '..', 'src', 'styles', name);
    this.addDependency(file);
    return `export default ${JSON.stringify(readFileSync(file, 'utf8'))};`;
};
