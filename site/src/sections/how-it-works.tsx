import { screens } from '@screens/index';
import {
    Badge,
    buttonVariants,
    Card,
    ContinuumMark,
    cn,
    createThemeCss,
    Input,
    Progress,
    Spinner,
    StatusDot,
    Switch,
    Theme,
    type ThemeOptions,
} from 'continuum';
import { Check, Copy, Lock, Pause, Play, Terminal } from 'lucide-react';
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
    useMotionTemplate,
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
    useRef,
    useState,
} from 'react';
import { Reveal, Section, Shot } from '../web';

/*
 * How it works, as MCP Hosted's explainer: a scripted video drawn live, title cards between five
 * scenes on a dotted canvas, a cursor, a camera and chips that carry one scene's result into the
 * next. One clock drives it all; every scene reads cues off it and keeps no timer of its own.
 *
 * 1. Theme: the free builder, no account. Accent, greys, corners; the preview follows each pick.
 * 2. Project: Save as project, sign up, and Acme exists with its theme. Its link command flies on.
 * 3. Link: `npx continuum init acme` pulls the theme, the parts, the skill and the MCP connection.
 * 4. Build: a prompt, what the agent reads over MCP, then the finished screen in Acme's theme.
 * 5. Sync: the accent changes once in the account, three repos follow, the screen recolours.
 *
 * The video's own surfaces are the page's greys and its inverse; the accent shows only where a
 * product puts it, as a theme's action colour.
 */

/* ---------- Timeline ---------- */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN = [0.7, 0, 0.84, 0] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** The whole video's tempo: every duration, delay and cue goes through it. */
const PACE = 0.7;
const pace = (seconds: number) => seconds * PACE;

/** The scenes are laid out in pixels on this canvas, then scaled to the player. */
const CANVAS = { width: 1104, height: 720 };

type Palette = { background: string; ink: string; muted: string };

/** One background throughout: the surface, so the video reads as one black canvas. */
const surface: Palette = {
    background: 'var(--color-neutral-50)',
    ink: 'var(--color-neutral-950)',
    muted: 'var(--color-neutral-600)',
};

/** Kept per segment colour so the scenes' cues stay as they are; every one is the surface. */
const PALETTES: Palette[] = [surface, surface, surface];

type Segment = {
    kind: 'title' | 'scene';
    beat: number;
    color: number;
    duration: number;
    from?: 'top' | 'center';
};

const TITLE = 1.6;

const SEGMENTS: Segment[] = [
    { kind: 'title', beat: 0, color: 0, duration: TITLE, from: 'center' },
    { kind: 'scene', beat: 0, color: 0, duration: pace(6.0) },
    { kind: 'title', beat: 1, color: 1, duration: TITLE, from: 'top' },
    { kind: 'scene', beat: 1, color: 1, duration: pace(6.0) },
    { kind: 'title', beat: 2, color: 0, duration: TITLE, from: 'top' },
    { kind: 'scene', beat: 2, color: 0, duration: pace(5.4) },
    { kind: 'title', beat: 3, color: 1, duration: TITLE, from: 'top' },
    { kind: 'scene', beat: 3, color: 1, duration: pace(8.0) },
    { kind: 'title', beat: 4, color: 2, duration: TITLE, from: 'center' },
    { kind: 'scene', beat: 4, color: 0, duration: pace(6.0), from: 'center' },
];

const STARTS = SEGMENTS.map((_, index) =>
    SEGMENTS.slice(0, index).reduce((sum, segment) => sum + segment.duration, 0),
);
const TOTAL = SEGMENTS.reduce((sum, segment) => sum + segment.duration, 0);
const BEATS = 5;
const at = (index: number) => STARTS[index] ?? 0;

const segmentAt = (time: number) =>
    STARTS.reduce((found, start, index) => (time >= start ? index : found), 0);
const beatStart = (beat: number) => at(SEGMENTS.findIndex(segment => segment.beat === beat));
const beatEnd = (beat: number) => (beat + 1 < BEATS ? beatStart(beat + 1) : TOTAL);

const MAKE = at(1);
const SAVE = at(3);
const LINK = at(5);
const BUILD = at(7);
const SYNC = at(9);

const CUE = {
    makeIn: MAKE + pace(0.35),
    picks: [MAKE + pace(2.0), MAKE + pace(3.0), MAKE + pace(4.0)],
    makeOut: MAKE + pace(5.6),

    saveIn: SAVE + pace(0.35),
    save: SAVE + pace(1.1),
    typeEmail: SAVE + pace(1.5),
    typeName: SAVE + pace(2.05),
    create: SAVE + pace(2.75),
    project: SAVE + pace(3.05),
    copy: SAVE + pace(4.5),
    commandOut: SAVE + pace(5.2),
    saveOut: SAVE + pace(5.4),

    terminalIn: LINK + pace(0.35),
    commandAbove: LINK + pace(0.4),
    dockCommand: LINK + pace(0.95),
    commandInput: LINK + pace(1.6),
    run: LINK + pace(2.0),
    rows: LINK + pace(2.3),
    linked: LINK + pace(3.7),
    terminalOut: LINK + pace(5.0),

    claudeIn: BUILD + pace(0.35),
    typePrompt: BUILD + pace(0.8),
    send: BUILD + pace(2.2),
    tools: [BUILD + pace(2.6), BUILD + pace(3.0), BUILD + pace(3.4), BUILD + pace(3.8)],
    toolsDone: [BUILD + pace(2.95), BUILD + pace(3.35), BUILD + pace(3.75), BUILD + pace(4.15)],
    built: BUILD + pace(4.35),
    claudeOut: BUILD + pace(4.85),
    screenIn: BUILD + pace(5.05),
    screenOut: BUILD + pace(7.6),

    backIn: SYNC + pace(0.3),
    accountIn: SYNC + pace(0.55),
    pickAccent: SYNC + pace(2.0),
    sync: SYNC + pace(3.0),
    repos: [SYNC + pace(3.35), SYNC + pace(3.55), SYNC + pace(3.75)],
    recolour: SYNC + pace(3.4),
    synced: SYNC + pace(3.95),
    syncOut: SYNC + pace(5.6),
};

