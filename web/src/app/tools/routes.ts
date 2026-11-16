import { toolPath, tools } from './_parts/catalogue';

/*
 * Every path this section generates, for the sitemap (src/app/sitemap.ts imports this) and the
 * markdown twins: the index and one page per tool in the catalogue, whether its page is a folder of
 * its own (/tools/theme-builder) or still the legacy route (../[slug]).
 */
/** Tools whose page is not built yet: their URL redirects for now (next.config), so no sitemap entry. */
const unbuilt = new Set(['color-builder']);

export const routes = (): string[] => [
    '/tools',
    ...tools.filter(tool => !unbuilt.has(tool.slug)).map(tool => toolPath(tool.slug)),
];
