import { exportTheme, tailwindEntry } from '@playground/theme-export';
import type { ThemeOptions } from 'continuum';

/*
 * A few lines of what the builder exports, cut from the real file: the theme's whole app.css is
 * written by the playground's own export (tailwindEntry), and the primary ramp is kept from its
 * light @theme block and its dark block, so a figure shows the export as it is, light and dark
 * together. The playground's module is client-side by habit, so this is imported by client parts.
 */

const primaryLines = (block: string) =>
    block.split('\n').filter(line => /^\s*--color-primary-\d+:/.test(line));

/** The whole app.css the builder would export for these options. */
export const appCss = (options: ThemeOptions, label = 'Your theme') =>
    tailwindEntry(exportTheme(options, label, 'light'));

/**
 * The theme's colours alone, as they stand in its app.css: every --color-* of the @theme block,
 * then the ones dark changes. A stylesheet of its own, to paste into a Tailwind v4 entry.
 */
export const colourTokens = (options: ThemeOptions) => {
    const css = appCss(options);
    const colours = (block = '') =>
        block
            .split('\n')
            .filter(line => /^\s*--color-[\w-]+:/.test(line))
            .map(line => `    ${line.trim()}`);
    const light = css.split('@theme static {')[1]?.split('\n}')[0];
    const dark = css.split('\n[data-mode="dark"] {')[1]?.split('\n}')[0];
    return [
        '@theme {',
        ...colours(light),
        '}',
        '',
        '[data-mode="dark"] {',
        ...colours(dark),
        '}',
        '',
    ].join('\n');
};

/** The primary ramp's lines of app.css, in light and in dark, with the rest elided. */
export const exportExcerpt = (options: ThemeOptions) => {
    const css = appCss(options);
    const [light = '', dark = ''] = css.split('\n[data-mode="dark"] {');
    const lines = (block: string) => primaryLines(block).join('\n');
    return [
        '@import "tailwindcss";',
        '',
        '@theme static {',
        lines(light),
        '    /* … greys, status colours, type, radii, shadows, spacing */',
        '}',
        '',
        '[data-mode="dark"] {',
        lines(dark),
        '}',
    ].join('\n');
};