/** The most telling moment of each beat: where a paused or still video stands. */
const STILLS = [
    MAKE + pace(4.8),
    SAVE + pace(4.2),
    LINK + pace(4.2),
    BUILD + pace(6.6),
    SYNC + pace(4.8),
];

type Zoom = {
    at: number;
    scale: number;
    x?: number;
    y?: number;
    duration?: number;
    instant?: boolean;
};

const ZOOMS: Zoom[] = [
    { at: 0, scale: 1, instant: true },
    { at: MAKE + pace(1.3), x: 300, y: 330, scale: 1.25 },
    { at: MAKE + pace(4.5), scale: 1 },
    { at: SAVE + pace(1.35), x: 552, y: 380, scale: 1.3 },
    { at: SAVE + pace(3.0), scale: 1 },
    { at: BUILD, x: 552, y: 590, scale: 1.4, instant: true },
    { at: BUILD + pace(2.3), scale: 1, duration: pace(1.2) },
];

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

/** A window shown in two scenes: in, out, in again, out again. */
const twice = (phase: number) => (phase === 0 ? 0 : phase % 2 === 1 ? 1 : 2);

/* ---------- Script ---------- */

const captions = [
    {
        label: 'Theme',
        title: 'Make your theme.',
        body: 'Pick an accent, greys, font and corners. Free, no account.',
    },
    {
        label: 'Project',
        title: 'Save it as a project.',
        body: 'Your theme lives in your account, in one place.',
    },
    {
        label: 'Link',
        title: 'Link your repo.',
        body: 'One command pulls the theme, the parts, the skill and MCP.',
    },
    {
        label: 'Build',
        title: 'Ask your agent.',
        body: 'It builds from your theme, its recipes and the components.',
    },
    {
        label: 'Sync',
        title: 'Change it once.',
        body: 'Every linked repo follows, and every screen with it.',
    },
];

const PROMPT = 'Build the customers page: name, plan, MRR and owner, filtered by plan.';
const COMMAND = 'npx continuum init acme';
const EMAIL = 'ana@acme.com';

/* The themes the video moves through: the builder's start, each pick, Acme, and Acme changed. */
const COOL = { hue: 265, tint: 0.012 };
const ACME: ThemeOptions = {
    accent: '#3939e5',
    action: 'accent',
    actionStyle: 'lit',
    tint: 'accent',
    neutral: COOL,
    radius: 1.4,
};
const ACME_NEXT: ThemeOptions = { ...ACME, accent: '#0f9f6e' };

const THEMES: Record<string, ThemeOptions> = {
    'hiw-start': { radius: 0.6 },
    'hiw-accent': { ...ACME, neutral: undefined, radius: 0.6 },
    'hiw-greys': { ...ACME, radius: 0.6 },
    'hiw-acme': ACME,
    'hiw-acme-next': ACME_NEXT,
};
const BUILDER_STEPS = ['hiw-start', 'hiw-accent', 'hiw-greys', 'hiw-acme'];

const themeCss = Object.entries(THEMES)
    .map(([name, options]) => createThemeCss({ ...options, name }))
    .join('\n');

const BUILDER_ACCENTS = ['#71717a', '#3939e5', '#0f9f6e', '#e11d48', '#d97706', '#0891b2'];
const ACCOUNT_ACCENTS = ['#3939e5', '#0f9f6e', '#e11d48', '#d97706', '#0891b2'];
const REPOS = ['acme-web', 'acme-admin', 'acme-docs'];

const customers = screens.find(screen => screen.id === 'list');

/* ---------- Geometry (canvas pixels) ---------- */

const BUILDER = { left: 132, top: 80, width: 840, height: 540 };
const TERMINAL = { left: 172, top: 110, width: 760, height: 420 };
const CLAUDE = { left: 172, top: 72, width: 760, height: 560 };
/** The screen's window: 1280 × 720 at 0.8, so the whole screen shows. */
const SCREEN_SCALE = 0.8;
const SCREEN = {
    left: 39,
    top: 28,
    width: 1280 * SCREEN_SCALE + 2,
    height: 720 * SCREEN_SCALE + 46,
};
const ACCOUNT = { left: 40, top: 110, width: 420, height: 450 };

/** Where things are clicked or land, in canvas pixels. */
const POINT = {
    accent: { x: BUILDER.left + 24 + 40 + 14, y: BUILDER.top + 152 + 14 },
    greys: { x: BUILDER.left + 184 + 36, y: BUILDER.top + 236 + 15 },
    corners: { x: BUILDER.left + 108 + 17, y: BUILDER.top + 320 + 17 },
    save: { x: BUILDER.left + BUILDER.width - 24 - 66, y: BUILDER.top + 44 + 34 },
    create: { x: BUILDER.left + 230 + 226 + 65, y: BUILDER.top + 150 + 246 + 17 },
    copy: { x: BUILDER.left + 456 + 336 - 22, y: BUILDER.top + 268 + 20 },
    lime: { x: ACCOUNT.left + 24 + 40 + 14, y: ACCOUNT.top + 44 + 72 + 14 },
    syncButton: { x: ACCOUNT.left + ACCOUNT.width / 2, y: ACCOUNT.top + 44 + 352 + 17 },
};

/** The link command's box in the project view, and its place on the terminal's prompt. */
const COMMAND_BOX = { x: BUILDER.left + 456, y: BUILDER.top + 268, width: 336, height: 40 };
const COMMAND_LINE = { x: TERMINAL.left + 156, y: TERMINAL.top + 62, width: 260, height: 36 };

type Key = {
    at: number;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    scale?: number;
    motion?: 'instant' | 'out' | 'dock' | 'fade';
};

