import {
    apcaContrast,
    checkSeries,
    hexToOklch,
    neutralShape,
    type Oklch,
    oklchToHex,
    parseHex,
    type RampShape,
    type SeriesCheck,
    seriesThresholds,
    type ThemeMode,
    type ThemeOptions,
    themeAccentCurves,
    themeAccentRamp,
    themeNeutralCurves,
    themeNeutralRamp,
    toHex,
    wcagContrast,
} from 'continuum';
import { themeToken } from '../theme-export';

/*
 * How a project's theme reads, measured on the values it writes: each token followed through the
 * cascade (the theme laid over the default tokens) to the colour an element is painted with. The
 * pairs are the roles foundations names: which step is text, which the surface, which the hairline.
 *
 * A pair is measured as WCAG 2 measures contrast, and held to the system's own level for the kind
 * of thing it is (see `levels`): text that is read to 4.5:1, a label or a hint to 3:1, a shape to
 * what makes it visible. APCA is given beside it, in a mark's tooltip, as a second reading.
 */

/** A token's colour and how opaque it is; a translucent wash is laid over what it sits on. */
export type Paint = { color: Oklch; alpha: number };

const number = (text: string) =>
    text.endsWith('%') ? Number.parseFloat(text) / 100 : Number.parseFloat(text);

/** Reads the colour forms the tokens are written in: hex, oklch(), a colour mixed with transparent. */
export const parseColor = (value: string | undefined): Paint | null => {
    if (!value) return null;
    const text = value.trim();
    if (text === 'transparent') return { color: { l: 0, c: 0, h: 0 }, alpha: 0 };
    if (text.startsWith('#')) {
        const color = hexToOklch(text);
        return color ? { color, alpha: 1 } : null;
    }
    const oklch =
        /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i.exec(
            text,
        );
    if (oklch) {
        const [, l = '0', c = '0', h = '0', a] = oklch;
        // A percentage chroma is a share of 0.4, as CSS Color 4 reads it.
        const chroma = c.endsWith('%') ? (Number.parseFloat(c) / 100) * 0.4 : Number(c);
        return {
            color: { l: number(l), c: chroma, h: Number(h) },
            alpha: a === undefined ? 1 : number(a),
        };
    }
    const mix = /^color-mix\(in oklab,\s*(.+)\s+([\d.]+)%,\s*transparent\)$/i.exec(text);
    if (mix) {
        const inner = parseColor(mix[1]);
        return inner ? { color: inner.color, alpha: inner.alpha * (Number(mix[2]) / 100) } : null;
    }
    return null;
};

/** A paint laid over an opaque colour, blended as a browser blends it, in sRGB. */
export const over = (top: Paint, below: Oklch): Oklch => {
    if (top.alpha >= 1) return top.color;
    const a = parseHex(oklchToHex(top.color)) ?? [0, 0, 0];
    const b = parseHex(oklchToHex(below)) ?? [1, 1, 1];
    const mixed = a.map((channel, i) => channel * top.alpha + (b[i] ?? 0) * (1 - top.alpha)) as [
        number,
        number,
        number,
    ];
    return hexToOklch(toHex(mixed)) ?? below;
};

export type Group = 'text' | 'controls';

/**
 * What a pair is, and the least contrast the system holds it to. These are the system's own
 * levels, not a standard's: they are set where the system itself draws each kind of thing, so a
 * theme is told when it has moved one out of sight, not when the system's own look falls short of
 * WCAG's strictest reading.
 *
 * - `text` is read: 4.5:1, which is WCAG's AA for body text.
 * - `label` is short and placed, a hint, a helper, a badge, a delta: 3:1, WCAG's level for large text.
 * - `ring` is the focus ring, the one mark a keyboard needs: 3:1.
 * - `shape` is a control's own outline, track or fill: it has to be seen as a shape, 1.5:1. The
 *   unchecked box and the switch's track are drawn at about 2:1, and a bright brand colour as a
 *   fill sits near there too.
 */
export type Level = 'text' | 'label' | 'ring' | 'shape';

export const levels: Record<Level, number> = { text: 4.5, label: 3, ring: 3, shape: 1.5 };

const levelNames: Record<Level, string> = {
    text: 'Text',
    label: 'Label',
    ring: 'Focus ring',
    shape: 'Shape',
};

export type PairCheck = {
    id: string;
    group: Group;
    /** What the pair is, in the playground's words. */
    label: string;
    /** Where it shows. */
    use: string;
    /** The foreground: a token, or a tone's step at an opacity. */
    fg: string;
    /** The background; a translucent one sits on `under`. */
    bg: string;
    bgAlpha?: number;
    under?: string;
    /** What kind of thing it is, which sets how much contrast it is held to. */
    level: Level;
    /** The least ratio it is held to: its level's. */
    min: number;
    /** APCA's Lc for its size and use. */
    lc: number;
    /** The success criterion it falls under. */
    criterion: string;
    /** Why a miss may be acceptable, when WCAG does not require it outright. */
    advisory?: string;
};

const surface = '--color-neutral-50';
const canvas = '--color-neutral-100';

