import { components } from '@/lib/content';

/*
 * Every path this section generates, for the sitemap (src/app/sitemap.ts imports this). Built from
 * the same loader as [slug]/page.tsx's generateStaticParams: one page per component of components.md.
 */
export const routes = (): string[] => [
    '/components',
    ...components().map(item => `/components/${item.slug}`),
];