const COMMAND_TRACK: Key[] = [
    { at: 0, ...COMMAND_BOX, visible: false, motion: 'instant' },
    { at: CUE.copy, ...COMMAND_BOX, visible: true, scale: 1.06 },
    { at: CUE.commandOut, ...COMMAND_BOX, y: -200, visible: true, motion: 'out' },
    { at: CUE.commandAbove, ...COMMAND_LINE, y: -200, visible: true, motion: 'instant' },
    { at: CUE.dockCommand, ...COMMAND_LINE, visible: true, motion: 'dock' },
    { at: CUE.commandInput, ...COMMAND_LINE, visible: false, motion: 'fade' },
];

type Point = { at: number; x: number; y: number; visible: boolean };

const CURSOR: Point[] = [
    { at: 0, x: 520, y: 470, visible: false },
    { at: (CUE.picks[0] ?? 0) - pace(0.85), x: 520, y: 470, visible: true },
    { at: (CUE.picks[0] ?? 0) - pace(0.7), ...POINT.accent, visible: true },
    { at: (CUE.picks[1] ?? 0) - pace(0.6), ...POINT.greys, visible: true },
    { at: (CUE.picks[2] ?? 0) - pace(0.6), ...POINT.corners, visible: true },
    { at: (CUE.picks[2] ?? 0) + pace(0.6), ...POINT.corners, visible: false },
    { at: CUE.save - pace(0.85), x: 760, y: 320, visible: true },
    { at: CUE.save - pace(0.7), ...POINT.save, visible: true },
    { at: CUE.create - pace(0.7), ...POINT.create, visible: true },
    { at: CUE.copy - pace(0.75), ...POINT.copy, visible: true },
    { at: CUE.copy + pace(0.5), ...POINT.copy, visible: false },
    { at: CUE.pickAccent - pace(0.85), x: 320, y: 470, visible: true },
    { at: CUE.pickAccent - pace(0.7), ...POINT.lime, visible: true },
    { at: CUE.sync - pace(0.7), ...POINT.syncButton, visible: true },
    { at: CUE.sync + pace(0.6), ...POINT.syncButton, visible: false },
];

const CLICKS = [...CUE.picks, CUE.save, CUE.create, CUE.copy, CUE.pickAccent, CUE.sync].map(
    cue => cue - pace(0.05),
);

/* ---------- Text effects ---------- */

