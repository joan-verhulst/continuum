'use client';

import { cn, createThemeCss, Spinner, Theme, type ThemeOptions } from '@contui/ui';
import { screens } from '@screens/index';
import { Check, Lock, Pause, Play, Terminal } from 'lucide-react';
import {
    AnimatePresence,
    type AnimationPlaybackControls,
    animate,
    MotionConfig,
    type MotionValue,
    motion,
    type TargetAndTransition,
    type Transition,
    useInView,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useTransform,
} from 'motion/react';
import {
    type CSSProperties,
    createContext,
    Fragment,
    type ReactNode,
    use,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { FilmApp, type FilmState, PROJECT, THEME_IDS } from '../how-it-works/film-app';
import { Reveal, Section, Shot } from '../web';

/*
 * How it works: the loop, filmed on the product itself. Title cards between four scenes; in them
 * the playground as it is (its sidebar, the theme flow and its preview, Home, the MCP server's page),
 * drawn at its real size from its own parts, and a camera that pans and zooms over it while a cursor
 * works it. One clock drives it all: every scene reads its moment off it and keeps no timer of its
 * own, so the video can be paused, sought and looped.
 *
 * 1. Theme: New project, Acme; the primary colour typed in, the preview takes it; Controls, the
 *    lit shine and the corner scale drawn up.
 * 2. Project: Review, Use this theme, and the whole app wears it; Export, app.css and DESIGN.md.
 * 3. Connect: the MCP server's page, its install line copied and run; Claude Code lists it.
 * 4. Build: a prompt in Claude Code, the tools it calls on the server, then the screen it built,
 *    in Acme's theme.
 *
 * The camera and the cursor aim at the parts themselves (measured where they are at that moment),
 * never at coordinates written by hand, so a change to a part never leaves the film pointing at
 * where it used to be.
 */

/* ---------- Timeline ---------- */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN = [0.7, 0, 0.84, 0] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** The whole video's tempo: every duration, delay and cue goes through it. */
const PACE = 0.78;
const pace = (seconds: number) => seconds * PACE;

/** The scenes are laid out in pixels on this canvas, then scaled to the player. */
const CANVAS = { width: 1600, height: 1000 };

type Segment = { kind: 'title' | 'scene'; beat: number; duration: number };

const TITLE = 1.7;

/*
 * Theme runs straight on into Project, one take in the same window: a card between them would only
 * interrupt it. Connect and Build open on their own card, the scene wiped away and back.
 */
const SEGMENTS: Segment[] = [
    { kind: 'title', beat: 0, duration: TITLE },
    { kind: 'scene', beat: 0, duration: pace(11.0) },
    { kind: 'scene', beat: 1, duration: pace(9.0) },
    { kind: 'title', beat: 2, duration: TITLE },
    { kind: 'scene', beat: 2, duration: pace(9.2) },
    { kind: 'title', beat: 3, duration: TITLE },
    { kind: 'scene', beat: 3, duration: pace(11.6) },
];

const STARTS = SEGMENTS.map((_, index) =>
    SEGMENTS.slice(0, index).reduce((sum, segment) => sum + segment.duration, 0),
);
const TOTAL = SEGMENTS.reduce((sum, segment) => sum + segment.duration, 0);
const BEATS = 4;
const at = (index: number) => STARTS[index] ?? 0;

const segmentAt = (time: number) =>
    STARTS.reduce((found, start, index) => (time >= start ? index : found), 0);
const beatStart = (beat: number) => at(SEGMENTS.findIndex(segment => segment.beat === beat));
const beatEnd = (beat: number) => (beat + 1 < BEATS ? beatStart(beat + 1) : TOTAL);

const THEME = at(1);
const SAVE = at(2);
const CONNECT = at(4);
const BUILD = at(6);

const T = (s: number) => THEME + pace(s);
const P = (s: number) => SAVE + pace(s);
const C = (s: number) => CONNECT + pace(s);
const B = (s: number) => BUILD + pace(s);

const CUE = {
    appIn: T(0.3),
    newProject: T(1.9),
    typeName: T(2.45),
    create: T(3.3),
    hexClick: T(5.0),
    typeHex: T(5.15),
    commitHex: T(5.8),
    controls: T(7.4),
    lit: T(8.3),
    dragFrom: T(9.0),
    dragTo: T(9.9),

    review: P(0.9),
    use: P(2.0),
    exportClick: P(4.4),
    toastOut: P(4.4),
    mdTab: P(6.2),
    done: P(7.8),

    mcp: C(0.8),
    // Down the page to its install line, as a person scrolls to it.
    scroll: C(1.2),
    copy: C(2.6),
    chipOut: C(3.3),
    terminalIn: C(3.2),
    chipAbove: C(3.35),
    dock: C(3.9),
    command: C(4.5),
    run: C(4.8),
    lines: [C(5.1), C(5.4), C(5.7), C(6.0)],
    typeList: C(6.5),
    listRun: C(7.3),
    connected: C(7.7),
    // The app and the terminal leave under the next title card.
    appOut: at(5) + pace(1.0),

    claudeIn: B(0.3),
    typePrompt: B(0.9),
    send: B(2.6),
    tools: [B(3.0), B(3.45), B(3.9), B(4.35), B(4.8)],
    built: B(5.5),
    // One window at a time: the screen comes in once the thread has gone.
    claudeOut: B(6.0),
    browserIn: B(6.6),
};

/** The most telling moment of each beat: where a paused or still video stands. */
const STILLS = [T(10.4), P(3.2), C(8.2), B(8.6)];

const TimeContext = createContext<MotionValue<number> | null>(null);

const useTime = () => {
    const time = use(TimeContext);
    if (!time) throw new Error('useTime must be used within TimeContext');
    return time;
};

/** How many of the cues the playhead has passed: a scene re-renders only when it changes. */
const usePhase = (cues: number[]) => {
    const time = useTime();
    const count = (value: number) => cues.filter(cue => value >= cue).length;
    const [phase, setPhase] = useState(() => count(time.get()));
    useMotionValueEvent(time, 'change', value => {
        const next = count(value);
        setPhase(previous => (previous === next ? previous : next));
    });
    return phase;
};

const useCue = (cue: number) => usePhase([cue]) === 1;

/* ---------- Script ---------- */

const captions = [
    {
        label: 'Theme',
        title: 'Create a project theme',
    },
    {
        label: 'Export',
        title: 'Export the CSS and design brief',
    },
    {
        label: 'Connect',
        title: 'Set up Continuum in Claude Code',
    },
    {
        label: 'Build',
        title: 'Ask Claude to build the customers page',
    },
];

/** Asks for what the screen shows: its columns, the search and the filters. */
const PROMPT =
    'Build the customers page from @DESIGN.md: plan, status, revenue and owner, with search and filters.';
const INSTALL = 'npx contui init';
const LIST = 'claude mcp list';
const HEX = '#0f9f6e';

/** Acme's theme as it ends: the green primary, the lit shine, rounder corners. */
const ACME: ThemeOptions = { accent: HEX, actionStyle: 'lit', radius: 1.5 };

/** How far down the MCP server's page its install line sits, so the scroll brings it to the middle. */
const MCP_SCROLL = 480;

/** The playground at a moment of the film: a pure function of the playhead. */
const filmStateAt = (t: number): FilmState => {
    const drag = Math.min(1, Math.max(0, (t - CUE.dragFrom) / (CUE.dragTo - CUE.dragFrom)));
    // The corner scale moves in its own steps of 0.05.
    const radius = Math.round((1 + 0.5 * drag) * 20) / 20;
    const theme: ThemeOptions = {
        ...(t >= CUE.commitHex && { accent: HEX }),
        ...(t >= CUE.lit && { actionStyle: 'lit' }),
        ...(radius !== 1 && { radius }),
    };
    const typed = Math.max(0, Math.floor((t - CUE.typeName) / pace(0.09)));
    const view =
        t < CUE.create
            ? 'projects'
            : t < CUE.use
              ? 'project'
              : t < CUE.exportClick
                ? 'home'
                : t < CUE.mcp
                  ? 'project'
                  : 'mcp';
    return {
        view,
        project: t < CUE.create ? 'none' : t < CUE.use ? 'draft' : 'used',
        step: t < CUE.controls ? 0 : t < CUE.review ? 2 : 4,
        theme: t >= CUE.use ? ACME : theme,
        creating: t >= CUE.newProject && t < CUE.create,
        name: t >= CUE.typeName ? PROJECT.slice(0, typed) : '',
        exporting: t >= CUE.exportClick && t < CUE.done,
        exportTab: t >= CUE.mdTab ? 'md' : 'css',
        scroll: view === 'mcp' && t >= CUE.scroll ? MCP_SCROLL : 0,
        toast: t >= CUE.use && t < CUE.toastOut,
    };
};

/* ---------- Aiming at the parts ---------- */

type Box = { x: number; y: number; width: number; height: number };

/** A part of the canvas: a selector, or a finder for what a selector cannot say. */
type Spec = string | ((root: HTMLElement) => Element | null | undefined);

/** The smallest element whose own text is exactly this: a button, a tab, a label. */
const byText =
    (text: string, within = '') =>
    (root: HTMLElement) => {
        const scope = within ? root.querySelector(within) : root;
        if (!scope) return null;
        const found = Array.from(
            scope.querySelectorAll('button, [role=tab], [role=radio], label, a, span, p'),
        ).filter(element => element.textContent?.trim() === text);
        return (
            found.find(element => element.matches('button, [role=tab], [role=radio]')) ?? found[0]
        );
    };

/** A question of the theme flow by its heading, the block a control sits in. */
const question = (text: string) => (root: HTMLElement) =>
    Array.from(root.querySelectorAll('[data-slot="theme-question"]')).find(element =>
        element.textContent?.trim().startsWith(text),
    );

const HEX_INPUT = 'input[aria-label="Primary as hex"]';
const hexBlock = (root: HTMLElement) =>
    root.querySelector(HEX_INPUT)?.closest('[data-slot="theme-block"]');
const cornerSlider = (root: HTMLElement) =>
    question('Corners')(root)?.querySelector('[role="slider"]') ??
    root.querySelector('[data-slot="theme-question"] [role="slider"]');

const CanvasContext = createContext<HTMLElement | null>(null);

/** A part's box on the canvas, in its pixels, wherever the camera is and however it is scaled. */
const measure = (canvas: HTMLElement, spec: Spec): Box | null => {
    const element = typeof spec === 'string' ? canvas.querySelector(spec) : spec(canvas);
    if (!element) return null;
    const frame = canvas.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const k = frame.width / CANVAS.width;
    if (!k || !rect.width) return null;
    return {
        x: (rect.left - frame.left) / k,
        y: (rect.top - frame.top) / k,
        width: rect.width / k,
        height: rect.height / k,
    };
};

/** Measures a part once it is there: a part that mounts on the same cue is waited for. */
const useAim = (canvas: HTMLElement | null, key: number, find: () => Spec | null) => {
    const [box, setBox] = useState<Box | null>(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the cue to aim again; the spec is read then.
    useEffect(() => {
        const spec = find();
        if (!canvas || !spec) return;
        let tries = 0;
        let frame = 0;
        const look = () => {
            const found = measure(canvas, spec);
            if (found) return setBox(found);
            if (tries++ < 40) frame = requestAnimationFrame(look);
        };
        // A frame later, so a part that changes on this cue is drawn first.
        frame = requestAnimationFrame(look);
        return () => cancelAnimationFrame(frame);
    }, [canvas, key]);
    return box;
};

/* ---------- Camera ---------- */

type CameraShot = {
    at: number;
    /** What to frame; `whole` is the canvas. */
    on: Spec | 'whole';
    /** Trims or grows the measured box to the piece that matters. */
    cut?: (box: Box) => Box;
    /** Room around the box, in canvas pixels. */
    pad?: number;
    /** A zoom of its own, rather than the one that fits the box. */
    zoom?: number;
    duration?: number;
    instant?: boolean;
};

const grow =
    (top: number, right: number, bottom: number, left: number) =>
    (box: Box): Box => ({
        x: box.x - left,
        y: box.y - top,
        width: box.width + left + right,
        height: box.height + top + bottom,
    });

const topOf = (height: number) => (box: Box) => ({ ...box, height: Math.min(box.height, height) });

const SHOTS: CameraShot[] = [
    { at: 0, on: 'whole', instant: true },
    { at: T(1.0), on: '[data-hiw="page-head"]', pad: 48 },
    { at: T(2.05), on: '[data-hiw="dialog"]', pad: 72 },
    { at: T(3.55), on: 'whole', duration: pace(1.1) },
    { at: T(4.4), on: hexBlock, pad: 56 },
    { at: T(6.0), on: '[data-slot="aside-panel"]', cut: topOf(470), pad: 24 },
    { at: T(6.9), on: '[data-hiw="flow"]', cut: topOf(470), pad: 40 },
    { at: T(7.75), on: question('Shine'), pad: 64 },
    { at: T(8.65), on: question('Corners'), pad: 72 },
    { at: T(10.05), on: '[data-slot="aside-panel"]', cut: topOf(620), pad: 24 },

    { at: P(0.1), on: '[data-hiw="flow"]', cut: topOf(470), pad: 40 },
    { at: P(1.15), on: byText('Use this theme'), cut: grow(560, 30, 30, 430), pad: 24 },
    { at: P(2.25), on: 'whole', duration: pace(1.3) },
    { at: P(4.65), on: '[data-hiw="export"]', pad: 40 },
    { at: P(8.0), on: 'whole' },

    { at: C(1.75), on: '[data-hiw="install"]', pad: 90 },
    { at: C(3.45), on: '[data-hiw="terminal"]', pad: 48 },

    { at: CUE.appOut, on: 'whole', instant: true },
    { at: B(0.7), on: '[data-hiw="claude"]', pad: 48 },
    { at: B(6.1), on: 'whole', duration: pace(1.1) },
    {
        at: B(7.7),
        on: '[data-hiw="browser"]',
        cut: box => ({ x: box.x + 250, y: box.y + 44, width: 900, height: 470 }),
    },
    {
        at: B(9.1),
        on: '[data-hiw="browser"]',
        cut: box => ({ x: box.x + 500, y: box.y + 300, width: 940, height: 560 }),
    },
    { at: B(10.6), on: 'whole' },
];

/** The zoom that fits a box, and where to point so it is centred, never past the canvas. */
const frameFor = (box: Box | null, shot: CameraShot) => {
    if (!box) return { x: CANVAS.width / 2, y: CANVAS.height / 2, zoom: 1 };
    const pad = shot.pad ?? 32;
    const fit = Math.min(
        CANVAS.width / (box.width + pad * 2),
        CANVAS.height / (box.height + pad * 2),
    );
    const zoom = Math.max(1, Math.min(2.4, shot.zoom ?? fit));
    const half = { x: CANVAS.width / (2 * zoom), y: CANVAS.height / (2 * zoom) };
    const clamp = (value: number, low: number, high: number) =>
        Math.min(high, Math.max(low, value));
    return {
        x: clamp(box.x + box.width / 2, half.x, CANVAS.width - half.x),
        y: clamp(box.y + box.height / 2, half.y, CANVAS.height - half.y),
        zoom,
    };
};

/** The canvas under a camera: it frames each shot in turn, panning and zooming between them. */
const Camera = ({ children }: { children: ReactNode }) => {
    const time = useTime();
    const reduce = useReducedMotion() ?? false;
    const [canvas, setCanvas] = useState<HTMLDivElement | null>(null);
    const index = Math.max(0, usePhase(SHOTS.map(shot => shot.at)) - 1);
    const shot = SHOTS[index] ?? SHOTS[0];
    const cx = useMotionValue(CANVAS.width / 2);
    const cy = useMotionValue(CANVAS.height / 2);
    const zoom = useMotionValue(1);
    const x = useTransform(() => CANVAS.width / 2 - cx.get() * zoom.get());
    const y = useTransform(() => CANVAS.height / 2 - cy.get() * zoom.get());

    const box = useAim(canvas, index, () => (shot && shot.on !== 'whole' ? shot.on : null));

    // biome-ignore lint/correctness/useExhaustiveDependencies: a new shot or its measured box moves the camera.
    useEffect(() => {
        if (!shot) return;
        if (shot.on !== 'whole' && !box) return;
        const raw = shot.on === 'whole' ? null : box;
        const target = frameFor(raw && shot.cut ? shot.cut(raw) : raw, shot);
        // A jump (a seek, or the loop) cuts; only the playhead moving on moves the camera.
        const seeking = Math.abs(time.get() - shot.at) > (shot.duration ?? pace(1.1)) + 0.5;
        if (shot.instant || reduce || seeking) {
            cx.set(target.x);
            cy.set(target.y);
            zoom.set(target.zoom);
            return;
        }
        const options = { duration: shot.duration ?? pace(1.1), ease: EASE_IN_OUT };
        const moves = [
            animate(cx, target.x, options),
            animate(cy, target.y, options),
            animate(zoom, target.zoom, options),
        ];
        return () => {
            for (const move of moves) move.stop();
        };
    }, [index, box]);

    return (
        <motion.div
            className="absolute top-0 left-0 origin-top-left"
            ref={setCanvas}
            style={{ width: CANVAS.width, height: CANVAS.height, x, y, scale: zoom }}
        >
            <CanvasContext value={canvas}>{children}</CanvasContext>
        </motion.div>
    );
};

/* ---------- Cursor ---------- */

type Aim = {
    at: number;
    on?: Spec;
    /** Where in the part, as fractions of its box; its centre by default. */
    fx?: number;
    fy?: number;
    /** A point on the canvas, for a cursor not over a part. */
    point?: { x: number; y: number };
    visible: boolean;
    /** How long the glide to it takes; a drag takes as long as it. */
    duration?: number;
};

/** Where the corner scale's thumb ends: 150% along a 50%–200% track, read off the slider. */
const cornerEnd = (root: HTMLElement) => cornerSlider(root);
const cornerFraction = () => {
    const slider = document.querySelector(
        '[data-hiw-canvas] [data-slot="theme-question"] [role="slider"]',
    );
    const min = Number(slider?.getAttribute('aria-valuemin') ?? 0.5);
    const max = Number(slider?.getAttribute('aria-valuemax') ?? 2);
    return (1.5 - min) / (max - min);
};

const CURSOR: Aim[] = [
    { at: 0, point: { x: 1100, y: 420 }, visible: false },
    { at: T(1.05), point: { x: 1100, y: 420 }, visible: true },
    { at: T(1.2), on: '[data-hiw="new-project"]', visible: true },
    { at: T(2.6), on: '[data-hiw="create"]', visible: true },
    { at: T(3.7), on: '[data-hiw="create"]', visible: false },
    { at: T(4.3), point: { x: 640, y: 640 }, visible: true },
    { at: T(4.45), on: HEX_INPUT, fx: 0.3, visible: true },
    { at: T(6.8), on: byText('Controls', '[data-hiw="flow"]'), visible: true },
    { at: T(7.7), on: byText('Lit'), visible: true },
    { at: T(8.6), on: cornerEnd, fx: 0, visible: true },
    { at: CUE.dragFrom, on: cornerEnd, visible: true, duration: CUE.dragTo - CUE.dragFrom },
    { at: T(10.3), on: cornerEnd, visible: false },

    { at: P(0.3), point: { x: 700, y: 300 }, visible: true },
    { at: P(0.45), on: byText('Review', '[data-hiw="flow"]'), visible: true },
    { at: P(1.5), on: byText('Use this theme'), visible: true },
    { at: P(3.8), on: '[data-hiw="nav-export"]', fx: 0.3, visible: true },
    { at: P(5.6), on: '[data-hiw="tab-md"]', visible: true },
    { at: P(7.2), on: '[data-hiw="export-done"]', visible: true },
    { at: P(8.3), on: '[data-hiw="export-done"]', visible: false },

    { at: C(0.15), point: { x: 600, y: 500 }, visible: true },
    { at: C(0.3), on: '[data-hiw="nav-mcp"]', fx: 0.3, visible: true },
    { at: C(2.0), on: '[data-hiw="install"] button', visible: true },
    { at: C(3.1), on: '[data-hiw="install"] button', visible: false },
];

const CLICKS = [
    CUE.newProject,
    CUE.create,
    CUE.hexClick,
    CUE.controls,
    CUE.lit,
    CUE.dragFrom,
    CUE.review,
    CUE.use,
    CUE.exportClick,
    CUE.mdTab,
    CUE.done,
    CUE.mcp,
    CUE.copy,
].map(cue => cue - pace(0.05));

const Cursor = () => {
    const canvas = use(CanvasContext);
    const index = Math.max(0, usePhase(CURSOR.map(point => point.at)) - 1);
    const click = usePhase(CLICKS);
    const aim = CURSOR[index] ?? CURSOR[0];
    const box = useAim(canvas, index, () => aim?.on ?? null);
    // Until a part is measured the cursor holds where it was.
    const last = useRef({ x: 1100, y: 420 });

    const fx = aim?.on === cornerEnd && aim.fx === undefined ? cornerFraction() : (aim?.fx ?? 0.5);
    const target =
        aim?.point ??
        (box
            ? { x: box.x + box.width * fx, y: box.y + box.height * (aim?.fy ?? 0.5) }
            : last.current);
    last.current = target;
    if (!aim) return null;

    const jump = index === 0 || !CURSOR[index - 1]?.visible;
    const glide: Transition = jump
        ? { duration: 0 }
        : { duration: aim.duration ?? pace(0.55), ease: EASE_IN_OUT };

    return (
        <motion.div
            animate={{ x: target.x, y: target.y, opacity: aim.visible ? 1 : 0 }}
            className="pointer-events-none absolute top-0 left-0 z-50"
            initial={false}
            transition={{ x: glide, y: glide, opacity: { duration: pace(0.3) } }}
        >
            {click > 0 && (
                <motion.span
                    animate={{ scale: 1.6, opacity: 0 }}
                    className="absolute -top-5 -left-5 size-10 rounded-full border-2 border-white/80"
                    initial={{ scale: 0.3, opacity: 0.9 }}
                    key={click}
                    transition={{ duration: pace(0.6), ease: EASE_OUT }}
                />
            )}
            <motion.svg
                animate={{ scale: click > 0 ? [1, 0.8, 1] : 1 }}
                className="absolute -top-[3px] -left-[5px]"
                height="28"
                initial={{ scale: 1 }}
                key={`pointer-${click}`}
                style={{ originX: 0.2, originY: 0.1 }}
                transition={{ duration: pace(0.3), ease: EASE_OUT }}
                viewBox="0 0 28 28"
                width="28"
            >
                <path
                    d="M5 3 L5 22 L10 17.2 L13.4 24.6 L16.6 23.2 L13.3 15.9 L20.2 15.9 Z"
                    fill="#FFFFFF"
                    stroke="#0B0B0C"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                />
            </motion.svg>
        </motion.div>
    );
};

/* ---------- Primitives ---------- */

const SHOWN = { opacity: 1, x: 0, y: 0, rotateX: 0, scale: 1 };

/** A window entering from its pose (phase 0), shown (1), and leaving to its exit pose (2). */
const Presence = ({
    phase,
    style,
    enter,
    exit,
    children,
}: {
    phase: number;
    style: CSSProperties;
    enter: TargetAndTransition;
    exit: TargetAndTransition;
    children: ReactNode;
}) => (
    <motion.div
        animate={phase === 1 ? SHOWN : phase === 0 ? enter : exit}
        className="absolute"
        initial={enter}
        style={{ ...style, transformPerspective: 1400 }}
        transition={
            phase === 1
                ? { duration: pace(1.1), ease: EASE_OUT }
                : { duration: pace(0.7), ease: EASE_IN }
        }
    >
        {children}
    </motion.div>
);

/** A desktop window: the panel corner, a hairline, a bar with its name. */
const Chrome = ({
    title,
    icon,
    children,
    ...props
}: {
    title: ReactNode;
    icon?: ReactNode;
    children: ReactNode;
    'data-hiw'?: string;
}) => (
    <div
        className="relative flex size-full flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50"
        {...props}
    >
        <div className="flex h-11 shrink-0 items-center border-neutral-200 border-b bg-neutral-100 px-4">
            <span className="flex w-16 gap-1.5">
                {[0, 1, 2].map(dot => (
                    <span className="size-2.5 rounded-full bg-neutral-300" key={dot} />
                ))}
            </span>
            <span className="flex flex-1 items-center justify-center gap-2 text-neutral-500 text-xs">
                {icon}
                {title}
            </span>
            <span className="w-16" />
        </div>
        <div className="relative min-h-0 flex-1">{children}</div>
    </div>
);

/** Fades and lifts in when shown. */
const Appear = ({
    show,
    delay = 0,
    className,
    style,
    children,
}: {
    show: boolean;
    delay?: number;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}) => (
    <motion.div
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        className={className}
        initial={{ opacity: 0, y: 10 }}
        style={style}
        transition={{ duration: pace(0.45), ease: EASE_OUT, delay: show ? delay : 0 }}
    >
        {children}
    </motion.div>
);

/** Types its text a character at a time once active, with a caret while it types. */
const Typed = ({
    text,
    active,
    step = 0.035,
}: {
    text: string;
    active: boolean;
    step?: number;
}) => {
    const reduce = useReducedMotion() ?? false;
    const [count, setCount] = useState(0);
    const shown = !active ? '' : reduce ? text : text.slice(0, count);

    useEffect(() => {
        if (!active || reduce) return;
        let current = 0;
        const timer = window.setInterval(() => {
            current += 1;
            setCount(current);
            if (current >= text.length) window.clearInterval(timer);
        }, pace(step) * 1000);
        return () => {
            window.clearInterval(timer);
            setCount(0);
        };
    }, [active, reduce, text.length, step]);

    return (
        <>
            {shown}
            {active && shown.length < text.length && (
                <span className="ml-px inline-block h-[1.1em] w-0.5 translate-y-[0.2em] bg-current" />
            )}
        </>
    );
};

const Ok = () => (
    <Check aria-hidden className="size-3.5 shrink-0 text-success-600" strokeWidth={2.25} />
);

/* ---------- The app's window ---------- */

const APP = { left: 80, top: 50, width: 1440, height: 900 };
const TERMINAL = { left: 820, top: 360, width: 700, height: 470 };
const CLAUDE = { left: 300, top: 150, width: 1000, height: 640 };
const BROWSER = { left: 80, top: 50, width: 1440, height: 900 };

/** The themes the film's windows wear: the app's (the default, then Acme's), the draft's, Acme's. */
const ThemeStyles = ({ state }: { state: FilmState }) => {
    const appKey = state.project === 'used' ? 'used' : 'default';
    const draftKey = JSON.stringify(state.theme);
    const app = useMemo(
        () => createThemeCss({ ...(appKey === 'used' ? ACME : {}), name: THEME_IDS.app }),
        [appKey],
    );
    // biome-ignore lint/correctness/useExhaustiveDependencies: the theme is read through its key.
    const draft = useMemo(
        () => createThemeCss({ ...state.theme, name: THEME_IDS.draft }),
        [draftKey],
    );
    const acme = useMemo(() => createThemeCss({ ...ACME, name: 'hiw-acme' }), []);
    return <style>{`${app}\n${draft}\n${acme}\n${easeCss}`}</style>;
};

/** The preview follows the theme as each pick lands: colours ease over rather than snap. */
const easeCss = `.continuum[data-theme="${THEME_IDS.draft}"], .continuum[data-theme="${THEME_IDS.draft}"] *, .continuum[data-theme="${THEME_IDS.app}"], .continuum[data-theme="${THEME_IDS.app}"] * {
    transition-property: color, background-color, border-color, fill, stroke, box-shadow;
    transition-duration: 450ms;
    transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
}`;

/** The film's state, recomputed as the playhead moves and drawn only when it changes. */
const useFilmState = () => {
    const time = useTime();
    const [state, setState] = useState(() => filmStateAt(time.get()));
    const key = useRef(JSON.stringify(state));
    useMotionValueEvent(time, 'change', value => {
        const next = filmStateAt(value);
        const nextKey = JSON.stringify(next);
        if (nextKey === key.current) return;
        key.current = nextKey;
        setState(next);
    });
    return state;
};

/**
 * The primary's hex typed into its field a character at a time, as a person types it: written to
 * the field itself, so the flow's own input shows it; the theme takes the colour when it is whole.
 */
const useHexTyping = () => {
    const time = useTime();
    const canvas = use(CanvasContext);
    useMotionValueEvent(time, 'change', value => {
        if (value < CUE.typeHex || value >= CUE.commitHex || !canvas) return;
        const input = canvas.querySelector<HTMLInputElement>(HEX_INPUT);
        if (!input) return;
        const count = Math.min(HEX.length, Math.floor((value - CUE.typeHex) / pace(0.075)) + 1);
        const text = HEX.slice(0, count);
        if (input.value === text) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setter?.call(input, text);
    });
};

const AppWindow = ({ state }: { state: FilmState }) => {
    const shown = usePhase([CUE.appIn, CUE.appOut]);
    useHexTyping();
    return (
        <Presence
            enter={{ opacity: 0, y: 160, rotateX: 14, scale: 0.94 }}
            exit={{ opacity: 0, scale: 0.96 }}
            phase={shown}
            style={APP}
        >
            <Chrome icon={<Lock className="size-3" strokeWidth={2} />} title="contui.dev/app">
                <div className="absolute inset-0">
                    <FilmApp state={state} />
                </div>
            </Chrome>
        </Presence>
    );
};

/* ---------- 03 Connect: the terminal ---------- */

/** What `npx contui init` reports, line by line. */
const RAN = [
    '@contui/ui 0.1.0, a dependency in package.json',
    'Skills continuum-taste and continuum-fix-padding in .claude/skills',
    "MCP server 'continuum' in .mcp.json, run from node_modules",
    'postinstall runs contui sync: the skills follow the version',
];

const Prompt = ({ children }: { children: ReactNode }) => (
    <p className="flex h-7 items-center">
        <span className="w-19 shrink-0 text-neutral-500">
            ~/acme <span className="text-neutral-950">$</span>
        </span>
        {children}
    </p>
);

const TerminalWindow = () => {
    const shown = usePhase([CUE.terminalIn, CUE.appOut]);
    const command = useCue(CUE.command);
    const ran = useCue(CUE.run);
    const lines = usePhase(CUE.lines);
    const typing = useCue(CUE.typeList);
    const listed = useCue(CUE.listRun);
    const connected = useCue(CUE.connected);

    return (
        <Presence
            enter={{ opacity: 0, y: 60, scale: 0.92 }}
            exit={{ opacity: 0, scale: 0.96 }}
            phase={shown}
            style={TERMINAL}
        >
            <Chrome
                data-hiw="terminal"
                icon={<Terminal className="size-3.5" strokeWidth={2} />}
                title="acme — zsh"
            >
                <div className="absolute inset-0 flex flex-col gap-1 px-6 py-5 font-mono text-[13px] text-neutral-800">
                    <div data-hiw="prompt-1">
                        <Prompt>
                            <motion.span
                                animate={{ opacity: command ? 1 : 0 }}
                                className="text-neutral-950"
                                initial={false}
                                transition={{ duration: pace(0.25) }}
                            >
                                {INSTALL}
                            </motion.span>
                        </Prompt>
                    </div>
                    {ran && lines === 0 && (
                        <p className="flex h-7 items-center gap-2 text-neutral-500">
                            <Spinner size="sm" />
                            Installing @contui/ui
                        </p>
                    )}
                    {RAN.map((line, index) => (
                        <Appear
                            className="flex min-h-6 items-start gap-2.5"
                            key={line}
                            show={lines > index}
                        >
                            <span className="mt-1">
                                <Ok />
                            </span>
                            <span className="min-w-0 text-neutral-950">{line}</span>
                        </Appear>
                    ))}
                    {lines >= RAN.length && (
                        <Prompt>
                            <span className="text-neutral-950">
                                <Typed active={typing} step={0.04} text={LIST} />
                            </span>
                        </Prompt>
                    )}
                    <Appear show={listed}>
                        <p className="text-neutral-500">Checking MCP server health…</p>
                    </Appear>
                    <Appear className="mt-2" show={connected}>
                        <p className="rounded-item bg-success-500/10 px-3 py-2 text-neutral-950">
                            continuum: node node_modules/@contui/ui/mcp/server.mjs -{' '}
                            <span className="text-success-600">✓ Connected</span>
                        </p>
                    </Appear>
                </div>
            </Chrome>
        </Presence>
    );
};

/** The install line, copied from the page and carried into the terminal. */
const CommandChip = () => {
    const canvas = use(CanvasContext);
    const phase = usePhase([CUE.copy, CUE.chipOut, CUE.chipAbove, CUE.dock, CUE.command]);
    const from = useAim(canvas, phase === 1 ? 1 : 0, () =>
        phase >= 1 ? '[data-hiw="install"] pre' : null,
    );
    const to = useAim(canvas, phase >= 3 ? 1 : 0, () =>
        phase >= 3 ? '[data-hiw="prompt-1"]' : null,
    );
    const size = { width: 230, height: 36 };
    const start = from ? { x: from.x + 8, y: from.y + from.height / 2 - 18 } : { x: 0, y: -200 };
    const end = to ? { x: to.x + 120, y: to.y - 4 } : { x: 0, y: -200 };

    const pose =
        phase === 0
            ? { ...start, opacity: 0, scale: 1 }
            : phase === 1
              ? { ...start, opacity: 1, scale: 1.06 }
              : phase === 2
                ? { ...start, y: -260, opacity: 1, scale: 1 }
                : phase === 3
                  ? { ...end, y: -260, opacity: 1, scale: 1 }
                  : phase === 4
                    ? { ...end, opacity: 1, scale: 1 }
                    : { ...end, opacity: 0, scale: 1 };
    const move: Transition =
        phase === 2
            ? { duration: pace(0.6), ease: EASE_IN }
            : phase === 4
              ? { duration: pace(0.75), ease: EASE_OUT }
              : phase === 1
                ? { duration: pace(0.3), ease: EASE_OUT }
                : { duration: 0 };

    return (
        <motion.div
            animate={pose}
            className="pointer-events-none absolute top-0 left-0 z-40 flex items-center gap-2.5 overflow-hidden rounded-control bg-neutral-950 px-3.5 font-mono text-[13px] text-neutral-50"
            initial={false}
            style={size}
            transition={{
                ...move,
                opacity: { duration: phase === 5 ? pace(0.2) : pace(0.3) },
            }}
        >
            <Terminal className="size-3.5 shrink-0" strokeWidth={2} />
            {INSTALL}
        </motion.div>
    );
};

/* ---------- 04 Build: Claude Code, then the screen ---------- */

const TOOLS = [
    { name: 'continuum · get_page_kind', note: 'index' },
    { name: 'continuum · find_pattern', note: 'filter bar' },
    { name: 'continuum · get_component', note: 'Table, FilterConditions, Pagination' },
    { name: 'Write src/pages/customers.tsx', note: '+212 lines' },
    { name: 'continuum · audit_source', note: 'clean' },
];

const ClaudeWindow = () => {
    const shown = usePhase([CUE.claudeIn, CUE.claudeOut]);
    const typing = useCue(CUE.typePrompt);
    const sent = useCue(CUE.send);
    const tools = usePhase(CUE.tools);
    const done = usePhase(CUE.tools.map(cue => cue + pace(0.35)));
    const built = useCue(CUE.built);

    return (
        <Presence
            enter={{ opacity: 0, y: 140 }}
            exit={{ opacity: 0, scale: 0.94 }}
            phase={shown}
            style={CLAUDE}
        >
            <Chrome
                data-hiw="claude"
                icon={<Terminal className="size-3.5" strokeWidth={2} />}
                title="acme-web — claude"
            >
                <div className="absolute inset-0">
                    {sent && (
                        <>
                            <motion.p
                                animate={{ y: 0, opacity: 1 }}
                                className="absolute top-6 right-7 left-7 rounded-card bg-neutral-100 px-4 py-3 text-[14px] text-neutral-950 leading-[1.5]"
                                initial={{ y: 380, opacity: 0 }}
                                transition={{ duration: pace(0.6), ease: EASE_OUT }}
                            >
                                <span className="mr-2 font-mono text-neutral-500">&gt;</span>
                                {PROMPT}
                            </motion.p>
                            {TOOLS.map((tool, index) => (
                                <Appear
                                    className="absolute left-8 flex h-7 items-center gap-2.5 font-mono text-[13px]"
                                    key={tool.name}
                                    show={tools > index}
                                    style={{ top: 120 + index * 36 }}
                                >
                                    {done > index ? <Ok /> : <Spinner size="sm" />}
                                    <span className="text-neutral-950">{tool.name}</span>
                                    <span className="text-neutral-500">{tool.note}</span>
                                </Appear>
                            ))}
                            <Appear
                                className="absolute top-[320px] right-8 left-8 text-[14px] text-neutral-800 leading-[1.6]"
                                show={built}
                            >
                                Built the customers page as an index: search and filters over the
                                table, pages at the foot, in {PROJECT}'s theme from src/app.css.
                            </Appear>
                        </>
                    )}
                    <div className="absolute right-7 bottom-7 left-7 flex h-[60px] items-center gap-3 rounded-card border border-neutral-200 bg-neutral-50 px-4 font-mono text-[13px] text-neutral-950">
                        <span className="text-neutral-500">&gt;</span>
                        <span className="min-w-0 flex-1 truncate">
                            {typing && !sent ? (
                                <Typed active step={0.014} text={PROMPT} />
                            ) : (
                                <span className="text-neutral-400">Message Claude</span>
                            )}
                        </span>
                        <span className="rounded-chip border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-500">
                            ↵
                        </span>
                    </div>
                </div>
            </Chrome>
        </Presence>
    );
};

const customers = screens.find(screen => screen.id === 'list');

/** The screen Claude built, whole and at its real size, in Acme's theme. */
const BrowserWindow = () => {
    const shown = usePhase([CUE.browserIn]);
    return (
        <Presence
            enter={{ opacity: 0, y: 160, rotateX: 14, scale: 0.94 }}
            exit={{ opacity: 0, scale: 0.96 }}
            phase={shown}
            style={BROWSER}
        >
            <Chrome
                data-hiw="browser"
                icon={<Lock className="size-3" strokeWidth={2} />}
                title="acme-web · localhost:5173/customers"
            >
                <Theme className="absolute inset-0 overflow-hidden" mode="dark" theme="hiw-acme">
                    <div className="size-full" inert>
                        <Shot className="size-full">{shown > 0 && customers?.render(true)}</Shot>
                    </div>
                </Theme>
            </Chrome>
        </Presence>
    );
};

/* ---------- The scene ---------- */

const Scene = () => {
    const state = useFilmState();
    return (
        <>
            <ThemeStyles state={state} />
            <Camera>
                <div className="absolute -inset-[1200px] bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-neutral-950)_14%,transparent)_1.2px,transparent_1.6px)] bg-size-[32px_32px]" />
                <div className="absolute inset-0" data-hiw-canvas inert>
                    <AppWindow state={state} />
                    <TerminalWindow />
                    <ClaudeWindow />
                    <BrowserWindow />
                    <CommandChip />
                    <Cursor />
                </div>
            </Camera>
        </>
    );
};

/* ---------- The player ---------- */

/** Whether the tab is in front, so the video never plays behind it. */
const usePageVisible = () => {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const sync = () => setVisible(!document.hidden);
        sync();
        document.addEventListener('visibilitychange', sync);
        return () => document.removeEventListener('visibilitychange', sync);
    }, []);
    return visible;
};

