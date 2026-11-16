'use client';

import { presets } from '@playground/presets';
import {
    Button,
    cn,
    createThemeCss,
    focusRing,
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
    Theme,
    type ThemeOptions,
    themeAccentRamp,
} from 'continuum';
import { ArrowRight, Moon, RotateCcw, SlidersHorizontal, Sparkles, Sun } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type ComponentProps, type ReactNode, useMemo, useState } from 'react';
import { appLink, themeBuilderLink } from '@/lib/site';
import { heroScreens } from '../hero-screens';
import { ease, Reveal, RuledFrame, Shot } from '../web';

/*
 * The hero, on the board: the news, the promise, one way in, and under it the product itself. The
 * window shows four screens of one product suite at Continuum's real size, never scaled, so 13px
 * stays 13px; its title bar holds them as browser tabs and opens Customize, a small theme builder
 * that restyles the screen in place.
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

/**
 * The site's own theme, ContinuumUI (brand/continuum-ui/app.css), as the builder's options. Untouched,
 * the screen wears the exported theme itself (`continuum-ui`, scoped by scripts/scope-theme.mjs);
 * these are where Customize starts from once the reader changes something.
 */
const CONTINUUM_UI = 'continuum-ui';

const continuumUiTheme: ThemeOptions = {
    accent: '#ffa31a',
    action: 'accent',
    actionStyle: 'flat',
    neutral: { hue: 232, tint: 0.004 },
    radius: 1.5,
};

/** The starts: ContinuumUI, then the playground's presets. */
const starts: { id: string; label: string; theme: ThemeOptions }[] = [
    { id: CONTINUUM_UI, label: 'ContinuumUI', theme: continuumUiTheme },
    ...presets.map(preset => ({ id: preset.id, label: preset.label, theme: preset.theme })),
];

type Choices = {
    start: string;
    accent?: string;
    radius: string;
    size: string;
    font: string;
    mode: 'light' | 'dark';
};

const defaultChoices: Choices = {
    start: CONTINUUM_UI,
    radius: '1.5',
    size: '1',
    font: 'geist',
    mode: 'dark',
};

const HERO_THEME = 'hero-custom';

const themeOf = (choices: Choices): ThemeOptions => {
    const start = starts.find(item => item.id === choices.start) ?? { theme: continuumUiTheme };
    return {
        ...start.theme,
        accent: choices.accent ?? start.theme.accent,
        action: 'accent',
        radius: Number(choices.radius),
        size: Number(choices.size),
        font: choices.font,
    };
};

/** An option drawn as what it does: a small figure over its name. */
type Option = { value: string; label: string; figure: ReactNode };

/** The corner each choice gives a control, drawn as a quarter frame. */
const Corner = ({ radius }: { radius: number }) => (
    <span
        aria-hidden
        className="size-5 translate-x-1 translate-y-1 border-neutral-950 border-t-2 border-l-2"
        style={{ borderTopLeftRadius: radius }}
    />
);

/** How tall each choice draws a row: three bars at its height. */
const Rows = ({ height }: { height: number }) => (
    <span aria-hidden className="flex w-8 flex-col gap-0.5">
        {[0, 1, 2].map(row => (
            <span className="rounded-[2px] bg-neutral-950/25" key={row} style={{ height }} />
        ))}
    </span>
);

const cornerOptions: Option[] = [
    { value: '0', label: 'Square', figure: <Corner radius={0} /> },
    { value: '1', label: 'Soft', figure: <Corner radius={6} /> },
    { value: '1.5', label: 'Round', figure: <Corner radius={12} /> },
];

const densityOptions: Option[] = [
    { value: '0.9', label: 'Compact', figure: <Rows height={4} /> },
    { value: '1', label: 'Default', figure: <Rows height={5} /> },
    { value: '1.1', label: 'Large', figure: <Rows height={6} /> },
];

const fontOptions: Option[] = [
    {
        value: 'geist',
        label: 'Geist',
        figure: (
            <span className="text-lg leading-none" style={{ fontFamily: 'Geist Variable' }}>
                Aa
            </span>
        ),
    },
    {
        value: 'inter',
        label: 'Inter',
        figure: (
            <span className="text-lg leading-none" style={{ fontFamily: 'Inter Variable' }}>
                Aa
            </span>
        ),
    },
];

const modeOptions: Option[] = [
    { value: 'light', label: 'Light', figure: <Sun className="size-4" strokeWidth={2} /> },
    { value: 'dark', label: 'Dark', figure: <Moon className="size-4" strokeWidth={2} /> },
];

