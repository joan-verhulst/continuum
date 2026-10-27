import { hexToOklch, neutralRamp, type RampSteps, rampFromSeed, rampLightness } from './color';

/*
 * The theme builder. A theme is a handful of choices (an accent, how grey the
 * greys are, a font, how the action and the selection draw) turned into a
 * `.continuum[data-theme="name"]` block that overrides the default tokens.
 * Components never change; only the values behind the tokens do.
 */

export type ThemeFont = 'geist' | 'inter' | 'system' | (string & {});

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
    /** A hex colour; it becomes the primary ramp's 500 and the rest is built around it. */
    accent?: string;
    /** The greys: an oklch hue and the chroma at 500 (0 is pure grey; 0.012 is clearly tinted). */
    neutral?: { hue: number; tint: number };
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
    /** Data colours of the theme's own; without them the accent leads the set. */
    charts?: ThemeCharts;
};

export const defaultThemeOptions = {
    name: 'custom',
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

const steps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

const neutralLightness = rampLightness(defaultNeutral);

export const themeFonts: Record<'geist' | 'inter' | 'system', string> = {
    geist: 'var(--font-geist, "Geist Variable"), "Geist", ui-sans-serif, system-ui, sans-serif',
    inter: 'var(--font-inter, "Inter Variable"), "Inter", ui-sans-serif, system-ui, sans-serif',
    system: 'ui-sans-serif, system-ui, sans-serif',
};

const fontFamily = (font: ThemeFont) =>
    font in themeFonts ? themeFonts[font as keyof typeof themeFonts] : font;

/** The neutral ramp a set of options produces, for previews. */
export const themeNeutralRamp = (options: ThemeOptions): RampSteps => {
    const neutral = options.neutral ?? defaultThemeOptions.neutral;
    // No tint is the baseline whatever the hue says.
    return neutral.tint === 0
        ? defaultNeutral
        : neutralRamp(neutral.hue, neutral.tint, neutralLightness);
};

/** The accent ramp a set of options produces, for previews; the default when the seed is missing or invalid. */
export const themeAccentRamp = (options: ThemeOptions): RampSteps => {
    const seed = options.accent ? hexToOklch(options.accent) : null;
    return seed ? rampFromSeed(seed) : defaultAccent;
};

export type ThemeVariables = {
    /** Set on `.continuum[data-theme]`. */
    light: Record<string, string>;
    /** Set on `.continuum[data-theme][data-mode="dark"]`. */
    dark: Record<string, string>;
};

/** Every token a set of options changes, as custom properties, for light and for dark. */
export const createThemeVariables = (options: ThemeOptions): ThemeVariables => {
    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};
    const hasAccent = Boolean(options.accent && hexToOklch(options.accent));

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

    const action = options.action ?? defaultThemeOptions.action;
    const style = options.actionStyle ?? defaultThemeOptions.actionStyle;
    if (action === 'accent') {
        light['--color-action'] = 'var(--color-primary-500)';
        light['--color-action-hover'] = 'var(--color-primary-600)';
        // The raw palest step, so the label stays light on the accent in both modes.
        light['--color-on-action'] = 'var(--continuum-p-50)';
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
    } else if (hasAccent) {
        // The accent leads the data colours; three more hues a quarter turn apart complete the set.
        light['--color-chart-1'] = 'var(--continuum-p-500)';
        light['--color-chart-5'] = 'var(--continuum-p-600)';
        light['--color-chart-2'] = 'oklch(from var(--color-chart-1) l c calc(h + 90))';
        light['--color-chart-3'] = 'oklch(from var(--color-chart-1) l c calc(h + 180))';
        light['--color-chart-4'] = 'oklch(from var(--color-chart-1) l c calc(h + 270))';
        light['--color-chart-series-2'] = 'var(--color-chart-2)';
        light['--color-chart-series-3'] = 'var(--color-chart-3)';
        light['--color-chart-series-4'] = 'var(--color-chart-4)';
        // A 500 sinks into a dark surface, so the set starts a step lighter.
        dark['--color-chart-1'] = 'var(--continuum-p-400)';
        dark['--color-chart-5'] = 'var(--continuum-p-300)';
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
