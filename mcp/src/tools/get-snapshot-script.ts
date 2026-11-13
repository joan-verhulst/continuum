import { z } from 'zod';
import { snapshotScript } from '../audit/snapshot-script';
import { defineTool, readOnly, text } from '../support/tool';

/*
 * The browser half of audit_ui: a script the agent runs in the page, whose result it passes on.
 */

export const getSnapshotScriptTool = defineTool({
    name: 'get_snapshot_script',
    title: 'Get the snapshot script',
    description:
        'Returns a JavaScript expression to run in a rendered page (any stack: React, Angular, Vue, Svelte, plain HTML) and how to run it; its result is the tree of boxes audit_ui reads: sizes, paddings, colours, type, roles and, in a dev build, the source file of each element. Call this first to audit a running page, run the script, then pass its result to audit_ui as tree.',
    input: {
        root: z
            .string()
            .optional()
            .describe(
                "A CSS selector to snapshot one part of the page ('main', '[data-slot=card]'); empty for the whole body. Narrow it on a large page: the snapshot stops at maxNodes.",
            ),
        maxNodes: z
            .number()
            .int()
            .min(50)
            .max(2500)
            .optional()
            .describe('How many elements to read at most. Defaults to 1500.'),
    },
    annotations: readOnly,
    handle: ({ root, maxNodes }) => {
        const script = snapshotScript(root, maxNodes);
        return text(
            [
                '# Snapshot script',
                '',
                'Run it in the page, in the mode you want checked, then pass the object it returns to `audit_ui` as `tree` (with `format` left empty).',
                '',
                '- **Playwright**: `const tree = await page.evaluate(script)` with the script as a string.',
                '- **A browser tool’s javascript call** (Claude in Chrome, the built-in browser, Chrome DevTools MCP): run it as given; if the tool only returns text, wrap it as `JSON.stringify(<script>)`.',
                '- **The devtools console**: `copy(JSON.stringify(<script>))`, then paste.',
                '',
                'Elements that are hidden, empty wrappers and the inside of SVGs are left out. Run it again after each round of fixes.',
                '',
                '```js',
                script,
                '```',
            ].join('\n'),
        );
    },
});
