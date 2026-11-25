'use client';

import { cn } from '@contui/ui';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ease } from '../web';

/*
 * The kit the In practice films share. A film is a few seconds of what a job does to your UI, looping.
 * Its rules: show, don't tell (no captions; text only where the text is the act or the data, a typed
 * prompt, a value, a formula); one thing on screen at a time; one continuous sequence, the camera
 * moving between the parts rather than cutting; nothing fades, since a fade lets the canvas's dots
 * show through (things slide, wipe, clip open or veil instead); real values; a real screen, drawn at
 * its real size from the library's own parts, with the camera panning and zooming over it.
 */

/**
 * A short film: its beats in order, each held for its time in ms, looping: after the last it starts
 * again, a new round. Under reduced motion it holds its last beat, the result.
 */
export const useFilm = (beats: readonly number[]) => {
    const reduce = useReducedMotion() ?? false;
    const [beat, setBeat] = useState(reduce ? beats.length - 1 : 0);
    const [round, setRound] = useState(0);
    useEffect(() => {
        if (reduce) return;
        const timer = setTimeout(() => {
            if (beat < beats.length - 1) return setBeat(beat + 1);
            setBeat(0);
            setRound(value => value + 1);
        }, beats[beat]);
        return () => clearTimeout(timer);
    }, [beat, beats, reduce]);
    return { beat, round };
};

/** A film's length in seconds, for the job list to wait on. */
export const seconds = (beats: readonly number[]) => beats.reduce((sum, ms) => sum + ms, 0) / 1000;

/**
 * A film's frame: one stage on the canvas's dots, the film playing in it. A film ends on its result;
 * the job list then moves on to the next job. Picked and left playing, it starts again from the top.
 */
export const FilmFrame = ({ round, children }: { round: number; children: ReactNode }) => (
    <div className="relative h-full overflow-hidden bg-[radial-gradient(circle,var(--color-neutral-200)_1px,transparent_1.4px)] bg-size-[16px_16px]">
        <div className="absolute inset-0" key={`round-${round}`}>
            {children}
        </div>
    </div>
);

/**
 * A part stepped back while another is in focus: a solid veil of the surface's own colour laid over
 * it, so the canvas never shows through it.
 */
export const Veil = ({ on }: { on: boolean }) => (
    <motion.span
        animate={{ opacity: on ? 0.75 : 0 }}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-neutral-50"
        initial={false}
        transition={{ duration: 0.5, ease }}
    />
);

/** A number counting up to its value as it appears, as a calculation coming out. */
export const Count = ({
    to,
    delay = 0,
    digits = 1,
}: {
    to: number;
    delay?: number;
    digits?: number;
}) => {
    const reduce = useReducedMotion() ?? false;
    const [shown, setShown] = useState(reduce ? to : 0);
    useEffect(() => {
        if (reduce) return;
        const control = animate(0, to, {
            duration: 0.8,
            delay,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: setShown,
        });
        return () => control.stop();
    }, [reduce, to, delay]);
    return <>{shown.toFixed(digits)}</>;
};

/** Flips from false to true `after` ms after it mounts: the one change a step makes. */
export const useAfter = (after: number) => {
    const reduce = useReducedMotion() ?? false;
    const [done, setDone] = useState(reduce);
    useEffect(() => {
        if (reduce) return;
        const timer = setTimeout(() => setDone(true), after);
        return () => clearTimeout(timer);
    }, [after, reduce]);
    return done;
};

/** The prompt, as you type it to your agent: the words a letter at a time behind a caret, then sent. */
export const Prompt = ({ text, on }: { text: string; on: boolean }) => {
    const reduce = useReducedMotion() ?? false;
    const [typed, setTyped] = useState(0);
    useEffect(() => {
        if (!on) return;
        if (reduce) return setTyped(text.length);
        setTyped(0);
        const timer = setInterval(
            () => setTyped(value => (value >= text.length ? value : value + 1)),
            30,
        );
        return () => clearInterval(timer);
    }, [on, reduce, text]);
    const sent = typed >= text.length;
    return (
        <motion.div
            animate={{ y: on ? 0 : -90 }}
            className="absolute top-6 left-1/2 z-30 flex w-[380px] max-w-[calc(100%-32px)] origin-top -translate-x-1/2 items-center gap-3 rounded-control border border-neutral-200 bg-neutral-50 py-2.5 pr-2.5 pl-4 text-[13px] shadow-float max-lg:top-3 max-lg:scale-75"
            initial={{ y: -90 }}
            transition={{ duration: 0.35, ease }}
        >
            <span className="min-w-0 flex-1 truncate text-neutral-950">
                {text.slice(0, typed)}
                <span
                    aria-hidden
                    className="ml-px inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-neutral-950"
                />
            </span>
            <span
                className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
                    sent ? 'bg-action text-on-action' : 'bg-neutral-200 text-neutral-500',
                )}
            >
                <ArrowUp aria-hidden className="size-3.5" strokeWidth={2} />
            </span>
        </motion.div>
    );
};

