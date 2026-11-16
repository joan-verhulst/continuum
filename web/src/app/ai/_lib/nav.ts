import 'server-only';
import type { NavItem } from '@/components/page-frame';
import { mcpManifest } from '@/lib/content';

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

/** The four ways in, in order, for the previous and next at a page's foot. */
export const aiWays = (): NavItem[] => aiPages.slice(1).map(page => ({ ...page }));

/** The path of one tool's page: '/ai/mcp-server/get-component'. */
export const toolPath = (slug: string) => `/ai/mcp-server/${slug}`;

/** The MCP tools in the server's order. */
export const mcpToolOrder = (): NavItem[] =>
    mcpManifest().tools.map(tool => ({ href: toolPath(tool.slug), label: tool.name }));
