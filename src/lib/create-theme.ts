import {
    buildGreyRamp,
    buildRamp,
    type Gamut,
    hasRampSteps,
    hexToOklch,
    type Oklch,
    type RampShape,
    type RampStep,
    type RampSteps,
    rampLightness,
    rampSteps,
    rampToCss,
    toCss,
} from './color';
import { wcagContrast } from './contrast';
import { buildChartSeries, type ChartHarmony, type ChartSeries } from './harmony';

/*
 * The theme builder. A theme is a handful of choices (an accent, how grey the
 * greys are, a font, how the action and the selection draw) turned into a
 * `.continuum[data-theme="name"]` block that overrides the default tokens.
 * Components never change; only the values behind the tokens do.
 */

/**
 * The fonts a theme picks from by name: each read from `--font-<id>` (set it from `next/font`), then
 * its Fontsource variable family, then the installed family. Any other value is used as a family.
 */
export const themeFontFamilies = {
    geist: { family: 'Geist', package: '@fontsource-variable/geist' },
    inter: { family: 'Inter', package: '@fontsource-variable/inter' },
    'instrument-sans': {
        family: 'Instrument Sans',
        package: '@fontsource-variable/instrument-sans',
    },
    'ibm-plex-sans': {
        family: 'IBM Plex Sans',
        package: '@fontsource-variable/ibm-plex-sans',
    },
    figtree: { family: 'Figtree', package: '@fontsource-variable/figtree' },
} as const;

export type ThemeFontId = keyof typeof themeFontFamilies;

export type ThemeFont = ThemeFontId | (string & {});

/** A theme's own data colours, in place of the set its accent leads. */
export type ThemeCharts = {
    /** chart-1 to chart-5: steps in order, a funnel or shades of one measure. */
    steps: readonly string[];
    /** The steps dark mode changes, by position, so a deep one still reads on a dark surface. */
    dark?: readonly (string | null)[];
    /** series-2 to series-4, for independent series; without them the series take chart-2 to chart-4. */
    series?: readonly string[];
};

export type ThemeOptions = {
    /** The `data-theme` value the block is written for. */
    name?: string;
    /** A hex colour; it becomes the primary ramp's `accentStep` and the rest is built around it. */
    accent?: string;
    /** Which step of the primary ramp the accent is; the 500 unless given. */
    accentStep?: RampStep;
    /** The greys: an oklch hue and the chroma at their peak (0 is pure grey; 0.012 is clearly tinted). */
    neutral?: { hue: number; tint: number };
    /** The colours the ramps may use: Display P3, as Tailwind's palette, or sRGB, which every screen shows. */
    gamut?: Gamut;
    /** How each ramp's curves are shaped; anything left out is Tailwind's. */
    curves?: { primary?: RampShape; neutral?: RampShape };
    /**
     * The base type size in px, 13 as drawn. Every size on the scale follows it, rounded to a whole
     * pixel, its line height 1.25 times that.
     */
    type?: number;
    /**
     * The spacing unit in whole px, 4 as drawn: every padding, gap and margin is a multiple of it, the
     * steps between whole units each rounded to a pixel. 3 is tight, 5 roomy.
     */
    unit?: number;
    /**
     * Every fixed height (controls, rows, bars) times this, each rounded to a whole pixel: 1 as drawn,
     * 0.9 compact, 1.1 large.
     */
    size?: number;
    font?: ThemeFont;
    /** What the primary button, checked controls and the active rail item are filled with. */
    action?: 'neutral' | 'accent';
    /** `lit` adds a top highlight and a ring; `glossy` adds a gradient as well. */
    actionStyle?: 'flat' | 'lit' | 'glossy';
    /** The selected wash: a translucent neutral, or the accent's palest step. */
    tint?: 'neutral' | 'accent';
    /** The active segment: filled with the action colour, or raised as a chip on the track. */
    segment?: 'filled' | 'raised';
    /** The dock, rail and small chips: full pills, or a tighter 10px corner. */
    dock?: 'pill' | 'rounded';
    /** Corner scale; 1 is as drawn, 0 squares everything off. */
    radius?: number;
    /**
     * How series 2 to 4 are found from the primary: auto takes the hues that stay furthest apart for
     * every reader, the others follow a harmony on the oklch wheel. Each series takes the step of its
     * hue that tells it best from its neighbours. Auto unless given; set colours in `charts` win.
     */
    chartHarmony?: ChartHarmony;
    /**
     * The harmony's one parameter, in degrees: how far analogous hues spread either side of the
     * primary (30 as drawn, the outer one twice as far), how far split complementary ones sit either
     * side of its opposite (30), how wide the tetradic rectangle is (60). Others have none.
     */
    chartSpread?: number;
    /** With the `custom` harmony: series 2 to 4, in order, as turns of the primary's hue. */
    chartTurns?: readonly number[];
    /**
     * Steps held by hand: the light-mode step (3 to 8, the 300 to the 800) of each of the
     * harmony's hues, in the order it lists its turns (custom: `chartTurns`); null leaves one to the
     * search. Dark mode holds the same place in its band, a step lighter. Auto ignores it.
     */
    chartSteps?: readonly (number | null)[];
    /** Data colours of the theme's own, in place of the set the harmony finds. */
    charts?: ThemeCharts;
};

