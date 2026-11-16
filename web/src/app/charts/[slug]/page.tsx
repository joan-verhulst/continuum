import { notFound } from 'next/navigation';
import { chartOrder } from '@/components/preview/nav';
import { summaries } from '@/components/preview/reference';
import { leadOf, listOf, ReferencePage } from '@/components/preview/reference-page';
import { chartsWithEntries, clip } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

/*
 * One page per chart of charts.md (AreaChart · LineChart · BarChart is one page, its two entries
 * shown one after the other), drawn as a component's page is.
 */

type Params = { slug: string };

const find = (slug: string) => chartsWithEntries().find(item => item.slug === slug);

export const dynamicParams = false;

export const generateStaticParams = (): Params[] =>
    chartsWithEntries().map(item => ({ slug: item.slug }));

export const generateMetadata = async ({ params }: { params: Promise<Params> }) => {
    const item = find((await params).slug);
    if (!item) return {};
    return pageMetadata({
        title: `${listOf(item.parts)} React chart${item.parts.length > 1 ? 's' : ''} — Continuum`,
        absoluteTitle: true,
        description: clip(leadOf('chart', item.parts.join(' · '), item.summary, item.body)),
        path: `/charts/${item.slug}`,
    });
};

const ChartPage = async ({ params }: { params: Promise<Params> }) => {
    const item = find((await params).slug);
    if (!item) notFound();
    const path = `/charts/${item.slug}`;

    return (
        <ReferencePage
            body={item.body}
            crumbs={[
                { name: 'Components', path: '/components' },
                { name: 'Charts', path: '/charts' },
                { name: item.name, path },
            ]}
            entries={item.entries}
            group="Charts"
            kind="chart"
            name={item.parts.length > 1 ? item.parts.join(' · ') : item.name}
            order={chartOrder()}
            parts={item.parts}
            path={path}
            summaries={summaries()}
            summary={item.summary}
        />
    );
};

export default ChartPage;
