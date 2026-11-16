/**
 * Turns an SVG into a module whose default export is a data URL, the string Vite gives the
 * playground for `import x from './x.svg'`; Next would give an object, which an <img> cannot take.
 */
module.exports = function svgUrlLoader(source) {
    return `export default ${JSON.stringify(`data:image/svg+xml,${encodeURIComponent(source)}`)};`;
};
