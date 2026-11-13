import { ArticleSection, C, CodeBlock, column, P } from '../article';
import { Page, PageHeader } from '../layout';
import { type AppState, toHash } from '../meta';
import { skills } from './data';

/*
 * The skills in this repo and how to install them: an article like Foundations, its list read
 * from each skill's SKILL.md, so a new skill shows here without a word changed.
 */

type SkillsPageProps = { state: AppState; onChange: (patch: Partial<AppState>) => void };

export const SkillsPage = ({ state, onChange }: SkillsPageProps) => (
    <Page className="gap-0">
        <div className={column}>
            <PageHeader
                description="What Claude knows about Continuum, packed as skills: installed once, and used in every project from then on."
                title="Skills"
            />
        </div>

        <ArticleSection
            description="One command from a clone of the repo, and again whenever the skills change."
            id="skills-install"
            title="Install"
        >
            <CodeBlock className={column} code="pnpm install:skill" />
            <P>
                It builds the skills from the library's own source (the components, the stylesheets
                and the reference screens go in as the skill's assets), copies every skill to{' '}
                <C>~/.claude/skills</C>, and registers the MCP server, so both reach every project
                on this machine. Inside this repo the skills already work from <C>.claude/skills</C>
                .
            </P>
            <P>
                The installed skills are copies: after a <C>git pull</C> that changes them, run it
                again. The MCP server reads from the clone, so it is current after the pull alone.
            </P>
        </ArticleSection>

        <ArticleSection
            description={`${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}, read from .claude/skills.`}
            id="skills-list"
            title="In this repo"
        >
            <ul
                className={`${column} flex flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50`}
            >
                {skills.map(skill => (
                    <li
                        className="flex min-w-0 flex-col gap-2 border-neutral-200 border-b px-5 py-4 last:border-b-0"
                        key={skill.name}
                    >
                        <span className="font-medium font-mono text-neutral-950 text-sm">
                            /{skill.name}
                        </span>
                        <span className="text-neutral-700 text-xs leading-relaxed">
                            {skill.summary}
                        </span>
                        {skill.when && (
                            <span className="text-neutral-600 text-xs leading-relaxed">
                                {skill.when}
                            </span>
                        )}
                        {skill.references.length > 0 && (
                            <span className="text-neutral-600 text-xs leading-relaxed">
                                References:{' '}
                                <span className="font-mono">{skill.references.join(' · ')}</span>
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </ArticleSection>

        <ArticleSection
            description="Ask in words, or call a skill by its name."
            id="skills-use"
            title="Using them"
        >
            <P>
                Claude reaches for a skill when a request matches its description: "build the
                settings page in Continuum", "this card feels cramped". To be sure, call it by name,
                with what it should work on: <C>/continuum-taste the invoices index</C>,{' '}
                <C>/continuum-fix-padding src/app/billing-card.tsx</C>.
            </P>
            <P>
                Skills are Claude's. Cursor, VS Code and the agents in Paper and Figma reach the
                same system through the{' '}
                <a
                    className="text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                    href={toHash({ ...state, view: 'mcp' })}
                    onClick={event => {
                        event.preventDefault();
                        onChange({ view: 'mcp' });
                    }}
                >
                    MCP server
                </a>
                , which serves the skill's references, its values and its checks as tools.
            </P>
        </ArticleSection>
    </Page>
);
