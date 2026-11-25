/*
 * Words the AI pages share: where the server is, and a tool's description cut for a person.
 */

/** Where the server is in a project: inside the installed @contui/ui, so it is that version's. */
export const serverPath = 'node_modules/@contui/ui/mcp/server.mjs';

/** The same path for an editor's config, which fills in the project's folder itself. */
export const serverInWorkspace = `\${workspaceFolder}/${serverPath}`;

/** The line `npx contui init` writes into .mcp.json, as one command. */
export const claudeMcpAdd = `claude mcp add --scope project continuum -- node ${serverPath}`;

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
