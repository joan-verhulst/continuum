import { Tabs, TabsContent, TabsList, TabsTrigger } from 'continuum';
import Link from 'next/link';
import { ArticleSection, C, column, DividedList, Figure, H, P } from '@/components/article';
import { CodeBlock } from '@/components/code-block';
import { Article, CardGrid, LinkCard, PageHero, PrevNext } from '@/components/page-frame';
import { mcpManifest } from '@/lib/content';
import { JsonLd, pageMetadata, softwareApplicationLd } from '@/lib/seo';
import { githubUrl } from '@/lib/site';
import { Row, RowName, RowText } from '../_components/rows';
import { aiWays, toolPath } from '../_lib/nav';
import { claudeMcpAdd, serverPath, toolSummary } from '../_lib/text';

/*
 * The MCP server: how to connect it, what it offers and how its audit reads any stack. The copy is
 * the playground's MCP page (playground/src/install/mcp-page.tsx); the tools and prompts are read
 * from the server's manifest, each tool leading to a page of its own. No command names a machine's
 * path: one run in the clone's folder reads it from the shell, and a config file shows where the
 * reader's own path goes.
 */

const lead = () =>
    `Continuum's MCP server gives any agent, in any editor, the design system's parts, values and maths as ${mcpManifest().tools.length} tools, and an audit that says what to fix in UI that already exists; connect it once per machine.`;

export const metadata = pageMetadata({
    title: 'Continuum MCP server: a design system for any agent',
    absoluteTitle: true,
    description: `A design system MCP server for Claude Code, Cursor and VS Code: ${mcpManifest().tools.length} read-only tools for components, page anatomy, tokens and spacing, and an audit for UI in any stack.`,
    path: '/ai/mcp-server',
});

const cursorConfig = JSON.stringify(
    { mcpServers: { continuum: { command: 'node', args: [serverPath] } } },
    null,
    2,
);

const vscodeConfig = JSON.stringify(
    { servers: { continuum: { type: 'stdio', command: 'node', args: [serverPath] } } },
    null,
    2,
);

const steps = [
    {
        title: 'Clone and install',
        text: 'Anywhere on the machine; the server runs from this clone.',
        code: `git clone ${githubUrl}.git\ncd continuum\npnpm install`,
    },
    {
        title: 'Install the skills and the server',
        text: 'Copies the skills to ~/.claude/skills and registers the server with Claude Code for every project. Without the Claude CLI it prints the command instead.',
        code: 'pnpm install:skill',
    },
    {
        title: 'Check it is connected',
        text: 'In any project, continuum is listed as connected. Ask Claude which Continuum tools it has to see them in use.',
        code: 'claude mcp list',
    },
];