/*
 * APCA's levels by use: Lc 90 for body text and values (preferred for reading, and the only level
 * near what 13px asks), 75 for the secondary and muted text that is still read, for button labels
 * and for status text, 45 for a fine outline (a ring, a box's border), 30 for a solid shape of
 * 5.5px or more (a filled box, a track), and 15 under a line that only has to be seen.
 */

/** The pairs foundations names, with the criterion each falls under. */
export const pairChecks: PairCheck[] = [
    {
        id: 'text',
        group: 'text',
        label: 'Primary text',
        use: 'Titles, values, the active nav item',
        fg: '--color-neutral-950',
        bg: surface,
        level: 'text',
        min: levels.text,
        lc: 90,
        criterion: '1.4.3',
    },
    {
        id: 'text-canvas',
        group: 'text',
        label: 'Primary text on the canvas',
        use: 'A page title on the canvas, a table header',
        fg: '--color-neutral-950',
        bg: canvas,
        level: 'text',
        min: levels.text,
        lc: 90,
        criterion: '1.4.3',
    },
    {
        id: 'cell',
        group: 'text',
        label: 'Cell and field values',
        use: 'A table cell, an input’s value',
        fg: '--color-neutral-900',
        bg: surface,
        level: 'text',
        min: levels.text,
        lc: 90,
        criterion: '1.4.3',
    },
    {
        id: 'quiet',
        group: 'text',
        label: 'Quieter body text',
        use: 'Body copy one step down, a footer label',
        fg: '--color-neutral-700',
        bg: surface,
        level: 'text',
        min: levels.text,
        lc: 75,
        criterion: '1.4.3',
    },
    {
        id: 'secondary',
        group: 'text',
        label: 'Secondary text',
        use: 'Card titles, idle controls, default icons',
        fg: '--color-neutral-600',
        bg: surface,
        level: 'label',
        min: levels.label,
        lc: 75,
        criterion: '1.4.3',
    },
    {
        id: 'secondary-canvas',
        group: 'text',
        label: 'Secondary text on the canvas',
        use: 'A description under a page title',
        fg: '--color-neutral-600',
        bg: canvas,
        level: 'label',
        min: levels.label,
        lc: 75,
        criterion: '1.4.3',
    },
    {
        // WCAG names placeholder text among what 1.4.3 covers; APCA would let a placeholder alone
        // sit at Lc 30, but the same step carries hints and eyebrows, which are read. The 500 misses
        // 4.5:1 on the surface, so hints share the secondary step.
        id: 'muted',
        group: 'text',
        label: 'Hints and placeholders',
        use: 'Helper text, muted labels, eyebrows, neutral-600',
        fg: '--color-neutral-600',
        bg: surface,
        level: 'label',
        min: levels.label,
        lc: 75,
        criterion: '1.4.3',
    },
    {
        id: 'on-action',
        group: 'text',
        label: 'Label on the action',
        use: 'The primary button, a checked segment',
        fg: '--color-on-action',
        bg: '--color-action',
        level: 'text',
        min: levels.text,
        lc: 75,
        criterion: '1.4.3',
        advisory:
            'The label is white from 3:1 on a primary fill: WCAG’s ratio under-rates white on saturated mid-tones, where it reads better than black.',
    },
    {
        id: 'tint',
        group: 'text',
        label: 'Text on the tint',
        use: 'An active pill tab, an own chat message',
        fg: '--color-tint-fg',
        bg: '--color-tint',
        under: surface,
        level: 'text',
        min: levels.text,
        lc: 90,
        criterion: '1.4.3',
    },
    ...(['primary', 'success', 'warning', 'error'] as const).map(
        (tone): PairCheck => ({
            id: `badge-${tone}`,
            group: 'text',
            label: `${tone[0]?.toUpperCase()}${tone.slice(1)} badge`,
            use: 'The tone’s 800 on its 500 at 20%',
            fg: `--color-${tone}-800`,
            bg: `--color-${tone}-500`,
            bgAlpha: 0.2,
            under: surface,
            level: 'label',
            min: levels.label,
            lc: 75,
            criterion: '1.4.3',
        }),
    ),
    {
        id: 'rise',
        group: 'text',
        label: 'A rising delta',
        use: 'success-800 as text: +12%',
        fg: '--color-success-800',
        bg: surface,
        level: 'label',
        min: levels.label,
        lc: 75,
        criterion: '1.4.3',
    },
    {
        id: 'invalid',
        group: 'text',
        label: 'Invalid helper text',
        use: 'error-600 under a field, a falling delta',
        fg: '--color-error-600',
        bg: surface,
        level: 'label',
        min: levels.label,
        lc: 75,
        criterion: '1.4.3',
    },
    {
        // A button's fill need not stand off the page (its label identifies it); a checked box's
        // or switch's fill is the state itself, so it must.
        id: 'action',
        group: 'controls',
        label: 'Checked box or switch',
        use: 'The action fill that shows the state',
        fg: '--color-action',
        bg: surface,
        level: 'shape',
        min: levels.shape,
        lc: 30,
        criterion: '1.4.11',
    },
    {
        id: 'checkbox',
        group: 'controls',
        label: 'Unchecked box',
        use: 'A checkbox’s border, neutral-300',
        fg: '--color-neutral-300',
        bg: surface,
        level: 'shape',
        min: levels.shape,
        lc: 45,
        criterion: '1.4.11',
    },
    {
        id: 'focus',
        group: 'controls',
        label: 'Focus ring',
        use: 'The 2px ring, on the surface',
        fg: '--color-focus',
        bg: surface,
        level: 'ring',
        min: levels.ring,
        lc: 45,
        criterion: '1.4.11',
    },
    {
        // The ring is drawn 2px outside its control, so it lands on whatever is around it.
        id: 'focus-canvas',
        group: 'controls',
        label: 'Focus ring on the canvas',
        use: 'A control on the canvas, a page’s tabs',
        fg: '--color-focus',
        bg: canvas,
        level: 'ring',
        min: levels.ring,
        lc: 45,
        criterion: '1.4.11',
    },
    // A field's border is the hairline, and a hairline is meant to be faint: it is not judged.
    {
        id: 'track',
        group: 'controls',
        label: 'Switch off',
        use: 'A switch’s track when it is off',
        fg: '--color-neutral-300',
        bg: surface,
        level: 'shape',
        min: levels.shape,
        lc: 30,
        criterion: '1.4.11',
    },
];

