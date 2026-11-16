import { examples } from './content';

/*
 * Every path this section generates, for the sitemap (src/app/sitemap.ts imports this), from the same
 * list as /examples/[slug]'s generateStaticParams: the index, each screen (/examples/settings-page)
 * and each block (/examples/live-analytics).
 */
export const routes = (): string[] => [
    '/examples',
    ...examples().map(item => `/examples/${item.path}`),
];
