import { foundationTopics } from '@/lib/content';

/*
 * Every path this section generates, for the sitemap (src/app/sitemap.ts imports this), from the same
 * loader as /foundations/[topic]'s generateStaticParams: the index and one page per ## of
 * foundations.md.
 */
export const routes = (): string[] => [
    '/foundations',
    ...foundationTopics().map(topic => `/foundations/${topic.slug}`),
];
