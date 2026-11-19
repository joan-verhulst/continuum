import { InventoryCount } from '@/components/landing/sections/inventory';
import { FrameSection, JumpLinks, PageHero } from '@/components/page-frame';
import { type GalleryItem, PreviewGrid } from '@/components/preview/gallery';
import {
    chartsWithEntries,
    componentGroups,
    componentsWithEntries,
    firstSentence,
    inventory,
} from '@/lib/content';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';

/*
 * The components index, a gallery: every component of components.md drawn live, in the families
 * components.md groups them in, each card its page. The Charts family shows the chart kit, whose
 * pages live under /charts.
 */

const lead = () =>
    `Continuum has ${inventory().components} React components for dashboards and tool UI, ${inventory().charts} of them charts, on Base UI and Tailwind v4, grouped by what they do; each page shows the part live, says when to use it and when not, and gives its values in units.`;

export const metadata = pageMetadata({
    title: 'React components for dashboards and tool UI — Continuum',
    absoluteTitle: true,
    description: `${inventory().components} React components for dense dashboards and tool UI, on Base UI and Tailwind v4: what each is for, what not, a live preview and its values.`,
    path: '/components',
});

/** Each family with its cards, the Charts family the chart kit's. */
const families = () => {
    const withEntries = new Map(componentsWithEntries().map(item => [item.slug, item]));
    return componentGroups()
        .map(group => {
            const items: GalleryItem[] =
                group.components.length === 0
                    ? chartsWithEntries().map(item => ({
                          href: `/charts/${item.slug}`,
                          name: item.name,
                          summary: item.summary,
                          entry: item.entries[0]?.id,
                      }))
                    : group.components.map(item => ({
                          href: `/components/${item.slug}`,
                          name: item.name,
                          summary: item.summary,
                          entry: withEntries.get(item.slug)?.entries[0]?.id,
                      }));
            return { ...group, items };
        })
        .filter(group => group.items.length > 0);
};

const ComponentsPage = () => {
    const groups = families();
    return (
        <>
            <JsonLd
                data={techArticleLd({
                    headline: 'Components',
                    description: lead(),
                    path: '/components',
                })}
            />
            <PageHero
                actions={
                    <JumpLinks
                        links={groups.map(group => ({ href: `#${group.slug}`, label: group.name }))}
                    />
                }
                crumbs={[{ name: 'Components', path: '/components' }]}
                eyebrow={<InventoryCount totals={inventory()} />}
                lead={lead()}
                title="Components"
            />
            {groups.map(group => (
                <FrameSection
                    count={group.items.length}
                    description={firstSentence(group.intro) || undefined}
                    id={group.slug}
                    key={group.slug}
                    title={group.name}
                >
                    <PreviewGrid items={group.items} />
                </FrameSection>
            ))}
        </>
    );
};

export default ComponentsPage;
