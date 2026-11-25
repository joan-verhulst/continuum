import { Tabs, TabsContent, TabsList, TabsTrigger } from '@contui/ui';
import { ArticleSection, C, CodeBlock, column, Figure, H, P } from '../article';
import { Page, PageHeader } from '../layout';
import { firstSentence, manifest, serverInWorkspace, serverPath } from './data';

/*
 * The MCP server: how to connect it, what it offers and how its audit works. An article like
 * Foundations; the tools and prompts are read from the server's manifest, so the page lists
 * what the server serves. The server comes with the project's @contui/ui and runs from its
 * node_modules, so every command runs in the project.
 */

const cursorConfig = JSON.stringify(
    { mcpServers: { continuum: { command: 'node', args: [serverInWorkspace] } } },
    null,
    2,
);

const vscodeConfig = JSON.stringify(
    { servers: { continuum: { type: 'stdio', command: 'node', args: [serverInWorkspace] } } },
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
        title: 'Install it in the project',
        text: 'In the project’s root. Installs @contui/ui as a dependency, adds the skills, and registers the server in .mcp.json, run from node_modules.',
        code: 'npx contui init',
    },
    {
        title: 'Check it is connected',
        text: 'Restart Claude Code in the project and approve the continuum server; it is then listed as connected. Ask Claude which Continuum tools it has to see them in use.',
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
            description={`Once per project, in ${steps.length} steps.`}
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
                The first step writes this into <C>.mcp.json</C>, which comes with the project for
                everyone on it. Run it yourself in the project's folder to register the server under
                another name; leave out <C>--scope project</C> to register it for you alone.
            </P>
            <CodeBlock
                className={column}
                code={`claude mcp add --scope project continuum -- node ${serverPath}`}
            />
        </ArticleSection>

        <ArticleSection
            description="The same server, started the same way: only where its line goes differs."
            id="mcp-editors"
            title="In other editors"
        >
            <Figure caption="After npx contui init, the server is in the project's node_modules. Cursor reads .cursor/mcp.json in the project, VS Code .vscode/mcp.json; both fill in ${workspaceFolder}. Any other client runs the command in the project's folder.">
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
                The server runs from the installed <C>@contui/ui</C>, so it is the version in{' '}
                <C>package.json</C>. Update the package like any dependency, and every new session
                uses the new server; the install copies the new skills too.
            </P>
        </ArticleSection>
    </Page>
);
