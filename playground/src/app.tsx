import { createThemeCss, isDefaultTheme, Theme } from 'continuum';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Foundations } from './foundations';
import { Home } from './home';
import { CmsTest } from './lab/cms';
import { type AppState, CUSTOM_THEME, parseHash, toHash } from './meta';
import { Patterns } from './patterns';
import { RasterLab } from './raster/lab';
import { Shell } from './shell';
import { Components } from './showcase';

const useHashState = () => {
    const [state, setState] = useState(() => parseHash(window.location.hash));

    useEffect(() => {
        const sync = () => setState(parseHash(window.location.hash));
        window.addEventListener('hashchange', sync);
        return () => window.removeEventListener('hashchange', sync);
    }, []);

    useEffect(() => {
        const hash = toHash(state);
        if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    }, [state]);

    // The shell scrolls a new view back to its top.
    const update = useCallback((patch: Partial<AppState>) => {
        setState(current => ({ ...current, ...patch }));
    }, []);

    return [state, update] as const;
};

export const App = () => {
    const [state, update] = useHashState();
    const ref = useRef<HTMLDivElement>(null);
    const custom = !isDefaultTheme(state.theme);

    // Overscroll shows the page behind the scope, so it follows the canvas colour.
    useEffect(() => {
        if (!ref.current) return;
        document.body.style.backgroundColor = getComputedStyle(ref.current).backgroundColor;
        document.documentElement.style.colorScheme = ref.current.dataset.mode ?? 'light';
    });

    return (
        // The root is Continuum's own look; the shell previews a theme on the page inside it.
        <Theme
            className="bg-neutral-100 text-neutral-950"
            mode={state.mode}
            // The demo links point at "#", which would wipe the state kept in the hash.
            onClickCapture={event => {
                if (event.target instanceof Element && event.target.closest('a[href="#"]')) {
                    event.preventDefault();
                }
            }}
            ref={ref}
        >
            {/* The builder's theme, applied the way a host app would: a block after the tokens. */}
            {custom && <style>{createThemeCss({ ...state.theme, name: CUSTOM_THEME })}</style>}
            <Shell onChange={update} state={state}>
                {state.view === 'home' && <Home onChange={update} state={state} />}
                {state.view === 'foundations' && <Foundations state={state} />}
                {state.view === 'components' && <Components onChange={update} state={state} />}
                {state.view === 'patterns' && <Patterns onChange={update} state={state} />}
                {state.view === 'raster' && <RasterLab />}
                {state.view === 'cms' && <CmsTest state={state} />}
            </Shell>
        </Theme>
    );
};
