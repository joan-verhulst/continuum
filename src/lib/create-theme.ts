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
import { buildChartSeries, type ChartHarmony, type ChartLead, type ChartSeries } from './harmony';

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
    /** The dock, rail and small chips: full pills, or a tighter 10px corner. */
    dock?: 'pill' | 'rounded';
    /**
     * The page you are on in the sidebar: `quiet` the grey wash, `tinted` the primary's tint, `raised`
     * a card on the canvas. The sections that hold it stay plain in every look; their darkened guide
     * line leads to the page. A filled row would read as a button; a page that wants one adds one.
     */
    nav?: 'quiet' | 'tinted' | 'raised';
    /**
     * What lifts off the page: `flat` only what floats (menus, popovers, sheets); `full` cards,
     * panels and table frames as well, and the controls on them (fields, selects, secondary buttons,
     * segmented controls, checkboxes). A theme saved with `soft`, since removed, reads as `full`.
     */
    elevation?: 'flat' | 'full';
    /** Letter spacing, in em of the type: 0.025 as drawn (0.32px at 13px), below 0 tighter. */
    tracking?: number;
    /** Line height as a share of the type size: 1.25 as drawn, every size on the scale with it. */
    leading?: number;
    /** How dark the shadows are: 1 as drawn, 0.25 barely there, 3 heavy. */
    shadowStrength?: number;
    /** How far the shadows reach: 1 as drawn, 0.5 tight, 3 wide and soft. */
    shadowSize?: number;
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
    /**
     * Series 1 put by hand: `turn` is its hue as a turn of the primary's, `step` its light-mode
     * step (3 to 8, the 300 to the 800). It is the primary's own 500 unless given, and the harmony's
     * hues are turns of its hue, so the set follows it.
     */
    chartLead?: ChartLead;
    /** Data colours of the theme's own, in place of the set the harmony finds. */
    charts?: ThemeCharts;
    /**
     * A texture in every tint a chart draws (an area's fill, a tinted bar): diagonal stripes or
     * a field of dots. None unless given; a chart can still ask for one, or none, itself.
     */
    chartTexture?: 'none' | 'stripes' | 'dots';
};