export type PairResult = {
    check: PairCheck;
    fg: Oklch;
    bg: Oklch;
    ratio: number;
    lc: number;
    /** `pass`, `aaa` past 7:1 for text, `fail`, or `advise` for a miss WCAG does not require. */
    state: 'pass' | 'aaa' | 'fail' | 'advise';
    /** Whether APCA's level for the use is met. */
    apca: boolean;
};

/** A pair's two colours as painted: the background laid over what is under it, the text over that. */
const paintPair = (check: PairCheck, fgPaint: Paint, bgPaint: Paint, underneath: Oklch) => {
    const bg = over(
        { color: bgPaint.color, alpha: bgPaint.alpha * (check.bgAlpha ?? 1) },
        underneath,
    );
    return { fg: over(fgPaint, bg), bg };
};

const grey = { l: 0.5, c: 0, h: 0 };

/** The surface a pair sits on unless it names another: its `under`, or the surface. */
const underOf = (check: PairCheck) => check.under ?? surface;

/** The pair checks for one mode, measured. */
export const measurePairs = (theme: ThemeOptions, mode: ThemeMode): PairResult[] => {
    const token = themeToken(theme, mode);
    const read = (name: string) => parseColor(token(name));
    const base = read(surface)?.color ?? { l: 0.98, c: 0, h: 0 };

    return pairChecks.flatMap(check => {
        const underneath = read(underOf(check))?.color ?? base;
        const bgPaint = read(check.bg);
        const fgPaint = read(check.fg);
        if (!bgPaint || !fgPaint) return [];
        const { fg, bg } = paintPair(check, fgPaint, bgPaint, underneath);
        const ratio = wcagContrast(fg, bg);
        const lc = apcaContrast(fg, bg);
        // Never rounded up: 4.499:1 does not meet 4.5:1.
        const passes = ratio >= check.min;
        const state: PairResult['state'] = passes
            ? check.group === 'text' && ratio >= 7
                ? 'aaa'
                : 'pass'
            : check.advisory
              ? 'advise'
              : 'fail';
        return [{ check, fg, bg, ratio, lc, state, apca: Math.abs(lc) >= check.lc }];
    });
};

export type Verdict = 'pass' | 'fail' | 'advise';

/** How a measured pair reads against its level: met, missed, or missed where only advice is given. */
export const verdict = (result: PairResult): Verdict => {
    if (result.ratio >= result.check.min) return 'pass';
    return result.check.advisory ? 'advise' : 'fail';
};

/** A token as the marks name it: `neutral-500`, the variable's prefix left off. */
const tokenName = (token: string) => token.replace(/^--color-/, '');

/** The pair as it is painted, in the system's names: "warning-800 on warning-500 at 20%". */
export const pairName = (check: PairCheck) =>
    `${tokenName(check.fg)} on ${tokenName(check.bg)}${
        check.bgAlpha ? ` at ${Math.round(check.bgAlpha * 100)}%` : ''
    }`;

/** What the pair is held to, as a mark says it: "Label, 3:1". */
export const pairNeeds = (check: PairCheck) => `${levelNames[check.level]}, ${check.min}:1`;

/** APCA's Lc as a whole number, its sign (which way the polarity runs) left off. */
export const lcValue = (lc: number) => String(Math.trunc(Math.abs(lc)));

/** A value cut, never rounded, to its digits, so a figure shown never claims a level it misses. */
export const cut = (value: number, digits: number) => {
    const scale = 10 ** digits;
    return (Math.trunc(value * scale) / scale).toFixed(digits);
};

/** WCAG 2's level for normal text, or 3:1 for large text and the parts of controls. */
export const wcagLevel = (ratio: number) =>
    ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? '3:1' : null;

