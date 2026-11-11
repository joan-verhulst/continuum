import {
    Button,
    cn,
    type Gamut,
    hasRampSteps,
    maxChroma,
    neutralShape,
    type Oklch,
    type RampChannel,
    type RampCurveKey,
    type RampShape,
    type RampStepOverride,
    rampSteps,
    StatusDot,
    toCss,
} from 'continuum';
import {
    type KeyboardEvent,
    type PointerEvent,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { hueBand, hueKnob, SliderRow } from './parts';

/*
 * A ramp as three charts over its eleven steps: lightness, chroma and hue. It is the ramp editor's
 * other view, for working on the ramp as curves rather than as swatches. One chart is picked at a
 * time, and what shapes that curve as a whole sits under it: the others only show. A single step can be taken by its point and dragged up or
 * down (or nudged with the arrow keys) when it needs to sit apart on one channel, and a point
 * pressed without moving picks the step. Tailwind's own curve stays drawn, dashed, once the ramp
 * has moved off it. On the chroma chart the gamut's limit is drawn as a ceiling: past it a colour
 * cannot be shown. Each point is filled with its step's colour, so a chart is the ramp as well as
 * its curve.
 *
 * A step set by hand is absolute: it stays where it was put while the whole-ramp sliders move every
 * other step, and only for the channel it was set in (a step set on lightness still follows the
 * chroma and hue curves). Its point carries a dot, as a held series does on the harmony wheel.
 * Delete, Backspace or a double-click gives the step back to the curve. A primary's seed is the
 * accent itself and is never moved here.
 */

const channels: { value: RampChannel; label: string }[] = [
    { value: 'l', label: 'Lightness' },
    { value: 'c', label: 'Chroma' },
    { value: 'h', label: 'Hue' },
];

/**
 * The chart's drawing box in px. Its width is measured rather than scaled into, so the labels keep
 * their size at any width; the side pads hold the tick labels and half a point. Every chart is
 * the one height, picked or not, so picking one moves nothing but its controls.
 */
const CHART = 116;
const pad = { top: 12, right: 12, bottom: 24, left: 52 };
/** How far a tick's value stands off the plot, clear of the first point's ring. */
const tickGap = 14;

const hueDelta = (a: number, b: number) => ((a - b + 540) % 360) - 180;
const wrapHue = (h: number) => ((h % 360) + 360) % 360;

/** How far a curve may sit from Tailwind's before it counts as moved, per channel. */
const tolerance: Record<RampChannel, number> = { l: 0.001, c: 0.0005, h: 0.5 };

/** How far the pointer goes before a press on a point becomes a drag, in px. */
const dragSlop = 2;

type ShapeKey = RampCurveKey;
type Kind = 'primary' | 'grey';

/** The shape's keys each channel's sliders write, which its Reset clears. */
const channelKeys: Record<RampChannel, readonly ShapeKey[]> = {
    l: ['lightest', 'darkest', 'midtones'],
    c: ['saturation', 'taper'],
    h: ['drift', 'lightHue', 'darkHue'],
};

/** An arrow key's nudge on a step, and with Shift held. */
const nudgeOf = (channel: RampChannel, kind: Kind, big: boolean) =>
    (channel === 'l' ? 0.005 : channel === 'h' ? 1 : kind === 'grey' ? 0.0005 : 0.002) *
    (big ? 10 : 1);

/** A step's value as stored: lightness and chroma to four places, hue to a tenth of a degree. */
const stored = (channel: RampChannel, value: number) =>
    channel === 'h' ? Number(wrapHue(value).toFixed(1)) : Number(value.toFixed(4));

type Control = {
    key: ShapeKey;
    label: string;
    min: number;
    max: number;
    step: number;
    format: (value: number) => string;
};

const sign = (value: number) => (value > 0 ? '+' : value < 0 ? '−' : '');
const asPercent = (value: number) => `${Math.round(value * 100)}%`;
const asLightness = (value: number) => `${(value * 100).toFixed(1)}%`;
const asSigned = (value: number) =>
    Math.abs(value) < 0.005 ? '0' : `${sign(value)}${Math.abs(value).toFixed(2)}`;
const asTurn = (value: number) =>
    Math.round(value) === 0 ? '0°' : `${sign(value)}${Math.abs(Math.round(value))}°`;

/**
 * What shapes one curve as a whole, shown under its chart while that chart is the one picked; a
 * grey ramp has no drift of its own. Lightest and Darkest set the 50 and the 950; Midtones leans
 * the steps between (right lighter); Vividness scales the chroma against Tailwind's and Taper
 * fades the ends; Drift is Tailwind's turn of hue along the ramp, and the two ends turn the
 * lighter and the darker steps.
 */
const controlsFor = (channel: RampChannel, kind: Kind): Control[] => {
    if (channel === 'l') {
        return [
            {
                key: 'lightest',
                label: 'Lightest',
                min: 0.9,
                max: 1,
                step: 0.002,
                format: asLightness,
            },
            { key: 'midtones', label: 'Midtones', min: -1, max: 1, step: 0.05, format: asSigned },
            {
                key: 'darkest',
                label: 'Darkest',
                min: 0.1,
                max: 0.45,
                step: 0.005,
                format: asLightness,
            },
        ];
    }
    if (channel === 'c') {
        const taper: Control = {
            key: 'taper',
            label: 'Taper',
            min: 0,
            max: 2,
            step: 0.05,
            format: asPercent,
        };
        // The greys' amount of colour is their own colour's, set with it: only its fade is shaped here.
        if (kind === 'grey') return [taper];
        return [
            {
                key: 'saturation',
                label: 'Vividness',
                min: 0,
                max: 1.5,
                step: 0.05,
                format: asPercent,
            },
            taper,
        ];
    }
    const ends: Control[] = [
        { key: 'lightHue', label: 'Light end', min: -45, max: 45, step: 1, format: asTurn },
        { key: 'darkHue', label: 'Dark end', min: -45, max: 45, step: 1, format: asTurn },
    ];
    if (kind === 'grey') return ends;
    return [
        { key: 'drift', label: 'Drift', min: 0, max: 2, step: 0.05, format: asPercent },
        ...ends,
    ];
};

/**
 * The shape with only its set values, less the keys dropped, its steps set by hand kept while any
 * is; undefined once nothing is left.
 */
const tidy = (shape: RampShape, drop: readonly ShapeKey[] = []): RampShape | undefined => {
    const entries: [string, unknown][] = Object.entries(shape).filter(
        ([key, value]) =>
            key !== 'steps' &&
            !drop.includes(key as ShapeKey) &&
            typeof value === 'number' &&
            Number.isFinite(value),
    );
    if (hasRampSteps(shape)) entries.push(['steps', shape.steps]);
    return entries.length ? (Object.fromEntries(entries) as RampShape) : undefined;
};

/** The shape as its curves alone draw it, every step given back. */
export const withoutSteps = (shape?: RampShape) => tidy({ ...shape, steps: undefined });

/** The shape with one channel of one step set by hand, or given back to the curve when undefined. */
const withStep = (
    shape: RampShape | undefined,
    index: number,
    channel: RampChannel,
    value: number | undefined,
): RampShape | undefined => {
    const name = rampSteps[index];
    if (!name) return shape;
    const step: RampStepOverride = { ...shape?.steps?.[name] };
    if (value === undefined) delete step[channel];
    else step[channel] = stored(channel, value);
    const steps = { ...shape?.steps };
    if (Object.keys(step).length) steps[name] = step;
    else delete steps[name];
    return tidy({ ...shape, steps: Object.keys(steps).length ? steps : undefined });
};

type Drag = {
    pointer: number;
    index: number;
    /** The point's height less the pointer's when pressed, so the point stays under the pointer. */
    offset: number;
    startY: number;
    /** The shape when pressed, which Escape puts back and every move writes onto. */
    from: RampShape | undefined;
    moved: boolean;
    captured: boolean;
};

type Scale = { low: number; high: number; chromaStep?: number };

export type RampGraphProps = {
    label: string;
    /** The ramp as it is now, shaped, with its steps set by hand. */
    ramp: readonly Oklch[];
    /** The ramp as Tailwind would draw it, unshaped: the dashed reference and the ends' defaults. */
    reference: readonly Oklch[];
    /** The ramp as the curves alone draw it, without the steps set by hand; the ramp unless given. */
    curve?: readonly Oklch[];
    gamut: Gamut;
    /** The step the seed sits on, which the shape never moves; none for greys. */
    seed?: number;
    shape?: RampShape;
    onShape: (shape?: RampShape) => void;
    kind: Kind;
    /**
     * Where a step of this ramp starts to read as text: the lightness under which it keeps 4.5:1 on
     * the light surface, and the one over which it keeps it on the dark. Drawn across the lightness
     * chart, for a ramp whose steps are text: the greys.
     */
    textLine?: { light: number; dark: number };
    /**
     * The greys' own colour: its hue, and how much of it they carry (the chroma at their 500). It
     * is what the chroma and hue charts are charts of, so it is set under them: the tint under
     * chroma, the hue under hue. None for a colour's ramp, whose hue and chroma are the colour's.
     */
    tint?: { hue: number; tint: number; onChange: (next: { hue: number; tint: number }) => void };
    /** The step picked to be set under the chart, by index. */
    picked?: number | null;
    onPick?: (index: number) => void;
};

/** The shape with every step set by hand on one channel given back to its curve. */
const withoutChannelSteps = (shape: RampShape | undefined, channel: RampChannel) => {
    const steps = Object.fromEntries(
        Object.entries(shape?.steps ?? {}).flatMap(([name, step]) => {
            const rest = { ...step };
            delete rest[channel];
            return Object.keys(rest).length ? [[name, rest]] : [];
        }),
    );
    return tidy({ ...shape, steps: Object.keys(steps).length ? steps : undefined });
};

/**
 * A ramp as three charts, one under the other: lightness, chroma and hue over the eleven steps.
 * All three show at once, Tailwind's own curve stays drawn, dashed, behind what has been moved,
 * and a moved curve carries a mark by its name and its own Reset. One chart is the one being
 * worked on: it is picked by pressing it, and what shapes its curve as a whole shows under it and
 * nowhere else, so a slider is always beside the curve it moves. A point pressed is picked, to be
 * set under the charts as a step is on the strip; a point dragged up or down sets that step on
 * that channel alone.
 */
export const RampChart = (props: RampGraphProps) => {
    // Lightness first, for a colour and for the greys alike: it is where a ramp is read from.
    const order = ['l', 'c', 'h'] as const;
    const [active, setActive] = useState<RampChannel>(order[0]);

    return (
        <div className="flex min-w-0 flex-col gap-2" data-slot="ramp-chart">
            {order.map(channel => (
                <ChannelGraph
                    {...props}
                    active={channel === active}
                    channel={channel}
                    key={channel}
                    onActivate={() => setActive(channel)}
                />
            ))}
        </div>
    );
};

/** One of a ramp's curves: its eleven steps as points in their own colours. */
const ChannelGraph = ({
    label,
    ramp,
    reference,
    curve = ramp,
    gamut,
    seed,
    shape,
    onShape,
    kind,
    channel,
    picked,
    onPick,
    textLine,
    tint,
    active,
    onActivate,
}: RampGraphProps & {
    channel: RampChannel;
    /** The chart being worked on: the one whose controls show under it. */
    active: boolean;
    onActivate: () => void;
}) => {
    const clip = `ramp-plot-${useId().replace(/[^\w-]/g, '')}`;
    const box = useRef<HTMLDivElement>(null);
    const svg = useRef<SVGSVGElement>(null);
    const [W, setW] = useState(560);
    const [focused, setFocused] = useState<number | null>(null);
    const [dragging, setDragging] = useState<number | null>(null);
    // The scale under a drag holds still, so the point follows the pointer rather than the axis.
    const [frozen, setFrozen] = useState<Scale | null>(null);
    const drag = useRef<Drag | null>(null);
    const H = CHART;
    const plotH = H - pad.top - pad.bottom;

    // A drag writes once a frame, with the latest onShape.
    const write = useRef(onShape);
    write.current = onShape;
    const frame = useRef(0);
    const pending = useRef<{ shape: RampShape | undefined } | null>(null);
    const flush = () => {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        const next = pending.current;
        pending.current = null;
        if (next) write.current(next.shape);
    };
    const schedule = (next: RampShape | undefined) => {
        pending.current = { shape: next };
        if (!frame.current) frame.current = requestAnimationFrame(flush);
    };
    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    // Measured before paint, and again on every resize (a tab shown, a column narrowed).
    useLayoutEffect(() => {
        const node = box.current;
        if (!node) return;
        const measure = () => setW(Math.max(200, node.clientWidth));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    const plotW = W - pad.left - pad.right;
    const xAt = (i: number) => pad.left + (plotW * i) / 10;
    const channelName = channels.find(item => item.value === channel)?.label.toLowerCase() ?? '';
    const rampName = kind === 'primary' ? 'Primary' : 'Neutral';

    // Hue is drawn around the seed's own (or the middle step's), so a red that crosses 0° stays one line.
    const centreHue = ramp[seed ?? 5]?.h ?? 0;
    const read = (color: Oklch) =>
        channel === 'h' ? centreHue + hueDelta(color.h, centreHue) : color[channel];
    const values = ramp.map(read);
    const base = reference.map(read);
    const curveValues = curve.map(read);
    const ceiling = ramp.map(color => maxChroma(color.l, color.h, gamut));
    // Greys sit far under the gamut's limit, so it is drawn for them only once a step comes near it.
    const showCeiling =
        channel === 'c' &&
        (kind === 'primary' || ramp.some((color, i) => color.c > (ceiling[i] ?? 1) * 0.8));

    // Fixed where it can be, so a slider moves the curve rather than the scale under it.
    const scale = ((): Scale => {
        if (frozen) return frozen;
        if (channel === 'l') return { low: 0, high: 1 };
        if (channel === 'c') {
            // A primary's scale is the gamut's limit, which only its lightness and hue move. Greys
            // carry a few thousandths of chroma, under a limit that would flatten them, so theirs
            // follows them: room for Saturation at its most over Tailwind's curve, and never under
            // 0.010, so pure grey keeps a floor and a ceiling.
            const top =
                kind === 'grey'
                    ? Math.max(0.01, Math.max(...base) * 1.5, Math.max(...values) * 1.1)
                    : Math.max(0.05, ...values, ...base, ...ceiling) * 1.1;
            // Up to four intervals of a whole step, so every tick reads as a round number.
            const step = [0.002, 0.005, 0.01, 0.02, 0.05, 0.1].find(size => top / size <= 4) ?? 0.1;
            return { low: 0, high: Math.ceil(top / step - 1e-9) * step, chromaStep: step };
        }
        const furthest = Math.max(0, ...[...values, ...base].map(v => Math.abs(v - centreHue)));
        const spread = Math.max(60, Math.ceil((furthest + 5) / 15) * 15);
        return { low: centreHue - spread, high: centreHue + spread };
    })();
    const { low, high, chromaStep } = scale;
    const yAt = (value: number) => pad.top + plotH * (1 - (value - low) / (high - low));
    const valueAt = (y: number) => low + (1 - (y - pad.top) / plotH) * (high - low);

    const tick = (value: number) =>
        channel === 'l'
            ? `${Math.round(value * 100)}%`
            : channel === 'c'
              ? value.toFixed((chromaStep ?? 0) >= 0.01 ? 2 : 3)
              : `${Math.round(wrapHue(value))}°`;
    const exact = (value: number) =>
        channel === 'l'
            ? asLightness(value)
            : channel === 'c'
              ? value.toFixed(3)
              : `${Math.round(wrapHue(value))}°`;

    const ticks =
        channel === 'l'
            ? [0, 0.5, 1]
            : chromaStep
              ? Array.from({ length: Math.round(high / chromaStep) + 1 }, (_, i) => i * chromaStep)
              : [low, (low + high) / 2, high];
    const line = (list: readonly number[]) =>
        list.map((value, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(value)}`).join(' ');
    const moved = values.some(
        (value, i) => Math.abs(value - (base[i] ?? value)) > tolerance[channel],
    );

    /** Whether a step is set by hand on the channel on screen; the seed never is. */
    const heldAt = (i: number) => {
        const name = rampSteps[i];
        return i !== seed && name !== undefined && shape?.steps?.[name]?.[channel] !== undefined;
    };
    const anyHeld = rampSteps.some((_, i) => heldAt(i));

    /** The range a step may take on the channel on screen: chroma stops at the gamut's limit. */
    const rangeAt = (i: number): [number, number] =>
        channel === 'l'
            ? [0, 1]
            : channel === 'c'
              ? [0, Math.max(0, ceiling[i] ?? 0)]
              : [centreHue - 180, centreHue + 180];
    const clampAt = (i: number, value: number) => {
        const [min, max] = rangeAt(i);
        return Math.min(max, Math.max(min, value));
    };

    const pointerY = (event: PointerEvent) => {
        const rect = svg.current?.getBoundingClientRect();
        return rect ? ((event.clientY - rect.top) / Math.max(1, rect.height)) * H : 0;
    };

    const begin = (event: PointerEvent<SVGGElement>, i: number) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        const y = pointerY(event);
        drag.current = {
            pointer: event.pointerId,
            index: i,
            offset: yAt(values[i] ?? 0) - y,
            startY: y,
            from: shape,
            moved: false,
            captured: false,
        };
        setFrozen(scale);
        setDragging(i);
    };

    const move = (event: PointerEvent<SVGSVGElement>) => {
        const current = drag.current;
        if (!current || current.pointer !== event.pointerId) return;
        const y = pointerY(event);
        if (!current.moved && Math.abs(y - current.startY) < dragSlop) return;
        current.moved = true;
        if (!current.captured) {
            current.captured = true;
            svg.current?.setPointerCapture(event.pointerId);
        }
        // Within what the axis shows, and within the step's own range.
        const plotted = Math.min(high, Math.max(low, valueAt(y + current.offset)));
        schedule(withStep(current.from, current.index, channel, clampAt(current.index, plotted)));
    };

    const finish = (pointer: number, cancel: boolean) => {
        const current = drag.current;
        if (!current || current.pointer !== pointer) return;
        drag.current = null;
        if (svg.current?.hasPointerCapture(pointer)) svg.current.releasePointerCapture(pointer);
        if (cancel) {
            cancelAnimationFrame(frame.current);
            frame.current = 0;
            pending.current = null;
            if (current.moved) write.current(current.from);
        } else flush();
        setFrozen(null);
        setDragging(null);
        // A press let go where it was put down is a pick, not a move.
        if (!cancel && !current.moved) onPick?.(current.index);
    };
    const end = (event: PointerEvent<SVGSVGElement>) => finish(event.pointerId, false);

    const onKey = (event: KeyboardEvent<SVGGElement>, i: number) => {
        if (event.key === 'Escape') {
            if (!drag.current) return;
            finish(drag.current.pointer, true);
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            if (drag.current) return;
            const way = event.key === 'ArrowUp' ? 1 : -1;
            const now = values[i] ?? 0;
            const next = clampAt(i, now + way * nudgeOf(channel, kind, event.shiftKey));
            // At the end of its range a key moves nothing, and sets nothing by hand.
            if (Math.abs(next - now) > 1e-9) onShape(withStep(shape, i, channel, next));
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            if (drag.current || !heldAt(i)) return;
            onShape(withStep(shape, i, channel, undefined));
        } else return;
        event.preventDefault();
    };

    // What moves this curve as a whole, which its Reset clears with its steps set by hand.
    const keys = channelKeys[channel];
    const shaped = keys.some(key => shape?.[key] !== undefined);

    // The ends rest where Tailwind puts them; the rest at the shape's own neutral values.
    const rest = (key: ShapeKey) =>
        key === 'lightest'
            ? (reference[0]?.l ?? 0.97)
            : key === 'darkest'
              ? (reference[10]?.l ?? 0.28)
              : neutralShape[key];
    const currentOf = (key: ShapeKey) => shape?.[key] ?? rest(key);
    // An end the theme's own colour sits on is that colour: its slider would move nothing.
    const controls = controlsFor(channel, kind).filter(
        control =>
            !(control.key === 'lightest' && seed === 0) &&
            !(control.key === 'darkest' && seed === 10),
    );
    const writeControl = (control: Control, value: number) => {
        // Back where it rests, within half a step, a slider leaves the shape.
        const resting = Math.abs(value - rest(control.key)) <= control.step / 2 + 1e-9;
        onShape(
            tidy(
                { ...shape, [control.key]: Number(value.toFixed(4)) },
                resting ? [control.key] : [],
            ),
        );
    };

    // Under about 28px a step, three digits run into the next: every other step is named then,
    // the theme's own always, and its neighbours give it room.
    const sparse = plotW / 10 < 28;
    const named = (i: number) =>
        !sparse || i === seed || (i % 2 === 0 && (seed === undefined || Math.abs(i - seed) !== 1));

    // Wide enough to take with a finger, never over the next step's point.
    const hit = Math.min(12, plotW / 20);

    const title = channels.find(item => item.value === channel)?.label ?? '';
    const edited = shaped || anyHeld;

    return (
        // A press anywhere on a chart makes it the one worked on; its controls open under it.
        <div
            className={cn(
                // A card like any other choice here: the same box and padding picked or not, so
                // picking one changes its edge and its fill and nothing about where things sit.
                'flex min-w-0 flex-col gap-3 rounded-item border p-3 transition-[background-color,border-color] duration-150',
                active
                    ? // Told by its fill and a hairline one step firmer: enough to say which, not a frame.
                      'border-neutral-300 bg-neutral-950/4'
                    : 'cursor-pointer border-neutral-200 hover:bg-neutral-950/5',
            )}
            data-active={active || undefined}
            data-slot="ramp-channel"
            onPointerDownCapture={() => {
                if (!active) onActivate();
            }}
        >
            <div className="flex h-6 items-center justify-between gap-3">
                <h3 className="text-xs">
                    <button
                        aria-pressed={active}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-chip outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2',
                            active ? 'font-medium text-neutral-950' : 'text-neutral-600',
                        )}
                        onClick={onActivate}
                        type="button"
                    >
                        {title}
                        {/* Moved off Tailwind's curve, by a slider or a step set by hand. */}
                        {edited && <StatusDot tone="primary" />}
                    </button>
                </h3>
                {edited && (
                    <Button
                        aria-label={`Reset ${channelName}`}
                        onClick={() =>
                            onShape(tidy(withoutChannelSteps(shape, channel) ?? {}, keys))
                        }
                        variant="ghost"
                    >
                        Reset
                    </Button>
                )}
            </div>

            <div ref={box}>
                <svg
                    aria-label={`${label}, ${channelName} per step: up and down move a step`}
                    className="block touch-none select-none overflow-visible"
                    height={H}
                    onPointerCancel={event => finish(event.pointerId, true)}
                    onPointerMove={move}
                    onPointerUp={end}
                    ref={svg}
                    viewBox={`0 0 ${W} ${H}`}
                    width="100%"
                >
                    <defs>
                        <clipPath id={clip}>
                            <rect height={plotH} width={plotW} x={pad.left} y={pad.top} />
                        </clipPath>
                    </defs>

                    {/* The grid: a hairline per tick, its value at the left, in the charts' own chrome. */}
                    {ticks.map(value => (
                        <g key={value}>
                            <line
                                stroke="var(--color-chart-grid)"
                                x1={pad.left}
                                x2={W - pad.right}
                                y1={yAt(value)}
                                y2={yAt(value)}
                            />
                            <text
                                className="text-xxs tabular-nums"
                                fill="var(--color-chart-label)"
                                dominantBaseline="middle"
                                textAnchor="end"
                                x={pad.left - tickGap}
                                y={yAt(value)}
                            >
                                {tick(value)}
                            </text>
                        </g>
                    ))}

                    {/* What the gamut allows: above the limit a chroma cannot be shown. */}
                    {showCeiling && (
                        <g clipPath={`url(#${clip})`}>
                            <path
                                d={`${line(ceiling)} L${xAt(10)},${pad.top} L${xAt(0)},${pad.top} Z`}
                                fill="var(--color-neutral-950)"
                                fillOpacity={0.04}
                            />
                            <path
                                d={line(ceiling)}
                                fill="none"
                                stroke="var(--color-neutral-400)"
                                strokeDasharray="2 3"
                            />
                        </g>
                    )}
                    {showCeiling && ceiling.some(value => value < high) && (
                        <text
                            className="fill-neutral-600 text-xxs"
                            textAnchor="end"
                            x={W - pad.right}
                            y={pad.top + 10}
                        >
                            {gamut === 'p3' ? 'P3 limit' : 'sRGB limit'}
                        </text>
                    )}

                    {/*
                     * Where a grey turns from text on one surface to text on the other: under the
                     * line a step reads on the light surface, over it on the dark. The two
                     * thresholds lie a hair apart, so they are drawn as one line as thick as the gap.
                     */}
                    {channel === 'l' &&
                        textLine &&
                        (() => {
                            const upper = yAt(Math.max(textLine.light, textLine.dark));
                            const lower = yAt(Math.min(textLine.light, textLine.dark));
                            const height = Math.max(1.5, lower - upper);
                            const mid = (upper + lower) / 2;
                            return (
                                <g className="pointer-events-none">
                                    <rect
                                        fill="var(--color-neutral-950)"
                                        fillOpacity={0.45}
                                        height={height}
                                        width={plotW}
                                        x={pad.left}
                                        y={mid - height / 2}
                                    />
                                    {/* Named on the side each holds for, where the curve leaves room. */}
                                    {active && (
                                        <>
                                            <text
                                                className="fill-neutral-600 text-xxs"
                                                textAnchor="end"
                                                x={W - pad.right}
                                                y={mid - height / 2 - 5}
                                            >
                                                Reads as text on dark
                                            </text>
                                            <text
                                                className="fill-neutral-600 text-xxs"
                                                x={pad.left + 4}
                                                y={mid + height / 2 + 12}
                                            >
                                                Reads as text on light
                                            </text>
                                        </>
                                    )}
                                </g>
                            );
                        })()}

                    {/* Tailwind's own curve, dashed, once the shape has moved this one off it. */}
                    {moved && (
                        <path
                            d={line(base)}
                            fill="none"
                            stroke="var(--color-neutral-400)"
                            strokeDasharray="4 3"
                        />
                    )}
                    {/* The curve the sliders draw, faint, under the line through the steps set by hand. */}
                    {anyHeld && (
                        <path
                            d={line(curveValues)}
                            fill="none"
                            stroke="var(--color-neutral-950)"
                            strokeLinejoin="round"
                            strokeOpacity={0.2}
                        />
                    )}
                    <path
                        d={line(values)}
                        fill="none"
                        stroke="var(--color-neutral-950)"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                    />

                    {values.map((value, i) => {
                        const isSeed = i === seed;
                        const color = ramp[i];
                        const step = rampSteps[i];
                        const held = heldAt(i);
                        const cx = xAt(i);
                        const cy = yAt(value);
                        const [min, max] = rangeAt(i);
                        const text = `${rampName} ${step} ${channelName} ${exact(value)}`;
                        const point = (
                            <>
                                {/* The surface round the point, so the line stops short of it. */}
                                <circle
                                    className="pointer-events-none"
                                    cx={cx}
                                    cy={cy}
                                    fill="var(--color-neutral-50)"
                                    r={isSeed ? 9 : 8}
                                />
                                {/* The step's colour inside a hairline ring, so a step as pale or as deep as the surface keeps its point. */}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    fill={color ? toCss(color, gamut) : 'transparent'}
                                    r={isSeed ? 7 : 6}
                                    stroke="var(--color-neutral-950)"
                                    strokeOpacity={0.3}
                                    strokeWidth={1}
                                />
                                {/* Set by hand: a dot at its heart, light on a deep step and deep on a light one. */}
                                {held && (
                                    <circle
                                        className="pointer-events-none"
                                        cx={cx}
                                        cy={cy}
                                        fill={(color?.l ?? 0) > 0.6 ? '#000' : '#fff'}
                                        fillOpacity={0.8}
                                        r={1.75}
                                    />
                                )}
                            </>
                        );
                        return (
                            <g key={step}>
                                {/* In a narrow chart every other step is named, and always the theme's own. */}
                                <text
                                    className={cn(
                                        'text-xxs tabular-nums',
                                        isSeed && 'font-medium',
                                        !named(i) && 'hidden',
                                    )}
                                    fill={
                                        isSeed
                                            ? 'var(--color-neutral-950)'
                                            : 'var(--color-chart-label)'
                                    }
                                    textAnchor="middle"
                                    x={cx}
                                    y={H - 6}
                                >
                                    {step}
                                </text>
                                {isSeed ? (
                                    // Your colour is never moved here, but it can be picked like any step.
                                    // biome-ignore lint/a11y/useSemanticElements: a point in an SVG chart cannot be a button element
                                    <g
                                        aria-label={`${rampName} ${step}, your colour`}
                                        aria-pressed={picked === i}
                                        className="cursor-pointer outline-none"
                                        onBlur={() => setFocused(null)}
                                        onClick={() => onPick?.(i)}
                                        onFocus={() => setFocused(i)}
                                        onKeyDown={event => {
                                            if (event.key !== 'Enter' && event.key !== ' ') return;
                                            event.preventDefault();
                                            onPick?.(i);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <title>{`${step}, your colour: ${exact(value)}`}</title>
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            fill="transparent"
                                            pointerEvents="all"
                                            r={hit}
                                        />
                                        {point}
                                        {focused === i && (
                                            <circle
                                                className="pointer-events-none"
                                                cx={cx}
                                                cy={cy}
                                                fill="none"
                                                r={13}
                                                stroke="var(--color-focus)"
                                                strokeWidth={2}
                                            />
                                        )}
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            fill="none"
                                            r={10}
                                            stroke="var(--color-neutral-950)"
                                            strokeWidth={1}
                                        />
                                    </g>
                                ) : (
                                    <g
                                        aria-label={`${rampName} ${step} ${channelName}`}
                                        aria-orientation="vertical"
                                        aria-valuemax={Number(
                                            (channel === 'h' ? 360 : max).toFixed(3),
                                        )}
                                        aria-valuemin={Number(
                                            (channel === 'h' ? 0 : min).toFixed(3),
                                        )}
                                        aria-valuenow={Number(
                                            (channel === 'h' ? wrapHue(value) : value).toFixed(3),
                                        )}
                                        aria-valuetext={held ? `${text}, set by hand` : text}
                                        className={cn(
                                            'outline-none',
                                            dragging === i ? 'cursor-grabbing' : 'cursor-ns-resize',
                                        )}
                                        onBlur={() => setFocused(null)}
                                        onDoubleClick={() =>
                                            held && onShape(withStep(shape, i, channel, undefined))
                                        }
                                        onFocus={() => setFocused(i)}
                                        onKeyDown={event => onKey(event, i)}
                                        onPointerDown={event => begin(event, i)}
                                        role="slider"
                                        tabIndex={0}
                                    >
                                        <title>
                                            {`${step}: ${exact(value)}${held ? ', set by hand (double-click to give it back to the curve)' : ''}`}
                                        </title>
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            fill="transparent"
                                            pointerEvents="all"
                                            r={hit}
                                        />
                                        {point}
                                        {/* The step picked to be set under the chart: a plain ring. */}
                                        {picked === i && focused !== i && (
                                            <circle
                                                className="pointer-events-none"
                                                cx={cx}
                                                cy={cy}
                                                fill="none"
                                                r={10}
                                                stroke="var(--color-neutral-950)"
                                                strokeWidth={1.5}
                                            />
                                        )}
                                        {/* The step with the keyboard: a ring in the focus colour. */}
                                        {focused === i && (
                                            <circle
                                                className="pointer-events-none"
                                                cx={cx}
                                                cy={cy}
                                                fill="none"
                                                r={10}
                                                stroke="var(--color-focus)"
                                                strokeWidth={2}
                                            />
                                        )}
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* What shapes this curve as a whole, under it, while this is the chart worked on. */}
            {active && (
                <div className="flex flex-col gap-2">
                    {/* How much colour the greys carry: without any, there is nothing to shape. */}
                    {tint && channel === 'c' && (
                        <SliderRow
                            display={tint.tint === 0 ? 'None' : tint.tint.toFixed(3)}
                            label="Tint"
                            max={0.08}
                            min={0}
                            onValueChange={value => tint.onChange({ hue: tint.hue, tint: value })}
                            step={0.001}
                            value={tint.tint}
                        />
                    )}
                    {/* Which colour that is; a pure grey has none to turn. */}
                    {tint && channel === 'h' && tint.tint > 0 && (
                        <SliderRow
                            display={`${Math.round(tint.hue)}°`}
                            knob={hueKnob(tint.hue)}
                            label="Hue"
                            max={360}
                            min={0}
                            onValueChange={value => tint.onChange({ hue: value, tint: tint.tint })}
                            step={1}
                            track={hueBand}
                            value={tint.hue}
                        />
                    )}
                    {tint && tint.tint === 0 && channel === 'h' && (
                        <p className="text-neutral-600 text-xs">
                            A pure grey has no hue. Give it a tint under Chroma first.
                        </p>
                    )}
                    {/* The rest shape the curve; on a pure grey only its lightness has one. */}
                    {(!tint || tint.tint > 0 || channel === 'l') &&
                        controls.map(control => (
                            <SliderRow
                                display={control.format(currentOf(control.key))}
                                key={control.key}
                                label={control.label}
                                max={control.max}
                                min={control.min}
                                onValueChange={value => writeControl(control, value)}
                                step={control.step}
                                value={currentOf(control.key)}
                            />
                        ))}
                </div>
            )}
        </div>
    );
};
