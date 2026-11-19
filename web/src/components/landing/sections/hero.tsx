'use client';

import { FooterSlotProvider } from '@playground/layout';
import { sameTheme } from '@playground/projects';
import { ProjectFlow } from '@playground/theme-editor/flow';
import { ExportDialog } from '@playground/theme-editor/parts';
import {
    Button,
    ContinuumMark,
    cn,
    createThemeCss,
    focusRing,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    Theme,
    type ThemeMode,
    type ThemeOptions,
} from 'continuum';
import { Moon, RotateCcw, SlidersHorizontal, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useDeferredValue, useMemo, useState } from 'react';
import { compact, load, store } from '@/app/tools/theme-builder/state';
import { themeBuilderLink } from '@/lib/site';
import { heroScreens } from '../hero-screens';
import { RimLight } from '../rim-light';
import { PRODUCT_THEME, productTheme } from '../theme';
import { ease, Reveal, RuledFrame, Section, Shot } from '../web';
import { Comparison } from './fair-test';

/*
 * The hero, on the board: the news, the promise, one way in, and under it the product itself. The
 * window shows four screens of one product suite at Continuum's real size, never scaled, so 13px
 * stays 13px; its title bar holds them as browser tabs and opens Customize, the theme builder's steps
 * in a sheet beside the page, restyling the screen in place.
 */

/**
 * The least size the screens are drawn at, and composed for: 16:9, the window at a 1440 screen
 * (1414 × 795) holding all of it. A larger window gets the shell filling it, as the app on a larger
 * screen; a smaller one crops it.
 */
const DRAWN = { width: 1408, height: 792 };

/** The sidebar's width: the first thing a narrower window crops, so the page stays whole longest. */
const SIDEBAR = 256;

const icon = { strokeWidth: 2 } as const;

/* ---------- The customizer ---------- */

/** What the theme is called in the flow and its export. */
const NAME = 'ContinuumUI';

const HERO_THEME = 'hero-custom';

/** The step the theme builder opens a sent theme at: its review. */
const REVIEW_STEP = 4;

/**
 * Customize: the theme builder's own five steps (the app's ProjectFlow), in a sheet beside the page,
 * starting from ContinuumUI, the theme the screen wears. The sheet is not modal, so the screen stays
 * in view and follows every change; its foot holds the flow's Back and Continue and, at the end, the
 * theme carried on to the theme builder.
 */
const Customizer = ({
    theme,
    set,
    onReset,
    mode,
    onMode,
}: {
    theme: ThemeOptions;
    set: (patch: Partial<ThemeOptions>) => void;
    onReset: () => void;
    mode: ThemeMode;
    onMode: (mode: ThemeMode) => void;
}) => {
    const [progress, setProgress] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [footerSlot, setFooterSlot] = useState<HTMLElement | null>(null);
    const changed = !sameTheme(theme, productTheme);

    // The theme goes on to the builder as the reader's own, opened at its review.
    const openBuilder = () => {
        store({ ...load(), theme, progress: REVIEW_STEP });
        window.location.assign(themeBuilderLink());
    };

    return (
        <Sheet>
            {/* The one control on the window, found by the rainbow turning round its edge. */}
            <RimLight className="rounded-control" glow={0.6} haloBlur={4} lap={3.5} loop>
                <SheetTrigger
                    render={
                        <Button variant="secondary">
                            <SlidersHorizontal {...icon} />
                            Customize
                        </Button>
                    }
                />
            </RimLight>
            <SheetContent>
                <SheetHeader icon={<SlidersHorizontal />}>
                    <SheetTitle>Customize</SheetTitle>
                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            aria-label={mode === 'dark' ? 'Light mode' : 'Dark mode'}
                            onClick={() => onMode(mode === 'dark' ? 'light' : 'dark')}
                            size="icon-sm"
                            variant="ghost"
                        >
                            {mode === 'dark' ? <Sun {...icon} /> : <Moon {...icon} />}
                        </Button>
                        <Button
                            aria-label="Reset"
                            disabled={!changed}
                            onClick={onReset}
                            size="icon-sm"
                            variant="ghost"
                        >
                            <RotateCcw {...icon} />
                        </Button>
                    </div>
                </SheetHeader>
                {/* The flow scrolls a new step back to its top through the sheet area. */}
                <SheetBody data-slot="sheet-area">
                    <FooterSlotProvider value={footerSlot}>
                        <div className="flex flex-col gap-10 p-6">
                            <ProjectFlow
                                dirty={false}
                                inUse={false}
                                labels={{
                                    use: 'Open in the theme builder',
                                    useAnyway: 'Open in the theme builder anyway',
                                }}
                                name={NAME}
                                narrowNote="The screen behind follows every change."
                                onExport={() => setExporting(true)}
                                onProgress={setProgress}
                                onSave={() => {}}
                                onUse={openBuilder}
                                progress={progress}
                                set={set}
                                theme={theme}
                                titleAs="h2"
                                used={false}
                            />
                        </div>
                    </FooterSlotProvider>
                </SheetBody>
                {/* The flow's own bar at the foot: Back and Continue, or the last action. */}
                <div className="contents" ref={setFooterSlot} />
            </SheetContent>
            <ExportDialog
                label={NAME}
                mode={mode}
                onGamut={gamut => set({ gamut: gamut === 'p3' ? undefined : gamut })}
                onOpenChange={setExporting}
                open={exporting}
                options={theme}
            />
        </Sheet>
    );
};

