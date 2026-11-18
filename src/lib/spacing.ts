/*
 * The spacing formula: padding and gaps worked out from what a box holds rather than picked, and
 * always landing on a Tailwind spacing step, never an arbitrary value. It covers boxes that hold
 * content (cards, sections, panels, sheets, list rows) and the gaps between texts; a control's
 * side padding stays fixed per kind, since its height already decides it.
 *
 * - A box of text pads by its type and its amount: k × size × (1 + α·log₂ lines), where size is
 *   the type size averaged over its lines, so one large figure does not size a whole card.
 * - A box of boxes pads at least a step past its children: r × their padding.
 * - Between alike boxes (cards in a row, a list's rows): g × their padding.
 * - Between unlike blocks (a page head and its table, a chart and a section; inside a card, a title
 *   and its list, a figure and its badge): each claims its own room, growing with what it holds,
 *   and the gap is the sum. Inside a box with a surface a block claims less (× inside) and counts
 *   only its first lines (insideLines), so a long list does not push its own title away.
 * - Between texts: t × the size of the text after the gap (type sets the space above a line in that
 *   line's own size), tight for a pair that belongs together and loose between blocks, growing with
 *   the lines either side: × (1 + β·log₂ lines).
 *
 * Kept free of imports so a script can load it on its own (the continuum-fix-padding skill runs it with Node).
 */

export type SpacingParams = {
    /** Padding per px of type. */
    k: number;
    /** How fast a box's padding grows with the lines it holds. */
    alpha: number;
    /** A box of boxes pads at least this times its children's padding. */
    nesting: number;
    /** The gap between boxes, as a share of their padding. */
    gapRatio: number;
    /** The gap within a pair (a header and subheader, a label and value, a figure and caption). */
    tight: number;
    /** The gap between blocks of text. */
    loose: number;
    /** How fast a gap between texts grows with the lines either side of it. */
    beta: number;
    /** The room a free-standing block claims, per px of its type. */
    room: number;
    /** How fast that room grows with the lines and rows the block holds. */
    roomGrowth: number;
    /** The share of its room a block claims inside a box with a surface (a card), beside an unlike block. */
    inside: number;
    /** The most lines a block counts toward its room inside a box with a surface. */
    insideLines: number;
    /** No padding past this, in px. */
    cap: number;
};

/** The balance judged on a billing screen in the spacing lab, 4 Nov 2026. */
export const spacingDefaults: SpacingParams = {
    k: 0.75,
    alpha: 0.6,
    nesting: 1.5,
    gapRatio: 1.1,
    tight: 0.25,
    loose: 1.5,
    beta: 0.6,
    /* Fitted 16 Nov 2026 to Joan's anchors: a page head over a dense table about 64, over ten rows
       about 56, a bare title over a short settings card about 32. */
    room: 0.375,
    roomGrowth: 1.85,
    /* Fitted 17 Nov 2026 to the cards Continuum draws by eye (a stat card's badge 12 under its
       figure, a card's title 16 over its list): off by about 1px on average across them. */
    inside: 0.6,
    insideLines: 3,
    cap: 48,
};

/**
 * The Tailwind steps a result may land on, in units of `--spacing` (4px): half steps to 4, then
 * whole steps, then wider ones, as Tailwind's own scale runs.
 */
export const spacingSteps = [
    0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24,
] as const;

export type SpacingStep = (typeof spacingSteps)[number];

const unit = 4;

/** The nearest Tailwind step to a length in px. */
export const toSpacingStep = (px: number): SpacingStep => {
    let best: SpacingStep = 0;
    for (const step of spacingSteps) {
        if (Math.abs(step * unit - px) < Math.abs(best * unit - px)) best = step;
    }
    return best;
};

/** A length in px, snapped to the scale and written as a class: `spacingClass('p', 22)` is `p-5`. */
export const spacingClass = (prefix: string, px: number) => `${prefix}-${toSpacingStep(px)}`;

/** A length in px snapped to the scale, still in px. */
export const snapToSpacing = (px: number) => toSpacingStep(px) * unit;

export type TypeRun = {
    /** Font size in px. */
    size: number;
    /** Rendered lines; measure them where you can, about eight words of body text to a line otherwise. */
    lines: number;
};

