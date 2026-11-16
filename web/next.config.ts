import path from 'node:path';
import type { NextConfig } from 'next';
import { withTencil } from 'tencil/next';

/*
 * The public site. Its pages are generated from sources outside this folder (the library, the
 * playground's screens and showcase entries, the skill's references), so Turbopack's root is the
 * repository's: files above web/ then resolve and compile like the site's own.
 */
const root = path.join(import.meta.dirname, '..');
const loader = (name: string) => path.join(import.meta.dirname, 'loaders', name);
const dev = process.env.NODE_ENV !== 'production';

const config: NextConfig = {
    // The library ships TypeScript source, as the personal website takes it.
    transpilePackages: ['continuum'],
    /*
     * Every page's markdown twin is at its path plus .md (/components/button.md); the twins are
     * built under /md (src/app/md). Before files, so a dynamic page never takes 'button.md' as a slug.
     */
    // Patterns became Examples: a page kind's page is its reference screen's, the rest the index.
    redirects: async () => [
        {
            source: '/patterns/:kind(overview|index|detail|create-or-edit|settings|assistant|sign-in)-page',
            destination: '/examples/:kind-page',
            permanent: true,
        },
        { source: '/patterns', destination: '/examples', permanent: true },
        { source: '/patterns/:path*', destination: '/examples', permanent: true },
        /*
         * The theme builder's old page became the tools page. A way in that only the builder
         * understands (?accent=, from a palette or the landing) goes on to the builder itself, its
         * query passed along; the rest to the tools.
         */
        {
            source: '/theme-builder',
            has: [{ type: 'query', key: 'accent' }],
            destination: '/tools/theme-builder',
            permanent: true,
        },
        { source: '/theme-builder', destination: '/tools', permanent: true },
        // The keyword pages were slices of these tools; their search words are the tools' now.
        ...Object.entries({
            'tailwind-theme-generator': 'theme-builder',
            'shadcn-theme-generator': 'theme-builder',
            'tailwind-color-palette-generator': 'color-builder',
            'oklch-palette-generator': 'color-builder',
        }).map(([from, to]) => ({
            source: `/tools/${from}`,
            destination: `/tools/${to}`,
            permanent: true,
        })),
        /*
         * Until the colour builder has its own page (tools phase 2), its way in opens the theme
         * builder, which starts on the Colour step. Temporary, so search engines wait for the page.
         */
        { source: '/tools/color-builder', destination: '/tools/theme-builder', permanent: false },
    ],
    rewrites: async () => ({
        beforeFiles: [
            { source: '/:path((?!md/|_next/|app/).+)\\.md', destination: '/md/:path' },
            // The app at /app: in dev the playground's own server (base /app/, port 5173), in a
            // build its files copied into public/app, the page itself at index.html.
            ...(dev
                ? [
                      { source: '/app', destination: 'http://localhost:5173/app/' },
                      { source: '/app/:path*', destination: 'http://localhost:5173/app/:path*' },
                  ]
                : [{ source: '/app', destination: '/app/index.html' }]),
        ],
        afterFiles: [],
        fallback: [],
    }),
    outputFileTracingRoot: root,
    turbopack: {
        root,
        // The playground is written for Vite; these give its imports Vite's meaning.
        resolveAlias: {
            /*
             * The theme export reads the library's CSS as text (`?raw`). A module import of it
             * goes to a stand-in the raw-css loader turns into that text; the stylesheet itself is
             * imported by globals.css, through Tailwind's own resolver, which this never reaches.
             */
            'continuum/theme.css': './raw/theme.css.txt',
            'continuum/tokens.css': './raw/tokens.css.txt',
        },
        rules: {
            '*.css.txt': {
                loaders: [loader('raw-css.cjs')],
                as: '*.js',
            },
            // The device frames import their SVGs as URLs.
            '*.svg': {
                loaders: [loader('svg-url.cjs')],
                as: '*.js',
            },
        },
    },
};

// Tencil finds the repository through this in dev; production builds come back untouched.
export default withTencil(config);
