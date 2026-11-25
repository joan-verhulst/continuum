/** The install guide's parts, by their anchors: the index lists them, the page draws them. */
export const installParts = [
    {
        id: 'library',
        title: 'The React library',
        summary:
            'Install @contui/ui from npm, load its styles through Tailwind v4 or the prebuilt sheet, and wrap the app in a Theme.',
    },
    {
        id: 'skills-and-mcp',
        title: 'The skills and the MCP server',
        summary:
            'npx contui init adds the Claude skills and the MCP server to the project, kept on the installed version.',
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