const pad = (value: number) => String(value).padStart(2, '0');

const Player = () => {
    const reduce = useReducedMotion() ?? false;
    const player = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const inView = useInView(player, { amount: 0.45 });
    const pageVisible = usePageVisible();
    const time = useMotionValue(0);
    const playback = useRef<AnimationPlaybackControls | null>(null);
    const [segment, setSegment] = useState(0);
    const [started, setStarted] = useState(false);
    const [paused, setPaused] = useState(false);
    const [size, setSize] = useState(CANVAS);

    const current = SEGMENTS[segment] ?? SEGMENTS[0];
    const playing = started && inView && pageVisible && !paused;
    const fit = Math.min(size.width / CANVAS.width, size.height / CANVAS.height);

    useMotionValueEvent(time, 'change', value => {
        const next = segmentAt(value);
        setSegment(previous => (previous === next ? previous : next));
    });

    useEffect(() => {
        const element = screen.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => {
            if (!entry) return;
            setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!inView || started) return;
        setStarted(true);
        if (!reduce) return;
        setPaused(true);
        time.set(STILLS[0] ?? 0);
    }, [inView, started, reduce, time]);

    const play = () => {
        playback.current?.stop();
        playback.current = animate(time, TOTAL, {
            duration: TOTAL - time.get(),
            ease: 'linear',
            onComplete: () => {
                time.set(0);
                play();
            },
        });
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: play only reads refs and the clock
    useEffect(() => {
        if (!playing) return;
        play();
        return () => playback.current?.stop();
    }, [playing]);

    const jump = (beat: number) => {
        playback.current?.stop();
        time.set(paused ? (STILLS[beat] ?? 0) : beatStart(beat));
        if (playing) play();
    };

    const title = current?.kind === 'title';

    return (
        <MotionConfig reducedMotion="user">
            <div
                className="relative h-[420px] select-none overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 sm:h-[600px] md:h-[720px]"
                ref={player}
                style={
                    {
                        '--ink': 'var(--color-neutral-950)',
                        '--muted': 'var(--color-neutral-600)',
                    } as CSSProperties
                }
            >
                <div aria-hidden className="absolute inset-0" ref={screen}>
                    <div
                        className="absolute top-1/2 left-1/2"
                        style={{
                            width: CANVAS.width,
                            height: CANVAS.height,
                            transform: `translate(-50%, -50%) scale(${fit})`,
                        }}
                    >
                        <TimeContext value={time}>{started && <Scene />}</TimeContext>
                    </div>

                    {/*
                     * A title card wipes the surface over the scene, out from the centre, so the
                     * middle is clear first for the words; the scene after it is wiped back in as
                     * the surface closes into the centre again.
                     */}
                    <motion.div
                        animate={{
                            clipPath: title ? 'circle(75% at 50% 50%)' : 'circle(0% at 50% 50%)',
                        }}
                        className="pointer-events-none absolute inset-0 bg-neutral-50"
                        initial={false}
                        transition={{ duration: reduce ? 0 : pace(0.9), ease: EASE_IN_OUT }}
                    />

                    {/* Keeps the controls clear of whatever the camera brings down to them. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-neutral-50 to-transparent" />

                    <AnimatePresence>
                        {started && title && current && (
                            <TitleCard beat={current.beat} key={segment} />
                        )}
                    </AnimatePresence>
                </div>

                <ol className="sr-only">
                    {captions.map(caption => (
                        <li key={caption.title}>{caption.title}</li>
                    ))}
                </ol>

                <div className="absolute inset-x-5 bottom-5 z-10 flex items-end gap-4 md:inset-x-8 md:bottom-6">
                    <div className="flex flex-1 gap-2">
                        {captions.map((caption, index) => (
                            <ProgressSegment
                                active={current?.beat === index}
                                beat={index}
                                key={caption.label}
                                label={caption.label}
                                onClick={() => jump(index)}
                                time={time}
                                title={caption.title}
                            />
                        ))}
                    </div>
                    <button
                        aria-label={paused ? 'Play the video' : 'Pause the video'}
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--ink)/20 bg-neutral-50 text-(--ink) transition-[color,border-color,background-color] duration-150 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                        onClick={() => setPaused(previous => !previous)}
                        type="button"
                    >
                        {paused ? (
                            <Play className="size-4" strokeWidth={2} />
                        ) : (
                            <Pause className="size-4" strokeWidth={2} />
                        )}
                    </button>
                </div>
            </div>
        </MotionConfig>
    );
};

const TitleCard = ({ beat }: { beat: number }) => {
    const caption = captions[beat];
    if (!caption) return null;

    return (
        <motion.div
            animate="shown"
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 pb-12 text-center"
            exit="exit"
            initial="hidden"
        >
            <p className="max-w-3xl text-balance font-medium text-(--ink) text-4xl leading-[1.02] tracking-[-0.02em] md:text-6xl">
                <Words delay={0.5} text={caption.title} />
            </p>
        </motion.div>
    );
};

/** Words that slide up out of their own line, and on out of it again. */
const Words = ({
    text,
    delay = 0,
    stagger = 0.05,
}: {
    text: string;
    delay?: number;
    stagger?: number;
}) => {
    const words = text.split(' ');
    return (
        <>
            {words.map((word, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: a fixed caption, never reordered
                <Fragment key={`${word}-${index}`}>
                    <span className="-mb-[0.15em] inline-block overflow-hidden pb-[0.15em] align-top">
                        <motion.span
                            className="inline-block"
                            variants={{
                                hidden: { y: '110%' },
                                shown: {
                                    y: '0%',
                                    transition: {
                                        duration: pace(0.8),
                                        ease: EASE_OUT,
                                        delay: pace(delay + index * stagger),
                                    },
                                },
                                exit: {
                                    y: '-110%',
                                    transition: {
                                        duration: pace(0.35),
                                        ease: EASE_IN,
                                        delay: pace(index * 0.015),
                                    },
                                },
                            }}
                        >
                            {word}
                        </motion.span>
                    </span>
                    {index < words.length - 1 && ' '}
                </Fragment>
            ))}
        </>
    );
};

const ProgressSegment = ({
    time,
    beat,
    label,
    title,
    active,
    onClick,
}: {
    time: MotionValue<number>;
    beat: number;
    label: string;
    title: string;
    active: boolean;
    onClick: () => void;
}) => {
    const start = beatStart(beat);
    const end = beatEnd(beat);
    const fill = useTransform(time, value =>
        Math.min(1, Math.max(0, (value - start) / (end - start))),
    );

    return (
        <button
            aria-current={active ? 'step' : undefined}
            aria-label={title}
            className="group flex flex-1 cursor-pointer flex-col gap-2 text-left focus-visible:outline-none"
            onClick={onClick}
            type="button"
        >
            <span
                className={cn(
                    'hidden items-center gap-2 truncate text-xs transition-colors duration-150 md:flex',
                    active ? 'text-(--ink)' : 'text-(--muted)',
                )}
            >
                <span className="font-mono text-xxs tabular-nums opacity-70">{pad(beat + 1)}</span>
                {label}
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-(--ink)/15 group-focus-visible:outline-2 group-focus-visible:outline-focus group-focus-visible:outline-offset-2">
                <motion.span
                    className="block h-full origin-left rounded-full bg-neutral-950"
                    style={{ scaleX: fill }}
                />
            </span>
        </button>
    );
};

/* ---------- The section ---------- */

export const HowItWorks = () => (
    <Section id="how-it-works" title="How it works">
        <Reveal>
            <Player />
        </Reveal>
    </Section>
);
