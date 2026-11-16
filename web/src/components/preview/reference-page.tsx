import 'server-only';
import { Button } from 'continuum';
import { ArrowUpRight } from 'lucide-react';
import { examplesUsing } from '@/app/examples/content';
import { ArticleSection, Figure, H, P } from '@/components/article';
import { Container } from '@/components/landing/web';
import { LinkList } from '@/components/link-list';
import { Inline, Markdown } from '@/components/markdown';
import { Article, type NavItem, PageHero, PrevNext } from '@/components/page-frame';
import { type EntryInfo, firstSentence, plainText } from '@/lib/content';
import { foundationsFor, linkSentence } from '@/lib/cross-links';
import { type Crumb, faqPageLd, JsonLd, techArticleLd } from '@/lib/seo';
import { appLink } from '@/lib/site';
import { EntryCode, EntryInUse, EntryInUseNote, EntryStage } from './entry-preview';
import { faqsOf, type Related, relatedTo, usesOf } from './reference';

/*
 * One component's or one chart's page, the same for both: the board with what it is and when to
 * use it, the live preview with its knobs across the page's column, then the article: when to use
 * it, the piece of a product it is used in, the code, the spec from the references, where it is
 * used and the parts it goes with, and the previous and next part. Everything comes from the
 * references and the showcase entries; nothing here is written for one component.
 */

export type ReferencePageProps = {
    /** 'component' or 'chart', for the opening sentence. */
    kind: 'component' | 'chart';
    name: string;
    /** Every name in its heading, the part first. */
    parts: readonly string[];
    /** The family it is in, above the title. */
    group: string;
    summary: string;
    /** Its whole entry in the references, markdown. */
    body: string;
    path: string;
    crumbs: readonly Crumb[];
    entries: readonly EntryInfo[];
    /** One line per related page, from the loaders. */
    summaries: ReadonlyMap<string, string>;
    /** The section's pages in order, for the previous and next at the foot. */
    order: readonly NavItem[];
};

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** 'A', 'B' and 'C' as "A, B and C". */
export const listOf = (names: readonly string[]) =>
    names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : (names[0] ?? '');

/** The page's opening sentence: what the thing is and when to use it. */
export const leadOf = (
    kind: ReferencePageProps['kind'],
    name: string,
    summary: string,
    body: string,
) => {
    const { uses } = usesOf(body);
    const what = (uses.for ? firstSentence(plainText(uses.for)) : lower(summary)).replace(
        /\.$/,
        '',
    );
    const names = name.split(' · ');
    if (names.length > 1) {
        return `${listOf(names)} are the Continuum ${kind}s for ${what}.`;
    }
    return `${name} is the Continuum ${kind} for ${what}.`;
};