/** One question of the panel: its name, then its options as tiles in a row. */
const Tiles = ({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}) => (
    <fieldset className="flex min-w-0 flex-col">
        <legend className="mb-2 text-neutral-600 text-xs">{label}</legend>
        <div className={cn('grid gap-1.5', options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
            {options.map(option => (
                <button
                    aria-pressed={value === option.value}
                    className={cn(
                        'flex h-16 flex-col items-center justify-center gap-2 rounded-item border border-neutral-200 text-neutral-600 text-xs transition-[background-color,border-color,color] duration-150',
                        'hover:bg-neutral-950/5 hover:text-neutral-950',
                        'aria-pressed:border-neutral-400 aria-pressed:bg-selected aria-pressed:text-neutral-950',
                        focusRing,
                    )}
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    type="button"
                >
                    <span className="flex h-6 items-center justify-center text-neutral-950">
                        {option.figure}
                    </span>
                    {option.label}
                </button>
            ))}
        </div>
    </fieldset>
);

/** A ring around a swatch, off the surface so it reads on any colour. */
const ringOn = 'shadow-[0_0_0_2px_var(--color-neutral-50),0_0_0_4px_var(--color-neutral-950)]';
const ringHover =
    'hover:shadow-[0_0_0_2px_var(--color-neutral-50),0_0_0_4px_var(--color-neutral-300)]';

const Customizer = ({
    choices,
    onChange,
}: {
    choices: Choices;
    onChange: (next: Partial<Choices>) => void;
}) => {
    const start = starts.find(item => item.id === choices.start);
    const changed = JSON.stringify(choices) !== JSON.stringify(defaultChoices);

    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button className="rim-light" variant="secondary">
                        <SlidersHorizontal {...icon} />
                        Customize
                    </Button>
                }
            />
            <PopoverContent align="end" className="w-80 gap-0 p-0" sideOffset={8}>
                <div className="flex items-start justify-between gap-3 border-neutral-200 border-b py-3 pr-3 pl-4">
                    <PopoverHeader>
                        <PopoverTitle>Customize</PopoverTitle>
                        <PopoverDescription>Every part of the screen follows.</PopoverDescription>
                    </PopoverHeader>
                    <Button
                        aria-label="Reset"
                        disabled={!changed}
                        onClick={() => onChange(defaultChoices)}
                        size="icon-sm"
                        variant="ghost"
                    >
                        <RotateCcw {...icon} />
                    </Button>
                </div>
                <div className="flex flex-col gap-5 p-4">
                    <fieldset className="flex flex-col">
                        <legend className="mb-2 flex w-full items-center justify-between text-neutral-600 text-xs">
                            <span>Accent</span>
                            <span className="text-neutral-950">
                                {choices.accent ? 'Your own' : start?.label}
                            </span>
                        </legend>
                        <div className="flex items-center gap-2.5 py-1">
                            {starts.map(item => {
                                const on = choices.start === item.id && !choices.accent;
                                return (
                                    <button
                                        aria-label={item.label}
                                        aria-pressed={on}
                                        className={cn(
                                            'size-7 rounded-full ring-1 ring-neutral-950/10 ring-inset transition-[box-shadow] duration-150',
                                            on ? ringOn : ringHover,
                                            focusRing,
                                        )}
                                        key={item.id}
                                        onClick={() =>
                                            onChange({ start: item.id, accent: undefined })
                                        }
                                        style={{ background: themeAccentRamp(item.theme)[5] }}
                                        type="button"
                                    />
                                );
                            })}
                            <span aria-hidden className="h-5 w-px bg-neutral-200" />
                            <label
                                className={cn(
                                    'relative size-7 cursor-pointer rounded-full bg-[conic-gradient(from_180deg,#f43f5e,#f59e0b,#84cc16,#06b6d4,#6366f1,#d946ef,#f43f5e)] transition-[box-shadow] duration-150',
                                    choices.accent ? ringOn : ringHover,
                                )}
                            >
                                <span className="sr-only">Your own colour</span>
                                <input
                                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                                    onChange={event => onChange({ accent: event.target.value })}
                                    type="color"
                                    value={choices.accent ?? '#ffa31a'}
                                />
                            </label>
                        </div>
                    </fieldset>
                    <Tiles
                        label="Corners"
                        onChange={radius => onChange({ radius })}
                        options={cornerOptions}
                        value={choices.radius}
                    />
                    <Tiles
                        label="Density"
                        onChange={size => onChange({ size })}
                        options={densityOptions}
                        value={choices.size}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Tiles
                            label="Font"
                            onChange={font => onChange({ font })}
                            options={fontOptions}
                            value={choices.font}
                        />
                        <Tiles
                            label="Mode"
                            onChange={mode => onChange({ mode: mode as Choices['mode'] })}
                            options={modeOptions}
                            value={choices.mode}
                        />
                    </div>
                </div>
                <a
                    className={cn(
                        'group flex items-center gap-3 rounded-b-[inherit] border-neutral-200 border-t px-4 py-3 text-xs transition-[background-color] duration-150 hover:bg-neutral-950/5',
                        focusRing,
                    )}
                    // The customizer's colour goes with it, once the reader has made it their own.
                    href={themeBuilderLink(changed ? themeOf(choices).accent : undefined)}
                >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-medium text-neutral-950">Open the theme builder</span>
                        <span className="text-neutral-600">
                            Greys, type, charts, contrast checks and the export.
                        </span>
                    </span>
                    <ArrowRight
                        className="size-4 shrink-0 text-neutral-600 transition-[translate,color] duration-150 group-hover:translate-x-0.5 group-hover:text-neutral-950"
                        strokeWidth={2}
                    />
                </a>
            </PopoverContent>
        </Popover>
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
                                className="absolute inset-x-3 bottom-1 h-px origin-left bg-primary-500"
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
    const [choices, setChoices] = useState<Choices>(defaultChoices);
    const reduce = useReducedMotion();
    const screen = heroScreens[index];
    // Untouched, the screen wears ContinuumUI as exported, in either mode (the export holds both); any
    // other change builds a theme from the choices.
    const customized =
        JSON.stringify({ ...choices, mode: defaultChoices.mode }) !==
        JSON.stringify(defaultChoices);
    const css = useMemo(
        () => (customized ? createThemeCss({ ...themeOf(choices), name: HERO_THEME }) : ''),
        [customized, choices],
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
                        choices={choices}
                        onChange={next => setChoices(value => ({ ...value, ...next }))}
                    />
                </TitleBar>
                <Theme
                    className="relative h-120 overflow-hidden bg-neutral-100 md:aspect-video md:h-auto"
                    mode={choices.mode}
                    role="tabpanel"
                    theme={customized ? HERO_THEME : CONTINUUM_UI}
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
        </div>
    );
};

/** A Button drawn as a link: the label is the Button's own children. */
const linkTo = (href: string) => (props: ComponentProps<'a'>) => <a href={href} {...props} />;

// The board holds the words alone; the product's window follows under it, outside, at the page's full
// width, so the screen reads as the thing shown rather than something lying on the board.
export const Hero = () => (
    <>
        <RuledFrame outerClassName="pb-0 md:pb-0" top>
            <section
                aria-labelledby="hero-title"
                className="flex scroll-mt-20 flex-col px-2 py-20 md:px-3 md:py-48"
                id="top"
            >
                <div className="mx-auto flex max-w-[760px] flex-col items-center gap-8 px-2 text-center">
                    <div className="flex flex-col items-center gap-6">
                        <Reveal>
                            <a
                                className={cn(
                                    'group inline-flex h-8 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-1 text-neutral-950 text-xs transition-[border-color] duration-150 hover:border-neutral-300',
                                    focusRing,
                                )}
                                href="#mcp"
                            >
                                <span className="flex h-6 items-center gap-1 rounded-full bg-primary-500/15 pr-2.5 pl-2 font-medium text-primary-500">
                                    <Sparkles className="size-3.5" strokeWidth={2} />
                                    New
                                </span>
                                <span className="whitespace-nowrap font-medium">
                                    <span className="hidden sm:inline">an </span>MCP connection
                                    <span className="hidden sm:inline"> for every project</span>
                                </span>
                                <span className="flex size-6 items-center justify-center rounded-full border border-neutral-200 transition-[translate] duration-150 group-hover:translate-x-0.5">
                                    <ArrowRight className="size-3" strokeWidth={2} />
                                </span>
                            </a>
                        </Reveal>
                        <Reveal delay={1}>
                            <h1
                                className="text-balance font-medium text-4xl text-neutral-950 leading-[1.05] tracking-[-0.02em] md:text-5xl"
                                id="hero-title"
                            >
                                A better way to build consistent interfaces.
                            </h1>
                        </Reveal>
                        <Reveal delay={2}>
                            <p className="mx-auto max-w-[580px] text-pretty text-base text-neutral-600 leading-[1.6] md:text-lg">
                                A complete design system and developer toolkit for modern product
                                teams. With reusable components, AI agent skills, MCP integrations
                                and tools to streamline your workflow.
                            </p>
                        </Reveal>
                    </div>
                    <Reveal className="flex flex-wrap items-center justify-center gap-3" delay={3}>
                        <Button render={linkTo(appLink())} size="lg">
                            Get started
                            <ArrowRight strokeWidth={2} />
                        </Button>
                    </Reveal>
                </div>
            </section>
        </RuledFrame>
        <div className="px-2 pt-3 pb-16 md:px-3 md:pb-32">
            <Reveal delay={4}>
                <HeroWindow />
            </Reveal>
        </div>
    </>
);