/** About eight words of body text to a line, for when the lines cannot be measured. */
export const estimateLines = (text: string) =>
    Math.max(1, text.trim().split(/\s+/).filter(Boolean).length / 8);

/** A box's type size: averaged over its lines, so a large figure among small lines does not set it. */
export const typeSize = (runs: readonly TypeRun[]) => {
    const total = runs.reduce((sum, run) => sum + run.lines, 0);
    return total > 0 ? runs.reduce((sum, run) => sum + run.size * run.lines, 0) / total : 0;
};

export type InnerBox = {
    /** The inner box's padding in px; for a group with no surface, its children's. */
    padding: number;
    /** The inner box's type size, which counts as one line of this box's content. */
    size: number;
};

/**
 * A box's padding in px, unsnapped: from its own text and the boxes inside it (each one line of
 * content at its own type size), and at least a step past those boxes' padding.
 */
export const boxPadding = (
    { runs, children = [] }: { runs: readonly TypeRun[]; children?: readonly InnerBox[] },
    params: SpacingParams = spacingDefaults,
) => {
    const all = [...runs, ...children.map(child => ({ size: child.size, lines: 1 }))];
    const amount = all.reduce((sum, run) => sum + run.lines, 0);
    const fromContent =
        params.k * typeSize(all) * (1 + params.alpha * Math.log2(Math.max(1, amount)));
    const fromChildren = Math.max(0, ...children.map(child => child.padding)) * params.nesting;
    return Math.min(Math.max(fromContent, fromChildren), params.cap);
};

/** The gap between alike sibling boxes (cards in a row, a list's rows) in px, unsnapped, from their padding. */
export const boxGap = (children: readonly number[], params: SpacingParams = spacingDefaults) =>
    Math.max(0, ...children) * params.gapRatio;

/**
 * The room a free-standing block claims on the side facing another block, in px, unsnapped, from
 * what it holds (its texts, and each box inside it as one line at its own size), whether or not it
 * has a surface: room × size × (1 + growth·log₂ lines). It grows faster with amount than padding
 * does, so a dense table claims far more than a short card: a page head of a title and a line about
 * 20, a table of twenty rows about 44, a short settings card about 12.
 */
export const blockRoom = (
    { runs, children = [] }: { runs: readonly TypeRun[]; children?: readonly InnerBox[] },
    params: SpacingParams = spacingDefaults,
) => {
    const all = [...runs, ...children.map(child => ({ size: child.size, lines: 1 }))];
    const lines = all.reduce((sum, run) => sum + run.lines, 0);
    return params.room * typeSize(all) * (1 + params.roomGrowth * Math.log2(Math.max(1, lines)));
};

/**
 * The room a block claims beside an unlike block inside a box with a surface (a card's title over
 * its list, a figure over its badge), in px, unsnapped: the free-standing room, scaled by `inside`
 * and counting at most `insideLines` lines, since inside a card both blocks are seen together and a
 * list's length should not push its own title away. A stat card's figure over its badge lands on 12,
 * a card's title over its list near 14.
 */
export const insideRoom = ({ size, lines }: TypeRun, params: SpacingParams = spacingDefaults) =>
    params.inside *
    blockRoom({ runs: [{ size, lines: Math.min(lines, params.insideLines) }] }, params);

/**
 * The gap between two unlike blocks (a page head and its table, a chart and the section under it;
 * inside a card, each with its insideRoom), in px, unsnapped: each brings its own room, so the gap is
 * the sum, and it grows with how much either side holds. A page head over a dense table lands near
 * 64; a bare title over a short card near 32.
 */
export const blockGap = (before: number, after: number) => before + after;

/**
 * The gap between two texts in px, unsnapped: sized by the text after it, tight within a pair and
 * loose between blocks, and wider the more lines sit either side.
 */
export const textGap = (
    { before, after, pair }: { before: TypeRun; after: TypeRun; pair: boolean },
    params: SpacingParams = spacingDefaults,
) => {
    const around = before.lines + after.lines - 1;
    return (
        after.size *
        (pair ? params.tight : params.loose) *
        (1 + params.beta * Math.log2(Math.max(1, around)))
    );
};
