import {
    blockGap,
    blockRoom,
    boxGap,
    boxPadding,
    estimateLines,
    insideRoom,
    spacingDefaults,
    spacingSteps,
    type TypeRun,
    textGap,
    typeSize,
} from '@contui/ui';
import { z } from 'zod';
import { defineTool, readOnly, structured, ToolError } from '../support/tool';

/*
 * The spacing formula (src/lib/spacing.ts) as a tool: padding and gaps worked out from what a box
 * holds, snapped to a Tailwind step in the theme's own unit. The library snaps at 4px; a theme
 * with another unit snaps to the same steps of its unit, as its classes do.
 */

const run = z.object({
    size: z.number().positive().describe('Font size in px: 13 for text-xs, 24 for text-2xl.'),
    lines: z
        .number()
        .positive()
        .optional()
        .describe('Rendered lines, measured where you can. Give this or text.'),
    text: z
        .string()
        .optional()
        .describe(
            'The text itself, when the lines cannot be measured: about eight words to a line.',
        ),
});

const child = z.object({
    padding: z
        .number()
        .min(0)
        .describe("The inner box's padding in px; for a group with no surface, its children's."),
    size: z
        .number()
        .positive()
        .optional()
        .describe(
            "The inner box's type size in px (needed for box 'boxes'): it counts as one line here.",
        ),
});

const linesOf = (item: z.infer<typeof run>, index: number): TypeRun => {
    const lines = item.lines ?? (item.text ? estimateLines(item.text) : undefined);
    if (lines === undefined) {
        throw new ToolError(
            `runs[${index}] needs lines or text. Give the measured lines, or the text to estimate them from.`,
        );
    }
    return { size: item.size, lines };
};

/** The nearest step on Tailwind's scale, in units of the theme's spacing unit. */
const snap = (px: number, unit: number) =>
    spacingSteps.reduce<number>(
        (best, step) => (Math.abs(step * unit - px) < Math.abs(best * unit - px) ? step : best),
        0,
    );

const one = (value: number) => Number(value.toFixed(1));
const log = (lines: number) => `log₂ ${one(lines)}`;

