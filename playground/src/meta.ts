import { defaultThemeOptions, type ThemeMode, type ThemeOptions } from 'continuum';
import { chartsPreset, presets } from './presets';

/** The id the builder's theme is written under; the default theme needs none. */
export const CUSTOM_THEME = 'custom';

export const views = ['home', 'foundations', 'components', 'patterns', 'raster', 'cms'] as const;

export type View = (typeof views)[number];

export type AppState = {
    /** The theme builder's choices; empty for the default theme. */
    theme: ThemeOptions;
    mode: ThemeMode;
    /** Corner scale, 0 to 2; 1 is the theme as drawn. */
    radius: number;
    view: View;
    /** The component whose page is open, in the components view. */
    component?: string;
    /** The screen or block whose page is open, in the patterns view. */
    screen?: string;
    /** The theme builder is open beside the page. */
    builder?: boolean;
};

const fonts = ['geist', 'inter', 'system'] as const;
const actions = ['neutral', 'accent'] as const;
const styles = ['flat', 'lit', 'glossy'] as const;
const washes = ['neutral', 'accent'] as const;
const segments = ['filled', 'raised'] as const;
const docks = ['pill', 'rounded'] as const;

const pick = <T extends string>(options: readonly T[], value: string | null) =>
    options.find(option => option === value);

const number = (value: string | null, fallback: number) => {
    const parsed = Number(value);
    return value !== null && Number.isFinite(parsed) ? parsed : fallback;
};

/** Drops the keys the hash did not set, so the options compare equal to the defaults when untouched. */
const compact = (options: ThemeOptions): ThemeOptions =>
    Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));

export const parseHash = (hash: string): AppState => {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const mode = params.get('mode');
    // The patterns were called screens once; an old link still lands on them.
    const named = params.get('view');
    const view = pick(views, named === 'screens' ? 'patterns' : named) ?? 'home';
    const radius = number(params.get('radius'), 1);
    const accent = params.get('accent');
    const tinted = params.has('hue') || params.has('tint');

    return {
        theme: compact({
            accent: accent && /^[0-9a-f]{6}$/i.test(accent) ? `#${accent}` : undefined,
            neutral: tinted
                ? {
                      hue: number(params.get('hue'), defaultThemeOptions.neutral.hue),
                      tint: number(params.get('tint'), defaultThemeOptions.neutral.tint),
                  }
                : undefined,
            font: pick(fonts, params.get('font')),
            action: pick(actions, params.get('action')),
            actionStyle: pick(styles, params.get('style')),
            tint: pick(washes, params.get('wash')),
            segment: pick(segments, params.get('segment')),
            dock: pick(docks, params.get('dock')),
            // A preset's own data colours travel by its name.
            charts: presets.find(preset => preset.id === params.get('charts'))?.theme.charts,
        }),
        mode: mode === 'dark' ? 'dark' : 'light',
        radius: Math.min(2, Math.max(0, radius)),
        view,
        component: params.get('component') ?? undefined,
        screen: params.get('screen') ?? undefined,
        builder: params.has('builder') || undefined,
    };
};

export const toHash = ({ theme, mode, radius, view, component, screen, builder }: AppState) => {
    const params = new URLSearchParams({ mode, view });
    if (theme.accent) params.set('accent', theme.accent.replace('#', ''));
    if (theme.neutral) {
        params.set('hue', String(theme.neutral.hue));
        params.set('tint', String(theme.neutral.tint));
    }
    if (theme.font) params.set('font', theme.font);
    if (theme.action) params.set('action', theme.action);
    if (theme.actionStyle) params.set('style', theme.actionStyle);
    if (theme.tint) params.set('wash', theme.tint);
    if (theme.segment) params.set('segment', theme.segment);
    if (theme.dock) params.set('dock', theme.dock);
    const charts = chartsPreset(theme.charts);
    if (charts) params.set('charts', charts.id);
    if (radius !== 1) params.set('radius', String(radius));
    if (component) params.set('component', component);
    if (screen) params.set('screen', screen);
    if (builder) params.set('builder', '');
    return `#${params}`.replace('builder=', 'builder');
};
