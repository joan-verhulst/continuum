'use client';

import { FooterSlotProvider, HeaderActions, HeaderSlotProvider } from '@playground/layout';
import { sameTheme, useProjects } from '@playground/projects';
import { ProjectFlow } from '@playground/theme-editor/flow';
import { ExportDialog } from '@playground/theme-editor/parts';
import { PreviewPanel } from '@playground/theme-editor/preview';
import {
    createThemeCss,
    HeaderBar,
    Notice,
    type ThemeMode,
    type ThemeOptions,
    ToastProvider,
    useNotice,
    useToast,
} from 'continuum';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useMode } from '@/components/mode';
import { appLink } from '@/lib/site';
import { PaneScroll, ToolPanes } from '../_parts/panes';
import { begin, compact, type Stored, store } from './state';

/*
 * The theme builder on its page: the app's own parts, not the app. The controls pane holds the
 * app's ProjectFlow (the five steps, the stepper, Import, Back and Continue in the bar at its foot,
 * Export on Review) under a slim header bar; the result pane is the app's PreviewPanel (Light and
 * Dark, colour vision, Check and the contrast grid). The flow's slots, the header bar's actions and
 * the bar at the foot, are given here as the app's shell gives them.
 *
 * State: the theme lives in this browser (./state), kept as it changes; ⌘S only says so. A colour
 * in the address (?accent=) starts a fresh theme from it. Open in the app, the flow's last action,
 * sends the theme on as a project there (the same origin, so the app's own storage), opened at its
 * review.
 */

/** What the theme is called: in DESIGN.md and as the project in the app. */
const NAME = 'My theme';

/** The data-theme the theme is written under, for the preview. */
const THEME_ID = 'site-builder';

/** The step the app opens a sent theme at: its review. */
const REVIEW_STEP = 4;

/** Whether the key press is ⌘S or Ctrl+S. */
const isSaveKey = (event: KeyboardEvent) =>
    (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 's';

/** The preview's mode: the page's to begin with, and again whenever the reader switches the site's. */
const usePreviewMode = () => {
    const { mode: siteMode } = useMode();
    const [mode, setMode] = useState<ThemeMode>(siteMode);
    useEffect(() => setMode(siteMode), [siteMode]);
    return [mode, setMode] as const;
};

export const ThemeBuilderTool = () => (
    <ToastProvider timeout={2500}>
        <Builder />
    </ToastProvider>
);

const Builder = () => {
    const [stored, setStored] = useState<Stored>({ theme: {}, progress: 0 });
    // The kept theme is read once in the browser; nothing is written back until it has been.
    const [loaded, setLoaded] = useState(false);
    const [mode, setMode] = usePreviewMode();
    const [exporting, setExporting] = useState(false);
    const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
    const [footerSlot, setFooterSlot] = useState<HTMLElement | null>(null);
    const { notice, show } = useNotice();
    const toast = useToast();
    const projects = useProjects();

    useEffect(() => {
        setStored(begin());
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (loaded) store(stored);
    }, [loaded, stored]);

    const storedRef = useRef(stored);
    storedRef.current = stored;
    const theme = stored.theme;

    const set = (patch: Partial<ThemeOptions>) =>
        setStored(now => ({ ...now, theme: compact({ ...now.theme, ...patch }) }));

    // ⌘S or Ctrl+S: the theme is kept already, so it only says so, and never opens the browser's own save.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (!isSaveKey(event)) return;
            event.preventDefault();
            store(storedRef.current);
            toast.add({ title: 'Saved in this browser', type: 'success' });
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [toast]);

    // The controls answer at once; the theme behind the preview follows when React has time.
    const shown = useDeferredValue(theme);
    const css = useMemo(() => createThemeCss({ ...shown, name: THEME_ID }), [shown]);

    /**
     * Open in the app: the theme becomes a project in the app's own storage, opened at its review.
     * A project sent before and not changed in the app since is updated rather than made again; one
     * changed there is left as it is, and a new one made.
     */
    const openInApp = () => {
        const now = storedRef.current;
        const sent = now.sent;
        const prior = sent && projects.projects.find(project => project.id === sent.project);
        const from = { theme: now.theme, progress: REVIEW_STEP, flow: 2 };
        let id: string;
        if (prior && sent && sameTheme(prior.theme, sent.theme)) {
            projects.update(prior.id, from);
            id = prior.id;
        } else {
            id = projects.create(NAME, from).id;
        }
        store({ ...now, sent: { project: id, theme: now.theme } });
        window.location.assign(appLink({ view: 'projects', project: id }));
    };

    return (
        <>
            {css && <style>{css}</style>}
            <ToolPanes
                controls={
                    <>
                        <HeaderBar className="justify-start gap-3" sidebarToggle={false}>
                            <span className="truncate font-medium text-neutral-950">
                                Theme builder
                            </span>
                            {/* "Saved" hangs from the bar, as a save state does in the app. */}
                            <div
                                className="ml-auto flex shrink-0 items-center gap-4"
                                ref={setHeaderSlot}
                            />
                        </HeaderBar>
                        {/* The flow scrolls a new step back to its top through this slot. */}
                        <PaneScroll data-slot="sheet-area">
                            <HeaderSlotProvider value={headerSlot}>
                                <FooterSlotProvider value={footerSlot}>
                                    {loaded && (
                                        <div className="flex flex-col gap-10 p-6">
                                            <HeaderActions>
                                                <Notice {...notice} />
                                            </HeaderActions>
                                            <ProjectFlow
                                                dirty={false}
                                                inUse={false}
                                                labels={{
                                                    use: 'Open in the app',
                                                    useAnyway: 'Open in the app anyway',
                                                }}
                                                name={NAME}
                                                narrowNote="The preview is under the steps."
                                                onExport={() => setExporting(true)}
                                                onProgress={progress =>
                                                    setStored(now => ({ ...now, progress }))
                                                }
                                                // The theme is kept as it changes; leaving a step only says so.
                                                onSave={() => show('Saved in this browser')}
                                                onUse={openInApp}
                                                progress={stored.progress}
                                                set={set}
                                                theme={theme}
                                                titleAs="h2"
                                                used={false}
                                            />
                                        </div>
                                    )}
                                </FooterSlotProvider>
                            </HeaderSlotProvider>
                        </PaneScroll>
                        {/* The flow's own bar at the foot: Back and Continue, or the last action. */}
                        <div className="contents" ref={setFooterSlot} />
                    </>
                }
                controlsLabel="Theme steps"
                result={
                    <PreviewPanel
                        mode={mode}
                        onModeChange={setMode}
                        set={set}
                        theme={shown}
                        themeId={THEME_ID}
                    />
                }
                resultLabel="Preview"
            />
            <ExportDialog
                label={NAME}
                mode={mode}
                onGamut={gamut => set({ gamut: gamut === 'p3' ? undefined : gamut })}
                onOpenChange={setExporting}
                open={exporting}
                options={theme}
            />
        </>
    );
};
