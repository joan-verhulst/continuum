import 'server-only';
import { once, readRepoFile } from './files';
import { kebab } from './slugs';

/*
 * The MCP server's manifest (mcp/manifest.json, built by `pnpm build:mcp` and tracked), so the AI
 * pages list exactly what the server serves.
 */

export type McpTool = {
    /** 'list_components' */
    name: string;
    /** 'List components' */
    title: string;
    description: string;
    /** 'list-components': an anchor or a page of its own. */
    slug: string;
};

export type McpPrompt = McpTool & {
    args: { name: string; description: string }[];
};

export type McpManifest = {
    name: string;
    version: string;
    tools: McpTool[];
    prompts: McpPrompt[];
};

/** The manifest: the server's name and version, its tools and its prompts, in its order. */
export const mcpManifest = once((): McpManifest => {
    const raw = JSON.parse(readRepoFile('mcp/manifest.json')) as {
        name: string;
        version: string;
        tools: Omit<McpTool, 'slug'>[];
        prompts: (Omit<McpPrompt, 'slug' | 'args'> & { args?: McpPrompt['args'] })[];
    };
    return {
        name: raw.name,
        version: raw.version,
        tools: raw.tools.map(tool => ({ ...tool, slug: kebab(tool.name) })),
        prompts: raw.prompts.map(prompt => ({
            ...prompt,
            args: prompt.args ?? [],
            slug: kebab(prompt.name),
        })),
    };
});