export const defaultThemeOptions = {
    name: 'custom',
    accentStep: '500' as RampStep,
    gamut: 'p3' as Gamut,
    // No theme leans nowhere: the baseline greys are achromatic.
    neutral: { hue: 0, tint: 0 },
    font: 'geist' as ThemeFont,
    action: 'neutral' as const,
    actionStyle: 'flat' as const,
    tint: 'neutral' as const,
    segment: 'filled' as const,
    dock: 'pill' as const,
    radius: 1,
};

/** The baseline greys, as the tokens write them: achromatic; new greys keep their lightness at every step. */
export const defaultNeutral: RampSteps = [
    '#f8f8f8',
    '#ededed',
    '#d2d2d2',
    '#b3b3b3',
    '#9a9a9a',
    '#818181',
    '#676767',
    '#484848',
    '#2a2a2a',
    '#181818',
    '#0d0d0d',
];

/** The default accent, as the tokens write it: the indigo built from #3939e5 on the same curve. */
export const defaultAccent: RampSteps = [
    '#f2f5ff',
    '#dee6ff',
    '#bdccfe',
    '#91a7fe',
    '#596ff4',
    '#3939e5',
    '#3218e0',
    '#2a16c4',
    '#23219f',
    '#20267f',
    '#171e52',
];

const steps = rampSteps;

const neutralLightness = rampLightness(defaultNeutral);

/** The accent the default primary ramp was built from, at its 500. */
export const defaultAccentSeed = '#3939e5';

/** True when a shape sets any of its controls, or any step by hand. */
const touched = (shape?: RampShape) =>
    Boolean(
        shape &&
            (Object.values(shape).some(
                value => typeof value === 'number' && Number.isFinite(value),
            ) ||
                hasRampSteps(shape)),
    );

/** The type scale as drawn, size and line height in px, by Tailwind's names. */
export const typeScale = {
    xxs: [11, 13.75],
    xs: [13, 16.25],
    sm: [14, 17.5],
    base: [16, 20],
    lg: [18, 22.5],
    xl: [20, 25],
    '2xl': [24, 30],
    '3xl': [31, 38.75],
    '4xl': [39, 48.75],
    '5xl': [48, 60],
    '6xl': [61, 76.25],
} as const;

/** The base size the type scale is drawn at, and the spacing unit it is drawn on, in px. */
export const drawnType = 13;
export const drawnUnit = 4;

const px = (value: number) => `${Number(value.toFixed(2))}px`;

const gamutOf = (options: ThemeOptions) => options.gamut ?? defaultThemeOptions.gamut;

/**
 * The primary ramp a set of options produces, as oklch colours: built around the accent at its step,
 * with the steps set by hand. Null for the default ramp: no accent and nothing set by hand.
 */
export const themeAccentCurves = (options: ThemeOptions): Oklch[] | null => {
    const shape = options.curves?.primary;
    const seed =
        hexToOklch(options.accent ?? '') ?? (touched(shape) ? hexToOklch(defaultAccentSeed) : null);
    if (!seed) return null;
    const step = steps.indexOf(options.accentStep ?? defaultThemeOptions.accentStep);
    return buildRamp(seed, { step: step < 0 ? 5 : step, gamut: gamutOf(options), shape });
};

/** The grey ramp a set of options produces, as oklch colours; null for the baseline greys. */
export const themeNeutralCurves = (options: ThemeOptions): Oklch[] | null => {
    const neutral = options.neutral ?? defaultThemeOptions.neutral;
    const shape = options.curves?.neutral;
    // No tint is the baseline whatever the hue says, unless the curves were shaped.
    if (neutral.tint === 0 && !touched(shape)) return null;
    return buildGreyRamp(neutral.hue, neutral.tint, neutralLightness, {
        gamut: gamutOf(options),
        shape,
    });
};

