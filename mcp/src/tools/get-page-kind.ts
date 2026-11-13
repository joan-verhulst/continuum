import { z } from 'zod';
import { pageKind, pageKinds } from '../knowledge';
import { defineTool, readOnly, ToolError, text } from '../support/tool';

export const getPageKindTool = defineTool({
    name: 'get_page_kind',
    title: 'Get page kind',
    description:
        'Get the anatomy of one kind of screen, top to bottom with its width and gaps, plus what every screen in the shell needs (the shell, the column, the page head, a section) and the standing decisions (one primary action, a breadcrumb, views in the dock, one column …), and the reference screens built to it. Call this first when building or reviewing a screen, once you have named its kind; then list_components and find_pattern for what goes in it. Kinds: overview (a dashboard), index (a list or table), detail (one record), create or edit (a form), settings, assistant (an AI chat), sign in.',
    input: {
        kind: z
            .string()
            .describe(
                "The screen's kind: 'overview', 'index', 'detail', 'create or edit', 'settings', 'assistant', 'sign in', or a common name ('dashboard', 'list', 'form', 'login', 'chat').",
            ),
    },
    annotations: readOnly,
    handle: ({ kind }) => {
        const found = pageKind(kind);
        if (!found) {
            throw new ToolError(
                `No page kind named "${kind}". The kinds are: ${pageKinds().join(', ')}. A screen that fits none is composed from the nearest one; name which and call get_page_kind with it.`,
            );
        }
        const screens =
            found.screens.length > 0
                ? `\n\n## Reference screens\n\nBuilt to this kind, in the skill's references/screens (React, but every value is in the specs): ${found.screens.join(', ')}.`
                : '';
        return text(`${found.anatomy}${screens}`);
    },
});
