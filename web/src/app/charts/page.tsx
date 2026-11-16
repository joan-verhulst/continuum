import { ArticleSection } from '@/components/article';
import { Markdown } from '@/components/markdown';
import { Article, FrameSection, PageHero } from '@/components/page-frame';
import { PreviewGrid } from '@/components/preview/gallery';
import { charts, chartsWithEntries, fullBody, plainText } from '@/lib/content';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';

/*
 * The chart kit's index: each chart of charts.md drawn live, a card per page, then the rules every
 * chart shares (which chart answers which need, the card, the plot, the marks, colour, hover,
 * motion, states, size), as charts.md states them.
 */

const lead = () =>
    `Continuum's chart kit, continuum/charts, has ${charts().charts.length} React charts for dashboards that draw every mark themselves, with no chart library under them, and take their colours from the theme, so a mode switch or a product's accent restyles them.`;

export const metadata = pageMetadata({
    title: 'React charts for dashboards — Continuum',
    absoluteTitle: true,
    description: `${charts().charts.length} React charts on Continuum's tokens, with no chart library under them: area, line, bar, donut, treemap, funnel, radar and more, and which to use when.`,
    path: '/charts',
});

const ChartsPage = () => {
    const { general } = charts();
    const list = chartsWithEntries();
    return (
        <>
            <JsonLd
                data={techArticleLd({ headline: 'Charts', description: lead(), path: '/charts' })}
            />
            <PageHero
                crumbs={[
                    { name: 'Components', path: '/components' },
                    { name: 'Charts', path: '/charts' },
                ]}
                eyebrow={`${list.length} charts`}
                lead={lead()}
                title="Charts"
            />
            <FrameSection
                count={list.length}
                description="Each chart drawn live at its defaults; open one for its knobs, its code and its spec."
                id="each-chart"
                title="Each chart"
            >
                <PreviewGrid
                    items={list.map(item => ({
                        href: `/charts/${item.slug}`,
                        name: item.parts.join(' · '),
                        summary: item.summary,
                        entry: item.entries[0]?.id,
                    }))}
                />
            </FrameSection>
            <Article className="pt-8 md:pt-16">
                {general.map(section => (
                    <ArticleSection
                        id={section.slug}
                        key={section.slug}
                        tight
                        title={plainText(section.title)}
                    >
                        <Markdown source={fullBody(section)} />
                    </ArticleSection>
                ))}
            </Article>
        </>
    );
};

export default ChartsPage;
