import { z } from 'zod';
import {
    componentsNamedIn,
    findPatterns,
    pageKind,
    pageKinds,
    sections,
    skill,
} from '../knowledge';
import { defineTool, readOnly, text } from '../support/tool';

/*
 * The plan a screen gets before any code: what a reader needs first, its kind and width, its
 * content in one column top to bottom, its groups, whether it has a side panel, which lists grow,
 * how its sections are titled, and the part for each item. The server fills in what it can look
 * up (the kind's anatomy, the pattern row for each item); the decisions are the agent's, written
 * down, so the composition is chosen before the parts are placed. The rules it quotes stay in
 * pages.md; nothing here restates them.
 */

/** The kind a screen's description names, by the words people use for it. */
const kindWords: [RegExp, string][] = [
    // First: a screen that is the work names its settings, its items and its records too ("the settings of the
    // selected step"), and is never a settings page, a form or a list for it.
    [
        /\b(canvas|builder|editor|board|kanban|planner|schedule|calendar|map|timeline|spreadsheet|grid of|designer|player|studio|workflow|diagram|floor ?plan)\b/,
        'the work',
    ],
    [/\b(sign ?in|log ?in|login|sign ?up|register)\b/, 'sign in'],
    [/\b(settings?|preferences)\b/, 'settings'],
    [/\b(chat|assistant|copilot|conversation)\b/, 'assistant'],
    [/\b(new|create|edit|add|form|compose)\b/, 'create or edit'],
    [/\b(dashboard|overview|home|analytics|metrics|report)\b/, 'overview'],
    [/\b(list|index|table|all|inbox|queue|directory|catalog(ue)?)\b/, 'index'],
    // A description of one thing ("a customer in the CRM", "one order") is that thing's detail.
    [/\b(detail|record|profile)\b|^\s*(a|an|one|the)\s/, 'detail'],
];

const guessKind = (screen: string) => {
    const lower = screen.toLowerCase();
    return kindWords.find(([pattern]) => pattern.test(lower))?.[1];
};

/** SKILL.md's step 5, the order the groups are placed in, as written: quoted, never restated here. */
const placeStep = () => {
    const from = skill.indexOf('5. **Place the groups**');
    const to = skill.indexOf('\n6. **', from);
    return from < 0
        ? ''
        : skill
              .slice(from, to < 0 ? undefined : to)
              .replace(/^5\. /, '')
              .trim();
};

/** method.md's section on a screen that is the work, its bullets as written. */
const workSection = () =>
    sections('method.md')
        .find(each => each.heading === 'When the screen is the work')
        ?.body.trim() ?? '';

/** A rule as pages.md states it: a level-2 section's lead paragraph or a bullet that starts with `lead`. */
const quote = (heading: string, lead?: string) => {
    const body = sections('pages.md').find(each => each.heading === heading)?.body ?? '';
    const blocks = body.split(/\n(?=- )|\n\n/).map(each => each.replace(/\s+/g, ' ').trim());
    const found = lead ? blocks.find(each => each.includes(lead)) : blocks[0];
    return (found ?? '').replace(/^- /, '');
};

