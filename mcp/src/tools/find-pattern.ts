import { z } from 'zod';
import { componentsNamedIn, findPatterns, render, sections } from '../knowledge';
import { defineTool, readOnly, ToolError, text } from '../support/tool';

/** Under this, no row is about the need: say so and hand over the recipe for a new part. */
const weak = 1;

export const findPatternTool = defineTool({
    name: 'find_pattern',
    title: 'Find pattern',
    description:
        'Find how Continuum builds a common need (a filter bar, key figures, an empty state, a list of objects, bulk selection, a wizard, a destructive action, a chat …): the best rows of patterns.md, each saying which parts it is built from, how they sit and the values that matter, with the parts named so you can call get_component on each. Call this for each need on a screen before composing it. When nothing fits well it says so and gives the recipe for building a new part from the nearest one.',
    input: {
        need: z
            .string()
            .describe(
                "The need in a few words, as a person would say it: 'filter bar', 'kpi row', 'confirm delete', 'upload files'.",
            ),
        limit: z
            .number()
            .int()
            .min(1)
            .max(8)
            .optional()
            .describe('How many rows to return. Defaults to 3.'),
    },
    annotations: readOnly,
    handle: ({ need, limit = 3 }) => {
        if (!need.trim())
            throw new ToolError(
                'need is empty. Pass the need in a few words, such as "filter bar".',
            );
        const rows = findPatterns(need, limit);
        const best = rows[0];
        const strong = best !== undefined && best.score >= weak;
        // A row far behind the best is noise when the best is a real match.
        const kept = strong ? rows.filter(row => row.score >= best.score * 0.75) : rows;
        const out = kept.map(row => {
            const parts = componentsNamedIn(row.build);
            return `**${row.need}**: ${row.build}${parts.length > 0 ? `\nParts: ${parts.join(', ')}` : ''}`;
        });
        if (!strong) {
            const recipe = sections('method.md').find(section => section.heading === 'A new part');
            out.unshift(
                best
                    ? `No row is about "${need}" (best score ${best.score}); the nearest are below. Build it from the nearest row by the recipe for a new part, or call find_pattern again in other words.`
                    : `No row is about "${need}". Compose it from the parts (list_components) by the recipe for a new part, or call find_pattern again in other words.`,
            );
            if (recipe) out.push(render(recipe));
        }
        return text(out.join('\n\n'));
    },
});
