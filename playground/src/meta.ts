import { type ThemeMode, type ThemeName, themes } from 'personal-design-system';

type ThemeMeta = {
    name: string;
    year: number;
    product: string;
    /** The mode the product was designed in; picking the theme switches to it. */
    mode: ThemeMode;
};

export const themeMeta: Record<ThemeName, ThemeMeta> = {
    eyes: { name: 'Eyes', year: 2026, product: 'Analytics', mode: 'light' },
    indigo: { name: 'Indigo', year: 2024, product: 'Email sequencing', mode: 'light' },
    electric: { name: 'Electric', year: 2025, product: 'Report editor', mode: 'light' },
    lime: { name: 'Lime', year: 2025, product: 'Report generator', mode: 'light' },
    stone: { name: 'Stone', year: 2025, product: 'Invoicing', mode: 'dark' },
    violet: { name: 'Violet', year: 2024, product: 'Sign-in', mode: 'dark' },
};

export const views = ['foundations', 'components', 'screens'] as const;

export type View = (typeof views)[number];

export type AppState = {
    theme: ThemeName;
    mode: ThemeMode;
    view: View;
    screen?: string;
};

export const parseHash = (hash: string): AppState => {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const theme = themes.find(name => name === params.get('theme')) ?? 'eyes';
    const mode = params.get('mode');
    const view = views.find(name => name === params.get('view')) ?? 'foundations';

    return {
        theme,
        mode: mode === 'light' || mode === 'dark' ? mode : themeMeta[theme].mode,
        view,
        screen: params.get('screen') ?? undefined,
    };
};

export const toHash = ({ theme, mode, view, screen }: AppState) => {
    const params = new URLSearchParams({ theme, mode, view });
    if (screen) params.set('screen', screen);
    return `#${params}`;
};