/**
 * The film's one callout, at the stage's top centre, over the camera's view rather than in it. It
 * clips open from the left and closes off to the right; the next opens only once the last has closed,
 * so there is never more than one. `id` null shows none; a new id is a new callout.
 */
export const Note = ({
    id,
    width,
    children,
}: {
    id: string | null;
    /** In px; by default as wide as its content. */
    width?: number;
    children: ReactNode;
}) => (
    <AnimatePresence mode="wait">
        {id && (
            <motion.div
                animate={{ clipPath: 'inset(0 0% 0 0 round 16px)' }}
                className={cn(
                    // On a narrow stage, where the screen is drawn smaller, the callout is too.
                    'absolute top-6 left-1/2 z-40 max-w-[calc(100%-32px)] origin-top -translate-x-1/2 rounded-card border border-neutral-200 bg-neutral-50 p-4 shadow-float max-lg:top-3 max-lg:scale-75',
                    !width && 'w-max',
                )}
                exit={{ clipPath: 'inset(0 0 0 100% round 16px)' }}
                initial={{ clipPath: 'inset(0 100% 0 0 round 16px)' }}
                key={id}
                style={width ? { width } : undefined}
                transition={{ duration: 0.25, ease }}
            >
                {children}
            </motion.div>
        )}
    </AnimatePresence>
);

/** What an audit says of findings, as data: what, as found, then what Continuum wants. */
export const Finding = ({ rows }: { rows: [string, string, string][] }) => (
    <div className="flex flex-col gap-2 font-mono text-[12px] tabular-nums">
        {rows.map(([what, found, wanted]) => (
            <div className="flex items-baseline gap-2" key={what}>
                <span className="w-16 shrink-0 text-neutral-500">{what}</span>
                <span className="text-error-500 line-through decoration-error-500/60">{found}</span>
                <span className="text-neutral-500">→</span>
                <span className="text-neutral-950">{wanted}</span>
            </div>
        ))}
    </div>
);

/** The agent's question on a structural change, and your answer pressed once `answered`. */
export const Ask = ({
    question,
    yes,
    no,
    answered,
}: {
    question: string;
    yes: string;
    no: string;
    answered: boolean;
}) => (
    <div className="flex flex-col gap-3 text-[13px]">
        <span className="text-neutral-950 leading-[1.4]">{question}</span>
        <div className="flex gap-2">
            <span
                className={cn(
                    'flex h-7 items-center rounded-control px-3 font-medium text-[12px] text-white transition-[scale,background-color] duration-150',
                    answered ? 'scale-95 bg-primary-600' : 'bg-primary-500',
                )}
            >
                {yes}
            </span>
            <span className="flex h-7 items-center rounded-control border border-neutral-200 px-3 text-[12px] text-neutral-700">
                {no}
            </span>
        </div>
    </div>
);

/** A finding marked on a screen: a red outline round the part (its parent is `relative`). */
export const Mark = ({ on }: { on: boolean }) => (
    <span
        aria-hidden
        className={cn(
            'pointer-events-none absolute -inset-1.5 z-20 rounded-[inherit] outline-2 outline-error-500 outline-solid transition-[outline-color] duration-200',
            !on && 'outline-transparent',
        )}
    />
);

export type Box = { x: number; y: number; width: number; height: number };

/**
 * Every film's screen: an app window at 16:9 and its real size, larger than the stage. It is never
 * scaled to fit its container: the stage crops it and the camera pans across it.
 */
export const SCREEN = { width: 1440, height: 810 } as const;

/**
 * Where the camera looks: `start`, the window's top left, as a cropped window shows it; or one part
 * of the screen, found by its `data-film` attribute and measured where it is at that moment, centred
 * as far as the window's edges allow. `cut` trims or grows the measured box (in the screen's px) to
 * the piece that matters.
 */
export type Shot = 'start' | { region: string; cut?: (box: Box) => Box };

