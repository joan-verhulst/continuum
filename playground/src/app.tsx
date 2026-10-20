import { Theme } from 'personal-design-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Foundations } from './foundations';
import { Gallery } from './gallery';
import { type AppState, parseHash, toHash } from './meta';
import { ScreensView } from './screens-view';
import { Shell } from './shell';

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

    const update = useCallback((patch: Partial<AppState>) => {
        if (patch.view) window.scrollTo({ top: 0 });
        setState(current => ({ ...current, ...patch }));
    }, []);

    return [state, update] as const;
};

export const App = () => {
    const [state, update] = useHashState();
    const ref = useRef<HTMLDivElement>(null);

    // Overscroll shows the page behind the scope, so it follows the canvas colour.
    useEffect(() => {
        if (!ref.current) return;
        document.body.style.backgroundColor = getComputedStyle(ref.current).backgroundColor;
        document.documentElement.style.colorScheme = ref.current.dataset.mode ?? 'light';
    });

    return (
        <Theme
            className="min-h-screen bg-neutral-100 text-neutral-950"
            mode={state.mode}
            // The demo links point at "#", which would wipe the state kept in the hash.
            onClickCapture={event => {
                if (event.target instanceof Element && event.target.closest('a[href="#"]')) {
                    event.preventDefault();
                }
            }}
            ref={ref}
            theme={state.theme}
        >
            <Shell onChange={update} state={state}>
                {state.view === 'foundations' && <Foundations />}
                {state.view === 'components' && <Gallery />}
                {state.view === 'screens' && (
                    <ScreensView
                        onScreenChange={screen => update({ screen })}
                        screenId={state.screen}
                    />
                )}
            </Shell>
        </Theme>
    );
};
