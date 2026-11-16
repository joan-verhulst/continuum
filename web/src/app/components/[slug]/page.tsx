import { notFound } from 'next/navigation';
import { componentOrder } from '@/components/preview/nav';
import { summaries } from '@/components/preview/reference';
import { leadOf, ReferencePage } from '@/components/preview/reference-page';
import { clip, componentsWithEntries } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

/*
 * One page per component of components.md: its opening sentence, the playground's live preview
 * with its knobs, the piece it is used in, its code, its spec and the parts it goes with.
 */

type Params = { slug: string };

const find = (slug: string) => componentsWithEntries().find(item => item.slug === slug);

export const dynamicParams = false;

export const generateStaticParams = (): Params[] =>
    componentsWithEntries().map(item => ({ slug: item.slug }));

export const generateMetadata = async ({ params }: { params: Promise<Params> }) => {
    const item = find((await params).slug);
    if (!item) return {};
    return pageMetadata({
        title: `${item.name} component — Continuum`,
        absoluteTitle: true,
        description: clip(leadOf('component', item.name, item.summary, item.body)),
        path: `/components/${item.slug}`,
    });
};

const ComponentPage = async ({ params }: { params: Promise<Params> }) => {
    const item = find((await params).slug);
    if (!item) notFound();
    const path = `/components/${item.slug}`;

    return (
        <ReferencePage
            body={item.body}
            crumbs={[
                { name: 'Components', path: '/components' },
                { name: item.name, path },
            ]}
            entries={item.entries}
            group={item.group}
            kind="component"
            name={item.name}
            order={componentOrder()}
            parts={item.parts}
            path={path}
            summaries={summaries()}
            summary={item.summary}
        />
    );
};

export default ComponentPage;
