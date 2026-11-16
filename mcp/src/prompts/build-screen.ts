import { skill } from 'virtual:knowledge';
import { z } from 'zod';
import { definePrompt } from '../support/tool';

/*
 * The steps of building a screen are the skill's own (SKILL.md, "Building something"), embedded at
 * build time, so this prompt and the skill never disagree. The server adds only which of its tools
 * serves each step.
 */

/** SKILL.md's "Building something" section, its heading left off. */
const buildingSteps = () => {
    const start = skill.indexOf('## Building something');
    if (start < 0) return '';
    const body = skill.slice(start).replace(/^## Building something\s*/, '');
    const end = body.search(/\n## /);
    return (end < 0 ? body : body.slice(0, end)).trim();
};

/** Which tool serves which step, in the steps' own words. */
const tools = (stack: string) =>
    [
        'With this server:',
        "- The page kind: `get_page_kind` gives its width, the parts marked always and each other part's condition.",
        `- The parts: \`list_components\`, then \`get_component\` (medium '${stack}') for each part you choose; \`find_pattern\` for a need (key figures, filters, an empty state…), which says when it is the answer.`,
        '- Spacing: `get_spacing` for every box that holds content; every other value from the specs or `get_foundation`, never invented.',
        `- Before looking: \`audit_source\` on the files you wrote${stack === 'canvas' ? ", or `audit_ui` on the canvas's computed styles" : ', or `audit_ui` on a snapshot of the running page (`get_snapshot_script`)'}; apply the fixes, propose the advice, audit again until clean.`,
    ].join('\n');

export const buildScreenPrompt = definePrompt({
    name: 'build_screen',
    title: 'Build a screen',
    description:
        "Build a screen in Continuum the skill's way: name its page kind, choose a part for each piece of content, work out its spacing with the formula, audit until clean, and look at it at 1920 × 1080, 1440 × 900 and 390.",
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
            `Build ${target}, in Continuum, in ${stack}. Follow these steps in order.`,
            buildingSteps(),
            tools(stack),
        ].join('\n\n');
    },
});
