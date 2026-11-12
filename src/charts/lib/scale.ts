/*
 * Where a value sits in a plot, and the round numbers an axis counts in. This is
 * the whole of the maths a cartesian chart needs: no d3, no scale objects, just
 * the two functions a chart calls and the ticks it labels.
 */

/** The steps an axis may count in: 1, 2, 2.5 and 5 at every power of ten. */
const STEPS = [1, 2, 2.5, 5, 10] as const;

/** The smallest step of that family at or above `rough`. */
export const niceStep = (rough: number) => {
    if (!(rough > 0) || !Number.isFinite(rough)) return 1;
    const power = 10 ** Math.floor(Math.log10(rough));
    // The float that comes out of a log is never exact, so a step lands on its own value.
    const factor = STEPS.find(step => step * power >= rough - 1e-9) ?? 10;
    return factor * power;
};

export type Ticks = {
    /** Every rule the plot draws and labels, lowest first. */
    values: number[];
    /** The domain the plot draws, which the data fills. */
    min: number;
    max: number;
};

/** A peak is given this much air above it, so the line never grazes the chart's top edge. */
const HEADROOM = 0.08;

/**
 * The domain a measure is drawn in, and the round numbers ruled across it.
 *
 * The data sets the domain — the top is the largest value and a little air — and the rules
 * land on round numbers inside it. Letting the ticks set the domain instead is what leaves
 * a chart of 6,300 counting up to 8,000 with a quarter of its height empty; here the top
 * rule is 6,000 and the peak sits just above it, where the eye can still read it off.
 *
 * `cap` is a ceiling the measure cannot pass, such as 100 for a rate: then it is the top,
 * air and all, because headroom above a full bar would be a lie.
 */
export const niceTicks = (dataMin: number, dataMax: number, count = 4, cap?: number): Ticks => {
    // A measure is read against zero unless it goes below it.
    const low = Math.min(0, dataMin);
    let high = Math.max(0, dataMax);
    // Nothing to tell apart (every value zero, or one value): count in ones from zero.
    if (high - low < 1e-12) high = low + count;
    else high = high + (high - low) * HEADROOM;
    if (cap !== undefined && Number.isFinite(cap)) high = Math.min(high, cap);

    const step = niceStep((high - low) / count);
    const first = Math.ceil(low / step) * step;

    const values: number[] = [];
    // Counting by multiples of the step, rather than adding it, keeps 0.1 + 0.2 out of the labels.
    for (let i = 0; first + i * step <= high + step * 1e-9; i++) values.push(first + i * step);
    // A domain too shallow for a single rule still gets its floor, so the plot is not bare.
    if (!values.length) values.push(low);
    return { values, min: low, max: high };
};

/** Where a value sits across a plot's height: the domain's top at the top of the plot. */
export const scaleY = (value: number, { min, max }: Pick<Ticks, 'min' | 'max'>, height: number) =>
    max === min ? height : height - ((value - min) / (max - min)) * height;

/**
 * Where point `index` of `count` sits across a plot's width. A line reaches both edges,
 * so its first and last points sit on them; with one point it sits in the middle.
 */
export const scalePoint = (index: number, count: number, width: number) =>
    count > 1 ? (index / (count - 1)) * width : width / 2;

/**
 * A slot per row, each the same width, with the row's marks drawn inside it. Bars count in
 * slots rather than points, so the first and last bar keep half a slot of air at the edges.
 */
export const slotScale = (count: number, width: number) => {
    const slot = count > 0 ? width / count : width;
    return { slot, center: (index: number) => slot * (index + 0.5) };
};

/** The smallest and largest of the numbers, ignoring the gaps. */
export const extent = (values: readonly (number | null | undefined)[]) => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const value of values) {
        if (value == null || !Number.isFinite(value)) continue;
        if (value < min) min = value;
        if (value > max) max = value;
    }
    return Number.isFinite(min) ? { min, max } : { min: 0, max: 0 };
};