/**
 * The stage's width on a desktop, where every film is composed. A narrower stage (a phone, a small
 * tablet) would show a keyhole of a real-size window, cutting the parts a shot is about; there, and
 * only there, the camera draws the screen smaller by the same ratio, so each shot keeps its framing.
 */
const COMPOSED = 720;

/** How large the camera draws the screen on a stage: real size, or less on a narrow stage. */
const scaleFor = (stage: { width: number }) => Math.min(1, stage.width / COMPOSED);

/** The pan that centres a box on the stage, never past the screen's edges. */
const frameBox = (
    box: Box,
    screen: { width: number; height: number },
    stage: { width: number; height: number },
) => {
    const scale = scaleFor(stage);
    const clamp = (value: number, room: number, drawn: number) =>
        drawn <= room ? (room - drawn) / 2 : Math.min(0, Math.max(room - drawn, value));
    return {
        scale,
        x: clamp(
            stage.width / 2 - scale * (box.x + box.width / 2),
            stage.width,
            scale * screen.width,
        ),
        y: clamp(
            stage.height / 2 - scale * (box.y + box.height / 2),
            stage.height,
            scale * screen.height,
        ),
    };
};

/**
 * A screen drawn at its real `size` (SCREEN, 16:9), cropped by the stage, with a camera that pans over it.
 * Each time `at` changes (pass the beat) the camera measures `shot` where it is now and moves to it.
 * The screen is inert: a film is watched, not used.
 */
export const FilmCamera = ({
    size,
    shot,
    at,
    children,
}: {
    size: { width: number; height: number };
    shot: Shot;
    at: number;
    children: ReactNode;
}) => {
    const [stage, setStage] = useState<HTMLDivElement | null>(null);
    const [screen, setScreen] = useState<HTMLDivElement | null>(null);
    const [room, setRoom] = useState({ width: 0, height: 0 });
    const [camera, setCamera] = useState<{ scale: number; x: number; y: number } | null>(null);
    // The first shot is cut to, not moved to: a film opens on it. Every shot after moves.
    const [moving, setMoving] = useState(false);
    const shotRef = useRef(shot);
    shotRef.current = shot;

    useEffect(() => {
        if (!stage) return;
        const measure = () => setRoom({ width: stage.clientWidth, height: stage.clientHeight });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(stage);
        return () => observer.disconnect();
    }, [stage]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: `at` is the cue to measure again; the shot is read from its ref.
    useEffect(() => {
        if (!screen || !room.width) return;
        const current = shotRef.current;
        if (current === 'start') {
            const scale = scaleFor(room);
            // A stage narrower than the composed one opens on the page rather than the sidebar
            // beside it, the first thing a narrow window gives up.
            const panel = scale < 1 ? screen.querySelector('[data-slot="app-panel"]') : null;
            const left = panel
                ? (panel.getBoundingClientRect().left - screen.getBoundingClientRect().left) /
                  (screen.getBoundingClientRect().width / size.width)
                : 0;
            setCamera(
                frameBox(
                    { x: left, y: 0, width: room.width / scale, height: room.height / scale },
                    size,
                    room,
                ),
            );
            return;
        }
        const part = screen.querySelector(`[data-film="${current.region}"]`);
        if (!part) return;
        const origin = screen.getBoundingClientRect();
        const rect = part.getBoundingClientRect();
        const drawn = origin.width / size.width;
        const box = {
            x: (rect.left - origin.left) / drawn,
            y: (rect.top - origin.top) / drawn,
            width: rect.width / drawn,
            height: rect.height / drawn,
        };
        setCamera(frameBox(current.cut ? current.cut(box) : box, size, room));
    }, [at, screen, room, size]);

    useEffect(() => {
        if (!camera || moving) return;
        const frame = requestAnimationFrame(() => setMoving(true));
        return () => cancelAnimationFrame(frame);
    }, [camera, moving]);

    return (
        <div className="absolute inset-0 overflow-hidden" ref={setStage}>
            {room.width > 0 && (
                <motion.div
                    animate={camera ?? undefined}
                    className="absolute top-0 left-0 origin-top-left"
                    initial={false}
                    inert
                    ref={setScreen}
                    style={{
                        width: size.width,
                        height: size.height,
                        visibility: camera ? undefined : 'hidden',
                    }}
                    transition={
                        moving ? { duration: 0.9, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }
                    }
                >
                    {children}
                </motion.div>
            )}
        </div>
    );
};
