import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type ToolSlug, tools } from '../_parts/catalogue';
import { ToolLanding } from '../_parts/landing';
import { legacyPage, legacyPages } from '../_parts/legacy';
import { toolMetadata } from '../_parts/tool-page';

/*
 * The tools still on the old landing (../_parts/legacy), at their own URLs, with the catalogue's
 * search words. A tool moved onto the template gets a folder of its own, /tools/<slug>, and leaves
 * the legacy list; Next prefers the folder over this route.
 */

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => legacyPages.map(page => ({ slug: page.slug }));

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
    const { slug } = await params;
    return tools.some(tool => tool.slug === slug) ? toolMetadata(slug as ToolSlug) : {};
};

const LegacyToolRoute = async ({ params }: Props) => {
    const page = legacyPage((await params).slug);
    if (!page) notFound();
    return <ToolLanding page={page} />;
};

export default LegacyToolRoute;
