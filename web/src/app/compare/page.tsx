import { GitCompare } from 'lucide-react';
import { CardGrid, FrameSection, LinkCard, PageHero } from '@/components/page-frame';
import { pageMetadata } from '@/lib/seo';
import { compareIndex, comparisons } from './content';

export const metadata = pageMetadata({
    title: compareIndex.title,
    description: compareIndex.description,
    path: '/compare',
});

/* The comparisons' index: a card for each, what it compares in one line. */
const ComparePage = () => (
    <>
        <PageHero
            crumbs={[{ name: 'Compare', path: '/compare' }]}
            eyebrow="Alternatives"
            lead={compareIndex.lead}
            title="Compare"
        />
        <FrameSection count={comparisons.length} id="comparisons" title="Comparisons">
            <CardGrid columns={2}>
                {comparisons.map((c, index) => (
                    <LinkCard
                        delay={index % 2}
                        description={c.description}
                        href={`/compare/${c.slug}`}
                        icon={GitCompare}
                        key={c.slug}
                        title={c.title}
                    />
                ))}
            </CardGrid>
        </FrameSection>
    </>
);

export default ComparePage;
