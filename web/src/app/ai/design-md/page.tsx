import { Button } from 'continuum';
import Link from 'next/link';
import { ArticleSection, C, column, DividedList, Figure, P } from '@/components/article';
import { CodeBlock } from '@/components/code-block';
import { Article, PageHero, PrevNext } from '@/components/page-frame';
import { firstSentence, type MdSection, parseMarkdown, plainText } from '@/lib/content';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { themeBuilderUrl } from '@/lib/site';
import { Row, RowName, RowText } from '../_components/rows';
import { mcpLive } from '../_lib/mcp-live';
import { aiWays, toolPath } from '../_lib/nav';

/*
 * DESIGN.md, the brief the theme builder exports beside app.css for the agents that work in a
 * project. What it holds and the excerpt are the default theme's brief itself, written at build
 * time by the same code the theme builder and create_theme run (mcp-live.ts asks the built server).
 */

const lead =
    "DESIGN.md is the brief Continuum's theme builder exports beside a project's app.css, for the AI agents that work in it: the look in a paragraph, the setup, the theme's own values and the rules in short; put it at the project's root and point CLAUDE.md at it.";

export const metadata = pageMetadata({
    title: 'DESIGN.md: a design brief for AI agents',
    description:
        "DESIGN.md is the brief Continuum's theme builder writes for a project's AI agents: setup, theme values and design rules in short. Add @DESIGN.md to CLAUDE.md.",
    path: '/ai/design-md',
});

const linkClass =
    'text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950';

/** The brief's opening, up to its first table: what a reader sees before the details. */
const excerptOf = (markdown: string, maxLines = 24) => {
    const lines = markdown.trim().split('\n');
    const end = lines.findIndex(line => line.startsWith('## The theme'));
    const cut = lines.slice(0, Math.min(end > 0 ? end : maxLines, maxLines));
    return `${cut.join('\n').trimEnd()}\n\n…`;
};

/** A section in a line: its first sentence, and the topics under it when it has them. */
const holds = (section: MdSection) => {
    const topics = section.children.map(child => plainText(child.title)).join(' · ');
    const first = firstSentence(section.body);
    if (!topics) return first;
    return first ? `${first.replace(/\.$/, '')}: ${topics}.` : `${topics}.`;
};

const steps = [
    {
        title: 'Build the theme',
        text: 'Pick the accent, greys, font, sizes and corners in the theme builder, and export. Or ask an agent: create_theme writes the same two files.',
    },
    {
        title: 'Save both files',
        text: 'app.css in src/, as the Tailwind entry; DESIGN.md at the project’s root.',
    },
    {
        title: 'Point CLAUDE.md at it',
        text: 'One line, and every session starts from the brief.',
        code: '@DESIGN.md',
    },
    {
        title: 'Ask for the setup',
        text: 'Ask Claude to set the project up from DESIGN.md: it says where the library comes from, what to install and how to keep the look.',
    },
];

const DesignMdPage = () => {
    const brief = mcpLive().designMd;
    const doc = parseMarkdown(brief);
    return (
        <>
            <JsonLd
                data={techArticleLd({
                    headline: 'DESIGN.md: a design brief for AI agents',
                    description: lead,
                    path: '/ai/design-md',
                })}
            />
            <PageHero
                crumbs={[
                    { name: 'AI', path: '/ai' },
                    { name: 'DESIGN.md', path: '/ai/design-md' },
                ]}
                actions={
                    <Button
                        // biome-ignore lint/a11y/useAnchorContent: the button renders its label into the link
                        render={<a href={themeBuilderUrl} />}
                        variant="secondary"
                    >
                        Open the theme builder
                    </Button>
                }
                eyebrow="AI"
                lead={lead}
                title="DESIGN.md"
            />
            <Article>
                <ArticleSection
                    description="The skill holds the whole system; the brief holds what is particular to one project."
                    id="what-it-is"
                    tight
                    title="What it is"
                >
                    <P>
                        A project built in Continuum carries two files from the theme builder:{' '}
                        <C>app.css</C>, the theme as values in Tailwind's names, and{' '}
                        <C>DESIGN.md</C>, how to use them. The brief names the theme, says how the
                        project is set up, and states the rules in short, so they hold for an agent
                        that has no skill installed and for one that has.
                    </P>
                    <P>
                        It is written from the theme itself: change the accent or the corners and
                        the brief says so. Change the look by changing <C>app.css</C>, or build the
                        theme again and export both.
                    </P>
                </ArticleSection>

                {doc.sections.length > 0 && (
                    <ArticleSection
                        description={`${doc.sections.length} sections, in the default theme's brief.`}
                        id="what-it-holds"
                        tight
                        title="What it holds"
                    >
                        <DividedList>
                            {doc.sections.map(section => (
                                <Row key={section.slug}>
                                    <RowName>{plainText(section.title)}</RowName>
                                    <RowText>{holds(section)}</RowText>
                                </Row>
                            ))}
                        </DividedList>
                    </ArticleSection>
                )}

                <ArticleSection
                    description={`${steps.length} steps, once per project.`}
                    id="how-to-use-it"
                    tight
                    title="How to use it"
                >
                    <ol className={`${column} flex flex-col gap-10`}>
                        {steps.map((step, index) => (
                            <li className="flex min-w-0 flex-col gap-3" key={step.title}>
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-base text-neutral-950">
                                        {index + 1}. {step.title}
                                    </span>
                                    <span className="text-base text-neutral-600 leading-[1.6]">
                                        {step.text}
                                    </span>
                                </div>
                                {step.code && <CodeBlock code={step.code} />}
                            </li>
                        ))}
                    </ol>
                    <P>
                        An agent without the theme builder makes the same files with the MCP
                        server's{' '}
                        <Link className={linkClass} href={toolPath('create-theme')}>
                            <C>create_theme</C>
                        </Link>
                        , and checks their contrast with{' '}
                        <Link className={linkClass} href={toolPath('check-theme')}>
                            <C>check_theme</C>
                        </Link>
                        .
                    </P>
                </ArticleSection>

                {brief && (
                    <ArticleSection
                        description="How the default theme's brief opens, as the theme builder writes it today."
                        id="excerpt"
                        tight
                        title="An excerpt"
                    >
                        <Figure caption="The top of DESIGN.md for Continuum's default theme: the look, then the setup. The theme's values, the rules and the checks before finishing follow.">
                            <CodeBlock code={excerptOf(brief)} />
                        </Figure>
                    </ArticleSection>
                )}
            </Article>
            <PrevNext groups={aiWays()} label="AI" path="/ai/design-md" />
        </>
    );
};

export default DesignMdPage;
