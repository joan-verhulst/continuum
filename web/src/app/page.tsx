import { Landing } from '@/components/landing/landing';
import type { ComponentIndex } from '@/components/landing/sections/components';
import { charts, componentGroups, components } from '@/lib/content';
import { JsonLd, pageMetadata, softwareApplicationLd } from '@/lib/seo';

const description =
    "Continuum gives Claude Code a designer's decisions for dense tool UI: a React design system on Base UI and Tailwind v4, a skill your agent reads, and a free Tailwind v4 theme builder with contrast checks.";

export const metadata = pageMetadata({
    title: "Continuum: a design system for Claude Code that makes your agent's UI look designed",
    description,
    path: '/',
    type: 'website',
    absoluteTitle: true,
});

/** The docs' families for the landing's index: each with its parts, linked to their pages. */
const componentIndex = (): ComponentIndex => ({
    total: components().length,
    groups: componentGroups()
        .map(group => ({
            name: group.name,
            slug: group.slug,
            // The Charts family lists the chart kit's pages, as the docs' index does.
            items:
                group.components.length === 0
                    ? charts().charts.map(item => ({
                          name: item.name,
                          href: `/charts/${item.slug}`,
                      }))
                    : group.components.map(item => ({
                          name: item.name,
                          href: `/components/${item.slug}`,
                      })),
        }))
        .filter(group => group.items.length > 0),
});

/** The home page: the landing from site/, dark and amber, with the product shown live. */
const HomePage = () => (
    <>
        <JsonLd
            data={softwareApplicationLd({
                name: 'Continuum',
                description,
                path: '/',
                category: 'DeveloperApplication',
            })}
        />
        <Landing componentIndex={componentIndex()} />
    </>
);

export default HomePage;