/**
 * The chart colours' levels as a theme is held to them. The engine's own (`seriesThresholds`) are
 * what its search aims at, and stay as they are; a set a little outside them still reads, so the
 * check allows a margin: a wider lightness band, a little less chroma, and 2:1 against the chart's
 * surface where the engine aims for 3.
 */
export const seriesLevels = {
    band: { light: [0.38, 0.82], dark: [0.43, 0.72] },
    chroma: 0.08,
    cvd: seriesThresholds.cvd,
    normal: seriesThresholds.normal,
    contrast: 2,
} as const;

/** The chart colours checked at those levels. */
export const checkChartSeries = (
    colors: Oklch[],
    { mode, surface }: { mode: ThemeMode; surface: Oklch },
): SeriesCheck[] =>
    checkSeries(colors, { mode, surface }).map((check): SeriesCheck => {
        if (check.id === 'band') {
            const [low, high] = seriesLevels.band[mode];
            const off = colors.flatMap((color, i) => (color.l < low || color.l > high ? [i] : []));
            return { ...check, state: off.length ? 'fail' : 'pass', series: off };
        }
        if (check.id === 'chroma') {
            const grey = colors.flatMap((color, i) => (color.c < seriesLevels.chroma ? [i] : []));
            return { ...check, state: grey.length ? 'fail' : 'pass', series: grey };
        }
        if (check.id === 'contrast') {
            const faint = colors.flatMap((color, i) =>
                wcagContrast(color, surface) < seriesLevels.contrast ? [i] : [],
            );
            return { ...check, state: faint.length ? 'warn' : 'pass', series: faint };
        }
        return check;
    });

/**
 * Whether the chart colours are judged along with the pairs. They are not: series 1 is the theme's
 * own colour at its 500, whatever that is, so a bright or a deep one missed the band every time,
 * and whoever chose the colour knows what it is. The wheel still says how the set is told apart,
 * beside the place it is changed.
 */
const judgeSeries: boolean = false;

/** The data colours a chart reads, series 1 to 4, and the surface it is drawn on. */
export const measureSeries = (theme: ThemeOptions, mode: ThemeMode) => {
    const token = themeToken(theme, mode);
    const surfaceColor = parseColor(token('--color-chart-background'))?.color ?? {
        l: mode === 'light' ? 0.98 : 0.15,
        c: 0,
        h: 0,
    };
    const series = [1, 2, 3, 4].flatMap(i => {
        const paint = parseColor(token(`--color-chart-series-${i}`));
        return paint ? [over(paint, surfaceColor)] : [];
    });
    const checks: SeriesCheck[] = judgeSeries
        ? checkChartSeries(series, { mode, surface: surfaceColor })
        : [];
    return { series, surface: surfaceColor, checks };
};

/** The ramps the contrast grid can lay against each other. */
export const gridRamps = ['neutral', 'primary', 'success', 'warning', 'error'] as const;

export type GridRamp = (typeof gridRamps)[number];

/** A ramp's step names, 50 to 950: the role names, which keep their place in either mode. */
export const stepLabels = [
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    '950',
] as const;

/** One ramp's eleven steps as a mode paints them: dark mode reads the ramp back to front. */
export const rampColors = (theme: ThemeOptions, mode: ThemeMode, ramp: string) => {
    const token = themeToken(theme, mode);
    return stepLabels.map(
        step => parseColor(token(`--color-${ramp}-${step}`))?.color ?? { l: 0.5, c: 0, h: 0 },
    );
};

/* ---------- Balancing light and dark ---------- */

/*
 * One ramp paints both modes, and dark mode reads it back to front: the 600 under a hint in light is
 * the 400 in dark, and the 500 that borders a box is the same grey in light and in dark. A curve
 * tuned until light reads well moves dark with it. The balance searches the curves' shapes (the
 * greys' and the primary's ends and midtones, the primary's saturation) for the one where every
 * required pair passes in both modes with the least change to the ramps; an advised pair only
 * breaks a near tie.
 *
 * It measures a shape on a model of the cascade, built once from the theme's own tokens: which step
 * of which ramp each pair's colours are. A coordinate search walks the sliders from where they are,
 * in strides that halve down to the slider's own step. A pair no shape can pass alongside the rest
 * is set aside, one that misses now before one that passes now, the furthest off first, and the
 * search runs again without it. The answer is measured once more in full, so the counts it shows
 * are the check layer's own.
 */

export type CurveRamp = 'neutral' | 'primary';
export type CurveKey = 'lightest' | 'darkest' | 'midtones' | 'saturation';

type Knob = {
    ramp: CurveRamp;
    key: CurveKey;
    min: number;
    max: number;
    /** The slider's step, the finest move the search makes. */
    step: number;
    /** The search's first move, in steps; it halves down to one. */
    stride: number;
};

