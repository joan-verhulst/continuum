import Link from 'next/link';
import { ArticleSection, C, DividedList, H, P } from '@/components/article';
import { CodeBlock } from '@/components/code-block';
import { Markdown } from '@/components/markdown';
import { Article, PageHero, PrevNext } from '@/components/page-frame';
import { plainText, skills } from '@/lib/content';
import { JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { Row, RowName, RowText } from '../_components/rows';
import { aiWays } from '../_lib/nav';
import { skillParts } from '../_lib/text';

/*
 * The skills in .claude/skills and how to install and call them. The copy is the playground's
 * Skills page (playground/src/install/skills-page.tsx); each skill is read from its SKILL.md, so a
 * new skill shows here without a word changed.
 */

const lead = () =>
    `Continuum's ${skills().length} skills pack what Claude Code needs to know about the design system, its values, page anatomy, parts and spacing formula; install them once and Claude uses them in every project.`;

export const metadata = pageMetadata({
    title: 'Claude Code skills for Continuum',
    absoluteTitle: true,
    description: `${skills().length} Claude Code skills that carry Continuum's design decisions into any project: ${skills()
        .map(skill => skill.name)
        .join(' and ')}, installed with one command.`,
    path: '/ai/skills',
});

const linkClass =
    'text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950';

const SkillsPage = () => {
    const all = skills();
    return (
        <>
            <JsonLd
                data={techArticleLd({
                    headline: 'Claude Code skills for Continuum',
                    description: lead(),
                    path: '/ai/skills',
                })}
            />
            <PageHero
                crumbs={[
                    { name: 'AI', path: '/ai' },
                    { name: 'Skills', path: '/ai/skills' },
                ]}
                eyebrow="AI"
                lead={lead()}
                title="Skills"
            />
            <Article>
                <ArticleSection
                    description="One command in the project; from then on the skills follow its version."
                    id="install"
                    tight
                    title="Install"
                >
                    <CodeBlock code="npx contui init" />
                    <P>
                        It installs <C>@contui/ui</C> as a dependency, copies every skill into the
                        project's <C>.claude/skills</C> (kept out of git), and registers the{' '}
                        <Link className={linkClass} href="/ai/mcp-server">
                            MCP server
                        </Link>
                        . The package is the source: every install copies the skills of the version
                        in <C>package.json</C> again, so everyone on the project has the same ones.
                    </P>
                    <P>
                        To update, update <C>@contui/ui</C> like any dependency: the skills and the
                        server come with it.
                    </P>
                </ArticleSection>

                <ArticleSection
                    description={`${all.length} ${all.length === 1 ? 'skill' : 'skills'}, read from .claude/skills.`}
                    id="the-skills"
                    tight
                    title={`The ${all.length} skills`}
                >
                    <DividedList>
                        {all.map(skill => {
                            const { summary, when } = skillParts(skill.description);
                            return (
                                <Row className="gap-2" key={skill.name}>
                                    <RowName mono>/{skill.name}</RowName>
                                    <RowText className="text-neutral-700">{summary}</RowText>
                                    {when && <RowText>{when}</RowText>}
                                </Row>
                            );
                        })}
                    </DividedList>
                </ArticleSection>

                {all.map(skill => (
                    <ArticleSection
                        id={skill.name}
                        key={skill.name}
                        tight
                        title={<span className="font-mono">/{skill.name}</span>}
                    >
                        <Markdown source={skill.doc.intro} />
                        {skill.doc.sections.length > 0 && (
                            <>
                                <H>What its SKILL.md holds</H>
                                <P>
                                    {skill.doc.sections
                                        .map(section => plainText(section.title))
                                        .join(' · ')}
                                    .
                                </P>
                            </>
                        )}
                        {skill.references.length > 0 && (
                            <>
                                <H>{`Its ${skill.references.length} reference files`}</H>
                                <P>
                                    Read when a step needs them, not all at once:{' '}
                                    {skill.references.map((file, index) => (
                                        <span key={file}>
                                            {index > 0 && ' · '}
                                            <C>{file.replace(/^references\//, '')}</C>
                                        </span>
                                    ))}
                                    .
                                </P>
                            </>
                        )}
                    </ArticleSection>
                ))}

                <ArticleSection
                    description="Ask in words, or call a skill by its name."
                    id="using-them"
                    tight
                    title="Using them"
                >
                    <P>
                        Claude reaches for a skill when a request matches its description: "build
                        the settings page in Continuum", "this card feels cramped". To be sure, call
                        it by name, with what it should work on.
                    </P>
                    <CodeBlock
                        code={all
                            .map(skill =>
                                skill.name === 'continuum-fix-padding'
                                    ? `/${skill.name} src/app/billing-card.tsx`
                                    : skill.name === 'continuum-taste'
                                      ? `/${skill.name} the invoices index`
                                      : `/${skill.name}`,
                            )
                            .join('\n')}
                    />
                    <P>
                        Skills are Claude's. Cursor, VS Code and the agents in Paper and Figma reach
                        the same system through the{' '}
                        <Link className={linkClass} href="/ai/mcp-server">
                            MCP server
                        </Link>
                        , which serves the skill's references, its values and its checks as tools.
                    </P>
                </ArticleSection>
            </Article>
            <PrevNext groups={aiWays()} label="AI" path="/ai/skills" />
        </>
    );
};

export default SkillsPage;
