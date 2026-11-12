import { createThemeCss, Theme, type ThemeMode, ToastProvider } from 'continuum';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Foundations } from './foundations';
import { Home } from './home';
import { LeaveDialog, type LeaveGuard, LeaveGuardProvider } from './leave-guard';
import { type AppState, parseHash, toHash } from './meta';
import { Patterns } from './patterns';
import { CURRENT_PROJECT } from './project-switcher';
import { appliedThemeId, useProjects } from './projects';
import { RasterLab } from './raster/lab';
import { Shell } from './shell';
import { Charts, Components } from './showcase';
import { Projects } from './theme-editor';

/** Where the mode is kept, so a fresh visit opens in the one used last. */
const MODE = 'continuum.mode';

const stored = (key: string) => {
    try {
        return localStorage.getItem(key) ?? undefined;
    } catch {
        return undefined;
    }
};

const keep = (key: string, value?: string) => {
    try {
        if (value) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
    } catch {
        // Without storage it only holds for this visit.
    }
};

/** Whether a link names its mode; one that does not keeps the mode used last. */
const namesMode = (hash: string) => new URLSearchParams(hash.replace(/^#/, '')).has('mode');

const storedMode = (): ThemeMode | undefined => {
    const mode = stored(MODE);
    return mode === 'dark' || mode === 'light' ? mode : undefined;
};

/** Whether two states show a different page, which is a step the browser's Back should undo. */
const otherPage = (a: AppState, b: AppState) =>
    a.view !== b.view ||
    a.component !== b.component ||
    a.screen !== b.screen ||
    a.project !== b.project;

/** Whether going from one state to the next closes the open project's page, or opens another's. */
const leavesProject = (now: AppState, next: AppState) =>
    now.view === 'projects' &&
    Boolean(now.project) &&
    (next.view !== 'projects' || next.project !== now.project);

/** The page parts of a hash link, as a patch. */
const pagePatch = (hash: string): Partial<AppState> => {
    const { view, component, screen, project } = parseHash(hash);
    return { view, component, screen, project };
};

const useHashState = (guard: RefObject<LeaveGuard | undefined>, hold: (go: () => void) => void) => {
    const [state, setState] = useState<AppState>(() => {
        const hash = window.location.hash;
        const parsed = parseHash(hash);
        // A visit without a project in its link opens on the one worked on last, and in the mode used last.
        const current = parsed.project ?? stored(CURRENT_PROJECT);
        const mode = namesMode(hash) ? parsed.mode : (storedMode() ?? parsed.mode);
        return { ...parsed, mode, project: current, current };
    });

    // A deleted current project is let go of here too, so the next visit does not open on it.
    useEffect(() => keep(CURRENT_PROJECT, state.current), [state.current]);
    useEffect(() => keep(MODE, state.mode), [state.mode]);

    // The state last written to the hash, and whether the next one came from the hash itself.
    const written = useRef<AppState>(undefined);
    const fromHash = useRef(false);
    // The state on show, for the guard to judge a way out against.
    const latest = useRef(state);
    latest.current = state;

    useEffect(() => {
        // A link without a project, the list's, leaves the current one as it was; one without a mode, the mode.
        const sync = () => {
            // Back or Forward off a project with unsaved changes: the page comes back while the question
            // is asked, and answering it goes back again, now let through.
            const now = latest.current;
            const next = { ...now, ...pagePatch(window.location.hash) };
            if (guard.current?.dirty() && leavesProject(now, next)) {
                window.history.pushState(null, '', toHash(now));
                hold(() => window.history.back());
                return;
            }
            setState(now => {
                const hash = window.location.hash;
                const parsed = parseHash(hash);
                fromHash.current = true;
                return {
                    ...parsed,
                    mode: namesMode(hash) ? parsed.mode : now.mode,
                    current: parsed.project ?? now.current,
                    // The search is not a page, so Back and Forward leave it as typed.
                    search: now.search,
                };
            });
        };
        window.addEventListener('hashchange', sync);
        return () => window.removeEventListener('hashchange', sync);
    }, [guard, hold]);

    // A new page is a step in the browser's history, so Back returns to the one before; the mode,
    // the first normalisation and a page reached through the hash only rewrite the entry in place.
    useEffect(() => {
        const hash = toHash(state);
        const before = written.current;
        const pushed = before && !fromHash.current && otherPage(before, state);
        written.current = state;
        fromHash.current = false;
        if (window.location.hash === hash) return;
        if (pushed) window.history.pushState(null, '', hash);
        else window.history.replaceState(null, '', hash);
    }, [state]);

    // The shell scrolls a new view back to its top. Opening a project makes it the current one.
    const update = useCallback((patch: Partial<AppState>) => {
        setState(now => {
            const next = { ...now, ...patch };
            return next.project ? { ...next, current: next.project } : next;
        });
    }, []);

    // Every way the pages move: one that leaves a project with unsaved changes waits on the question.
    const navigate = useCallback(
        (patch: Partial<AppState>) => {
            const now = latest.current;
            if (guard.current?.dirty() && leavesProject(now, { ...now, ...patch })) {
                hold(() => update(patch));
                return;
            }
            update(patch);
        },
        [guard, hold, update],
    );

    return [state, navigate, update] as const;
};

/** The current project's theme as it was used, written for the whole playground; none for a draft. */
const useWornTheme = (current?: string) => {
    const { projects } = useProjects();
    const project = projects.find(item => item.id === current);
    const applied = project?.applied;
    const id = project ? appliedThemeId(project) : undefined;
    const css = useMemo(
        () => (applied && id ? createThemeCss({ ...applied, name: id }) : ''),
        [applied, id],
    );
    return { id: css ? id : undefined, css };
};

export const App = () => {
    // The open page's unsaved changes, if any, and a way out held while it asks about them.
    const guard = useRef<LeaveGuard>(undefined);
    const [held, setHeld] = useState<{ name: string; go: () => void }>();
    const [asking, setAsking] = useState(false);
    const hold = useCallback((go: () => void) => {
        setHeld({ name: guard.current?.name ?? 'this project', go });
        setAsking(true);
    }, []);
    const leave = (settle: (guard?: LeaveGuard) => void) => {
        settle(guard.current);
        setAsking(false);
        held?.go();
    };

    const [state, navigate, update] = useHashState(guard, hold);
    const worn = useWornTheme(state.current);
    const ref = useRef<HTMLDivElement>(null);

    // Overscroll shows the page behind the scope, so it follows the canvas colour.
    useEffect(() => {
        if (!ref.current) return;
        document.body.style.backgroundColor = getComputedStyle(ref.current).backgroundColor;
        document.documentElement.style.colorScheme = ref.current.dataset.mode ?? 'light';
    });

    return (
        // The root wears the current project's theme once it is used; Continuum's own until then.
        <Theme
            className="bg-neutral-100 text-neutral-950"
            mode={state.mode}
            // The demo links point at "#", which would wipe the state kept in the hash.
            onClickCapture={event => {
                const link =
                    event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
                const href = link?.getAttribute('href');
                if (!href) return;
                if (href === '#') {
                    event.preventDefault();
                    return;
                }
                // A link off a project with unsaved changes waits on the question, as a sidebar item
                // does; one opened in a new tab leaves this page as it is.
                const newTab =
                    event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0;
                if (newTab) return;
                const patch = pagePatch(href);
                if (guard.current?.dirty() && leavesProject(state, { ...state, ...patch })) {
                    event.preventDefault();
                    hold(() => update(patch));
                }
            }}
            ref={ref}
            theme={worn.id}
        >
            {worn.css && <style>{worn.css}</style>}
            <ToastProvider>
                <LeaveGuardProvider value={guard}>
                    <Shell onChange={navigate} state={state}>
                        {state.view === 'home' && <Home onChange={navigate} state={state} />}
                        {state.view === 'foundations' && <Foundations state={state} />}
                        {state.view === 'components' && (
                            <Components onChange={navigate} state={state} />
                        )}
                        {state.view === 'charts' && <Charts onChange={navigate} state={state} />}
                        {state.view === 'patterns' && (
                            <Patterns onChange={navigate} state={state} />
                        )}
                        {state.view === 'projects' && (
                            <Projects onChange={navigate} state={state} />
                        )}
                        {state.view === 'raster' && <RasterLab />}
                    </Shell>
                </LeaveGuardProvider>
                <LeaveDialog
                    name={held?.name ?? ''}
                    onCancel={() => setAsking(false)}
                    onDiscard={() => leave(guard => guard?.discard())}
                    onSave={() => leave(guard => guard?.save())}
                    open={asking}
                />
            </ToastProvider>
        </Theme>
    );
};
