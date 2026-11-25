import { Landing } from '@/components/landing/landing';
import type { ComponentIndex } from '@/components/landing/sections/components';
import {
    chartsWithEntries,
    componentGroups,
    componentsWithEntries,
    inventory,
    skills,
} from '@/lib/content';
import { JsonLd, pageMetadata, softwareApplicationLd } from '@/lib/seo';
import { tagline } from '@/lib/site';

export const metadata = pageMetadata({
    title: 'Continuum — A design system for product teams and coding agents',
    description: tagline,
    path: '/',
    type: 'website',
    absoluteTitle: true,
});

const componentIndex = (): ComponentIndex => ({
    families: Object.fromEntries(
        componentGroups().map(group => [
            group.name,
            group.slug === 'charts' ? '/charts' : `/components#${group.slug}`,
        ]),
    ),
    // What comes with the components, read from the server and the skills' folders.
    kit: { tools: inventory().tools, skills: skills().map(skill => skill.name) },
    hrefs: Object.fromEntries([
        ...componentsWithEntries().flatMap(item =>
            item.entries.map(entry => [entry.id, `/components/${item.slug}`] as const),
        ),
        ...chartsWithEntries().flatMap(item =>
            item.entries.map(entry => [entry.id, `/charts/${item.slug}`] as const),
        ),
    ]),
});

/** The home page: the landing from site/, dark, with the product shown live. */
const HomePage = () => (
    <>
        <JsonLd
            data={softwareApplicationLd({
                name: 'Continuum',
                description: tagline,
                path: '/',
                category: 'DeveloperApplication',
                priceEUR: 0,
            })}
        />
        <Landing componentIndex={componentIndex()} />
    </>
);

export default HomePage;
