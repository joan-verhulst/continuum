import type { MetadataRoute } from 'next';
import { absolute } from '@/lib/site';
import { routes as ai } from './ai/routes';
import { routes as charts } from './charts/routes';
import { routes as compare } from './compare/routes';
import { routes as components } from './components/routes';
import { routes as docs } from './docs/routes';
import { routes as examples } from './examples/routes';
import { routes as foundations } from './foundations/routes';
import { routes as tools } from './tools/routes';

/*
 * sitemap.xml, from every section's routes. The convention: each section folder under src/app has a
 * routes.ts exporting `routes(): string[]`, every path it generates (its index and each
 * generateStaticParams page), built from the same loaders as its pages, so the two never drift. A new
 * section adds its own routes.ts and one import here.
 */
const sections = [components, charts, examples, foundations, ai, tools, docs, compare];

const sitemap = (): MetadataRoute.Sitemap => {
    const built = new Date();
    const paths = ['/', ...sections.flatMap(routes => routes())];
    return [...new Set(paths)].map(path => ({
        url: absolute(path),
        lastModified: built,
        // The home page and the section indexes first; a page under a section after them.
        priority: path === '/' ? 1 : path.split('/').length === 2 ? 0.8 : 0.6,
    }));
};

export default sitemap;