/** Types its text a character at a time once active, with a block caret while it types. */
const Typed = ({
    text,
    active = true,
    step = 0.035,
    caret = true,
}: {
    text: string;
    active?: boolean;
    step?: number;
    caret?: boolean;
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
            {active && caret && shown.length < text.length && (
                <span className="ml-px inline-block h-[1.1em] w-0.5 translate-y-[0.2em] bg-current" />
            )}
        </>
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

/** A desktop window in the system's register: the panel corner, a hairline, a bar with its name. */
const Chrome = ({
    title,
    icon,
    children,
}: {
    title: ReactNode;
    icon?: ReactNode;
    children: ReactNode;
}) => (
    <div className="relative size-full overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 shadow-[0_24px_64px_-24px_rgb(0_0_0/0.6)]">
        <div className="flex h-11 items-center border-neutral-200 border-b bg-neutral-100 px-4">
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
        {children}
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
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        className={className}
        initial={{ opacity: 0, y: 12 }}
        style={style}
        transition={{ duration: pace(0.5), ease: EASE_OUT, delay: show ? delay : 0 }}
    >
        {children}
    </motion.div>
);

/** A content swap inside a window: rises in, lifts out. */
const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
    <motion.div
        animate={{ opacity: 1, y: 0, transition: { duration: pace(0.45), ease: EASE_OUT } }}
        className={cn('absolute inset-0', className)}
        exit={{ opacity: 0, y: -16, transition: { duration: pace(0.25), ease: EASE_IN } }}
        initial={{ opacity: 0, y: 16 }}
    >
        {children}
    </motion.div>
);

/** Gives a little under a click. */
const Pressable = ({
    pressed,
    className,
    style,
    children,
}: {
    pressed: boolean;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}) => (
    <motion.div
        animate={{ scale: pressed ? [1, 0.94, 1] : 1 }}
        className={className}
        initial={false}
        style={style}
        transition={{ duration: pace(0.3), ease: EASE_OUT }}
    >
        {children}
    </motion.div>
);

/** A chip that carries one scene's result into the next window: the inverse of the canvas. */
const Track = ({ keys, icon, children }: { keys: Key[]; icon: ReactNode; children: ReactNode }) => {
    const index = Math.max(0, usePhase(keys.map(key => key.at)) - 1);
    const key = keys[index] ?? keys[0];
    if (!key) return null;
    const move: Transition =
        key.motion === 'instant'
            ? { duration: 0 }
            : key.motion === 'out'
              ? { duration: pace(0.6), ease: EASE_IN }
              : key.motion === 'dock'
                ? { duration: pace(0.75), ease: EASE_OUT }
                : { duration: pace(0.45), ease: EASE_OUT };

    return (
        <motion.div
            animate={{
                x: key.x,
                y: key.y,
                width: key.width,
                height: key.height,
                opacity: key.visible ? 1 : 0,
            }}
            className="absolute top-0 left-0"
            initial={false}
            transition={{
                ...move,
                opacity: {
                    duration:
                        key.motion === 'instant' ? 0 : pace(key.motion === 'fade' ? 0.18 : 0.3),
                    ease: EASE_OUT,
                },
            }}
        >
            <motion.div
                animate={{ scale: key.scale ?? 1 }}
                className="flex size-full items-center gap-2.5 overflow-hidden rounded-control bg-neutral-950 px-3.5 font-mono text-[13px] text-neutral-50 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.6)]"
                initial={false}
                transition={{ duration: pace(0.4), ease: EASE_OUT }}
            >
                {icon}
                <span className="min-w-0 flex-1 truncate">{children}</span>
            </motion.div>
        </motion.div>
    );
};

const Cursor = () => {
    const index = Math.max(0, usePhase(CURSOR.map(point => point.at)) - 1);
    const click = usePhase(CLICKS);
    const point = CURSOR[index] ?? CURSOR[0];
    if (!point) return null;
    const jump = index === 0 || !CURSOR[index - 1]?.visible;
    const glide: Transition = jump ? { duration: 0 } : { duration: pace(0.55), ease: EASE_IN_OUT };

    return (
        <motion.div
            animate={{ x: point.x, y: point.y, opacity: point.visible ? 1 : 0 }}
            className="pointer-events-none absolute top-0 left-0"
            initial={false}
            transition={{ x: glide, y: glide, opacity: { duration: pace(0.3) } }}
        >
            {click > 0 && (
                <motion.span
                    animate={{ scale: 1.6, opacity: 0 }}
                    className="absolute -top-5 -left-5 size-10 rounded-full border-2 border-neutral-950/70"
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

const Ok = () => (
    <Check aria-hidden className="size-3.5 shrink-0 text-success-600" strokeWidth={2.25} />
);

const Swatch = ({ hex, on, className }: { hex: string; on: boolean; className?: string }) => (
    <span
        className={cn(
            'size-7 rounded-full ring-offset-2 ring-offset-neutral-50 transition-shadow duration-200',
            on ? 'ring-2 ring-neutral-950' : 'ring-0',
            className,
        )}
        style={{ background: hex }}
    />
);

const Label = ({ children, top }: { children: ReactNode; top: number }) => (
    <p className="absolute left-6 text-neutral-600 text-xs" style={{ top }}>
        {children}
    </p>
);

/* ---------- 01 Theme and 02 Project: one builder window ---------- */

/** A small product picture in the theme being made: real parts, inert. */
const Preview = ({ theme }: { theme: string }) => (
    <Theme className="absolute inset-0 flex items-center justify-center" theme={theme}>
        <Card className="w-[340px] gap-4">
            <div className="flex items-center justify-between">
                <p className="font-medium text-neutral-950 text-sm">Invite your team</p>
                <Badge tone="primary">Pro</Badge>
            </div>
            <Input readOnly tabIndex={-1} value="ana@acme.com" />
            <div className="flex items-center justify-between text-neutral-800 text-xs">
                Send a welcome email
                <Switch checked tabIndex={-1} />
            </div>
            <Progress label="Seats" showValue value={60} />
            <div className="flex justify-end gap-2">
                <span className={buttonVariants({ variant: 'secondary', size: 'md' })}>Cancel</span>
                <span className={buttonVariants({ size: 'md' })}>Send invite</span>
            </div>
        </Card>
    </Theme>
);

const Controls = ({ step }: { step: number }) => (
    <div className="absolute top-[112px] bottom-0 left-0 w-[280px] border-neutral-200 border-r">
        <Label top={16}>Accent</Label>
        <div className="absolute top-10 left-6 flex gap-3">
            {BUILDER_ACCENTS.map((hex, index) => (
                <Swatch hex={hex} key={hex} on={index === (step >= 1 ? 1 : 0)} />
            ))}
        </div>
        <Label top={100}>Greys</Label>
        <div className="absolute top-[124px] left-6 flex gap-2">
            {['Neutral', 'Warm', 'Cool'].map((name, index) => (
                <span
                    className={cn(
                        'flex h-[30px] w-[72px] items-center justify-center rounded-control border text-xs transition-colors duration-200',
                        index === (step >= 2 ? 2 : 0)
                            ? 'border-neutral-400 bg-neutral-200 text-neutral-950'
                            : 'border-neutral-200 text-neutral-600',
                    )}
                    key={name}
                >
                    {name}
                </span>
            ))}
        </div>
        <Label top={184}>Corners</Label>
        <div className="absolute top-[208px] left-6 flex gap-2">
            {[2, 8, 14].map((radius, index) => (
                <span
                    className={cn(
                        'flex size-[34px] items-center justify-center rounded-control border transition-colors duration-200',
                        index === (step >= 3 ? 2 : 0)
                            ? 'border-neutral-400 bg-neutral-200'
                            : 'border-neutral-200',
                    )}
                    key={radius}
                >
                    <span
                        className="size-3.5 border-neutral-600 border-t-2 border-l-2"
                        style={{ borderTopLeftRadius: radius }}
                    />
                </span>
            ))}
        </div>
        <Label top={268}>Font</Label>
        <span className="absolute top-[292px] left-6 flex h-[34px] w-[232px] items-center rounded-control border border-neutral-200 px-3 text-neutral-950 text-xs">
            Geist
        </span>
        <p className="absolute right-6 bottom-6 left-6 text-neutral-500 text-xxs leading-[1.5]">
            Free, no account. Save it when you want to keep it.
        </p>
    </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-neutral-600 text-xs">{label}</span>
        <span className="flex h-[34px] items-center rounded-control border border-neutral-200 bg-neutral-50 px-3 text-neutral-950 text-xs">
            {children}
        </span>
    </div>
);

/** Sign up and name the project: a small dialog over the builder. */
const SaveDialog = () => {
    const email = useCue(CUE.typeEmail);
    const name = useCue(CUE.typeName);
    const pressed = useCue(CUE.create);

    return (
        <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-x-0 top-11 bottom-0 bg-neutral-50/60"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: pace(0.3) }}
        >
            <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute flex flex-col gap-4 rounded-card border border-neutral-200 bg-neutral-100 p-6 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.6)]"
                exit={{ opacity: 0, scale: 0.96 }}
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                style={{ left: 230, top: 106, width: 380, height: 300 }}
                transition={{ duration: pace(0.4), ease: EASE_OUT }}
            >
                <div className="flex flex-col gap-1">
                    <p className="font-medium text-neutral-950 text-sm">Save as project</p>
                    <p className="text-neutral-600 text-xs">
                        A free account keeps this theme in one place.
                    </p>
                </div>
                <Field label="Email">
                    <Typed active={email} step={0.03} text={EMAIL} />
                </Field>
                <Field label="Project">
                    <Typed active={name} step={0.06} text="Acme" />
                </Field>
                <Pressable className="absolute right-6 bottom-6" pressed={pressed}>
                    <span className={cn(buttonVariants({ size: 'md' }), 'w-[130px]')}>
                        {pressed ? <Spinner size="sm" /> : 'Create project'}
                    </span>
                </Pressable>
            </motion.div>
        </motion.div>
    );
};

const SUMMARY = [
    { label: 'Accent', value: '#3939E5', swatch: '#3939e5' },
    { label: 'Greys', value: 'Cool' },
    { label: 'Corners', value: 'Round' },
    { label: 'Font', value: 'Geist' },
];

/** The project Acme, just made: its theme, and how to link a repo. */
const ProjectView = () => {
    const copied = useCue(CUE.copy);

    return (
        <Panel className="top-[112px]">
            <div className="absolute top-6 left-6 flex items-center gap-2">
                <p className="font-medium text-lg text-neutral-950">Acme</p>
                <Badge tone="success">Saved</Badge>
            </div>
            <p className="absolute top-[58px] left-6 text-neutral-600 text-xs">
                Project · created just now · 0 repos linked
            </p>
            <div className="absolute top-[100px] left-6 w-[400px] rounded-card border border-neutral-200">
                {SUMMARY.map((row, index) => (
                    <Appear
                        className="flex h-11 items-center border-neutral-200 px-4 text-xs [&+&]:border-t"
                        delay={pace(0.1 + index * 0.1)}
                        key={row.label}
                        show
                    >
                        <span className="w-28 text-neutral-600">{row.label}</span>
                        {row.swatch && (
                            <span
                                className="mr-2 size-3 rounded-full"
                                style={{ background: row.swatch }}
                            />
                        )}
                        <span className="text-neutral-950">{row.value}</span>
                    </Appear>
                ))}
            </div>
            <Appear
                className="absolute top-[100px] left-[456px] flex w-[336px] flex-col gap-3"
                delay={pace(0.5)}
                show
            >
                <p className="font-medium text-neutral-950 text-sm">Link a repo</p>
                <p className="text-neutral-600 text-xs leading-[1.5]">
                    Run this in the repo. It pulls the theme and connects your agent to this
                    project.
                </p>
            </Appear>
            <Appear
                className="absolute flex items-center gap-2 rounded-control border border-neutral-200 bg-neutral-100 pr-1.5 pl-3 font-mono text-[13px] text-neutral-950"
                delay={pace(0.6)}
                show
                style={{
                    left: COMMAND_BOX.x - BUILDER.left,
                    top: COMMAND_BOX.y - BUILDER.top - 112,
                    width: COMMAND_BOX.width,
                    height: COMMAND_BOX.height,
                }}
            >
                <span className="text-neutral-500">$</span>
                <span className="flex-1">{COMMAND}</span>
                <Pressable pressed={copied}>
                    <span className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
                        {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={2} />}
                    </span>
                </Pressable>
            </Appear>
        </Panel>
    );
};

const BuilderWindow = () => {
    const shown = usePhase([CUE.makeIn, CUE.makeOut, CUE.saveIn, CUE.saveOut]);
    const saving = useCue(CUE.saveIn - 0.01);
    const picks = usePhase(CUE.picks);
    const pressedSave = useCue(CUE.save);
    const dialog = usePhase([CUE.save, CUE.create + pace(0.2)]) === 1;
    const project = useCue(CUE.project);
    const step = saving ? 3 : picks;

    return (
        <Presence
            enter={{ opacity: 0, y: 160, rotateX: 18, scale: 0.94 }}
            exit={{ opacity: 0, scale: 0.94, y: 40 }}
            phase={twice(shown)}
            style={BUILDER}
        >
            <Chrome icon={<ContinuumMark size={14} />} title="Continuum · Theme builder">
                <div className="absolute inset-x-0 top-11 h-[68px] border-neutral-200 border-b">
                    <p className="absolute top-6 left-6 font-medium text-neutral-950 text-sm">
                        {project ? 'Acme' : 'Untitled theme'}
                    </p>
                    <Pressable className="absolute top-[17px] right-6" pressed={pressedSave}>
                        <span
                            className={cn(
                                buttonVariants({
                                    size: 'md',
                                    variant: project ? 'secondary' : 'primary',
                                }),
                                'w-[132px]',
                            )}
                        >
                            {project ? 'Open builder' : 'Save as project'}
                        </span>
                    </Pressable>
                </div>
                <AnimatePresence initial={false}>
                    {project ? (
                        <ProjectView key="project" />
                    ) : (
                        <Panel key="builder">
                            <Controls step={step} />
                            <div className="absolute top-[112px] right-0 bottom-0 left-[280px] bg-neutral-100">
                                <Preview theme={BUILDER_STEPS[step] ?? 'hiw-start'} />
                            </div>
                        </Panel>
                    )}
                </AnimatePresence>
                <AnimatePresence>{dialog && <SaveDialog key="dialog" />}</AnimatePresence>
            </Chrome>
        </Presence>
    );
};

/* ---------- 03 Link ---------- */

const PULLED = [
    { what: 'Pulled the theme', where: 'src/app.css' },
    { what: 'Added the components', where: 'continuum' },
    { what: 'Installed the skill', where: 'continuum-taste' },
    { what: 'Connected the MCP server', where: '.mcp.json → acme' },
];

const TerminalWindow = () => {
    const shown = usePhase([CUE.terminalIn, CUE.terminalOut]);
    const typed = useCue(CUE.commandInput);
    const ran = useCue(CUE.run);
    const rows = useCue(CUE.rows);
    const linked = useCue(CUE.linked);

    return (
        <Presence
            enter={{ opacity: 0, scale: 0.86 }}
            exit={{ opacity: 0, y: 200, scale: 0.96 }}
            phase={shown}
            style={TERMINAL}
        >
            <Chrome icon={<Terminal className="size-3.5" strokeWidth={2} />} title="acme-web — zsh">
                <div className="absolute inset-x-0 top-11 bottom-0 font-mono text-[14px] text-neutral-800">
                    <p
                        className="absolute left-8 flex h-9 items-center"
                        style={{ top: COMMAND_LINE.y - TERMINAL.top - 44 }}
                    >
                        <span className="w-[124px] text-neutral-500">
                            ~/acme-web <span className="text-neutral-950">$</span>
                        </span>
                        <motion.span
                            animate={{ opacity: typed ? 1 : 0 }}
                            className="text-neutral-950"
                            initial={false}
                            transition={{ duration: pace(0.25), delay: pace(0.14) }}
                        >
                            {COMMAND}
                        </motion.span>
                    </p>
                    <AnimatePresence>
                        {ran && !rows && (
                            <motion.p
                                animate={{ opacity: 1 }}
                                className="absolute top-[64px] left-8 flex items-center gap-2 text-neutral-500"
                                exit={{ opacity: 0 }}
                                initial={{ opacity: 0 }}
                                key="linking"
                            >
                                <Spinner size="sm" />
                                Linking to acme
                            </motion.p>
                        )}
                    </AnimatePresence>
                    <Appear
                        className="absolute top-[60px] left-8 flex h-8 items-center gap-2"
                        show={rows}
                    >
                        <ContinuumMark className="text-neutral-950" size={14} />
                        <span className="text-neutral-950">Linked to acme</span>
                        <span className="text-neutral-500">indigo · cool · round · Geist</span>
                    </Appear>
                    {PULLED.map((row, index) => (
                        <Appear
                            className="absolute left-8 flex h-8 items-center"
                            delay={pace(0.2 + index * 0.25)}
                            key={row.what}
                            show={rows}
                            style={{ top: 100 + index * 36 }}
                        >
                            <Ok />
                            <span className="ml-3 w-[260px] text-neutral-950">{row.what}</span>
                            <span className="text-neutral-500">{row.where}</span>
                        </Appear>
                    ))}
                    <Appear className="absolute top-[262px] left-8 flex gap-2" show={linked}>
                        <span className="text-neutral-950">Done.</span>
                        <span className="text-neutral-500">
                            Your agent now works from the acme project.
                        </span>
                    </Appear>
                </div>
            </Chrome>
        </Presence>
    );
};

/* ---------- 04 Build ---------- */

const TOOLS = [
    { name: 'continuum · get_theme', note: 'acme' },
    { name: 'continuum · get_pattern', note: 'list page' },
    { name: 'continuum · get_component', note: 'Table, FilterConditions, Pagination' },
    { name: 'Write src/pages/customers.tsx', note: '+212 lines' },
];

const Thread = () => {
    const tools = usePhase(CUE.tools);
    const done = usePhase(CUE.toolsDone);
    const built = useCue(CUE.built);

    return (
        <>
            <motion.p
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-6 right-7 left-7 rounded-card bg-neutral-100 px-4 py-3 text-[14px] text-neutral-950 leading-[1.5]"
                initial={{ y: 380, opacity: 0 }}
                transition={{ duration: pace(0.7), ease: EASE_OUT, delay: pace(0.1) }}
            >
                <span className="mr-2 font-mono text-neutral-500">&gt;</span>
                {PROMPT}
            </motion.p>
            {TOOLS.map((tool, index) => (
                <Appear
                    className="absolute left-8 flex h-7 items-center gap-2.5 font-mono text-[13px]"
                    key={tool.name}
                    show={tools > index}
                    style={{ top: 112 + index * 36 }}
                >
                    {done > index ? <Ok /> : <Spinner size="sm" />}
                    <span className="text-neutral-950">{tool.name}</span>
                    <span className="text-neutral-500">{tool.note}</span>
                </Appear>
            ))}
            <Appear
                className="absolute top-[272px] right-8 left-8 text-[14px] text-neutral-800 leading-[1.6]"
                show={built}
            >
                Built the customers page from the list recipe: search and filters over the table,
                pages at the foot, in the acme theme.
            </Appear>
        </>
    );
};

const ClaudeWindow = () => {
    const shown = usePhase([CUE.claudeIn, CUE.claudeOut]);
    const typing = useCue(CUE.typePrompt);
    const sent = useCue(CUE.send);

    return (
        <Presence
            enter={{ opacity: 0, y: 140 }}
            exit={{ opacity: 0, scale: 0.94 }}
            phase={shown}
            style={CLAUDE}
        >
            <Chrome
                icon={<Terminal className="size-3.5" strokeWidth={2} />}
                title="Claude Code — acme-web"
            >
                <div className="absolute inset-x-0 top-11 bottom-0">
                    {sent && <Thread />}
                    <div className="absolute right-7 bottom-7 left-7 flex h-[60px] items-center gap-3 rounded-card border border-neutral-200 bg-neutral-50 px-4 font-mono text-[13px] text-neutral-950">
                        <span className="text-neutral-500">&gt;</span>
                        <span className="min-w-0 flex-1 truncate">
                            {typing && !sent ? (
                                <Typed step={0.015} text={PROMPT} />
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

/** The finished screen, whole: in Acme's theme, and in its new one once synced. */
const ScreenWindow = () => {
    const shown = usePhase([CUE.screenIn, CUE.screenOut, CUE.backIn, CUE.syncOut]);
    const back = useCue(SYNC);
    const recoloured = useCue(CUE.recolour);

    return (
        <Presence
            enter={{ opacity: 0, y: 160, rotateX: 16, scale: 0.94 }}
            exit={{ opacity: 0, scale: 0.96 }}
            phase={twice(shown)}
            style={SCREEN}
        >
            <motion.div
                animate={back ? { x: 24, y: 70, scale: 0.68 } : { x: 0, y: 0, scale: 1 }}
                className="size-full"
                initial={false}
                style={{ transformOrigin: '100% 0%' }}
                transition={{ duration: 0 }}
            >
                <Chrome
                    icon={<Lock className="size-3" strokeWidth={2} />}
                    title="acme-web · localhost:5173/customers"
                >
                    <Theme
                        className="absolute inset-x-0 top-11 bottom-0 overflow-hidden"
                        theme={recoloured ? 'hiw-acme-next' : 'hiw-acme'}
                    >
                        <div
                            inert
                            style={{
                                width: 1280,
                                height: 720,
                                transform: `scale(${SCREEN_SCALE})`,
                                transformOrigin: '0 0',
                            }}
                        >
                            <Shot className="size-full">{customers?.render(true)}</Shot>
                        </div>
                    </Theme>
                </Chrome>
            </motion.div>
        </Presence>
    );
};

/* ---------- 05 Sync ---------- */

const AccountWindow = () => {
    const shown = usePhase([CUE.accountIn, CUE.syncOut]);
    const picked = useCue(CUE.pickAccent);
    const pressed = useCue(CUE.sync);
    const repos = usePhase(CUE.repos);
    const synced = useCue(CUE.synced);

    return (
        <Presence
            enter={{ opacity: 0, x: -60, scale: 0.94 }}
            exit={{ opacity: 0, scale: 0.94 }}
            phase={shown}
            style={ACCOUNT}
        >
            <Chrome icon={<ContinuumMark size={14} />} title="Continuum · Acme">
                <div className="absolute inset-x-0 top-11 bottom-0 text-xs">
                    <div className="absolute top-5 left-6 flex items-center gap-2">
                        <p className="font-medium text-neutral-950 text-sm">Acme</p>
                        <Badge>Project</Badge>
                    </div>
                    <Label top={52}>Accent</Label>
                    <div className="absolute top-[72px] left-6 flex gap-3">
                        {ACCOUNT_ACCENTS.map((hex, index) => (
                            <Swatch hex={hex} key={hex} on={index === (picked ? 1 : 0)} />
                        ))}
                    </div>
                    <p className="absolute top-[118px] left-6 text-neutral-500">
                        Cool greys · round corners · Geist
                    </p>
                    <span className="absolute top-[150px] right-6 left-6 h-px bg-neutral-200" />
                    <Label top={166}>Linked repos</Label>
                    {REPOS.map((repo, index) => (
                        <div
                            className="absolute right-6 left-6 flex h-9 items-center gap-2.5 border-neutral-200 border-b"
                            key={repo}
                            style={{ top: 190 + index * 40 }}
                        >
                            <span className="flex-1 font-mono text-neutral-950">{repo}</span>
                            {repos > index ? (
                                <>
                                    <Ok />
                                    <span className="w-[72px] text-neutral-800">Synced</span>
                                </>
                            ) : pressed ? (
                                <>
                                    <Spinner size="sm" />
                                    <span className="w-[72px] text-neutral-500">Syncing</span>
                                </>
                            ) : (
                                <>
                                    <StatusDot tone="neutral" />
                                    <span className="w-[72px] text-neutral-500">Up to date</span>
                                </>
                            )}
                        </div>
                    ))}
                    <Pressable
                        className="absolute right-6 left-6"
                        pressed={pressed}
                        style={{ top: 352 }}
                    >
                        <span
                            className={cn(
                                buttonVariants({ size: 'md' }),
                                'w-full',
                                !picked && 'opacity-50',
                            )}
                        >
                            {synced ? (
                                <>
                                    <Check strokeWidth={2} />
                                    Saved
                                </>
                            ) : (
                                'Save and sync'
                            )}
                        </span>
                    </Pressable>
                </div>
            </Chrome>
        </Presence>
    );
};

/** The moment itself, over the canvas: one change, three repos. */
const SyncedNote = () => {
    const shown = usePhase([CUE.synced, CUE.syncOut]) === 1;

    return (
        <motion.div
            animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
            className="absolute top-8 flex h-10 items-center gap-2.5 rounded-full bg-neutral-950 px-5 font-medium text-[14px] text-neutral-50 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.6)]"
            initial={false}
            style={{ left: 552, translateX: '-50%' }}
            transition={{ duration: pace(0.5), ease: EASE_OUT }}
        >
            <Check className="size-4" strokeWidth={2.25} />
            Synced to 3 repos
        </motion.div>
    );
};

const Scene = () => (
    <>
        <BuilderWindow />
        <TerminalWindow />
        <ClaudeWindow />
        <ScreenWindow />
        <AccountWindow />
        <SyncedNote />
        <Track
            icon={<Terminal className="size-3.5 shrink-0" strokeWidth={2} />}
            keys={COMMAND_TRACK}
        >
            {COMMAND}
        </Track>
        <Cursor />
    </>
);

/* ---------- The player ---------- */

type Layer = { id: number; color: number; from: 'top' | 'center' };

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

/** The backgrounds, each new one growing over the last from the top or the centre. */
const Wipes = ({ layers, reduce }: { layers: Layer[]; reduce: boolean }) =>
    layers.map(layer => {
        const top = layer.from === 'top';
        return (
            <motion.div
                animate={{ clipPath: top ? 'circle(150% at 50% 0%)' : 'circle(75% at 50% 50%)' }}
                className="absolute inset-0"
                initial={
                    layer.id === 0
                        ? false
                        : { clipPath: top ? 'circle(0% at 50% 0%)' : 'circle(0% at 50% 50%)' }
                }
                key={layer.id}
                style={{ background: PALETTES[layer.color]?.background }}
                transition={{ duration: reduce ? 0 : pace(0.9), ease: EASE_IN_OUT }}
            />
        );
    });

const pad = (value: number) => String(value).padStart(2, '0');

const Player = () => {
    const reduce = useReducedMotion() ?? false;
    const player = useRef<HTMLDivElement>(null);
    const screen = useRef<HTMLDivElement>(null);
    const inView = useInView(player, { amount: 0.45 });
    const pageVisible = usePageVisible();
    const time = useMotionValue(0);
    const playback = useRef<AnimationPlaybackControls | null>(null);
    const layerId = useRef(0);
    const [segment, setSegment] = useState(0);
    const [zoom, setZoom] = useState(0);
    const [started, setStarted] = useState(false);
    const [paused, setPaused] = useState(false);
    const [size, setSize] = useState(CANVAS);
    const [layers, setLayers] = useState<Layer[]>([{ id: 0, color: 0, from: 'center' }]);

    const scale = useMotionValue(1);
    const originX = useMotionValue(CANVAS.width / 2);
    const originY = useMotionValue(CANVAS.height / 2);
    const origin = useMotionTemplate`${originX}px ${originY}px`;

    const current = SEGMENTS[segment] ?? SEGMENTS[0];
    const palette = PALETTES[current?.color ?? 0] ?? PALETTES[0];
    const playing = started && inView && pageVisible && !paused;
    const fit = Math.min(1, size.width / CANVAS.width, size.height / CANVAS.height);
    const compact = size.width < 768;

    useMotionValueEvent(time, 'change', value => {
        const nextSegment = segmentAt(value);
        const nextZoom = ZOOMS.reduce(
            (found, entry, index) => (value >= entry.at ? index : found),
            0,
        );
        setSegment(previous => (previous === nextSegment ? previous : nextSegment));
        setZoom(previous => (previous === nextZoom ? previous : nextZoom));
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

    useEffect(() => {
        const color = SEGMENTS[segment]?.color ?? 0;
        setLayers(previous => {
            if (previous[previous.length - 1]?.color === color) return previous;
            layerId.current += 1;
            return [
                ...previous.slice(-1),
                { id: layerId.current, color, from: SEGMENTS[segment]?.from ?? 'center' },
            ];
        });
    }, [segment]);

    useEffect(() => {
        const entry = ZOOMS[zoom];
        if (!entry) return;
        if (
            entry.x !== undefined &&
            entry.y !== undefined &&
            (entry.x !== originX.get() || entry.y !== originY.get())
        ) {
            if (Math.abs(scale.get() - 1) > 0.01) scale.set(1);
            originX.set(entry.x);
            originY.set(entry.y);
        }
        const target = compact ? 1 + (entry.scale - 1) * 0.35 : entry.scale;
        if (entry.instant || reduce) {
            scale.set(target);
            return;
        }
        const move = animate(scale, target, {
            duration: entry.duration ?? pace(1),
            ease: EASE_IN_OUT,
        });
        return () => move.stop();
    }, [zoom, compact, reduce, scale, originX, originY]);

    const jump = (beat: number) => {
        playback.current?.stop();
        time.set(paused ? (STILLS[beat] ?? 0) : beatStart(beat));
        if (playing) play();
    };

    return (
        <MotionConfig reducedMotion="user">
            <div
                className="relative h-[420px] select-none overflow-hidden rounded-panel border border-neutral-200 sm:h-[600px] md:h-[720px]"
                ref={player}
                style={{ '--ink': palette?.ink, '--muted': palette?.muted } as CSSProperties}
            >
                <div aria-hidden className="absolute inset-0" ref={screen}>
                    <Wipes layers={layers} reduce={reduce} />

                    <div
                        className="absolute top-1/2 left-1/2"
                        style={{
                            width: CANVAS.width,
                            height: CANVAS.height,
                            transform: `translate(-50%, -50%) scale(${fit})`,
                        }}
                    >
                        <motion.div
                            className="absolute inset-0"
                            style={{ scale, transformOrigin: origin }}
                        >
                            <div className="absolute -inset-[600px] bg-[radial-gradient(circle,color-mix(in_oklab,var(--ink)_14%,transparent)_1.2px,transparent_1.6px)] bg-size-[32px_32px]" />
                            <TimeContext value={time}>{started && <Scene />}</TimeContext>
                        </motion.div>
                    </div>

                    {/* Keeps the controls clear of whatever the camera brings down to them. */}
                    <div className="absolute inset-0 [mask-image:linear-gradient(to_top,black_40px,transparent_104px)]">
                        <Wipes layers={layers} reduce={reduce} />
                    </div>

                    <AnimatePresence>
                        {started && current?.kind === 'title' && (
                            <TitleCard beat={current.beat} key={segment} />
                        )}
                    </AnimatePresence>
                </div>

                <ol className="sr-only">
                    {captions.map(caption => (
                        <li key={caption.title}>
                            {caption.title} {caption.body}
                        </li>
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
                                title={`${pad(index + 1)} ${caption.label}: ${caption.title}`}
                            />
                        ))}
                    </div>
                    <button
                        aria-label={paused ? 'Play the video' : 'Pause the video'}
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--ink)/20 text-(--ink) transition-[color,border-color,background-color] duration-[420ms] hover:bg-(--ink)/10 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
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
            <p className="font-mono text-(--muted) text-sm transition-colors duration-[420ms]">
                <Words delay={0.45} text={`${pad(beat + 1)} / ${pad(BEATS)}`} />
            </p>
            <p className="mt-4 max-w-3xl text-balance font-medium text-(--ink) text-4xl leading-[1.02] tracking-[-0.02em] transition-colors duration-[420ms] md:text-6xl">
                <Words delay={0.5} text={caption.title} />
            </p>
            <p className="mt-5 max-w-md text-(--muted) text-base transition-colors duration-[420ms] md:text-lg">
                <Words delay={0.75} stagger={0.02} text={caption.body} />
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
                    'hidden items-center gap-2 truncate text-xs transition-colors duration-[420ms] md:flex',
                    active ? 'text-(--ink)' : 'text-(--muted)',
                )}
            >
                <span className="font-mono text-xxs tabular-nums opacity-70">{pad(beat + 1)}</span>
                {label}
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-(--ink)/15 transition-colors duration-[420ms] group-focus-visible:outline-2 group-focus-visible:outline-focus group-focus-visible:outline-offset-2">
                <motion.span
                    className="block h-full origin-left rounded-full bg-(--ink)"
                    style={{ scaleX: fill }}
                />
            </span>
        </button>
    );
};

/* ---------- The section ---------- */

export const HowItWorks = () => (
    <Section
        description="Bring Continuum into your existing development workflow. Use its components, connect your tools and let your agents work with a consistent set of design standards."
        eyebrow="How it works"
        id="how-it-works"
        title="From setup to finished interface."
    >
        <style>{themeCss}</style>
        <Reveal>
            <Player />
        </Reveal>
    </Section>
);