/* ---------- The window ---------- */

/** How long a screen holds before the next one, while nobody has picked one. */
const HOLD_MS = 7000;

/**
 * The window's title bar, drawn as a browser's: three lights, the screens as tabs and, at the far
 * end, Customize lit by a turning rim. Until a visitor picks a screen they advance on their own,
 * the open tab filling as it holds; hovering the hero holds it still.
 */
const TitleBar = ({
    current,
    playing,
    onPick,
    onDone,
    children,
}: {
    current: number;
    playing: boolean;
    onPick: (index: number) => void;
    onDone: () => void;
    children: ReactNode;
}) => (
    <div className="flex shrink-0 items-center gap-3 border-neutral-200 border-b bg-neutral-50 py-1.5 pr-1.5 pl-4">
        <div aria-hidden className="flex shrink-0 gap-1.5">
            <span className="size-2.5 rounded-full bg-neutral-300" />
            <span className="size-2.5 rounded-full bg-neutral-300" />
            <span className="size-2.5 rounded-full bg-neutral-300" />
        </div>
        <div
            aria-label="Screens"
            className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]"
            role="tablist"
        >
            {heroScreens.map((screen, index) => {
                const on = index === current;
                const Icon = screen.icon;
                return (
                    <button
                        aria-selected={on}
                        className={cn(
                            'relative flex h-control w-40 shrink-0 items-center gap-2 overflow-hidden rounded-control px-3 text-xs transition-[background-color,color] duration-150',
                            on
                                ? 'bg-selected font-medium text-neutral-950'
                                : 'text-neutral-600 hover:bg-neutral-950/5 hover:text-neutral-950',
                            focusRing,
                        )}
                        key={screen.id}
                        onClick={() => onPick(index)}
                        role="tab"
                        type="button"
                    >
                        <Icon className="size-3.5 shrink-0" strokeWidth={2} />
                        <span className="truncate">{screen.title}</span>
                        {on && playing && (
                            <motion.span
                                animate={{ scaleX: 1 }}
                                aria-hidden
                                className="absolute inset-x-3 bottom-1 h-px origin-left bg-spectrum"
                                initial={{ scaleX: 0 }}
                                key={screen.id}
                                onAnimationComplete={onDone}
                                transition={{ duration: HOLD_MS / 1000, ease: 'linear' }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
        <div className="shrink-0">{children}</div>
    </div>
);

const HeroWindow = () => {
    const [index, setIndex] = useState(0);
    const [picked, setPicked] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [theme, setTheme] = useState<ThemeOptions>(productTheme);
    const [mode, setMode] = useState<ThemeMode>('dark');
    const reduce = useReducedMotion();
    const screen = heroScreens[index];
    // Untouched, the screen wears ContinuumUI as exported, in either mode (the export holds both); any
    // change builds a theme of its own, when React has time, so a drag in the sheet never waits on it.
    const shown = useDeferredValue(theme);
    const customized = !sameTheme(shown, productTheme);
    const css = useMemo(
        () => (customized ? createThemeCss({ ...shown, name: HERO_THEME }) : ''),
        [customized, shown],
    );
    const playing = !picked && !hovered && !reduce;

    return (
        <div
            className="relative z-10 w-full"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            {css && <style>{css}</style>}
            {/* The window and its bar are Continuum's own; only the screen inside follows Customize. */}
            <div className="flex flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-100 shadow-float">
                <TitleBar
                    current={index}
                    onDone={() => setIndex(value => (value + 1) % heroScreens.length)}
                    onPick={next => {
                        setPicked(true);
                        setIndex(next);
                    }}
                    playing={playing}
                >
                    <Customizer
                        mode={mode}
                        onMode={setMode}
                        onReset={() => setTheme(productTheme)}
                        set={patch => setTheme(now => compact({ ...now, ...patch }))}
                        theme={theme}
                    />
                </TitleBar>
                <Theme
                    className="relative h-120 overflow-hidden bg-neutral-100 md:aspect-video md:h-auto"
                    mode={mode}
                    role="tabpanel"
                    theme={customized ? HERO_THEME : PRODUCT_THEME}
                >
                    {/* A picture of the app, not a second app on the page: out of the outline and tab order.
                        At its real size, never scaled: it fills a larger window as the app would, and
                        a smaller one crops it, first the sidebar from the left, then the page's far
                        side and its foot. */}
                    <div
                        className="absolute top-0"
                        inert
                        style={{
                            left: `clamp(-${SIDEBAR}px, calc(100% - ${DRAWN.width}px), 0px)`,
                            width: `max(100%, ${DRAWN.width}px)`,
                            height: `max(100%, ${DRAWN.height}px)`,
                        }}
                    >
                        <motion.div
                            animate={{ opacity: 1 }}
                            className="size-full"
                            initial={reduce ? false : { opacity: 0 }}
                            key={screen?.id}
                            transition={{ duration: 0.25, ease }}
                        >
                            <Shot className="size-full">{screen?.render()}</Shot>
                        </motion.div>
                    </div>
                </Theme>
            </div>
            <MadeByBadge />
        </div>
    );
};

/**
 * What the window is, said as what it shows rather than how it was made: built with Continuum, each
 * screen from one prompt. A pill on the window's foot, half over its edge, in the shape of the
 * hero's own "New" pill above.
 */
const MadeByBadge = () => (
    <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-1/2">
        <div className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-neutral-200 bg-neutral-50 py-1 pr-4 pl-1 text-neutral-950 text-xs">
            <span className="flex h-7 items-center gap-1.5 rounded-full bg-neutral-950/8 pr-2.5 pl-2 font-medium">
                <ContinuumMark size={14} />
                Built with Continuum
            </span>
            <span className="text-neutral-600">
                <span className="sm:hidden">from a prompt</span>
                <span className="max-sm:hidden">
                    Every screen here came from one prompt to Claude Code
                </span>
            </span>
        </div>
    </div>
);

// The board fills the first screen: the words centred in it, the before and after lying on its foot
// and running out of it. The four screens follow as a section of their own (Screens, below).
export const Hero = () => (
    // Room under the board for the part of the before and after that runs out of it, plus a
    // section's gap before the divider: 408 + 64 on phones, 448 + 128 from md.
    <RuledFrame glow outerClassName="pb-118 md:pb-[calc(min(1408px,100vw-146px)*9/16-192px)]" top>
        <section
            aria-labelledby="hero-title"
            // As tall as the screen under the site's header (64) and the board's own inset.
            className="flex min-h-[calc(100svh-80px)] scroll-mt-20 flex-col px-2 pt-16 md:min-h-[calc(100svh-89px)] md:px-3 md:pt-20"
            id="top"
        >
            {/* The words, centred in the room above the before and after. */}
            <div className="mx-auto my-auto flex max-w-[760px] flex-col items-center gap-6 px-2 pb-12 text-center md:pb-16">
                <Reveal>
                    <h1
                        className="text-balance font-medium text-4xl text-neutral-950 leading-[1.05] tracking-[-0.02em] md:text-5xl"
                        id="hero-title"
                    >
                        A better way to build consistent interfaces.
                    </h1>
                </Reveal>
                <Reveal delay={1}>
                    <p className="mx-auto max-w-[580px] text-pretty text-base text-neutral-950/66 leading-[1.6] md:text-lg">
                        A complete design system and developer toolkit for modern product teams.
                        With reusable components, AI agent skills, MCP integrations and tools to
                        streamline your workflow.
                    </p>
                </Reveal>
            </div>
            {/* Before and after: the same page with Continuum and as a plain agent builds it. Its top
                (200 on phones, 320 from md) lies on the board; a negative margin as large as the
                rest lets that run out of the board's foot. */}
            <Reveal
                className="relative z-10 mx-auto -mb-102 w-full md:mb-[calc(320px-min(1408px,100vw-146px)*9/16)] md:w-[min(1408px,calc(100vw-146px))]"
                delay={2}
            >
                <Comparison />
            </Reveal>
        </section>
    </RuledFrame>
);

/**
 * The product's screens, as a section of their own under the hero: a head like every section's,
 * then the window with the four screens as tabs and Customize, at the page's full width.
 */
export const Screens = () => (
    <>
        <Section
            className="pb-12 md:pb-16"
            description="Every screen here was built from scratch with Continuum. Describe the page you need and it looks finished the first time, no designer and no rounds of fixes."
            title="A good-looking screen, from the first prompt."
        >
            {null}
        </Section>
        <div className="px-2 pb-16 md:px-3 md:pb-32">
            <Reveal>
                <HeroWindow />
            </Reveal>
        </div>
    </>
);
