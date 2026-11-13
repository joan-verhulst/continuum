import { z } from 'zod';
import { definePrompt } from '../support/tool';

export const buildScreenPrompt = definePrompt({
    name: 'build_screen',
    title: 'Build a screen',
    description:
        'Build a screen in Continuum: name its kind, compose it from the parts and patterns, work out its spacing, then audit it and fix until it is clean.',
    args: {
        screen: z
            .string()
            .optional()
            .describe(
                "What to build and what it holds: 'the invoices list: number, customer, amount, status, due date'. Leave empty to be asked.",
            ),
        medium: z
            .string()
            .optional()
            .describe(
                "Where it is built: 'react' (the library), 'angular', 'vue', 'svelte', 'html', 'css', 'canvas' (Paper or Figma), 'qt'. Defaults to 'react'.",
            ),
    },
    handle: ({ screen, medium }) => {
        const target = screen?.trim()
            ? `this screen: ${screen.trim()}`
            : 'a screen (ask me what it is for and what it holds first)';
        const stack = medium?.trim() || 'react';
        return [
            `Build ${target}, in Continuum, in ${stack}.`,
            '1. Take the content as given: the fields, columns, actions and data are mine to decide. Do not invent any or leave any out; if something is missing, ask, or assume the least and say so.',
            "2. Name the screen's kind and call get_page_kind with it. Follow its anatomy top to bottom, with its width, gaps and the standing decisions (one primary action, a breadcrumb, views in the dock, one column).",
            `3. Call list_components, then get_component (medium '${stack}') for every part you use. For each need on the screen (a filter bar, key figures, an empty state, bulk selection …) call find_pattern and build it as the row says. Make a new part only when nothing fits, by the recipe find_pattern gives.`,
            '4. For every box that holds content (a card, a panel, a list row, a dialog), call get_spacing with what it holds for its padding and gaps. Take every other value from the specs or get_foundation; never invent one.',
            "5. Build it, with realistic data in the product's own domain and its empty and loading states.",
            `6. Audit the result: audit_source on the files you wrote${stack === 'canvas' ? ", or audit_ui on the canvas's computed styles" : ', or audit_ui on a snapshot of the running page (get_snapshot_script)'}. Apply the fixes, propose the advice to me, and audit again until it is clean.`,
            '7. Look at it in light and dark, at 1440 × 900 and at 390 wide, and fix what looks wrong before you report it done.',
        ].join('\n\n');
    },
});
