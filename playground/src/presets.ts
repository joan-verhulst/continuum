import {
    createThemeVariables,
    isDefaultTheme,
    type ThemeCharts,
    type ThemeOptions,
    themeAccentRamp,
} from 'continuum';

/** Whether a page previews a theme rather than the system's own baseline. */
export const isPreviewing = (theme: ThemeOptions, radius: number) =>
    !isDefaultTheme(theme) || radius !== 1;

export type Preset = {
    id: string;
    label: string;
    theme: ThemeOptions;
    radius: number;
};

/**
 * Starting points that show the range of the knobs; the builder edits any of them from there.
 * A theme is what shows at once: an accent, what the action is filled with and its shine, a
 * font and the corners. Without one the system is its own neutral baseline; Eyes is the product it was
 * distilled from. Continuum itself is not a theme: it is the system, and the playground's chrome.
 */
/**
 * Eyes' own data colours: its green leads, then lime, yellow and orange, and a lighter green;
 * independent series take blue, violet and amber. The deep green lightens in dark mode.
 */
const eyesCharts: ThemeCharts = {
    steps: ['#00553e', '#89e25f', '#e2c35f', '#e2a15f', '#1a896b'],
    dark: ['#3f9c7d'],
    series: ['oklch(68.5% 0.169 237.3)', 'oklch(60.6% 0.25 292.7)', 'oklch(76.9% 0.188 70.1)'],
};

export const presets: Preset[] = [
    // Eyes' one green, used at opacities rather than in steps, as the seed of a ramp.
    {
        id: 'eyes',
        label: 'Eyes',
        theme: { accent: '#005740', action: 'accent', charts: eyesCharts },
        radius: 1,
    },
    {
        id: 'indigo',
        label: 'Indigo',
        theme: { accent: '#3939e5', font: 'inter', action: 'accent' },
        radius: 0.8,
    },
    {
        id: 'electric',
        label: 'Electric',
        theme: { accent: '#0000eb', font: 'inter', action: 'accent' },
        radius: 0.7,
    },
    {
        id: 'lime',
        label: 'Lime',
        theme: { accent: '#80af0d', font: 'inter', action: 'accent', actionStyle: 'lit' },
        radius: 0.8,
    },
    {
        id: 'stone',
        label: 'Stone',
        theme: { accent: '#2c52e8', font: 'inter', action: 'accent', actionStyle: 'glossy' },
        radius: 0.8,
    },
];

/** The preset whose data colours these are, so the hash can name them rather than spell them out. */
export const chartsPreset = (charts?: ThemeCharts) =>
    charts &&
    presets.find(preset => JSON.stringify(preset.theme.charts) === JSON.stringify(charts));

/** Two option sets are the same theme when they write the same tokens. */
const signature = (theme: ThemeOptions) => JSON.stringify(createThemeVariables(theme));

export const matchPreset = (theme: ThemeOptions, radius: number) =>
    presets.find(
        preset => preset.radius === radius && signature(preset.theme) === signature(theme),
    );

/** The colour a preset's primary action takes, for a swatch drawn in the playground's own theme. */
export const presetSwatch = (theme: ThemeOptions) =>
    theme.action === 'accent' ? themeAccentRamp(theme)[5] : 'var(--color-action)';
