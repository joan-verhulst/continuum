import { Tabs, TabsContent, TabsList, TabsTrigger } from 'continuum';
import { ArticleSection, C, CodeBlock, column, Figure, H, P } from '../article';
import { Page, PageHeader } from '../layout';
import { firstSentence, manifest, serverFromClone, serverPath } from './data';

/*
 * The MCP server: how to connect it, what it offers and how its audit works. An article like
 * Foundations; the tools and prompts are read from the server's manifest, so the page lists
 * what the server serves. No command names a machine's path: one run in the clone's folder
 * reads it from the shell, and a config file shows where the reader's own path goes.
 */

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

/** One finding as audit_source returns it. */
const exampleFinding = JSON.stringify(
    {
        rule: 'height',
        severity: 'fix',
        confidence: 'high',
        at: 'src/app/toolbar.tsx:12',
        node: 'button · New invoice',
        property: 'height',
        found: 'h-9 (36px)',
        expected: '34px (control)',
        why: 'Controls sit on two heights, 34 and 38, so anything beside anything lines up (foundations.md › Heights).',
        fix: { tailwind: 'h-control', css: 'height: var(--spacing-control);' },
    },
    null,
    2,
);

const steps = [
    {
        title: 'Clone and install',
        text: 'Anywhere on the machine; the server runs from this clone.',
        code: 'git clone git@github.com:joan-verhulst/continuum.git\ncd continuum\npnpm install',
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

export const McpPage = () => (
    <Page className="gap-0">
        <div className={column}>
            <PageHeader
                description="Continuum for any agent, in any editor: the system's parts, values and maths as tools, and an audit that says what to fix in UI that already exists."
                title="MCP server"
            />
        </div>

        <ArticleSection
            description="Once per machine, from a clone of the repo."
            id="mcp-setup"
            title="Set it up"
        >
            <ol className={`${column} flex flex-col gap-10`}>
                {steps.map((step, index) => (
                    <li className="flex min-w-0 flex-col gap-3" key={step.title}>
                        <div className="flex flex-col gap-1">
                            <span className="font-medium text-base text-neutral-950">
                                {index + 1}. {step.title}
                            </span>
                            <span className="text-base text-neutral-700 leading-relaxed">
                                {step.text}
                            </span>
                        </div>
                        <CodeBlock code={step.code} />
                    </li>
                ))}
            </ol>
            <H>By hand</H>
            <P>
                The second step runs this. Run it yourself from the clone's folder, in bash or
                PowerShell, to register the server under another name; leave out <C>--scope user</C>{' '}
                to register it for the project you are in only.
            </P>
            <CodeBlock
                className={column}
                code={`claude mcp add --scope user continuum -- node ${serverFromClone}`}
            />
        </ArticleSection>

        <ArticleSection
            description="The same server, started the same way: only where its line goes differs."
            id="mcp-editors"
            title="In other editors"
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
            description={`${manifest.tools.length} tools, all of them reading: the agent makes the edits.`}
            id="mcp-tools"
            title="What it offers"
        >
            <ul
                className={`${column} flex flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50`}
            >
                {manifest.tools.map(tool => (
                    <li
                        className="flex min-w-0 flex-col gap-1 border-neutral-200 border-b px-5 py-4 last:border-b-0"
                        key={tool.name}
                    >
                        <span className="font-medium font-mono text-neutral-950 text-sm">
                            {tool.name}
                        </span>
                        <span className="text-neutral-600 text-xs leading-relaxed">
                            {firstSentence(tool.description)}
                        </span>
                    </li>
                ))}
            </ul>
        </ArticleSection>

        {manifest.prompts.length > 0 && (
            <ArticleSection
                description="Procedures that run the tools in order. In Claude Code each is a slash command."
                id="mcp-prompts"
                title="Prompts"
            >
                <ul
                    className={`${column} flex flex-col overflow-hidden rounded-card border border-neutral-200 bg-neutral-50`}
                >
                    {manifest.prompts.map(prompt => (
                        <li
                            className="flex min-w-0 flex-col gap-1 border-neutral-200 border-b px-5 py-4 last:border-b-0"
                            key={prompt.name}
                        >
                            <span className="font-medium font-mono text-neutral-950 text-sm">
                                /mcp__continuum__{prompt.name}
                            </span>
                            <span className="text-neutral-600 text-xs leading-relaxed">
                                {prompt.description}
                            </span>
                        </li>
                    ))}
                </ul>
            </ArticleSection>
        )}

        <ArticleSection
            description="One standard for every stack: whatever the input, it becomes the same facts, judged by one set of rules."
            id="mcp-audit"
            title="Improving what exists"
        >
            <P>
                <C>audit_source</C> reads source files in any language: style declarations in any
                syntax (CSS, SCSS, Less, QSS, QML, inline styles, style objects), utility classes,
                colour literals and raw elements. <C>audit_ui</C> reads what is rendered: a running
                page through <C>get_snapshot_script</C>, a canvas through Paper's or Figma's
                computed styles, or facts another tool has already extracted.
            </P>
            <P>
                Each value becomes a fact (a property, its value, what it sits on, how it was
                written), and one set of rules judges every fact the same way. A finding says what
                is off and what Continuum wants, in units, why, and the fix written in the form the
                file uses: a class where it was a class, a declaration where it was one.
            </P>
            <Figure caption="A finding: a button on 36 where controls sit on 34, with the fix as the file writes it.">
                <CodeBlock className={column} code={exampleFinding} />
            </Figure>
            <H>How an agent takes them</H>
            <P>
                Fixes of high confidence it applies; medium ones it applies and looks at; low ones
                (a colour far from every token, perhaps a brand's) it asks about. Advice (two
                primary actions, nested containers, tabs that belong in the dock) it proposes with
                the reason before changing anything. Then it audits again until clean, and looks at
                the result in light and dark. The <C>improve_ui</C> prompt runs this loop.
            </P>
            <H>What it cannot read</H>
            <P>
                Sizes are read where they are written as a property and a value, or as a utility
                class; a size written as code (<C>height(36.dp)</C>) is not. Colours are read in any
                language.
            </P>
        </ArticleSection>

        <ArticleSection
            description="The server is read fresh at the start of every session."
            id="mcp-update"
            title="Keeping it current"
        >
            <P>
                <C>git pull</C> in the clone, and every new session uses the new server. The skills
                are copies, so run <C>pnpm install:skill</C> again when they change.
            </P>
        </ArticleSection>
    </Page>
);
