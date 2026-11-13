import { z } from 'zod';
import { definePrompt } from '../support/tool';

/*
 * The audit on a design canvas: read the artboard's layers and styles, audit, patch the styles,
 * look. Any canvas tool with a way to read styles and write them back will do.
 */

export const reviewCanvasPrompt = definePrompt({
    name: 'review_canvas',
    title: 'Review a canvas artboard',
    description:
        "Reviews an artboard on a design canvas against Continuum: reads its layers' styles, audits them, applies the fixes on the canvas and compares the result with the page kind's anatomy.",
    args: {
        artboard: z
            .string()
            .optional()
            .describe('The artboard to review, by name or id. Empty for the current selection.'),
    },
    handle: ({ artboard }) =>
        [
            `Review ${artboard ? `the artboard \`${artboard}\`` : 'the selected artboard'} against Continuum, with whichever canvas tools you have.`,
            '',
            `1. **Find it**: the canvas's selection${artboard ? ' or a search by name' : ''}, then its layer tree with ids.`,
            '2. **Read the styles** of every layer, text layers included, in one call where the tool allows. If the tool gives CSS (computed styles), keep it as it is; if it gives its own properties (fills, strokes, corner radius, item spacing, text styles), turn each into its CSS name and value.',
            "3. **Audit**: `audit_ui` with `medium: 'canvas'` and the mode the artboard is drawn in, passing either `tree: { root: <the layers as nested { id, name, type, text, children }>, styles: <a map of layer id to CSS styles> }` or `facts`, one per value (`{ at: <layer id>, property, value, subject: { kind, name }, written: { form: 'rendered' } }`).",
            "4. **Fix**: for each 'fix' finding, patch the layers in its `at` with the finding's `fix.canvas` (a camelCase style patch; batch the same patch across layers), or the matching property of the canvas, bound to the file's variables where it has them. High confidence first; medium ones, then look; ask about low ones.",
            "5. **Propose** the 'advise' findings (one primary action, nested containers, views in the dock) to the person before redrawing anything.",
            '6. **Look**: a screenshot of the artboard, compared with the anatomy from `get_page_kind` for its kind; audit again until no fixes remain.',
            '',
            'Name layers by their part ("Button / primary", "Input") so the audit knows what each one is.',
        ].join('\n'),
});