/** Each named font as a `font-family` stack; the platform font is only the last fallback. */
export const themeFonts = Object.fromEntries(
    Object.entries(themeFontFamilies).map(([id, { family }]) => [
        id,
        `var(--font-${id}, "${family} Variable"), "${family}", ui-sans-serif, system-ui, sans-serif`,
    ]),
) as Record<ThemeFontId, string>;

const fontFamily = (font: ThemeFont) =>
    font in themeFonts ? themeFonts[font as keyof typeof themeFonts] : font;

/** The neutral ramp a set of options produces, as stylesheet values. */
export const themeNeutralRamp = (options: ThemeOptions): RampSteps => {
    const curves = themeNeutralCurves(options);
    return curves ? rampToCss(curves, gamutOf(options)) : defaultNeutral;
};

/** The accent ramp a set of options produces, as stylesheet values; the default when there is none. */
export const themeAccentRamp = (options: ThemeOptions): RampSteps => {
    const curves = themeAccentCurves(options);
    return curves ? rampToCss(curves, gamutOf(options)) : defaultAccent;
};

export type ThemeVariables = {
    /** Set on `.continuum[data-theme]`. */
    light: Record<string, string>;
    /** Set on `.continuum[data-theme][data-mode="dark"]`. */
    dark: Record<string, string>;
};

const asOklch = (ramp: readonly string[]) =>
    ramp.map(value => hexToOklch(value) ?? { l: 0.5, c: 0, h: 0 });

/**
 * Series 1 to 4 a set of options finds, for light and dark; null when the options leave the data
 * colours to the tokens' own (no accent and no harmony) or set their own in `charts`.
 */
export const themeChartSeries = (options: ThemeOptions): ChartSeries | null => {
    if (options.charts) return null;
    const curves = themeAccentCurves(options);
    if (!curves && !options.chartHarmony) return null;
    const greys = themeNeutralCurves(options) ?? asOklch(defaultNeutral);
    const surface = { light: greys[0], dark: greys[10] };
    if (!surface.light || !surface.dark) return null;
    return buildChartSeries(curves ?? asOklch(defaultAccent), options.chartHarmony ?? 'auto', {
        gamut: gamutOf(options),
        surface: { light: surface.light, dark: surface.dark },
        spread: options.chartSpread,
        turns: options.chartTurns,
        steps: options.chartSteps,
    });
};