const McpServerPage = () => {
    const manifest = mcpManifest();
    return (
        <>
            <JsonLd
                data={softwareApplicationLd({
                    name: 'Continuum MCP server',
                    description: lead(),
                    path: '/ai/mcp-server',
                    category: 'DeveloperApplication',
                })}
            />
            <PageHero
                crumbs={[
                    { name: 'AI', path: '/ai' },
                    { name: 'MCP server', path: '/ai/mcp-server' },
                ]}
                eyebrow="AI"
                lead={lead()}
                title="MCP server"
            />
            <Article>
                <ArticleSection
                    description="Once per machine, from a clone of the repo, in 3 steps."
                    id="set-it-up"
                    tight
                    title="Set it up"
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
                                <CodeBlock code={step.code} />
                            </li>
                        ))}
                    </ol>
                    <H>By hand</H>
                    <P>
                        The second step runs this. Run it yourself from the clone's folder, in bash
                        or PowerShell, to register the server under another name; leave out{' '}
                        <C>--scope user</C> to register it for the project you are in only.
                    </P>
                    <CodeBlock code={claudeMcpAdd} />
                </ArticleSection>

                <ArticleSection
                    description="The same server, started the same way: only where its line goes differs."
                    id="other-editors"
                    tight
                    title="In Cursor, VS Code and other editors"
                >
                    <Figure caption="Put the path to your own clone where /path/to/continuum is; pnpm install:skill prints it. Cursor reads ~/.cursor/mcp.json for every project, VS Code .vscode/mcp.json in the project.">
                        <Tabs className={`${column} flex flex-col gap-4`} defaultValue="cursor">
                            <TabsList variant="pill">
                                <TabsTrigger value="cursor">Cursor</TabsTrigger>
                                <TabsTrigger value="vscode">VS Code</TabsTrigger>
                                <TabsTrigger value="other">Any other</TabsTrigger>
                            </TabsList>
                            <TabsContent value="cursor">
                                <CodeBlock code={cursorConfig} />
                            </TabsContent>
                            <TabsContent value="vscode">
                                <CodeBlock code={vscodeConfig} />
                            </TabsContent>
                            <TabsContent value="other">
                                <CodeBlock code={`node ${serverPath}`} />
                            </TabsContent>
                        </Tabs>
                    </Figure>
                </ArticleSection>

                <ArticleSection
                    description={`${manifest.tools.length} tools, all of them reading: the agent makes the edits. Each has a page with its arguments and a real answer.`}
                    id="tools"
                    tight
                    title={`The ${manifest.tools.length} tools`}
                >
                    <CardGrid columns={2}>
                        {manifest.tools.map((tool, index) => (
                            <LinkCard
                                delay={index % 2}
                                description={toolSummary(tool.description)}
                                href={toolPath(tool.slug)}
                                key={tool.name}
                                mono
                                title={tool.name}
                            />
                        ))}
                    </CardGrid>
                </ArticleSection>

                {manifest.prompts.length > 0 && (
                    <ArticleSection
                        description="Procedures that run the tools in order. In Claude Code each is a slash command."
                        id="prompts"
                        tight
                        title={`The ${manifest.prompts.length} prompts`}
                    >
                        <DividedList>
                            {manifest.prompts.map(prompt => (
                                <Row key={prompt.name}>
                                    <RowName mono>/mcp__continuum__{prompt.name}</RowName>
                                    <RowText className="text-neutral-700">
                                        {prompt.description}
                                    </RowText>
                                    {prompt.args.map(arg => (
                                        <RowText key={arg.name}>
                                            <span className="font-mono text-neutral-800">
                                                {arg.name}
                                            </span>
                                            : {arg.description}
                                        </RowText>
                                    ))}
                                </Row>
                            ))}
                        </DividedList>
                    </ArticleSection>
                )}

                <ArticleSection
                    description="One standard for every stack: whatever the input, it becomes the same facts, judged by one set of rules."
                    id="audit"
                    tight
                    title="How the audit reads any stack"
                >
                    <P>
                        <C>audit_source</C> reads source files in any language: style declarations
                        in any syntax (CSS, SCSS, Less, QSS, QML, inline styles, style objects),
                        utility classes, colour literals and raw elements. <C>audit_ui</C> reads
                        what is rendered: a running page through <C>get_snapshot_script</C>, a
                        canvas through Paper's or Figma's computed styles, or facts another tool has
                        already extracted.
                    </P>
                    <P>
                        Each value becomes a fact (a property, its value, what it sits on, how it
                        was written), and one set of rules judges every fact the same way. A finding
                        says what is off and what Continuum wants, in units, why, and the fix
                        written in the form the file uses: a class where it was a class, a
                        declaration where it was one.
                    </P>
                    <H>What it cannot read</H>
                    <P>
                        Sizes are read where they are written as a property and a value, or as a
                        utility class; a size written as code (<C>height(36.dp)</C>) is not. Colours
                        are read in any language. The{' '}
                        <Link
                            className="text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                            href="/ai/audit"
                        >
                            audit's page
                        </Link>{' '}
                        shows a finding and how an agent takes it.
                    </P>
                </ArticleSection>

                <ArticleSection
                    description="The server is read fresh at the start of every session."
                    id="keeping-it-current"
                    tight
                    title="Keeping it current"
                >
                    <P>
                        <C>git pull</C> in the clone, and every new session uses the new server. The
                        skills are copies, so run <C>pnpm install:skill</C> again when they change.
                    </P>
                </ArticleSection>
            </Article>
            <PrevNext groups={aiWays()} label="AI" path="/ai/mcp-server" />
        </>
    );
};

export default McpServerPage;
