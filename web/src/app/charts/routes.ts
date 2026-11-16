import { charts } from '@/lib/content';

/*
 * Every path this section generates, for the sitemap (src/app/sitemap.ts imports this). Built from
 * the same loader as [slug]/page.tsx's generateStaticParams: one page per chart of charts.md.
 */
export const routes = (): string[] => [
    '/charts',
    ...charts().charts.map(item => `/charts/${item.slug}`),
];