/** The curve sliders' ranges and steps, as ramp-graph.tsx draws them, so a result can be set by hand. */
const knobs: Knob[] = [
    { ramp: 'neutral', key: 'lightest', min: 0.9, max: 1, step: 0.002, stride: 16 },
    { ramp: 'neutral', key: 'darkest', min: 0.1, max: 0.45, step: 0.005, stride: 16 },
    { ramp: 'neutral', key: 'midtones', min: -1, max: 1, step: 0.05, stride: 8 },
    { ramp: 'primary', key: 'lightest', min: 0.9, max: 1, step: 0.002, stride: 16 },
    { ramp: 'primary', key: 'darkest', min: 0.1, max: 0.45, step: 0.005, stride: 16 },
    { ramp: 'primary', key: 'midtones', min: -1, max: 1, step: 0.05, stride: 8 },
    { ramp: 'primary', key: 'saturation', min: 0, max: 1.5, step: 0.05, stride: 8 },
];

const curveRamps: CurveRamp[] = ['neutral', 'primary'];
const modes: ThemeMode[] = ['light', 'dark'];

type Ramps = Record<CurveRamp, Oklch[]>;

/** Where a pair's colour comes from: a step of a ramp the curves shape, or a paint they never touch. */
type Source = { ramp: CurveRamp; step: number; alpha: number } | { paint: Paint };

/** One pair in one mode, by where its colours come from. */
type Item = { check: PairCheck; mode: ThemeMode; fg: Source; bg: Source; under: Source };

const sameColor = (a: Oklch, b: Oklch) =>
    Math.abs(a.l - b.l) < 1e-6 &&
    Math.abs(a.c - b.c) < 1e-6 &&
    (a.c < 1e-6 || Math.abs(a.h - b.h) < 1e-3);

const sourceOf = (paint: Paint, ramps: Ramps): Source => {
    for (const ramp of curveRamps) {
        const step = ramps[ramp].findIndex(color => sameColor(color, paint.color));
        if (step >= 0) return { ramp, step, alpha: paint.alpha };
    }
    return { paint };
};

const paintOf = (source: Source, ramps: Ramps): Paint =>
    'paint' in source
        ? source.paint
        : { color: ramps[source.ramp][source.step] ?? grey, alpha: source.alpha };

/** Each pair in each mode, its colours traced to the ramps' steps through the theme's own tokens. */
const itemsOf = (theme: ThemeOptions, ramps: Ramps): Item[] =>
    modes.flatMap(mode => {
        const token = themeToken(theme, mode);
        const read = (name: string) => parseColor(token(name));
        const base = read(surface) ?? { color: { l: 0.98, c: 0, h: 0 }, alpha: 1 };
        return pairChecks.flatMap((check): Item[] => {
            const fg = read(check.fg);
            const bg = read(check.bg);
            if (!fg || !bg) return [];
            const under = read(underOf(check)) ?? base;
            return [
                {
                    check,
                    mode,
                    fg: sourceOf(fg, ramps),
                    bg: sourceOf(bg, ramps),
                    under: sourceOf({ color: under.color, alpha: 1 }, ramps),
                },
            ];
        });
    });

const ratioOf = (item: Item, ramps: Ramps) => {
    const { fg, bg } = paintPair(
        item.check,
        paintOf(item.fg, ramps),
        paintOf(item.bg, ramps),
        paintOf(item.under, ramps).color,
    );
    return wcagContrast(fg, bg);
};

const parseRamp = (values: readonly string[]) =>
    values.map(value => parseColor(value)?.color ?? grey);

/** The distance between two colours in OKLab, where 0.02 is about the least anyone sees. */
const deltaE = (a: Oklch, b: Oklch) => {
    const ha = (a.h * Math.PI) / 180;
    const hb = (b.h * Math.PI) / 180;
    return Math.hypot(
        a.l - b.l,
        a.c * Math.cos(ha) - b.c * Math.cos(hb),
        a.c * Math.sin(ha) - b.c * Math.sin(hb),
    );
};

/** The greys' ends count twice: they are the page and its canvas, in either mode. */
const changeWeight = (ramp: CurveRamp, step: number) =>
    ramp === 'neutral' && (step <= 1 || step >= 9) ? 2 : 1;

/** A knob's value now: the shape's own, or what the curve is without it. */
const startOf = (theme: ThemeOptions, knob: Knob, ramps: Ramps) => {
    const set = theme.curves?.[knob.ramp]?.[knob.key];
    if (typeof set === 'number' && Number.isFinite(set)) return set;
    if (knob.key === 'lightest') return ramps[knob.ramp][0]?.l ?? 0.97;
    if (knob.key === 'darkest') return ramps[knob.ramp][10]?.l ?? 0.2;
    return neutralShape[knob.key];
};

/** The theme with the knobs that moved from `from` set in its curves. */
const shapedTheme = (theme: ThemeOptions, x: number[], from: number[]): ThemeOptions => {
    const curves = { ...theme.curves };
    for (const ramp of curveRamps) {
        const shape: RampShape = { ...theme.curves?.[ramp] };
        let moved = false;
        knobs.forEach((knob, i) => {
            const value = x[i];
            if (knob.ramp !== ramp || value === undefined || value === from[i]) return;
            shape[knob.key] = value;
            moved = true;
        });
        if (moved) curves[ramp] = shape;
    }
    return { ...theme, curves };
};

