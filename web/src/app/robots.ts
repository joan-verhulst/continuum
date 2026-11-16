import type { MetadataRoute } from 'next';
import { absolute, indexable } from '@/lib/site';

/**
 * robots.txt: everything closed until the domain is attached (NEXT_PUBLIC_INDEXABLE='true'), then
 * everything open, with the sitemap.
 */
const robots = (): MetadataRoute.Robots =>
    indexable
        ? { rules: { userAgent: '*', allow: '/' }, sitemap: absolute('/sitemap.xml') }
        : { rules: { userAgent: '*', disallow: '/' } };

export default robots;
