/*
 * A chart holds no colour of its own: it names one, and the name is a token the theme
 * sets. That is what makes every chart follow the theme builder, light and dark, with
 * nothing read from script and no hex anywhere in the kit.
 */

/** How many colours a theme gives before a chart has to say "the rest". */
export const CHART_COLORS = 5;

export type ChartColor =
    /** Independent series, by position. */
    | 'series-1'
    | 'series-2'
    | 'series-3'
    | 'series-4'
    | 'series-5'
    /** Steps in order: a funnel, shades of one measure. */
    | 'chart-1'
    | 'chart-2'
    | 'chart-3'
    | 'chart-4'
    | 'chart-5'
    /** A tone, where the measure itself is good or bad. */
    | 'success'
    | 'warning'
    | 'error'
    | 'neutral'
    /** Anything else is taken as a CSS colour and used as given. */
    | (string & {});

const tones: Record<string, string> = {
    success: 'var(--color-success-500)',
    warning: 'var(--color-warning-500)',
    error: 'var(--color-error-500)',
    neutral: 'var(--color-neutral-400)',
};

/** A name turned into the token it stands for; anything else passes through as CSS. */
export const chartColor = (color: ChartColor = 'series-1') => {
    if (color in tones) return tones[color] as string;
    if (/^series-[1-5]$/.test(color)) return `var(--color-chart-${color})`;
    if (/^chart-[1-5]$/.test(color)) return `var(--color-${color})`;
    return color;
};

let warned = false;

/**
 * The colour of series `index`. A theme gives five that a reader can tell apart, so a
 * sixth series is drawn grey rather than starting the set again: two series in one
 * colour is worse than one series without one.
 */
export const seriesColor = (index: number): string => {
    if (index < CHART_COLORS) return chartColor(`series-${index + 1}`);
    if (!warned) {
        warned = true;
        console.warn(
            `Continuum charts: a theme has ${CHART_COLORS} series colours and this chart has more series than that. The rest are drawn grey. Group the small ones into "Other", or show them as several charts.`,
        );
    }
    return chartColor('neutral');
};

/**
 * The colour of step `index` of something read in order, such as a funnel. Past the five
 * the set walks again from the second, so two steps beside each other never match.
 */
export const stepColor = (index: number): string =>
    chartColor(`chart-${(index < CHART_COLORS ? index : 1 + (index % (CHART_COLORS - 1))) + 1}`);

/** Shades of one colour, for parts of a single measure: a share, a device, a plan. */
const SHADES = [100, 80, 60, 45, 33] as const;

export const shadeColor = (color: ChartColor, index: number) => {
    const share = SHADES[index] ?? SHADES.at(-1) ?? 33;
    const base = chartColor(color);
    return share === 100 ? base : `color-mix(in oklab, ${base} ${share}%, transparent)`;
};

/** How loud a cell of a heatmap is: nothing, then four steps of the first chart colour. */
const LEVELS = [20, 40, 70, 100] as const;

/** `level` 0 is no value at all; 1 to 4 climb. */
export const intensityColor = (level: number) => {
    if (level <= 0) return 'var(--color-neutral-200)';
    const share = LEVELS[Math.min(level, LEVELS.length) - 1] ?? 100;
    const base = chartColor('chart-1');
    return share === 100 ? base : `color-mix(in oklab, ${base} ${share}%, transparent)`;
};

/** Which of the four levels a value sits at, measured against the busiest. */
export const intensityLevel = (value: number, max: number) => {
    if (!(value > 0) || !(max > 0)) return 0;
    const share = value / max;
    if (share > 0.75) return 4;
    if (share > 0.5) return 3;
    if (share > 0.25) return 2;
    return 1;
};
