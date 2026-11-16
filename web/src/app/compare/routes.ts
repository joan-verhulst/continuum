import { comparisons } from './content';

/*
 * Every path this section generates, for the sitemap (src/app/sitemap.ts imports this): the index
 * and /compare/[name], one per comparison in content.ts.
 */
export const routes = (): string[] => ['/compare', ...comparisons.map(c => `/compare/${c.slug}`)];
