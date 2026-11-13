import { z } from 'zod';
import { foundation, foundationTopics } from '../knowledge';
import { defineTool, readOnly, ToolError, text } from '../support/tool';

export const getFoundationTool = defineTool({
    name: 'get_foundation',
    title: 'Get foundation',
    description:
        "Get the values and rules of one topic of Continuum's foundations, in units: colour (ramps, roles, the action colour, washes, status, focus, shadows, data colours), type (family, scale, weight), surfaces and depth, radius, spacing (fixed side padding, derived padding, the page's rhythm), heights, icons, states, motion, layout, narrow screens, touch, fixed widths. Call this when a value is in doubt or a part needs one its spec does not state; get_component already carries a part's own values.",
    input: {
        topic: z
            .string()
            .describe(
                "The topic: 'colour', 'type', 'radius', 'spacing', 'heights', 'states', 'motion', 'narrow screens' … or a common word for it ('corners', 'padding', 'font', 'shadow').",
            ),
    },
    annotations: readOnly,
    handle: ({ topic }) => {
        const found = foundation(topic);
        if (!found) {
            throw new ToolError(
                `No foundation topic named "${topic}". The topics are: ${foundationTopics().join(', ')}.`,
            );
        }
        return text(found);
    },
});
