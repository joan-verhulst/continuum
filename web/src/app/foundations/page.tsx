import {
    Activity,
    Grid3x3,
    Layers,
    type LucideIcon,
    MousePointerClick,
    Palette,
    Ruler,
    Shapes,
    SquareRoundCorner,
    Type,
    UnfoldVertical,
} from 'lucide-react';
import { ArticleSection } from '@/components/article';
import { Markdown } from '@/components/markdown';
import { Article, CardGrid, FrameSection, LinkCard, PageHero } from '@/components/page-frame';
import { firstSentence, foundationTopics, sections } from '@/lib/content';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { topicLead } from './content';

/*
 * The foundations index: a card per topic, then what foundations.md opens with (light and dark, the
 * corner scale), which holds across them all. The intro's first sentence is the page's lead.
 */

const intro = sections('foundations').intro;
const [first = '', ...rest] = intro.split(/\n\s*\n/);
const lead = firstSentence(first);

export const metadata = pageMetadata({
    title: 'Foundations: colour, type, spacing and radius',
    description: `${lead} Colour, type, surfaces, radius, spacing, heights, icons, states, motion and layout, for dense tool UI.`,
    path: '/foundations',
});

/** Each topic's mark in its card's tile. */
const icons: Record<string, LucideIcon> = {
    colour: Palette,
    type: Type,
    'surfaces-and-depth': Layers,
    radius: SquareRoundCorner,
    spacing: Ruler,
    heights: UnfoldVertical,
    icons: Shapes,
    states: MousePointerClick,
    motion: Activity,
    layout: Grid3x3,
};

const FoundationsPage = () => {
    const across = [first.slice(lead.length).trim(), ...rest].filter(Boolean).join('\n\n');
    return (
        <>
            <JsonLd
                data={techArticleLd({
                    headline: 'Foundations',
                    description: lead,
                    path: '/foundations',
                })}
            />
            <PageHero
                crumbs={[{ name: 'Foundations', path: '/foundations' }]}
                eyebrow={`${foundationTopics().length} topics`}
                lead={lead}
                title="Foundations"
            />
            <FrameSection
                count={foundationTopics().length}
                description="Each topic's values, in units that hold in any medium."
                id="topics"
                title="Topics"
            >
                <CardGrid>
                    {foundationTopics().map((topic, index) => (
                        <LinkCard
                            delay={index % 3}
                            description={topicLead(topic)}
                            href={`/foundations/${topic.slug}`}
                            icon={icons[topic.slug] ?? Shapes}
                            key={topic.slug}
                            title={topic.name}
                        />
                    ))}
                </CardGrid>
            </FrameSection>
            {across && (
                <Article className="pt-8 md:pt-16">
                    <ArticleSection id="across-the-topics" tight title="Across the topics">
                        <Markdown source={across} />
                    </ArticleSection>
                </Article>
            )}
        </>
    );
};

export default FoundationsPage;
