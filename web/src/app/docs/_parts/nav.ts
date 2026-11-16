/** The install guide's parts, by their anchors: the index lists them, the page draws them. */
export const installParts = [
    {
        id: 'library',
        title: 'The React library',
        summary:
            'Add Continuum from GitHub, load its styles through Tailwind v4 or the prebuilt sheet, and wrap the app in a Theme.',
    },
    {
        id: 'skills-and-mcp',
        title: 'The skills and the MCP server',
        summary:
            'One command from a clone copies the Claude skills and registers the MCP server for every project.',
    },
    {
        id: 'with-claude',
        title: 'Using it with Claude',
        summary: 'Ask for UI in Continuum, or call the skills and the server’s prompts by name.',
    },
    {
        id: 'theme',
        title: 'A theme of your own',
        summary: 'Make a theme in the builder and swap its app.css in for the default.',
    },
] as const;
