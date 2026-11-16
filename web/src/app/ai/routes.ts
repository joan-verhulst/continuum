import { mcpManifest } from '@/lib/content';
import { aiPages, toolPath } from './_lib/nav';

/*
 * Every path this section generates, for the sitemap (src/app/sitemap.ts imports this): the
 * section's pages, and one page per MCP tool, as mcp-server/[tool]'s generateStaticParams makes them.
 */
export const routes = (): string[] => [
    ...aiPages.map(page => page.href),
    ...mcpManifest().tools.map(tool => toolPath(tool.slug)),
];
