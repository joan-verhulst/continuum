/*
 * Words the AI pages share: where the server is, and a tool's description cut for a person.
 */

/**
 * Where the server is, for a config that needs it spelt out. A placeholder: every clone is
 * somewhere else, and pnpm install:skill prints the real line for the one it runs in.
 */
export const serverPath = '/path/to/continuum/mcp/dist/server.mjs';

/** The same path for a command run in the clone's folder: bash and PowerShell both read $PWD. */
export const serverFromClone = '"$PWD/mcp/dist/server.mjs"';

/** The one line that registers the server with Claude Code, for every project. */
export const claudeMcpAdd = `claude mcp add --scope user continuum -- node ${serverFromClone}`;

/**
 * What a tool does, for a person: its description (written for an agent) up to the first sentence
 * or list, without the shape it returns, and cut at about 220 characters. As the playground's MCP
 * page cuts it.
 */
export const toolSummary = (text: string) => {
    const end = text.search(/[.!?](?=\s|$)|:\s+-\s|:\s*returns\b|[:,]?\s*(returns\s*)?\{/);
    const cut = (end < 0 ? text : text.slice(0, end)).trim();
    if (cut.length <= 220) return `${cut}.`;
    return `${cut.slice(0, cut.lastIndexOf(' ', 220))}…`;
};

/** A skill's description split where it says when to use it, as the playground's Skills page splits it. */
export const skillParts = (description: string) => {
    const split = description.search(/\bUse (it )?when\b/);
    return {
        summary: (split > 0 ? description.slice(0, split) : description).trim(),
        when: split > 0 ? description.slice(split).trim() : undefined,
    };
};
