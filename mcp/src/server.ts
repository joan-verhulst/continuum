import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildScreenPrompt } from './prompts/build-screen';
import { improveUiPrompt } from './prompts/improve-ui';
import { reviewCanvasPrompt } from './prompts/review-canvas';
import { registerPrompt, registerTool, type ToolDefinition } from './support/tool';
import { auditSourceTool } from './tools/audit-source';
import { auditUiTool } from './tools/audit-ui';
import { checkThemeTool } from './tools/check-theme';
import { createThemeTool } from './tools/create-theme';
import { findPatternTool } from './tools/find-pattern';
import { getComponentTool } from './tools/get-component';
import { getFoundationTool } from './tools/get-foundation';
import { getPageKindTool } from './tools/get-page-kind';
import { getSnapshotScriptTool } from './tools/get-snapshot-script';
import { getSpacingTool } from './tools/get-spacing';
import { getTokensTool } from './tools/get-tokens';
import { listComponentsTool } from './tools/list-components';

/*
 * Continuum over MCP: the system's specs, its values and its maths, and an audit that tells an
 * agent what to fix in UI that already exists, in any stack. Everything here reads; the agent
 * makes the edits. The rules live in the skill's markdown, embedded at build time, so this
 * server and the skill never disagree.
 */

export const name = 'Continuum';
export const version = '0.1.0';

export const instructions = `
Continuum is a design system for quiet, dense tool UI: 13px type in two weights (400, 500), 1px hairline borders, one action colour, almost no shadow, controls 34 or 38 high, corners chip 6 · item 10 · control 12 · card 16 · panel 20, a 4px spacing scale, light and dark. Every rule is stated in units, so it applies in React (where it ships as a component library), Angular, Vue, plain CSS, Qt and on a design canvas (Paper, Figma) alike.

Building: name the screen's kind and read its anatomy with get_page_kind (overview, index, detail, create or edit, settings, assistant, sign in). Compose from the parts: list_components, then get_component for each part's spec, values and states, written for your medium. find_pattern answers "how do I build a filter bar, a KPI row, an empty state". get_foundation gives the values of one topic (colour, type, radius, spacing, heights, layout …). get_spacing works out a box's padding and gaps from what it holds; get_tokens gives the token set as CSS, Tailwind, DTCG JSON, or a Paper or Figma payload.

Improving existing UI: audit_source reads source files (React, Angular, Vue, Svelte, HTML, CSS, SCSS) and audit_ui reads a rendered tree of boxes, from a browser (run get_snapshot_script in the page and pass its result) or a canvas (Paper's computed styles). Both return findings: what is off, in units, what Continuum wants, why, and the fix written for the stack. Apply 'fix' findings of high confidence; apply medium ones and look; ask about low ones; propose 'advise' findings (structure: two primary actions, tabs that belong in the dock, nested containers) to the person before changing them. Audit again until it is clean, then look at the result in light and dark.

Theming: create_theme turns options (accent, greys, font, type size, spacing unit, control size, corners) into the app.css and DESIGN.md a project uses; check_theme measures its contrast. Contrast checks advise: the person's eye decides. Pass a project's app.css as theme to the other tools to check against its own values.

The prompts build_screen, improve_ui and review_canvas run these as a procedure.
`.trim();

/** In the order a client lists them: building, then improving, then theming. */
export const tools: ToolDefinition[] = [
    listComponentsTool,
    getComponentTool,
    findPatternTool,
    getPageKindTool,
    getFoundationTool,
    getSpacingTool,
    getTokensTool,
    getSnapshotScriptTool,
    auditUiTool,
    auditSourceTool,
    createThemeTool,
    checkThemeTool,
] as ToolDefinition[];

export const prompts = [buildScreenPrompt, improveUiPrompt, reviewCanvasPrompt];

export const createServer = () => {
    const server = new McpServer({ name, version }, { instructions });
    for (const tool of tools) registerTool(server, tool);
    for (const prompt of prompts) registerPrompt(server, prompt as never);
    return server;
};

const isMain =
    process.argv[1] &&
    import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop() ?? '');

if (isMain) {
    await createServer().connect(new StdioServerTransport());
}