export const ReferencePage = ({
    kind,
    name,
    parts,
    group,
    summary,
    body,
    path,
    crumbs,
    entries,
    summaries,
    order,
}: ReferencePageProps) => {
    const { uses, rest } = usesOf(body);
    const faqs = faqsOf(name, uses);
    const lead = leadOf(kind, name, summary, body);
    const related: Related[] = relatedTo(body, path);
    const usedIn = examplesUsing(parts);
    const foundations = foundationsFor(rest);
    const withInUse = entries.filter(entry => entry.hasInUse);
    const first = entries[0];
    // The parts an import line names when the preview cannot be written out: the heading's, and
    // the With line's own sub-parts (Table's TableHeader, TableRow …).
    const own = [...(uses.with ?? '').matchAll(/\b[A-Z][A-Za-z]+\b/g)]
        .map(match => match[0])
        .filter(word => parts.some(part => word !== part && word.startsWith(part)));
    const importParts = [...new Set([...parts, ...own])];

    return (
        <>
            <JsonLd
                data={[
                    techArticleLd({ headline: `${name} ${kind}`, description: lead, path }),
                    ...(faqs.length ? [faqPageLd(faqs)] : []),
                ]}
            />
            <PageHero
                actions={
                    first && (
                        <Button
                            render={
                                // biome-ignore lint/a11y/useAnchorContent: the button's children are the link's
                                <a
                                    href={appLink({ view: 'components', component: first.id })}
                                    rel="noreferrer"
                                    target="_blank"
                                />
                            }
                            size="lg"
                            variant="secondary"
                        >
                            Open in the app <ArrowUpRight strokeWidth={2} />
                        </Button>
                    )
                }
                crumbs={crumbs}
                eyebrow={group}
                lead={lead}
                title={name}
            />

            {entries.length > 0 && (
                <Container className="flex min-w-0 flex-col gap-12 pt-12 md:pt-16">
                    {entries.map(entry => (
                        <Figure
                            caption={
                                entries.length > 1 ? (
                                    <>
                                        <span className="font-medium text-neutral-950">
                                            {entry.name}.
                                        </span>{' '}
                                        {entry.description}
                                    </>
                                ) : (
                                    entry.description
                                )
                            }
                            key={entry.id}
                        >
                            <EntryStage id={entry.id} />
                        </Figure>
                    ))}
                </Container>
            )}

            <Article>
                {faqs.length > 0 && (
                    <ArticleSection id="when-to-use" tight title="When to use it">
                        {uses.for && (
                            <>
                                <H>When to use {name}</H>
                                <P>
                                    <Inline text={`For ${uses.for}`} />
                                </P>
                            </>
                        )}
                        {uses.notFor && (
                            <>
                                <H>When not to use it</H>
                                <P>
                                    <Inline text={`Not for ${uses.notFor}`} />
                                </P>
                            </>
                        )}
                        {uses.with && (
                            <>
                                <H>What it goes with</H>
                                <P>
                                    <Inline
                                        text={
                                            uses.with.charAt(0).toUpperCase() + uses.with.slice(1)
                                        }
                                    />
                                </P>
                            </>
                        )}
                    </ArticleSection>
                )}

                {withInUse.map(entry => (
                    <ArticleSection
                        id={withInUse.length > 1 ? `in-use-${entry.id}` : 'in-use'}
                        key={entry.id}
                        tight
                        title={withInUse.length > 1 ? `${entry.name} in use` : 'In use'}
                    >
                        <EntryInUseNote id={entry.id} />
                        <EntryInUse id={entry.id} />
                    </ArticleSection>
                ))}

                <ArticleSection
                    description={`Import it from ${kind === 'chart' ? 'continuum/charts' : 'continuum'}; the example draws the preview above at its defaults.`}
                    id="usage"
                    tight
                    title="Usage"
                >
                    {entries.length > 0 ? (
                        entries.map(entry => (
                            <EntryCode id={entry.id} key={entry.id} parts={importParts} />
                        ))
                    ) : (
                        <EntryCode parts={importParts} />
                    )}
                </ArticleSection>

                <ArticleSection
                    description="Its parts, its values in units and its states, as the design system states them."
                    id="spec"
                    tight
                    title="Spec"
                >
                    <Markdown source={rest} />
                    {foundations.length > 0 && (
                        <P>
                            <Inline
                                text={`Its values come from the foundations: ${linkSentence(foundations)}.`}
                            />
                        </P>
                    )}
                </ArticleSection>

                {usedIn.length > 0 && (
                    <ArticleSection
                        description={`The screens and blocks built with ${name}.`}
                        id="used-in"
                        tight
                        title="Used in"
                    >
                        <LinkList rows={usedIn} />
                    </ArticleSection>
                )}

                {related.length > 0 && (
                    <ArticleSection
                        description="The parts it is named beside in the spec."
                        id="related"
                        tight
                        title="Related"
                    >
                        <LinkList
                            rows={related.map(item => ({
                                href: item.href,
                                title: item.name,
                                description: summaries.get(item.href) ?? '',
                            }))}
                        />
                    </ArticleSection>
                )}
            </Article>

            <PrevNext
                groups={order}
                label={kind === 'chart' ? 'Charts' : 'Components'}
                path={path}
            />
        </>
    );
};
