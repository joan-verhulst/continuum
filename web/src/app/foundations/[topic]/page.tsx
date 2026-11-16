import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleSection, flowTight } from '@/components/article';
import { Container } from '@/components/landing/web';
import { LinkList } from '@/components/link-list';
import { Inline, Markdown } from '@/components/markdown';
import { Article, PageHero, PrevNext } from '@/components/page-frame';
import { clip, foundationTopics, fullBody } from '@/lib/content';
import { examplesFor, partsNamedIn } from '@/lib/cross-links';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { topicBySlug, topicLead } from '../content';
import { figureSlugs } from '../figure-slugs';
import { FoundationFigure } from '../foundation-figure';

/*
 * One topic of foundations.md as an article: the opening line on the board, the playground's
 * specimen for it where there is one, then the topic's own text and tables, each ### a section,
 * and the topics either side.
 */

type Params = { params: Promise<{ topic: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => foundationTopics().map(topic => ({ topic: topic.slug }));

export const generateMetadata = async ({ params }: Params): Promise<Metadata> => {
    const topic = topicBySlug((await params).topic);
    if (!topic) return {};
    return pageMetadata({
        title: `${topic.name} in Continuum`,
        description: clip(topicLead(topic)),
        path: `/foundations/${topic.slug}`,
    });
};

const FoundationPage = async ({ params }: Params) => {
    const topic = topicBySlug((await params).topic);
    if (!topic) notFound();
    const path = `/foundations/${topic.slug}`;
    const lead = topicLead(topic);
    const parts = partsNamedIn(fullBody(topic.section));
    const shaped = examplesFor(topic.slug);

    return (
        <>
            <JsonLd
                data={techArticleLd({
                    headline: `${topic.name} in Continuum`,
                    description: lead,
                    path,
                })}
            />
            <PageHero
                crumbs={[
                    { name: 'Foundations', path: '/foundations' },
                    { name: topic.name, path },
                ]}
                eyebrow="Foundation"
                lead={lead}
                title={topic.name}
            />
            {figureSlugs.has(topic.slug) && (
                <Container className="pt-12 md:pt-16">
                    <FoundationFigure slug={topic.slug} />
                </Container>
            )}
            <Article>
                {topic.section.body && (
                    <section className={flowTight}>
                        <Markdown source={topic.section.body} />
                    </section>
                )}
                {topic.section.children.map(child => (
                    <ArticleSection
                        id={child.slug}
                        key={child.slug}
                        tight
                        title={<Inline text={child.title} />}
                    >
                        <Markdown source={child.body} />
                    </ArticleSection>
                ))}
                {parts.length > 0 && (
                    <ArticleSection
                        description="The components and charts this topic names, each with its own page."
                        id="parts"
                        tight
                        title="Parts it names"
                    >
                        <LinkList rows={parts} />
                    </ArticleSection>
                )}
                {shaped.length > 0 && (
                    <ArticleSection
                        description="The reference screens whose page kind these values shape."
                        id="examples"
                        tight
                        title="In examples"
                    >
                        <LinkList rows={shaped} />
                    </ArticleSection>
                )}
            </Article>
            <PrevNext
                groups={foundationTopics().map(item => ({
                    href: `/foundations/${item.slug}`,
                    label: item.name,
                }))}
                label="Foundations"
                path={path}
            />
        </>
    );
};

export default FoundationPage;