export const defaultThemeOptions = {
    name: 'custom',
    accentStep: '500' as RampStep,
    gamut: 'p3' as Gamut,
    // No theme leans nowhere: the baseline greys are achromatic.
    neutral: { hue: 0, tint: 0 },
    font: 'geist' as ThemeFont,
    // A theme's own colour fills its main button unless it asks for near-black.
    action: 'accent' as 'accent' | 'neutral',
    actionStyle: 'flat' as const,
    tint: 'neutral' as const,
    nav: 'quiet' as const,
    elevation: 'flat' as const,
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
    if (!curves && !options.chartHarmony && !options.chartLead) return null;
    const greys = themeNeutralCurves(options) ?? asOklch(defaultNeutral);
    const surface = { light: greys[0], dark: greys[10] };
    if (!surface.light || !surface.dark) return null;
    return buildChartSeries(curves ?? asOklch(defaultAccent), options.chartHarmony ?? 'auto', {
        gamut: gamutOf(options),
        surface: { light: surface.light, dark: surface.dark },
        spread: options.chartSpread,
        turns: options.chartTurns,
        steps: options.chartSteps,
        lead: options.chartLead,
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

    // Type: every size on the scale from the base, rounded to a pixel, and its line height the
    // theme's share of it (1.25 as drawn).
    const type = options.type ?? drawnType;
    const leading = options.leading;
    if (type !== drawnType || leading !== undefined) {
        const scale = type / drawnType;
        for (const [name, [size, line]] of Object.entries(typeScale)) {
            const rounded = Math.round(size * scale);
            light[`--text-${name}`] = px(rounded);
            light[`--text-${name}--line-height`] = px(rounded * (leading ?? line / size));
        }
    }
    if (leading !== undefined) light['--leading-normal'] = String(leading);
    if (options.tracking !== undefined) {
        light['--tracking-normal'] = `${Number(options.tracking.toFixed(4))}em`;
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
        const ramp = themeAccentCurves(options) ?? asOklch(defaultAccent);
        const greys = themeNeutralCurves(options) ?? asOklch(defaultNeutral);
        // The surface and the canvas each mode paints: dark reads the greys back to front.
        const ground = {
            light: [greys[0], greys[1]],
            dark: [greys[10], greys[9]],
        };
        /** The first raw step from `from`, walking `by`, that keeps 3:1 on both grounds. */
        const reach = (from: number, by: 1 | -1, on: (Oklch | undefined)[]) => {
            for (let i = from; i >= 0 && i <= 10; i += by) {
                const color = ramp[i];
                if (color && on.every(bg => !bg || wcagContrast(color, bg) >= 3)) return i;
            }
            return by > 0 ? 10 : 0;
        };
        // What sits on the fill is neutral, never a step of the fill's own ramp: the palest grey
        // wherever it keeps 3:1, the deepest only below that (an orange, a lime, a sky). WCAG's ratio
        // under-rates white on saturated mid-tones, so the higher of the two ratios would put black
        // on a blue, red or violet 500 that reads better in white. The raw greys, so it is the same
        // in both modes, as the fill is.
        const fill = ramp[5];
        const paleGrey = greys[0];
        const deepGrey = greys[10];
        light['--color-action'] = 'var(--color-primary-500)';
        light['--color-action-hover'] = 'var(--color-primary-600)';
        light['--color-on-action'] =
            fill && paleGrey && deepGrey && wcagContrast(paleGrey, fill) < 3
                ? 'var(--continuum-n-950)'
                : 'var(--continuum-n-50)';
        // The knob of a switch is a shape on the fill, not a label: the palest grey unless the fill
        // is so pale itself that only the deepest shows on it.
        light['--color-action-knob'] =
            fill && paleGrey && wcagContrast(paleGrey, fill) < 1.6
                ? 'var(--continuum-n-950)'
                : 'var(--continuum-n-50)';

        // The ring is the accent's first step from its 300 that keeps 3:1 on the surface and the
        // canvas, as the grey ring is: deeper in light, paler in dark.
        const ringLight = `var(--continuum-p-${steps[reach(3, 1, ground.light)]})`;
        const ringDark = `var(--continuum-p-${steps[reach(3, -1, ground.dark)]})`;
        light['--color-focus'] = ringLight;
        if (ringDark !== ringLight) dark['--color-focus'] = ringDark;
    }
    const lit = (step: number) => `var(--continuum-p-${steps[Math.max(0, step - 1)]})`;
    if (style !== 'flat') {
        light['--color-action-highlight'] =
            action === 'accent'
                ? lit(5)
                : 'color-mix(in oklab, var(--color-on-action) 20%, transparent)';
        light['--color-action-ring'] = 'var(--color-action)';
    }
    if (style === 'glossy') {
        light['--action-gradient'] =
            action === 'accent'
                ? `linear-gradient(180deg, ${lit(5)}, var(--continuum-p-500))`
                : 'linear-gradient(180deg, var(--color-neutral-800), var(--color-neutral-950))';
    }

    if ((options.tint ?? defaultThemeOptions.tint) === 'accent') {
        light['--color-tint'] = 'var(--color-primary-50)';
        light['--color-tint-fg'] = 'var(--color-primary-700)';
        // 700 reads back to a deep step on the dark wash; the raw 300 stays legible.
        dark['--color-tint-fg'] = 'var(--continuum-p-300)';
    }

    // The page you are on in the sidebar; the sections that hold it stay plain. A theme saved
    // under an earlier name still reads; the filled looks, since removed, read as quiet.
    const navNames: Record<string, ThemeOptions['nav']> = {
        neutral: 'quiet',
        tint: 'tinted',
        fill: 'quiet',
        bold: 'quiet',
    };
    const nav = navNames[String(options.nav)] ?? options.nav ?? defaultThemeOptions.nav;
    const tintAt = (fill: string, text: string) => {
        light[fill] = 'var(--color-primary-100)';
        light[text] = 'var(--color-primary-700)';
        // The 100 reads back to the 900 in dark, a muddy step darker than the canvas it should
        // lift from: the accent's 600 shows through instead, lighter and in its own hue.
        dark[fill] = 'color-mix(in oklab, var(--continuum-p-600) 20%, transparent)';
        // 700 reads back to a deep step on the dark tint; the raw 300 sits too near the 600 the
        // fill is made of, so the text takes the 200 to stand apart from it.
        dark[text] = 'var(--continuum-p-200)';
    };
    if (nav === 'tinted') {
        tintAt('--color-nav-active', '--color-nav-active-fg');
    } else if (nav === 'raised') {
        // A card on the canvas: the surface, a hairline and a short shadow. Dark reads the greys
        // back to front, so there the surface would sink below the canvas: the item is the canvas
        // lit a little instead, with a faint light edge.
        light['--color-nav-active'] = 'var(--color-neutral-50)';
        light['--color-nav-active-border'] = 'var(--color-neutral-200)';
        light['--shadow-nav-active'] = '0 1px 2px 0 rgb(20 22 23 / 0.06)';
        dark['--color-nav-active'] =
            'color-mix(in oklab, var(--color-neutral-950) 7%, transparent)';
        dark['--color-nav-active-border'] =
            'color-mix(in oklab, var(--color-neutral-950) 10%, transparent)';
        dark['--shadow-nav-active'] = '0 1px 2px 0 rgb(0 0 0 / 0.4)';
    }

    // Cards and the controls on them lift together; the strength darkens them, the size spreads them.
    const elevation = options.elevation ?? defaultThemeOptions.elevation;
    if (elevation !== 'flat') {
        const k = Math.max(0, options.shadowStrength ?? 1);
        const z = Math.max(0.25, options.shadowSize ?? 1);
        const n = (value: number) => Number(value.toFixed(2));
        const shadow = (layers: [number, number, number, number][], tint: string, scale: number) =>
            layers
                .map(
                    ([y, blur, spread, alpha]) =>
                        `0 ${n(y * z)}px ${n(blur * z)}px ${n(spread * z)}px rgb(${tint} / ${n(Math.min(1, alpha * k * scale))})`,
                )
                .join(', ');
        // A card lifts a little more than a control, so the two read as layers.
        const card: [number, number, number, number][] = [
            [1, 2, 0, 0.06],
            [4, 12, -2, 0.08],
        ];
        const control: [number, number, number, number][] = [
            [1, 2, 0, 0.07],
            [2, 4, -1, 0.05],
        ];
        // Dark: the canvas is near black, so a black shadow has little to darken. It is drawn
        // deeper and wider there, and the lift is said mostly by a faint light top edge, as a
        // surface catching light from above; the strength sets both.
        const edge = (alpha: number) =>
            `inset 0 1px 0 0 rgb(255 255 255 / ${n(Math.min(0.2, alpha * k))})`;
        const deep = (layers: [number, number, number, number][]) =>
            layers.map(([y, blur, spread, alpha]): [number, number, number, number] => [
                y * 1.5,
                blur * 1.5,
                spread,
                alpha,
            ]);
        light['--shadow-card'] = shadow(card, '20 22 23', 1);
        dark['--shadow-card'] = `${edge(0.06)}, ${shadow(deep(card), '0 0 0', 6)}`;
        light['--shadow-control'] = shadow(control, '20 22 23', 1);
        dark['--shadow-control'] = `${edge(0.05)}, ${shadow(deep(control), '0 0 0', 6)}`;
    }

    if ((options.dock ?? defaultThemeOptions.dock) === 'rounded') {
        light['--continuum-r-dock'] = '10px';
        light['--continuum-r-pill'] = '8px';
    }

    if (options.radius !== undefined && options.radius !== 1) {
        light['--continuum-radius-scale'] = String(options.radius);
    }

    if (options.chartTexture === 'stripes') light['--chart-texture-stripes'] = '1';
    if (options.chartTexture === 'dots') light['--chart-texture-dots'] = '1';

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
            // Series 1 is a step of the primary while it keeps the primary's hue, and a colour of
            // its own once it has been turned away from it.
            const first = (mode: 'light' | 'dark') => {
                const color = series[mode][0];
                return series.leadTurn === 0 || !color
                    ? `var(--continuum-p-${steps[series.primaryStep[mode]]})`
                    : toCss(color, gamut);
            };
            light['--color-chart-1'] = first('light');
            light['--color-chart-5'] = 'var(--continuum-p-600)';
            for (const i of [1, 2, 3]) {
                const lit = series.light[i];
                const deep = series.dark[i];
                if (lit) light[`--color-chart-${i + 1}`] = toCss(lit, gamut);
                if (deep) dark[`--color-chart-${i + 1}`] = toCss(deep, gamut);
                light[`--color-chart-series-${i + 1}`] = `var(--color-chart-${i + 1})`;
            }
            // A 500 sinks into a dark surface, so the set starts a step lighter.
            dark['--color-chart-1'] = first('dark');
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
