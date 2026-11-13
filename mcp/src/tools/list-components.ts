import { z } from 'zod';
import { listComponents } from '../knowledge';
import { defineTool, readOnly, structured, ToolError } from '../support/tool';

export const listComponentsTool = defineTool({
    name: 'list_components',
    title: 'List components',
    description:
        "List every part of Continuum by group (App frame, Navigation, Actions, Inputs, Forms and settings, Filtering, Overlays, Content, Labels and identity, Status, Messages, AI, Charts), each with what it is for in one sentence. Call this first when composing a screen, to see the parts before drawing or writing any; then get_component for each part you use. Names joined by ' · ' are one entry (a part and its pieces).",
    input: {
        group: z
            .string()
            .optional()
            .describe(
                "Only this group, by name or the start of it: 'Inputs', 'overlays', 'ai'. Leave empty for all.",
            ),
    },
    annotations: readOnly,
    handle: ({ group }) => {
        const all = listComponents();
        const names = [...new Set(all.map(each => each.group))];
        const wanted = group?.trim().toLowerCase();
        const picked = wanted ? names.filter(name => name.toLowerCase().startsWith(wanted)) : names;
        if (picked.length === 0) {
            throw new ToolError(
                `No group named "${group}". The groups are: ${names.join(', ')}. Or leave group empty for all.`,
            );
        }
        return structured({
            groups: picked.map(name => ({
                group: name,
                components: all
                    .filter(each => each.group === name)
                    .map(({ name, summary }) => ({ name, summary })),
            })),
        });
    },
});
