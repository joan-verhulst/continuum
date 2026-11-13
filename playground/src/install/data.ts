/*
 * What the Install pages list, read from the repo itself so they never fall behind it: each
 * skill's SKILL.md and reference files, and the MCP server's manifest (written by
 * mcp/manifest.mjs from the built server).
 */

import manifestJson from '../../../mcp/manifest.json';

/**
 * Where the server is, for a config that needs it spelt out. A placeholder: every clone is
 * somewhere else, and pnpm install:skill prints the real line for the one it runs in.
 */
export const serverPath = '/path/to/continuum/mcp/dist/server.mjs';

/** The same path for a command run in the clone's folder: bash and PowerShell both read $PWD. */
export const serverFromClone = '"$PWD/mcp/dist/server.mjs"';

/* ---------- Skills ---------- */

const skillFiles = import.meta.glob<string>('../../../.claude/skills/*/SKILL.md', {
    query: '?raw',
    import: 'default',
    eager: true,
});

const referenceFiles = Object.keys(
    import.meta.glob('../../../.claude/skills/*/references/**/*.md'),
);

export type Skill = {
    name: string;
    /** What it does: the description up to its "Use when". */
    summary: string;
    /** When Claude reaches for it: the description from its "Use when" on. */
    when?: string;
    /** Its reference files, relative to references/. */
    references: string[];
};

/** The frontmatter's one-line fields. */
const frontmatter = (text: string) => {
    const block = /^---\n([\s\S]*?)\n---/.exec(text.replace(/\r\n/g, '\n'))?.[1] ?? '';
    const fields: Record<string, string> = {};
    for (const line of block.split('\n')) {
        const colon = line.indexOf(':');
        if (colon > 0) fields[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
    return fields;
};

export const skills: Skill[] = Object.entries(skillFiles)
    .map(([path, text]) => {
        const folder = path.split('/').at(-2) ?? '';
        const { name = folder, description = '' } = frontmatter(text);
        const split = description.search(/\bUse (it )?when\b/);
        const prefix = `../../../.claude/skills/${folder}/references/`;
        return {
            name,
            summary: (split > 0 ? description.slice(0, split) : description).trim(),
            when: split > 0 ? description.slice(split).trim() : undefined,
            references: referenceFiles
                .filter(file => file.startsWith(prefix))
                .map(file => file.slice(prefix.length))
                .sort(),
        };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

/* ---------- The MCP server ---------- */

export type McpManifest = {
    name: string;
    version: string;
    tools: Array<{ name: string; title: string; description: string }>;
    prompts: Array<{
        name: string;
        title: string;
        description: string;
        args: Array<{ name: string; description: string }>;
    }>;
};

/** Written by pnpm build:mcp and tracked, so it is always there. */
export const manifest: McpManifest = manifestJson;

/**
 * What a tool does, for a person: its description (written for an agent) up to the first sentence
 * or list, without the shape it returns, and cut at about 220 characters.
 */
export const firstSentence = (text: string) => {
    const end = text.search(/[.!?](?=\s|$)|:\s+-\s|:\s*returns\b|[:,]?\s*(returns\s*)?\{/);
    const cut = (end < 0 ? text : text.slice(0, end)).trim();
    if (cut.length <= 220) return `${cut}.`;
    return `${cut.slice(0, cut.lastIndexOf(' ', 220))}…`;
};