export const getSpacingTool = defineTool({
    name: 'get_spacing',
    title: 'Get spacing',
    description:
        "Works out one padding or gap with Continuum's spacing formula and snaps it to a Tailwind step: returns { px, step, tailwind ('p-4', 'gap-3'), css ('16px'), working (the formula with its numbers) }. Call it for the padding of a box that holds content (a card, a section, a sheet or dialog body, a list row, an empty state) and the gaps inside it, working from the innermost box out. Never for a control's side padding (a button, input, chip, tab, nav or menu row): that is fixed per kind, see get_foundation spacing. A group with no border or fill gets no padding, only gaps.",
    input: {
        box: z
            .enum(['text', 'boxes', 'gap-between-boxes', 'gap-between-blocks', 'gap-between-texts'])
            .describe(
                "What to work out: 'text' the padding of a box holding text (runs); 'boxes' the padding of a box holding boxes (children, and runs for any text of its own); 'gap-between-boxes' the gap between alike sibling boxes, cards in a row or a list's items (children's padding); 'gap-between-blocks' the gap between two unlike blocks, standing free (a page head and its table, a chart and the section under it) or inside a card with inside: true (a title over its list, a figure over its badge) (blocks: each claims room by what it holds, and the gap is the sum; never 'gap-between-boxes' for unlike blocks); 'gap-between-texts' the gap between two texts (runs: [before, after], and pair).",
            ),
        runs: z
            .array(run)
            .optional()
            .describe(
                "The box's texts, one entry per run of one size: [{ size: 13, lines: 2 }]. For 'gap-between-texts', exactly two: the text before the gap and the text after it.",
            ),
        children: z
            .array(child)
            .optional()
            .describe("The boxes inside, each with its padding (and size, for 'boxes')."),
        blocks: z
            .array(
                z.object({
                    runs: z.array(run).optional().describe('The texts the block holds.'),
                    children: z
                        .array(z.object({ size: z.number().positive() }))
                        .optional()
                        .describe(
                            "The boxes the block holds (a table's rows, a list's items), each one line at its type size.",
                        ),
                }),
            )
            .optional()
            .describe(
                "For 'gap-between-blocks', exactly two: the block before the gap and the block after it, each by what it holds: [{ runs: [{ size: 24, lines: 1 }, { size: 13, lines: 1 }] }, { children: [{ size: 13 }, … one per row] }].",
            ),
        pair: z
            .enum(['tight', 'loose'])
            .optional()
            .describe(
                "For 'gap-between-texts': 'tight' for two texts that belong together (a title and its subtitle, a label and its value, a figure and its caption), 'loose' between blocks.",
            ),
        inside: z
            .boolean()
            .optional()
            .describe(
                "For 'gap-between-blocks': true when the two blocks sit inside a box with a surface (a card): each then claims 0.6× its room and counts at most its first three lines, so a long list does not push its own title away.",
            ),
        unit: z
            .number()
            .int()
            .min(2)
            .max(8)
            .optional()
            .describe(
                "The theme's spacing unit in px (its --spacing): 4 unless the theme says otherwise.",
            ),
    },
    annotations: readOnly,
    handle: ({ box, runs = [], children = [], blocks = [], pair, inside = false, unit = 4 }) => {
        const params = spacingDefaults;
        const texts = runs.map(linesOf);
        let px: number;
        let working: string;
        let prefix = 'p';

        if (box === 'text') {
            if (!texts.length)
                throw new ToolError(
                    "box 'text' needs runs: [{ size, lines }] for each run of text.",
                );
            const size = typeSize(texts);
            const lines = texts.reduce((sum, item) => sum + item.lines, 0);
            px = boxPadding({ runs: texts }, params);
            working = `${params.k} × ${one(size)}px × (1 + ${params.alpha}·${log(lines)}) = ${one(px)}px`;
        } else if (box === 'boxes') {
            if (!children.length)
                throw new ToolError(
                    "box 'boxes' needs children: [{ padding, size }] for each box inside.",
                );
            const inner = children.map((item, index) => {
                if (item.size === undefined) {
                    throw new ToolError(
                        `children[${index}] needs size (its type size in px) for box 'boxes'.`,
                    );
                }
                return { padding: item.padding, size: item.size };
            });
            const all = [...texts, ...inner.map(item => ({ size: item.size, lines: 1 }))];
            const size = typeSize(all);
            const lines = all.reduce((sum, item) => sum + item.lines, 0);
            const content = params.k * size * (1 + params.alpha * Math.log2(Math.max(1, lines)));
            const deepest = Math.max(...inner.map(item => item.padding));
            px = boxPadding({ runs: texts, children: inner }, params);
            working = `max(${params.k} × ${one(size)}px × (1 + ${params.alpha}·${log(lines)}) = ${one(content)}, ${params.nesting} × ${deepest} = ${one(deepest * params.nesting)}) = ${one(px)}px`;
        } else if (box === 'gap-between-boxes') {
            if (!children.length)
                throw new ToolError(
                    "box 'gap-between-boxes' needs children: [{ padding }] for the sibling boxes.",
                );
            const paddings = children.map(item => item.padding);
            const deepest = Math.max(...paddings);
            px = boxGap(paddings, params);
            prefix = 'gap';
            working = `${params.gapRatio} × ${deepest}px (the fullest sibling's padding) = ${one(px)}px`;
        } else if (box === 'gap-between-blocks') {
            if (blocks.length !== 2) {
                throw new ToolError(
                    "box 'gap-between-blocks' needs exactly two blocks: the one before the gap, then the one after it, each with its runs and children.",
                );
            }
            const rooms = blocks.map(block => {
                const own = (block.runs ?? []).map(linesOf);
                const inner = (block.children ?? []).map(item => ({ padding: 0, size: item.size }));
                if (!own.length && !inner.length) {
                    throw new ToolError('Each block needs runs or children: what it holds.');
                }
                const all = [...own, ...inner.map(item => ({ size: item.size, lines: 1 }))];
                const lines = all.reduce((sum, item) => sum + item.lines, 0);
                if (inside) {
                    const counted = Math.min(lines, params.insideLines);
                    const room = insideRoom({ size: typeSize(all), lines }, params);
                    return {
                        room,
                        text: `${params.inside} × ${params.room} × ${one(typeSize(all))}px × (1 + ${params.roomGrowth}·${log(counted)}) = ${one(room)}`,
                    };
                }
                const room = blockRoom({ runs: own, children: inner }, params);
                return {
                    room,
                    text: `${params.room} × ${one(typeSize(all))}px × (1 + ${params.roomGrowth}·${log(lines)}) = ${one(room)}`,
                };
            });
            const before = rooms[0];
            const after = rooms[1];
            if (!before || !after) throw new ToolError('Two blocks are needed.');
            px = blockGap(before.room, after.room);
            prefix = 'gap';
            working = `each block claims its own room${inside ? ' (inside a card: a share of it, its first lines)' : ''}, before: ${before.text}; after: ${after.text}; the gap is the sum = ${one(px)}px`;
        } else {
            const [before, after] = texts;
            if (texts.length !== 2 || !before || !after) {
                throw new ToolError(
                    "box 'gap-between-texts' needs exactly two runs: the text before the gap, then the text after it.",
                );
            }
            if (!pair)
                throw new ToolError(
                    "box 'gap-between-texts' needs pair: 'tight' for two texts that belong together, 'loose' between blocks.",
                );
            const ratio = pair === 'tight' ? params.tight : params.loose;
            const around = before.lines + after.lines - 1;
            px = textGap({ before, after, pair: pair === 'tight' }, params);
            prefix = 'gap';
            working = `${after.size}px (the text after) × ${ratio} × (1 + ${params.beta}·${log(around)}) = ${one(px)}px`;
        }

        const capped = prefix === 'p' && px >= params.cap ? ` (capped at ${params.cap}px)` : '';
        const step = snap(px, unit);
        const snapped = step * unit;
        return structured({
            px: snapped,
            step,
            tailwind: `${prefix}-${step}`,
            css: `${snapped}px`,
            working: `${working}${capped} → ${prefix}-${step} (${snapped}px at a ${unit}px unit)`,
        });
    },
});