/** A move along a knob, on the grid of slider steps through where it started, within its range. */
const moveKnob = (knob: Knob, start: number, value: number) => {
    const steps = Math.round((value - start) / knob.step);
    // No move leaves the value exactly as it was, so a knob put back reads as unchanged.
    if (steps === 0) return start;
    const moved = start + steps * knob.step;
    if (moved >= knob.max) return knob.max;
    if (moved <= knob.min) return knob.min;
    return Number(moved.toFixed(4));
};

const margin = 1.001;

/** How far a ratio is from its level, in log steps; 0 once it passes, with a hair to spare. */
const shortfall = (ratio: number, min: number) => Math.max(0, Math.log((min * margin) / ratio));

/**
 * A coordinate search from `start`: each knob a stride either way, taken when it lowers the cost,
 * the strides halved once nothing moves, down to one slider step. It yields after each knob.
 */
function* coordinateSearch(
    start: number[],
    /** The values the slider grid runs through: the theme's own, so "unchanged" is on it. */
    anchor: number[],
    cost: (x: number[]) => number,
    /** Which knobs it may move; all of them unless given. */
    free: (knob: Knob) => boolean = () => true,
): Generator<void, number[]> {
    let x = start;
    let value = cost(x);
    const strides = knobs.map(knob => knob.stride);
    for (;;) {
        let moved = false;
        for (let i = 0; i < knobs.length; i++) {
            const knob = knobs[i] as Knob;
            if (!free(knob)) continue;
            const at = x[i] ?? 0;
            for (const direction of [1, -1]) {
                const next = moveKnob(
                    knob,
                    anchor[i] ?? at,
                    at + direction * (strides[i] ?? 1) * knob.step,
                );
                if (next === at) continue;
                const y = [...x];
                y[i] = next;
                const v = cost(y);
                if (v < value - 1e-9) {
                    x = y;
                    value = v;
                    moved = true;
                    break;
                }
            }
            yield;
        }
        if (!moved) {
            if (strides.every(stride => stride <= 1)) return x;
            strides.forEach((stride, i) => {
                strides[i] = Math.max(1, Math.floor(stride / 2));
            });
        }
    }
}

export type CurveChange = { ramp: CurveRamp; key: CurveKey; from: number; to: number };

export type Balance = {
    /** The misses WCAG requires per mode, pairs and data colours, as the check layer counts them. */
    before: Record<ThemeMode, number>;
    /** The same with the balanced curves. */
    after: Record<ThemeMode, number>;
    /** The values it would set; empty when no shape does better. */
    changes: CurveChange[];
    /** The theme's new curves, or null when no shape does better than the one it has. */
    patch: Pick<ThemeOptions, 'curves'> | null;
    /** What no shape fixes, grouped by why. */
    unfixed: { pairs: { label: string; modes: ThemeMode[] }[]; reason: string }[];
    /** The shapes measured, and the time the search worked, in ms. */
    measured: number;
    ms: number;
};

/** Misses WCAG requires in one mode: the pairs and the data colours, as the header counts them. */
export const requiredMisses = (theme: ThemeOptions, mode: ThemeMode) =>
    measurePairs(theme, mode).filter(result => verdict(result) === 'fail').length +
    measureSeries(theme, mode).checks.filter(check => check.state === 'fail').length;

/** The step a theme's accent sits on, by index. */
const seedStep = (theme: ThemeOptions) => {
    const step = (stepLabels as readonly string[]).indexOf(theme.accentStep ?? '500');
    return step < 0 ? 5 : step;
};

const statusToken = /--color-(success|warning|error)-/;

/** A pair on the status ramps, which no theme shapes. */
const onStatus = (check: PairCheck) => statusToken.test(check.fg) || statusToken.test(check.bg);

/** A pair painted with the accent itself, the one step a curve never moves. */
const onSeed = (item: Item, seed: number) =>
    [item.fg, item.bg].some(
        side => 'ramp' in side && side.ramp === 'primary' && side.step === seed,
    );

/** Why a pair stays missed: the fixed status ramps, the accent itself, or the one curve. */
const reasonFor = (theme: ThemeOptions, items: Item[], failing: ThemeMode[]) => {
    const check = items[0]?.check;
    if (!check) return 'No shape of the curves passes it.';
    if (onStatus(check)) {
        return 'The status ramps are fixed, so the fix is in the system, not the theme.';
    }
    const seed = seedStep(theme);
    if (items.some(item => onSeed(item, seed))) {
        const which =
            failing.length > 1
                ? 'another accent'
                : failing[0] === 'dark'
                  ? 'a lighter accent'
                  : 'a darker accent';
        return `It is the accent itself: ${which} fixes it, not a curve.`;
    }
    const greysOnly = items.every(({ fg, bg }) =>
        [fg, bg].every(side => !('ramp' in side) || side.ramp === 'neutral'),
    );
    return greysOnly
        ? 'No grey curve passes both modes along with the rest: one ramp paints both, back to front.'
        : 'No curve passes it along with the rest.';
};

