import { z } from 'zod';
import { definePrompt } from '../support/tool';

/*
 * The improve loop as a procedure: audit, fix the sure things, propose the rest, audit again. It
 * names no stack: the agent finds the one in front of it, and the audit reads them all alike.
 */

export const improveUiPrompt = definePrompt({
    name: 'improve_ui',
    title: 'Improve existing UI',
    description:
        'Brings existing UI, built in anything, to Continuum: audits the source and what it renders, applies the fixes, proposes the structural changes, and audits again until clean.',
    args: {
        target: z
            .string()
            .optional()
            .describe(
                "What to improve: files, a folder, a route or a page's URL. Empty for the screen in front of you.",
            ),
        medium: z
            .string()
            .optional()
            .describe(
                'Where the UI lives, as the audit tools name it. Empty to find out from the project.',
            ),
    },
    handle: ({ target, medium }) =>
        [
            `Improve ${target ? `\`${target}\`` : 'the UI in front of you'} so it follows Continuum, using the Continuum tools.`,
            '',
            `1. **The stack.** ${medium ? `The medium is ${medium}.` : 'Find it from the project (its manifest, its file types) and pick the closest `medium` the audit tools offer.'} If the project has an app.css from the theme builder, pass it as \`theme\` to every audit.`,
            '2. **Audit.** Run `audit_source` on the files. If the UI runs, audit what it renders too: in a browser, run the script from `get_snapshot_script` and pass the result to `audit_ui` as `tree`; on a canvas, pass its layers with their computed styles; anywhere else, read the values off the UI with whatever inspector the platform has and pass them to `audit_ui` as `facts`.',
            "3. **Fix.** Take the 'fix' findings high confidence first, in batches per file. Each fix comes back in the form the value was found in (a class for a class, the same declaration in the same syntax, a literal with its token's name): write that one, or the `css` or `tailwind` alternative if the place takes it better. Apply medium ones and look at the result. Ask before low ones (a colour far from every token may be a brand or data colour).",
            "4. **Propose.** For 'advise' findings (two primary actions, nested containers, tabs that belong in the dock, dividers between sections), tell the person what you would change and why, citing the finding's reason, and change it once they agree.",
            "5. **Components.** A 'component' finding names the Continuum part an element is. Where the library can be imported, use the part (`get_component` for its props). Where it cannot, keep the element and hold it to the part's spec (`get_component` with the medium).",
            '6. **Again.** Audit again until no fix findings remain. Then look at the UI in light and dark (audit again with `mode`), wide and narrow.',
            '7. **Report** what changed, file by file, and what stays open: the advice not taken and why.',
            '',
            'Change only what the findings name. Spacing that the scale snaps may want another step: `get_spacing` works out what a box should pad from what it holds.',
        ].join('\n'),
});