/** Every token a set of options changes, as custom properties, for light and for dark. */
export const createThemeVariables = (options: ThemeOptions): ThemeVariables => {
    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};
    const hasAccent = themeAccentCurves(options) !== null;

    const neutral = themeNeutralRamp(options);
    if (neutral !== defaultNeutral) {
        steps.forEach((step, i) => {
            light[`--continuum-n-${step}`] = neutral[i] ?? '';
        });
    }

    const accent = themeAccentRamp(options);
    if (hasAccent) {
        steps.forEach((step, i) => {
            light[`--continuum-p-${step}`] = accent[i] ?? '';
        });
    }

    if (options.font && options.font !== defaultThemeOptions.font) {
        light['--font-sans'] = fontFamily(options.font);
    }

    // Type: every size on the scale from the base, rounded to a pixel; its line height 1.25 times it.
    const type = options.type ?? drawnType;
    if (type !== drawnType) {
        const scale = type / drawnType;
        for (const [name, [size, line]] of Object.entries(typeScale)) {
            const rounded = Math.round(size * scale);
            light[`--text-${name}`] = px(rounded);
            light[`--text-${name}--line-height`] = px(rounded * (line / size));
        }
    }

    // Spacing: a whole-pixel unit; the steps between units round themselves (tokens.css).
    const unit = Math.round(options.unit ?? drawnUnit);
    if (unit !== drawnUnit) {
        light['--spacing'] = px(Math.max(1, unit));
    }

    // Heights: every fixed height is drawn times this scale.
    if (options.size !== undefined && options.size !== 1) {
        light['--continuum-size-scale'] = String(options.size);
    }

    const action = options.action ?? defaultThemeOptions.action;
    const style = options.actionStyle ?? defaultThemeOptions.actionStyle;
    if (action === 'accent') {
        light['--color-action'] = 'var(--color-primary-500)';
        light['--color-action-hover'] = 'var(--color-primary-600)';
        // The label is the raw end of the ramp that reads on the fill: the palest step on a deep
        // accent, the deepest on a bright one (an orange, a lime), the same in both modes.
        const ramp = themeAccentCurves(options) ?? asOklch(defaultAccent);
        const fill = ramp[5];
        const pale = ramp[0];
        const deep = ramp[10];
        light['--color-on-action'] =
            fill && pale && deep && wcagContrast(deep, fill) > wcagContrast(pale, fill)
                ? 'var(--continuum-p-950)'
                : 'var(--continuum-p-50)';
        light['--color-focus'] = 'var(--continuum-p-300)';
    }
    if (style !== 'flat') {
        light['--color-action-highlight'] =
            action === 'accent'
                ? 'var(--continuum-p-400)'
                : 'color-mix(in oklab, var(--color-on-action) 20%, transparent)';
        light['--color-action-ring'] = 'var(--color-action)';
    }
    if (style === 'glossy') {
        light['--action-gradient'] =
            action === 'accent'
                ? 'linear-gradient(180deg, var(--continuum-p-400), var(--continuum-p-500))'
                : 'linear-gradient(180deg, var(--color-neutral-800), var(--color-neutral-950))';
    }

    if ((options.tint ?? defaultThemeOptions.tint) === 'accent') {
        light['--color-tint'] = 'var(--color-primary-50)';
        light['--color-tint-fg'] = 'var(--color-primary-700)';
        // 700 reads back to a deep step on the dark wash; the raw 300 stays legible.
        dark['--color-tint-fg'] = 'var(--continuum-p-300)';
    }

    if ((options.segment ?? defaultThemeOptions.segment) === 'raised') {
        light['--color-segment'] = 'var(--color-neutral-50)';
        light['--color-segment-fg'] = 'var(--color-neutral-950)';
        light['--color-segment-border'] = 'var(--color-neutral-200)';
        light['--color-segment-track'] = 'var(--color-neutral-100)';
    }

    if ((options.dock ?? defaultThemeOptions.dock) === 'rounded') {
        light['--continuum-r-dock'] = '10px';
        light['--continuum-r-pill'] = '8px';
    }

    if (options.radius !== undefined && options.radius !== 1) {
        light['--continuum-radius-scale'] = String(options.radius);
    }

    if (options.charts) {
        // The theme's own set, as given: the accent no longer leads it.
        const { steps, dark: darkSteps = [], series = [] } = options.charts;
        steps.forEach((hex, i) => {
            light[`--color-chart-${i + 1}`] = hex;
        });
        series.forEach((hex, i) => {
            light[`--color-chart-series-${i + 2}`] = hex;
        });
        darkSteps.forEach((hex, i) => {
            if (hex) dark[`--color-chart-${i + 1}`] = hex;
        });
    } else {
        // The primary leads the data colours; the harmony finds the three after it, per mode.
        const series = themeChartSeries(options);
        if (series) {
            const gamut = gamutOf(options);
            light['--color-chart-1'] = `var(--continuum-p-${steps[series.primaryStep.light]})`;
            light['--color-chart-5'] = 'var(--continuum-p-600)';
            for (const i of [1, 2, 3]) {
                const lit = series.light[i];
                const deep = series.dark[i];
                if (lit) light[`--color-chart-${i + 1}`] = toCss(lit, gamut);
                if (deep) dark[`--color-chart-${i + 1}`] = toCss(deep, gamut);
                light[`--color-chart-series-${i + 1}`] = `var(--color-chart-${i + 1})`;
            }
            // A 500 sinks into a dark surface, so the set starts a step lighter.
            dark['--color-chart-1'] = `var(--continuum-p-${steps[series.primaryStep.dark]})`;
            dark['--color-chart-5'] = 'var(--continuum-p-300)';
        }
    }

    return { light, dark };
};

const block = (selector: string, variables: Record<string, string>) =>
    `${selector} {\n${Object.entries(variables)
        .map(([name, value]) => `    ${name}: ${value};`)
        .join('\n')}\n}`;

/**
 * The CSS for a theme: paste it after tokens.css and open the scope with
 * `<Theme theme="name">`. Empty when the options are the defaults.
 */
export const createThemeCss = (options: ThemeOptions) => {
    const name = options.name ?? defaultThemeOptions.name;
    const { light, dark } = createThemeVariables(options);
    const blocks: string[] = [];
    if (Object.keys(light).length) blocks.push(block(`.continuum[data-theme="${name}"]`, light));
    if (Object.keys(dark).length) {
        blocks.push(block(`.continuum[data-theme="${name}"][data-mode="dark"]`, dark));
    }
    return blocks.join('\n\n');
};

/** True when the options change nothing, so no theme block is needed. */
export const isDefaultTheme = (options: ThemeOptions) => {
    const { light, dark } = createThemeVariables(options);
    return Object.keys(light).length === 0 && Object.keys(dark).length === 0;
};
