import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleSection, P } from '@/components/article';
import { Container } from '@/components/landing/web';
import { LinkList } from '@/components/link-list';
import { Inline, Markdown } from '@/components/markdown';
import { Article, PageHero, PrevNext } from '@/components/page-frame';
import { clip } from '@/lib/content';
import { foundationsFor, linkSentence } from '@/lib/cross-links';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import {
    exampleBySlug,
    exampleLead,
    exampleParts,
    examples,
    exampleTitle,
    kindAnatomy,
    kindLead,
    kindName,
    kindNarrow,
} from '../content';
import { ExampleLive } from '../example-figure';

/*
 * One example: the screen or block live across the column, then for a screen its page kind's
 * anatomy from pages.md, the parts it is built from, and the examples either side.
 */

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => examples().map(item => ({ slug: item.path }));

export const generateMetadata = async ({ params }: Params): Promise<Metadata> => {
    const example = exampleBySlug((await params).slug);
    if (!example) return {};
    return pageMetadata({
        title: `${exampleTitle(example)} — Continuum`,
        absoluteTitle: true,
        description: clip(exampleLead(example)),
        path: `/examples/${example.path}`,
    });
};

const ExamplePage = async ({ params }: Params) => {
    const example = exampleBySlug((await params).slug);
    if (!example) notFound();
    const path = `/examples/${example.path}`;
    const lead = exampleLead(example);
    const kind = example.pageKind;
    const narrow = kind && kindNarrow(kind);
    const foundations = kind ? foundationsFor(kind.body) : [];
    const parts = exampleParts(example);

    return (
        <>
            <JsonLd
                data={techArticleLd({ headline: exampleTitle(example), description: lead, path })}
            />
            <PageHero
                crumbs={[
                    { name: 'Examples', path: '/examples' },
                    { name: example.title, path },
                ]}
                eyebrow={example.label}
                lead={lead}
                title={example.title}
            />
            <Container className="scroll-mt-20 pt-12 md:pt-16" id="example">
                <ExampleLive id={example.id} kind={example.kind} />
            </Container>
            <Article>
                {kind && (
                    <ArticleSection
                        description={`What ${/^[aeiou]/i.test(kindName(kind)) ? 'an' : 'a'} ${kindName(kind).toLowerCase()} page holds, top to bottom, with its values.`}
                        id="anatomy"
                        tight
                        title="Anatomy"
                    >
                        <P>{kindLead(kind)}</P>
                        <Markdown source={kindAnatomy(kind)} />
                        {foundations.length > 0 && (
                            <P>
                                <Inline
                                    text={`Its values come from the foundations: ${linkSentence(foundations)}.`}
                                />
                            </P>
                        )}
                    </ArticleSection>
                )}
                {narrow && (
                    <ArticleSection
                        description="Below 1024 the shell becomes a top bar and a drawer; below 640 it is compact."
                        id="narrow"
                        tight
                        title="On a narrow screen"
                    >
                        <Markdown source={narrow} />
                    </ArticleSection>
                )}
                {parts.length > 0 && (
                    <ArticleSection
                        description="The components it is built from, each with its own page."
                        id="components"
                        tight
                        title="Components"
                    >
                        <LinkList rows={parts} />
                    </ArticleSection>
                )}
            </Article>
            <PrevNext
                groups={examples().map(item => ({
                    href: `/examples/${item.path}`,
                    label: item.title,
                }))}
                label="Examples"
                path={path}
            />
        </>
    );
};

export default ExamplePage;
