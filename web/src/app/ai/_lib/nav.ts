import 'server-only';
import type { NavItem } from '@/components/page-frame';
import { mcpManifest, skills } from '@/lib/content';

/*
 * The AI section's pages, for its routes and the links between them: the overview and the four ways
 * an agent gets Continuum, then one page per MCP tool, in the server's own order.
 */

export const aiPages = [
    { href: '/ai', label: 'Overview' },
    { href: '/ai/mcp-server', label: 'MCP server' },
    { href: '/ai/skills', label: 'Skills' },
    { href: '/ai/audit', label: 'Audit' },
    { href: '/ai/design-md', label: 'DESIGN.md' },
] as const;

/**
 * The four ways in, each with its line: the AI page's cards and the header's menu both read these.
 * The counts are read from the manifest and the skills folder, so they never fall behind.
 */
export const aiWayLines = (): { href: string; name: string; text: string }[] => [
    {
        href: '/ai/skills',
        name: 'Skills',
        text: `${skills().length} skills for Claude Code: the system's values, page anatomy, parts and recipes, and the spacing formula, installed once and used in every project.`,
    },
    {
        href: '/ai/mcp-server',
        name: 'MCP server',
        text: `The same system as ${mcpManifest().tools.length} read-only tools, for any agent in any editor: Claude Code, Cursor, VS Code, and the agents in Paper and Figma.`,
    },
    {
        href: '/ai/audit',
        name: 'Audit',
        text: 'Reads existing UI in any stack, source or rendered, and says what is off in units, what Continuum wants, why, and the fix written for the file.',
    },
    {
        href: '/ai/design-md',
        name: 'DESIGN.md',
        text: "The brief the theme builder writes beside a project's app.css: its theme and the rules in short, for an agent that reads the project.",
    },
];

/** The four ways in, in order, for the previous and next at a page's foot. */
export const aiWays = (): NavItem[] => aiPages.slice(1).map(page => ({ ...page }));

/** The path of one tool's page: '/ai/mcp-server/get-component'. */
export const toolPath = (slug: string) => `/ai/mcp-server/${slug}`;

/** The MCP tools in the server's order. */
export const mcpToolOrder = (): NavItem[] =>
    mcpManifest().tools.map(tool => ({ href: toolPath(tool.slug), label: tool.name }));