/** The shape with each value back at its default, within half a step, left out. */
const tidyShape = (theme: ThemeOptions, ramp: CurveRamp, shape: RampShape) => {
    const out: RampShape = { ...shape };
    for (const knob of knobs) {
        const value = out[knob.key];
        if (knob.ramp !== ramp || value === undefined) continue;
        let fallback: number = neutralShape[knob.key === 'saturation' ? 'saturation' : 'midtones'];
        if (knob.key === 'lightest' || knob.key === 'darkest') {
            const rest = { ...out };
            delete rest[knob.key];
            const without = { ...theme, curves: { ...theme.curves, [ramp]: rest } };
            const curve =
                (ramp === 'neutral' ? themeNeutralCurves(without) : themeAccentCurves(without)) ??
                rampColors(without, 'light', ramp);
            fallback = (knob.key === 'lightest' ? curve[0]?.l : curve[10]?.l) ?? value;
        }
        if (Math.abs(value - fallback) <= knob.step / 2 + 1e-9) delete out[knob.key];
    }
    return Object.keys(out).length ? out : undefined;
};

/**
 * Searches the curves for the shape where light and dark both pass. A generator, so it runs a slice
 * at a time, off the main thread's critical path; it returns the proposal.
 */
export function* balanceCurves(theme: ThemeOptions): Generator<void, Balance> {
    let worked = 0;
    let slice = performance.now();

    const base: Ramps = {
        neutral: rampColors(theme, 'light', 'neutral'),
        primary: rampColors(theme, 'light', 'primary'),
    };
    const items = itemsOf(theme, base);
    const x0 = knobs.map(knob => startOf(theme, knob, base));

    // A ramp is built once per shape of its own knobs; the search moves one knob at a time.
    const built = new Map<string, Oklch[]>();
    const rampAt = (ramp: CurveRamp, x: number[]) => {
        const key = `${ramp}:${knobs.map((knob, i) => (knob.ramp === ramp ? x[i] : '')).join(',')}`;
        const found = built.get(key);
        if (found) return found;
        const unmoved = knobs.every((knob, i) => knob.ramp !== ramp || x[i] === x0[i]);
        const shaped = shapedTheme(theme, x, x0);
        const values = unmoved
            ? base[ramp]
            : parseRamp(ramp === 'neutral' ? themeNeutralRamp(shaped) : themeAccentRamp(shaped));
        built.set(key, values);
        return values;
    };

    let measured = 0;
    const evaluated = new Map<string, { ratios: number[]; change: number }>();
    const evaluate = (x: number[]) => {
        const key = x.join(',');
        const found = evaluated.get(key);
        if (found) return found;
        measured++;
        const ramps: Ramps = { neutral: rampAt('neutral', x), primary: rampAt('primary', x) };
        let sum = 0;
        let weights = 0;
        for (const ramp of curveRamps) {
            ramps[ramp].forEach((color, step) => {
                const weight = changeWeight(ramp, step);
                sum += weight * deltaE(color, base[ramp][step] ?? color) ** 2;
                weights += weight;
            });
        }
        const result = {
            ratios: items.map(item => ratioOf(item, ramps)),
            change: Math.sqrt(sum / weights),
        };
        evaluated.set(key, result);
        return result;
    };

    const minOf = (i: number) => items[i]?.check.min ?? 0;
    const fails = (ratios: number[], i: number) => (ratios[i] ?? 0) < minOf(i);
    const required = items.flatMap((item, i) => (item.check.advisory ? [] : [i]));
    const advised = items.flatMap((item, i) => (item.check.advisory ? [i] : []));
    const now = evaluate(x0).ratios;

    // A shortfall outweighs any change; an advised miss is worth a change no one would see.
    const costOf = (set: Set<number>) => (x: number[]) => {
        const { ratios, change } = evaluate(x);
        let short = 0;
        for (const i of set) short += shortfall(ratios[i] ?? 0, minOf(i));
        const advisedMisses = advised.filter(i => fails(ratios, i)).length;
        return 1000 * short + change + 0.004 * advisedMisses;
    };

    /** A search from `start` for the shape that passes every pair in `set`; it pauses every 8ms. */
    const walkFrom = function* (start: number[], set: Set<number>, free?: (knob: Knob) => boolean) {
        const cost = costOf(set);
        const walk = coordinateSearch(start, x0, cost, free);
        let next = walk.next();
        while (!next.done) {
            if (performance.now() - slice > 8) {
                worked += performance.now() - slice;
                yield;
                slice = performance.now();
            }
            next = walk.next();
        }
        const x = next.value;
        const { ratios } = evaluate(x);
        return { x, failing: [...set].filter(i => fails(ratios, i)), ratios, cost: cost(x) };
    };

    /*
     * A knob at a time cannot follow a valley that runs across two: a mid grey passes in
     * both modes only with the ends far apart and the midtones just so, and from anywhere else each
     * knob alone makes one mode worse. So each search also opens the ramps as far as they go, white
     * to the darkest the slider allows, shapes the midtones there, and then walks the ends back in
     * towards the theme; the better of the two answers is kept.
     */
    const isEnd = (knob: Knob) => knob.key === 'lightest' || knob.key === 'darkest';
    const opened = (x: number[]) =>
        x.map((value, i) => {
            const knob = knobs[i] as Knob;
            if (knob.key === 'lightest') return knob.max;
            if (knob.key === 'darkest') return moveKnob(knob, x0[i] ?? value, knob.min);
            return value;
        });
    const search = function* (start: number[], set: Set<number>) {
        const near = yield* walkFrom(start, set);
        const open = yield* walkFrom(opened(start), set, knob => !isEnd(knob));
        const far = yield* walkFrom(open.x, set);
        return far.failing.length < near.failing.length ||
            (far.failing.length === near.failing.length && far.cost < near.cost)
            ? far
            : near;
    };

    // Search with every required pair; while some miss, set one aside and search again.
    const active = new Set(required);
    const aside: number[] = [];
    let best = x0;
    for (;;) {
        const { x, failing, ratios } = yield* search(x0, active);
        if (failing.length === 0) {
            best = x;
            break;
        }
        const gap = (i: number) => shortfall(ratios[i] ?? 0, minOf(i));
        failing.sort((a, b) => Number(fails(now, b)) - Number(fails(now, a)) || gap(b) - gap(a));
        const drop = failing[0] as number;
        active.delete(drop);
        aside.push(drop);
    }

    // A pair set aside early may fit once the one it pulled against is gone: each is tried again
    // from the answer, the ones that pass now first. The status ramps and the accent never move.
    const seed = seedStep(theme);
    const retry = aside
        .filter(i => {
            const item = items[i];
            return item && !onStatus(item.check) && !onSeed(item, seed);
        })
        .sort((a, b) => Number(fails(now, a)) - Number(fails(now, b)));
    for (const i of retry) {
        const trial = new Set(active).add(i);
        const { x, failing } = yield* search(best, trial);
        if (failing.length > 0) continue;
        active.add(i);
        best = x;
    }

    // What the answer moved without need goes back: a ramp's knobs together, then one at a time.
    const settle = costOf(active);
    const passes = (x: number[]) => {
        const { ratios } = evaluate(x);
        return [...active].every(i => !fails(ratios, i));
    };
    const revert = [
        ...curveRamps.map(ramp => knobs.flatMap((knob, i) => (knob.ramp === ramp ? [i] : []))),
        ...knobs.map((_, i) => [i]),
    ];
    for (let again = true; again; ) {
        again = false;
        for (const group of revert) {
            if (group.every(i => best[i] === x0[i])) continue;
            const back = best.map((value, i) => (group.includes(i) ? (x0[i] ?? value) : value));
            if (!passes(back) || settle(back) > settle(best) + 1e-12) continue;
            best = back;
            again = true;
        }
    }

    const shaped = shapedTheme(theme, best, x0);
    const curves: NonNullable<ThemeOptions['curves']> = { ...theme.curves };
    for (const ramp of curveRamps) {
        const shape = shaped.curves?.[ramp];
        if (!shape || shape === theme.curves?.[ramp]) continue;
        const tidy = tidyShape(theme, ramp, shape);
        if (tidy) curves[ramp] = tidy;
        else delete curves[ramp];
    }
    const balanced: ThemeOptions = { ...theme, curves };

    const count = (options: ThemeOptions) => ({
        light: requiredMisses(options, 'light'),
        dark: requiredMisses(options, 'dark'),
    });
    const before = count(theme);
    const changed = knobs.some((_, i) => best[i] !== x0[i]);
    const counted = changed ? count(balanced) : before;
    const better = counted.light + counted.dark < before.light + before.dark;
    const kept = better ? balanced : theme;

    // What still misses with the shape it settles on, grouped by why.
    const misses = new Map<string, ThemeMode[]>();
    for (const mode of modes) {
        for (const result of measurePairs(kept, mode)) {
            if (verdict(result) !== 'fail') continue;
            misses.set(result.check.id, [...(misses.get(result.check.id) ?? []), mode]);
        }
    }
    const groups = new Map<string, { label: string; modes: ThemeMode[] }[]>();
    for (const [id, failing] of misses) {
        const reason = reasonFor(
            theme,
            items.filter(item => item.check.id === id),
            failing,
        );
        const label = pairChecks.find(check => check.id === id)?.label ?? id;
        const pair = { label, modes: failing };
        groups.set(reason, [...(groups.get(reason) ?? []), pair]);
    }

    worked += performance.now() - slice;
    return {
        before,
        after: better ? counted : before,
        changes: better
            ? knobs.flatMap((knob, i): CurveChange[] => {
                  const from = x0[i] ?? 0;
                  const to = best[i] ?? from;
                  return to === from ? [] : [{ ramp: knob.ramp, key: knob.key, from, to }];
              })
            : [],
        patch: better ? { curves } : null,
        unfixed: [...groups].map(([reason, pairs]) => ({ pairs, reason })),
        measured,
        ms: worked,
    };
}
