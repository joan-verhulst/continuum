import { FileText, type LucideIcon, ScanSearch, Server, Sparkles } from 'lucide-react';
import { ArticleSection, P } from '@/components/article';
import { FaqSection } from '@/components/faq-section';
import { Article, CardGrid, FrameSection, LinkCard, PageHero } from '@/components/page-frame';
import { mcpManifest, skills } from '@/lib/content';
import { type Faq, JsonLd, pageMetadata, techArticleLd } from '@/lib/seo';
import { aiWayLines } from './_lib/nav';

/*
 * The AI section's front page, for a person or an answer engine asking what Continuum gives an
 * agent: the four ways in, each leading to its page, then the questions people ask about them. The
 * counts are read from the manifest and the skills folder, so they never fall behind.
 */

const toolCount = () => mcpManifest().tools.length;

const lead = () =>
    `Continuum gives an AI agent its design system as something to read and check: ${skills().length} skills for Claude Code, an MCP server with ${toolCount()} tools for any editor, an audit that finds what is off in existing UI, and a DESIGN.md brief for each project.`;

export const metadata = pageMetadata({
    title: 'Continuum for AI agents: skills, MCP server and audit',
    absoluteTitle: true,
    description: `Skills for Claude Code, an MCP server with ${toolCount()} tools for Cursor, VS Code and Claude, an audit for UI in any stack, and a DESIGN.md brief: Continuum for AI agents.`,
    path: '/ai',
});

/** Each way's icon on its card; the lines themselves are shared with the header's menu. */
const icons: Record<string, LucideIcon> = {
    '/ai/skills': Sparkles,
    '/ai/mcp-server': Server,
    '/ai/audit': ScanSearch,
    '/ai/design-md': FileText,
};

const ways = () => aiWayLines().map(way => ({ ...way, icon: icons[way.href] ?? Sparkles }));

const faqs = (): Faq[] => [
    {
        question: 'What is a design system MCP server?',
        answer: `An MCP server is a program an AI agent connects to over the Model Context Protocol, to call its tools. Continuum's serves the design system itself: ${toolCount()} tools that return a part's spec, a page's anatomy, the recipe for a common need, the tokens and the spacing maths, and audit existing UI against them. The agent reads; it makes the edits itself.`,
    },
    {
        question: 'Does it work with Cursor and VS Code?',
        answer: 'Yes. The server runs over stdio with node, so any MCP client starts it the same way: Cursor reads it from ~/.cursor/mcp.json, VS Code from .vscode/mcp.json, and Claude Code registers it with one claude mcp add command.',
    },
    {
        question: 'Which stacks can the audit read?',
        answer: 'Any. audit_source reads source files whatever the framework: CSS, SCSS, Less, Sass, Qt stylesheets and QML, style blocks and attributes in any markup, CSS in template literals, style objects, utility classes, and colour literals in any language. audit_ui reads what is rendered: a running page in any framework through a snapshot script, or a Paper or Figma canvas through its computed styles.',
    },
    {
        question: 'What is the difference between the skills and the MCP server?',
        answer: 'They carry the same system. The skills are markdown Claude Code reads when a request matches them; the MCP server serves the same references, values and checks as tools, so agents in other editors and on design canvases reach them too. With Claude Code, use both.',
    },
    {
        question: 'Does the MCP server change my files?',
        answer: 'No. Every tool only reads: it returns specs, values or findings, and the agent decides what to edit. An audit finding says what to change and how, in the form the file already uses.',
    },
    {
        question: 'What is DESIGN.md?',
        answer: "A brief the theme builder exports with a project's app.css: the look in one paragraph, the setup, the theme's own values and the rules in short. Put @DESIGN.md in the project's CLAUDE.md and every session starts with it.",
    },
];

const AiPage = () => {
    const questions = faqs();
    return (
        <>
            <JsonLd
                data={[
                    techArticleLd({
                        headline: 'Continuum for AI agents',
                        description: lead(),
                        path: '/ai',
                    }),
                ]}
            />
            <PageHero
                crumbs={[{ name: 'AI', path: '/ai' }]}
                eyebrow={`${skills().length} skills · ${toolCount()} MCP tools`}
                lead={lead()}
                title="Continuum for AI agents"
            />

            <FrameSection
                description="Each reads the same system, so a screen built with one passes the checks of another."
                id="what-an-agent-gets"
                title="What an agent gets"
            >
                <CardGrid columns={2}>
                    {ways().map((way, index) => (
                        <LinkCard
                            delay={index % 2}
                            description={way.text}
                            href={way.href}
                            icon={way.icon}
                            key={way.href}
                            title={way.name}
                        />
                    ))}
                </CardGrid>
            </FrameSection>

            <Article className="pt-8 md:pt-16">
                <ArticleSection
                    description="Every rule is stated in units, never as a class string."
                    id="how-it-fits"
                    tight
                    title="One system, any medium"
                >
                    <P>
                        A Continuum rule says 34 high, 12 corners, 13px type at weight 500, so it
                        holds in React (where the system ships as a component library), in Angular,
                        Vue or plain CSS, in Qt, and on a design canvas. The skills and the server
                        write each value out for the medium in front of the agent: a Tailwind name
                        in React, a variable in CSS, a style on a canvas.
                    </P>
                    <P>
                        A new screen starts from its kind (an overview, an index, a settings page
                        …), then the parts and the recipes it is built from. Existing UI starts from
                        the audit: the agent applies its fixes, proposes its structural advice, and
                        audits again until it is clean.
                    </P>
                </ArticleSection>

                {/* The questions, and the same as FAQPage data. */}
                <FaqSection
                    description={`${questions.length} questions about Continuum and AI agents.`}
                    faqs={questions}
                />
            </Article>
        </>
    );
};

export default AiPage;
