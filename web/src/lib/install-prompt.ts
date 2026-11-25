/*
 * The setup prompt the hero's agent button copies, for a visitor to paste into their own coding
 * agent. Never shown on the page. It gives the order and the choices only: `npx contui init` does
 * the install, and the React setup is the skill's own (references/media/react.md), read from the
 * installed copy, so the two never say different things.
 */

export const installPrompt = `Set up Continuum in this project. Continuum is a design system for quiet, dense tool UI: a React component library (@contui/ui), two Claude skills and an MCP server that carry its decisions to any stack.

1. In the project's root, run \`npx contui init\`. It adds @contui/ui with this project's own package manager, copies the skills continuum-taste and continuum-fix-padding into .claude/skills, and registers the MCP server \`continuum\` in .mcp.json. If you are not Claude Code, register the same server in your own client: command \`node\`, argument \`node_modules/@contui/ui/mcp/server.mjs\`.
2. If this is a React app, read .claude/skills/continuum-taste/SKILL.md, then follow its React setup in references/media/react.md: the styles in the Tailwind entry, the app wrapped in \`Theme\`, the parts imported from @contui/ui. It needs React 19. If the project is not React, skip this step: the skills and the MCP server work in any stack.
3. Check that the project still builds.

Then tell me what you changed, and that I should restart Claude Code and approve the \`continuum\` MCP server, so the next session starts with the skills and the server's tools.`;
