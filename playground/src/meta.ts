import type { ThemeMode } from 'continuum';

export const views = [
    'home',
    'foundations',
    'components',
    'charts',
    'patterns',
    'projects',
    'raster',
] as const;

export type View = (typeof views)[number];

export type AppState = {
    mode: ThemeMode;
    view: View;
    /** The component whose page is open, in the components view. */
    component?: string;
    /** The screen or block whose page is open, in the patterns view. */
    screen?: string;
    /** The project whose page is open, in the Projects view. */
    project?: string;
    /**
     * The project the playground is in: the last one opened or picked in the switcher, kept while
     * the list is open. Every page wears its theme once that is used. Never in the hash.
     */
    current?: string;
    /** Opens the new project dialog once, from the switcher; never in the hash. */
    creating?: boolean;
    /** Opens the open project's export dialog once, from the sidebar; never in the hash. */
    exporting?: boolean;
    /**
     * The components search, one query for the sidebar's list and the Components grid alike.
     * Never in the hash.
     */
    search?: string;
};

const pick = <T extends string>(options: readonly T[], value: string | null) =>
    options.find(option => option === value);

export const parseHash = (hash: string): AppState => {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const mode = params.get('mode');
    const named = params.get('view');
    // The patterns were called screens once, and themes were built in a sheet over a page; old links still land.
    const view = params.has('builder')
        ? 'projects'
        : (pick(views, named === 'screens' ? 'patterns' : named === 'theme' ? 'projects' : named) ??
          'home');

    return {
        mode: mode === 'dark' ? 'dark' : 'light',
        view,
        component: params.get('component') ?? undefined,
        screen: params.get('screen') ?? undefined,
        project: params.get('project') ?? undefined,
    };
};

export const toHash = ({ mode, view, component, screen, project }: AppState) => {
    const params = new URLSearchParams({ mode, view });
    if (component) params.set('component', component);
    if (screen) params.set('screen', screen);
    if (project) params.set('project', project);
    return `#${params}`;
};
