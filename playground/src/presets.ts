import {
    createThemeVariables,
    drawnType,
    drawnUnit,
    isDefaultTheme,
    type ThemeCharts,
    type ThemeOptions,
    themeAccentRamp,
} from 'continuum';

/** Whether a theme differs from the system's own baseline: its options or its corners. */
export const isPreviewing = (theme: ThemeOptions) =>
    !isDefaultTheme(theme) || (theme.radius ?? 1) !== 1;

export type Preset = {
    id: string;
    label: string;
    /** The theme, its corner scale included. */
    theme: ThemeOptions;
};

/**
 * Eyes' own data colours: its green leads, then lime, yellow and orange, and a lighter green;
 * independent series take blue, violet and amber. The deep green lightens in dark mode.
 */
const eyesCharts: ThemeCharts = {
    steps: ['#00553e', '#89e25f', '#e2c35f', '#e2a15f', '#1a896b'],
    dark: ['#3f9c7d'],
    series: ['oklch(68.5% 0.169 237.3)', 'oklch(60.6% 0.25 292.7)', 'oklch(76.9% 0.188 70.1)'],
};

/**
 * Starting points for a new project, showing the range of the choices; a project edits any of
 * them from there. Without one a project starts on the system's own baseline, its fill the primary colour; Eyes is
 * the product it was distilled from.
 */
export const presets: Preset[] = [
    // Eyes' one green, used at opacities rather than in steps, as the seed of a ramp.
    {
        id: 'eyes',
        label: 'Eyes',
        theme: { accent: '#005740', action: 'accent', charts: eyesCharts },
    },
    {
        id: 'indigo',
        label: 'Indigo',
        theme: { accent: '#3939e5', font: 'inter', action: 'accent', radius: 0.8 },
    },
    {
        id: 'electric',
        label: 'Electric',
        theme: { accent: '#0000eb', font: 'inter', action: 'accent', radius: 0.7 },
    },
    {
        id: 'lime',
        label: 'Lime',
        theme: {
            accent: '#80af0d',
            font: 'inter',
            action: 'accent',
            actionStyle: 'lit',
            radius: 0.8,
        },
    },
    {
        id: 'stone',
        label: 'Stone',
        theme: {
            accent: '#2c52e8',
            font: 'inter',
            action: 'accent',
            actionStyle: 'glossy',
            radius: 0.8,
        },
    },
];

/** Two option sets are the same theme when they write the same tokens. */
const signature = (theme: ThemeOptions) => JSON.stringify(createThemeVariables(theme));

export const matchPreset = (theme: ThemeOptions) => {
    const own = signature(theme);
    return presets.find(preset => signature(preset.theme) === own);
};

/** The colour a preset's primary action takes, for a swatch drawn in the playground's own theme. */
export const presetSwatch = (theme: ThemeOptions) =>
    theme.action === 'accent' ? themeAccentRamp(theme)[5] : 'var(--color-action)';

/*
 * The sizes a product picks from, three questions apart: how large the type is, how much room
 * there is around things, and how tall the controls are. Each is a judged set rather than a free
 * number, and every one lands on whole pixels.
 */

export type SizeChoice<Value extends number> = { value: Value; label: string };

/** The base type size; every size on the scale follows it. */
export const typeChoices = [
    { value: 12, label: 'Small' },
    { value: drawnType, label: 'Default' },
    { value: 14, label: 'Large' },
] as const;

/** The spacing unit every padding, gap and margin is a multiple of. */
export const unitChoices = [
    { value: 3, label: 'Tight' },
    { value: drawnUnit, label: 'Default' },
    { value: 5, label: 'Roomy' },
] as const;

/** The height scale of controls, rows and bars. */
export const heightChoices = [
    { value: 0.9, label: 'Compact' },
    { value: 1, label: 'Default' },
    { value: 1.1, label: 'Large' },
] as const;

/** A theme's sizes in a line: its type, its unit and its heights. */
export const sizesLine = (theme: ThemeOptions) => {
    const height = heightChoices.find(item => item.value === (theme.size ?? 1));
    return `${theme.type ?? drawnType}px type · ${theme.unit ?? drawnUnit}px unit · ${(height?.label ?? 'own').toLowerCase()} heights`;
};