export const planScreenTool = defineTool({
    name: 'plan_screen',
    title: 'Plan a screen',
    description:
        'Plan a screen before writing any of it: give what it is for and the content it holds, and get its likely page kind with the anatomy and width (or, when the screen is the work, such as an editor, a canvas, a board or a map, how the work fills the panel), the pattern and parts for each item of content, and the plan to write out first: what a reader needs to know first, the order (one column on a page), the groups, whether a side panel is earned, which lists can grow, how sections are titled. Call it first when building a screen, write the plan down, then build it from get_component and audit the rendered page with audit_ui.',
    input: {
        screen: z
            .string()
            .describe(
                "What the screen is for, in a sentence: 'a customer in the CRM, for the account manager', 'this month's sales, for the shop's owner'.",
            ),
        content: z
            .array(z.string())
            .optional()
            .describe(
                "The content as given, one item each: 'revenue this month', 'orders over time', 'the latest orders', 'the team on the account'. Leave empty when the request does not say; the plan then starts by listing it.",
            ),
        kind: z
            .string()
            .optional()
            .describe(
                "The page kind when you know it ('overview', 'index', 'detail', 'create or edit', 'settings', 'assistant', 'sign in'), or 'the work' when the screen is where the work happens (an editor, a canvas, a board, a planner, a map, a player) rather than a page of records. Empty to have it read from the screen.",
            ),
    },
    annotations: readOnly,
    handle: ({ screen, content = [], kind }) => {
        const named = kind?.trim() || guessKind(screen);
        const work = named !== undefined && /\bwork\b/i.test(named);
        const found = named && !work ? pageKind(named) : undefined;
        const out: string[] = [
            `# Plan: ${screen.trim()}`,
            'When the continuum-taste skill is installed and not yet loaded, load it now: this plan quotes it, and its full text (pages.md, patterns.md, method.md) decides what the plan leaves open.',
        ];

        out.push(
            work
                ? `## The screen is the work${kind?.trim() ? '' : ' (read from the description: name a page kind instead if it is a page of records)'}\n\nIt has no page kind and no page anatomy. As method.md states it:\n\n${workSection()}`
                : found
                  ? `## Kind: ${found.kind}${kind?.trim() ? '' : ' (read from the description: change it if the screen is for something else)'}\n\nIts anatomy, top to bottom, follows; the plan below keeps its order and width unless the content asks otherwise.\n\n${found.anatomy.split('\n\n## ')[0]}`
                  : `## Kind: not named\n\nName it from what the screen is for: ${pageKinds().join(', ')}. When the screen is the work (an editor, a player, a canvas) it has no page kind: its layout is the genre's, its parts Continuum's. Then call get_page_kind with it.`,
        );

        if (content.length > 0) {
            const rows = content.map(item => {
                const best = findPatterns(item, 1)[0];
                if (!best || best.score < 1)
                    return `- **${item}**: no pattern row; choose from list_components by its when, or find_pattern in other words.`;
                const parts = componentsNamedIn(best.build);
                return `- **${item}** → ${best.need}${parts.length > 0 ? ` (${parts.join(', ')})` : ''}`;
            });
            out.push(
                `## The content and its parts\n\nThe nearest pattern row for each item; read the row with find_pattern and each part with get_component, and keep the row only when its when fits.\n\n${rows.join('\n')}`,
            );
        }

        out.push(
            [
                '## Write this plan out before any code',
                '',
                `1. **First:** what a reader opening this screen needs to know first, and what they act on. ${content.length > 0 ? 'Check every item above is on it, and nothing else.' : 'This list is the content: every item on it reaches the screen.'}`,
                work
                    ? '2. **No page anatomy:** the breadcrumb names what is open; the work is laid out by point 5, from what it holds.'
                    : '2. **Kind and width:** the kind above and its column; the narrowest that holds the content.',
                work
                    ? "3. **The work itself:** its own layout, the way the best apps of its genre lay it out (or the reference given), drawn with the library's parts."
                    : '3. **Order, in one column:** the page head, then each block in the order the reader needs it (key figures before the chart that explains them). Nothing side by side: what stays in view beside the work goes in the side panel, the rest under it.',
                '4. **Groups:** which items are read or acted on together, as a tree; each level gets one mark (a container, a hairline, an eyebrow or a title).',
                `5. **Place the groups.** As the skill states it (SKILL.md, Building something, step 5):\n\n${placeStep()}`,
                '6. **Lists that can grow:** for each list on a page about something else, about 10 rows, the count in its head, and where "View all" leads (find_pattern "a list that can grow").',
                `7. **Section titles:** ${quote('A section', 'One way per page')}`,
                '8. **Parts:** the part for each item, its variant and size for its spot.',
                '',
                'Then build it, run it, and audit the rendered page: get_snapshot_script in the browser, its result to audit_ui. The composition advice (one-column, figures-first, end-level, section-titles, long-list, page-width) is checked there, against this plan.',
            ].join('\n'),
        );
        return text(out.join('\n\n'));
    },
});
