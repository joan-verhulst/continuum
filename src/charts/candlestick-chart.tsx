'use client';

import { Minus, Plus, RotateCcw } from 'lucide-react';
import {
    type KeyboardEvent,
    type PointerEvent,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { type CandleWindow, clampWindow, panWindow, zoomWindow } from './lib/candlestick-window';
import { CHANGE_INK, chartColor } from './lib/color';
import { PLOT_FRAME } from './lib/frame';
import { lineAreaPath, linePath } from './lib/path';
import { niceStep } from './lib/scale';
import { useLabelWidth, useWidth } from './lib/use-size';

export type Candle = {
    /** When the period opened. */
    time: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    /** What changed hands in the period; drawn along the foot of the plot. */
    volume?: number;
};

/** A stretch of time offered under the plot: the latest `periods`, or all of them for `null`. */
export type CandleSpan = { label: string; periods: number | null };

export type CandlestickChartProps = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    /** The periods, oldest first. */
    data: readonly Candle[];
    /**
     * How the prices are drawn: `line`, the closes as one line over a tint, or `candles`,
     * each period's open, high, low and close. A line unless asked for candles.
     */
    type?: 'line' | 'candles';
    /** The whole chart's height: the plot, the time axis and the bar of controls under it. */
    height?: number;
    /** What traded, as short bars along the plot's foot, when the candles carry it. */
    volume?: boolean;
    /** A moving average of the closes over this many periods, as a line; left out, none. */
    average?: number;
    /**
     * The periods in view, by index into `data` (`end` not included); `null` for as many of
     * the latest as fit. Given, the chart is controlled and asks for a new one through
     * `onRangeChange` when it is zoomed or panned.
     */
    range?: CandleWindow | null;
    /** The periods in view at first, for a chart that keeps its own. */
    defaultRange?: CandleWindow | null;
    /** Called with the window the chart was zoomed or panned to; `null` once reset. */
    onRangeChange?: (range: CandleWindow | null) => void;
    /** The stretches offered at the left of the bar under the plot: 1W, 1M, 3M, All. */
    spans?: readonly CandleSpan[];
    /** The zoom out, zoom in and reset buttons at the right of that bar. On unless turned off. */
    zoomControls?: boolean;
    /** The decimals a price is written to; from the price's size unless given (1.0842, 182.40). */
    digits?: number;
    /** A price, on the axis and in the readout; the decimals above unless given. */
    formatPrice?: (price: number) => string;
    /** A time on the axis under the plot; the hour within a day, the date across days. */
    formatTime?: (time: Date, previous: Date | undefined) => string;
    /** The time a read period opened, in the label on the time axis. */
    formatTimeLong?: (time: Date) => string;
    /** The line a chart with no data shows in place of its plot. */
    emptyLabel?: string;
    className?: string;
};

/** The row of times under the plot: the gap to it and one line of labels, no more. */
const AXIS_HEIGHT = 20;
const GUTTER_GAP = 8;
/** The bar of controls under the time axis: its 24px controls and the room over them. */
const BAR = 32;
/** The room at the plot's head the readout is written in, kept clear of the prices. */
const READOUT = 28;
/** A label on the price axis has this much room either side of its figure. */
const PILL_PAD = 6;
/** The least room a period is given: a 1px line and a 1px gap. Past it, the oldest are left off. */
const MIN_SLOT = 2;
/** The least room between two points of a line: closer than this and they share a pixel. */
const LINE_PITCH = 0.5;
/** Below this slot a body is no wider than its wick, and the candle is drawn as a line. */
const LINE_SLOT = 3;
const BODY_SHARE = 0.66;
const BODY_MAX = 15;
/** The volume's share of the plot's height, between two bounds. */
const VOLUME_SHARE = 0.18;
const VOLUME_MIN = 20;
const VOLUME_MAX = 56;
/** A time label is given at least this much room. */
const TIME_ROOM = 72;
/** The fewest periods a zoom narrows to. */
const MIN_WINDOW = 5;
/** One press of zoom in narrows the window by this much. */
const ZOOM_STEP = 1.6;

const DAY = 86_400_000;

const timeOfDay = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
});
const dayOfMonth = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
});
const longDay = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
});

/** The decimals a price of this size is usually read to. */
const digitsFor = (price: number) => {
    const size = Math.abs(price);
    if (size < 10) return 4;
    if (size < 1000) return 2;
    return 0;
};

/** The closes' average over the last `span` periods, from the first period that has them all. */
const movingAverage = (data: readonly Candle[], span: number) => {
    const out: (number | null)[] = [];
    let sum = 0;
    data.forEach((candle, i) => {
        sum += candle.close;
        const leaving = data[i - span];
        if (leaving) sum -= leaving.close;
        out.push(i >= span - 1 ? sum / span : null);
    });
    return out;
};

/** A change from one price to another, written with its sign: "+0.22%". */
const changeOf = (from: number, to: number) => {
    const share = from ? Math.round(((to - from) / from) * 1e4) / 1e2 : 0;
    return {
        share,
        text: `${share > 0 ? '+' : share < 0 ? '−' : ''}${Math.abs(share).toFixed(2)}%`,
    };
};

type Drag =
    | { mode: 'pan'; x: number; view: CandleWindow }
    | { mode: 'select'; from: number; to: number };

/** The small controls on the bar under the plot: the kit's key toggles, as buttons. */
const control =
    'flex h-6 shrink-0 cursor-pointer items-center justify-center rounded-chip font-medium text-xxs outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none';
const quiet = 'text-neutral-600 hover:bg-neutral-950/5 hover:text-neutral-950';

/**
 * A price over time, put together as a trading screen is. The closes as one line over a
 * tint, or each period as a candle: its open and close as a body, its high and low as the
 * wick through it, a rise drawn as a tint with a solid edge and a fall solid, so the two are
 * told apart by form as well as colour. What traded runs along the foot of the same plot.
 *
 * The prices are read on the right, where the latest period is, and the latest close is
 * tagged there on a dashed rule. The period being read (the one under the pointer, or the
 * latest) is written out in the plot's top corner; a crosshair tags the price and the time
 * it stands on along the two axes.
 *
 * Time is moved through as on any such screen: drag to pan, ctrl or ⌘ with the wheel (or a
 * pinch) to zoom about the pointer, a double click to see it all again, and shift-drag to
 * mark a stretch and zoom to it. The bar under the plot offers the usual stretches and the
 * same zoom as buttons; the prices refit to whatever is in view.
 */
export const CandlestickChart = ({
    'aria-label': label,
    data,
    type = 'line',
    height = 360,
    volume = true,
    average,
    range,
    defaultRange = null,
    onRangeChange,
    spans,
    zoomControls = true,
    digits,
    formatPrice,
    formatTime,
    formatTimeLong,
    emptyLabel = 'No prices to show',
    className,
}: CandlestickChartProps) => {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const [ref, width] = useWidth<HTMLDivElement>();
    const [probeRef, labelWidth] = useLabelWidth();
    // Held in state, not a ref: the plot is drawn only once its width is known, and the wheel
    // listener has to be bound when it arrives.
    const [surface, setSurface] = useState<HTMLDivElement | null>(null);
    const [pointer, setPointer] = useState<{ index: number; y: number | null } | null>(null);
    const [ownRange, setOwnRange] = useState<CandleWindow | null>(defaultRange);
    const [drag, setDrag] = useState<Drag | null>(null);

    const current = range === undefined ? ownRange : range;
    const setRange = (next: CandleWindow | null) => {
        if (range === undefined) setOwnRange(next);
        onRangeChange?.(next);
    };

    const last = data.at(-1);
    const decimals = digits ?? digitsFor(last?.close ?? 0);
    const price = useMemo(() => {
        if (formatPrice) return formatPrice;
        const format = new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        return (value: number) => format.format(value);
    }, [formatPrice, decimals]);

    // How far apart the periods are, so the axis knows whether to count hours or days.
    const interval =
        data.length > 1
            ? ((last?.time.getTime() ?? 0) - (data[0]?.time.getTime() ?? 0)) / (data.length - 1)
            : DAY;
    const intraday = interval < DAY;
    const writeTime =
        formatTime ??
        ((time: Date, previous: Date | undefined) =>
            intraday &&
            previous &&
            Math.floor(previous.getTime() / DAY) === Math.floor(time.getTime() / DAY)
                ? timeOfDay.format(time)
                : dayOfMonth.format(time));
    const writeTimeLong =
        formatTimeLong ??
        ((time: Date) =>
            intraday
                ? `${longDay.format(time).replace(',', '')} ${timeOfDay.format(time)}`
                : longDay.format(time).replace(',', ''));

    const averages = useMemo(
        () => (average && average > 1 ? movingAverage(data, average) : null),
        [data, average],
    );

    const empty = data.length === 0;
    const candles = type === 'candles';
    const withVolume = volume && data.some(candle => candle.volume != null);
    const withBar = !empty && (zoomControls || Boolean(spans?.length));

    // The plot is what the prices on the right, the times under it and the bar leave.
    const gutter = labelWidth + PILL_PAD * 2 + GUTTER_GAP;
    const plotWidth = Math.max(0, width - gutter);
    const plotHeight = Math.max(0, height - AXIS_HEIGHT - (withBar ? BAR : 0));
    const volumeHeight = withVolume
        ? Math.round(Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, plotHeight * VOLUME_SHARE)))
        : 0;
    // The prices keep clear of the readout over them and of the volume under them.
    const priceTop = READOUT;
    const priceFoot = Math.max(priceTop + 1, plotHeight - volumeHeight - 12);

    // The window asked for, then as many of its latest periods as fit.
    // A candle needs its line and its gap; a line is drawn through points far closer together.
    const fits = Math.max(1, Math.floor(plotWidth / (candles ? MIN_SLOT : LINE_PITCH)));
    const asked = current
        ? clampWindow(current, data.length, MIN_WINDOW)
        : { start: 0, end: data.length };
    const offset = Math.max(asked.start, asked.end - fits);
    const shown = data.slice(offset, asked.end);
    const view: CandleWindow = { start: offset, end: offset + shown.length };
    const widest = Math.min(data.length, fits);
    const whole = view.start === 0 && view.end === data.length;
    const slot = shown.length ? plotWidth / shown.length : plotWidth;
    const lines = slot < LINE_SLOT;
    // An odd width, so the wick runs down the body's middle pixel.
    const rawBody = Math.min(
        BODY_MAX,
        Math.floor(slot) - Math.max(1, Math.round(slot * (1 - BODY_SHARE))),
    );
    const body = lines ? 1 : Math.max(1, rawBody % 2 ? rawBody : rawBody - 1);
    // Candles stand in the middle of their slots; a line runs from edge to edge of the plot.
    const pitch = shown.length > 1 ? plotWidth / (shown.length - 1) : 0;
    const slotted = candles || shown.length < 2;
    const xOf = (i: number) => (slotted ? Math.floor(slot * i + slot / 2) : pitch * i);
    const indexAt = (x: number) =>
        Math.max(
            0,
            Math.min(shown.length - 1, slotted ? Math.floor(x / slot) : Math.round(x / pitch)),
        );

    // The prices in view with a little air, ruled at round steps.
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    let most = 0;
    shown.forEach((candle, i) => {
        low = Math.min(low, candles ? candle.low : candle.close);
        high = Math.max(high, candles ? candle.high : candle.close);
        most = Math.max(most, candle.volume ?? 0);
        const mean = averages?.[offset + i];
        if (mean != null) {
            low = Math.min(low, mean);
            high = Math.max(high, mean);
        }
    });
    if (!Number.isFinite(low)) {
        low = 0;
        high = 1;
    }
    if (high - low < 1e-12) high = low + 1;
    const span = priceFoot - priceTop;
    const yOf = (value: number) => priceTop + ((high - value) / (high - low)) * span;
    const valueAt = (y: number) => high - ((y - priceTop) / span) * (high - low);
    const volumeOf = (amount: number) => (most > 0 ? (amount / most) * volumeHeight : 0);

    // Rules at round prices, wherever they clear the plot's own edges.
    const step = niceStep(((high - low) / Math.max(1, span)) * 44);
    const ticks: number[] = [];
    for (let i = Math.ceil(valueAt(plotHeight - 10) / step); i * step <= valueAt(10); i++)
        ticks.push(i * step);

    const up = chartColor('success');
    const down = chartColor('error');
    const ink = chartColor('series-1');
    const toneOf = (candle: Candle) => (candle.close >= candle.open ? up : down);

    // The period being read: the one under the pointer, or the latest.
    const pointed = pointer && shown.length ? Math.min(pointer.index, shown.length - 1) : null;
    const readIndex = pointed !== null ? offset + pointed : data.length - 1;
    const reading = data[readIndex];
    const before = data[readIndex - 1];
    const change = reading && before ? changeOf(before.close, reading.close) : null;
    const mean = averages?.[readIndex];

    // A stretch being marked with shift held, summed up in the readout while it is.
    const marking =
        drag?.mode === 'select' && drag.from !== drag.to
            ? { start: Math.min(drag.from, drag.to), end: Math.max(drag.from, drag.to) + 1 }
            : null;
    const first = marking ? data[marking.start] : undefined;
    const final = marking ? data[marking.end - 1] : undefined;

    // Time labels, at least TIME_ROOM apart, counted from the first period so they hold still.
    const every = Math.max(1, Math.ceil(TIME_ROOM / Math.max(slot, 1e-6)));
    const timeTicks: number[] = [];
    for (let i = 0; i < shown.length; i++) if ((offset + i) % every === 0) timeTicks.push(i);

    /** Sets the window, back to none once it holds every period that fits up to the latest. */
    const show = (next: CandleWindow) => {
        if (next.end >= data.length && next.end - next.start >= widest) setRange(null);
        else setRange(next);
    };
    const zoom = (factor: number, anchor?: number) => {
        if (!shown.length) return;
        // About the latest while it is in view, else about the middle.
        const at = anchor ?? (view.end >= data.length ? 1 : 0.5);
        show(zoomWindow(view, factor, at, data.length, MIN_WINDOW, widest));
    };
    const reset = () => {
        setDrag(null);
        setRange(null);
    };
    const canZoomIn = shown.length > MIN_WINDOW;
    const canZoomOut = shown.length < widest;

    const spanWindow = (periods: number | null): CandleWindow | null =>
        periods === null || periods >= data.length
            ? null
            : { start: data.length - periods, end: data.length };
    const spanActive = (periods: number | null) => {
        const at = spanWindow(periods);
        return at ? view.start === at.start && view.end === at.end : current === null;
    };

    const place = (event: PointerEvent<HTMLDivElement>) => {
        const box = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        return { x, y, index: indexAt(x) };
    };
    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !shown.length) return;
        const at = place(event);
        event.currentTarget.setPointerCapture(event.pointerId);
        if (event.shiftKey)
            setDrag({ mode: 'select', from: offset + at.index, to: offset + at.index });
        else if (!whole) setDrag({ mode: 'pan', x: at.x, view });
    };
    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!shown.length) return;
        const at = place(event);
        if (drag?.mode === 'pan') {
            // The plot moves with the hand: a period's width of travel is one period.
            const by = Math.round((drag.x - at.x) / Math.max(slot, 1e-6));
            const next = panWindow(drag.view, by, data.length, MIN_WINDOW);
            if (next.start !== view.start) show(next);
            setPointer(null);
            return;
        }
        if (drag?.mode === 'select') setDrag({ ...drag, to: offset + at.index });
        setPointer({ index: at.index, y: at.y >= 0 && at.y <= plotHeight ? at.y : null });
    };
    const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        if (marking && marking.end - marking.start >= 2)
            show(clampWindow(marking, data.length, MIN_WINDOW));
        setDrag(null);
    };

    // The wheel zooms only with ctrl or ⌘ held (a pinch sends the same), so a page still
    // scrolls past the chart; a sideways scroll pans. Bound by hand: React's is passive.
    const wheel = useRef<(event: WheelEvent) => void>(() => {});
    wheel.current = (event: WheelEvent) => {
        const node = surface;
        if (!node || !shown.length) return;
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const box = node.getBoundingClientRect();
            const anchor = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
            zoom(event.deltaY < 0 ? 1.25 : 0.8, anchor);
        } else if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && !whole) {
            event.preventDefault();
            const by = Math.sign(event.deltaX) * Math.max(1, Math.round(shown.length / 30));
            show(panWindow(view, by, data.length, MIN_WINDOW));
        }
    };
    useEffect(() => {
        if (!surface) return;
        const listener = (event: WheelEvent) => wheel.current(event);
        surface.addEventListener('wheel', listener, { passive: false });
        return () => surface.removeEventListener('wheel', listener);
    }, [surface]);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!shown.length) return;
        const at = pointed ?? shown.length - 1;
        const step = (by: number) => {
            const next = at + by;
            // Past either end of a narrowed window, the window slides along instead.
            if (next < 0 || next > shown.length - 1) {
                show(panWindow(view, by, data.length, MIN_WINDOW));
                setPointer({ index: at, y: null });
            } else setPointer({ index: next, y: null });
        };
        const keys: Record<string, () => void> = {
            ArrowLeft: () => step(-1),
            ArrowRight: () => step(1),
            Home: () => setPointer({ index: 0, y: null }),
            End: () => setPointer({ index: shown.length - 1, y: null }),
            '+': () => zoom(ZOOM_STEP),
            '=': () => zoom(ZOOM_STEP),
            '-': () => zoom(1 / ZOOM_STEP),
            '0': reset,
            Escape: () => setPointer(null),
        };
        const act = keys[event.key];
        if (!act) return;
        event.preventDefault();
        act();
    };

    const lastY = last ? yOf(last.close) : 0;
    const lastShown =
        Boolean(last) && view.end === data.length && lastY > 8 && lastY < plotHeight - 8;
    const lastInk = candles && last ? toneOf(last) : ink;
    const crossX = pointed !== null ? xOf(pointed) : null;
    const crossY = pointer?.y ?? null;
    const timeTag = pointed !== null && reading ? writeTimeLong(reading.time) : null;

    const points = shown.map((candle, i) => ({ x: xOf(i), y: yOf(candle.close) }));
    const averagePoints = averages
        ? shown.flatMap((_, i) => {
              const value = averages[offset + i];
              return value == null ? [] : [{ x: xOf(i), y: yOf(value) }];
          })
        : [];

    return (
        <figure
            aria-label={label}
            className={cn('relative m-0 min-w-0', className)}
            data-slot="candlestick-chart"
        >
            {/* The widest price, measured in the theme's font, sizes the gutter on the right. */}
            <div
                aria-hidden
                className="pointer-events-none invisible absolute top-0 left-0 w-max font-medium text-xxs tabular-nums"
                ref={probeRef}
            >
                {price(high)}
            </div>
            <div className="relative" ref={ref} style={{ height }}>
                {width > 0 && empty && (
                    <p className="absolute inset-0 flex items-center justify-center rounded-item border border-neutral-200 border-dashed text-neutral-600 text-xs">
                        {emptyLabel}
                    </p>
                )}
                {width > 0 && !empty && (
                    <>
                        <svg
                            aria-hidden="true"
                            className="block overflow-visible"
                            height={plotHeight + AXIS_HEIGHT}
                            width={width}
                        >
                            <defs>
                                {/* Everything in the plot stops at its frame, corners and all. */}
                                <clipPath id={`${id}-plot`}>
                                    <rect
                                        height={plotHeight}
                                        style={{ rx: 'var(--radius-item)' }}
                                        width={plotWidth}
                                    />
                                </clipPath>
                                <linearGradient
                                    gradientUnits="userSpaceOnUse"
                                    id={`${id}-tint`}
                                    x1={0}
                                    x2={0}
                                    y1={priceTop}
                                    y2={plotHeight}
                                >
                                    <stop offset="0%" stopColor={ink} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={ink} stopOpacity={0.04} />
                                </linearGradient>
                            </defs>

                            <g clipPath={`url(#${id}-plot)`}>
                                {ticks.map(tick => (
                                    <line
                                        key={tick}
                                        shapeRendering="crispEdges"
                                        stroke="var(--color-chart-grid)"
                                        x1={0}
                                        x2={plotWidth}
                                        y1={Math.round(yOf(tick)) + 0.5}
                                        y2={Math.round(yOf(tick)) + 0.5}
                                    />
                                ))}

                                {marking && (
                                    <rect
                                        fill="var(--color-chart-band)"
                                        height={plotHeight}
                                        width={Math.max(
                                            1,
                                            xOf(marking.end - 1 - offset) -
                                                xOf(marking.start - offset),
                                        )}
                                        x={xOf(marking.start - offset)}
                                    />
                                )}

                                {withVolume &&
                                    shown.map((candle, i) => {
                                        const tall = volumeOf(candle.volume ?? 0);
                                        const wide = slotted
                                            ? body
                                            : Math.max(1, Math.floor(pitch) - 1);
                                        return tall > 0 ? (
                                            <rect
                                                fill={
                                                    candles
                                                        ? toneOf(candle)
                                                        : 'var(--color-neutral-950)'
                                                }
                                                fillOpacity={candles ? 0.35 : 0.12}
                                                height={tall}
                                                key={candle.time.getTime()}
                                                shapeRendering="crispEdges"
                                                width={wide}
                                                x={Math.round(xOf(i) - wide / 2)}
                                                y={plotHeight - tall}
                                            />
                                        ) : null;
                                    })}

                                {candles ? (
                                    shown.map((candle, i) => {
                                        const tone = toneOf(candle);
                                        const x = xOf(i);
                                        const top = yOf(Math.max(candle.open, candle.close));
                                        const tall = Math.max(
                                            1,
                                            yOf(Math.min(candle.open, candle.close)) - top,
                                        );
                                        const risen = candle.close >= candle.open;
                                        return (
                                            <g
                                                key={candle.time.getTime()}
                                                shapeRendering="crispEdges"
                                            >
                                                <line
                                                    stroke={tone}
                                                    x1={x + 0.5}
                                                    x2={x + 0.5}
                                                    y1={yOf(candle.high)}
                                                    y2={yOf(candle.low)}
                                                />
                                                {!lines && (
                                                    <rect
                                                        fill={
                                                            risen
                                                                ? `color-mix(in oklab, ${tone} 24%, var(--color-chart-background))`
                                                                : tone
                                                        }
                                                        height={tall}
                                                        stroke={
                                                            risen && body >= 5 ? tone : undefined
                                                        }
                                                        width={body - (risen && body >= 5 ? 1 : 0)}
                                                        x={
                                                            x -
                                                            (body - 1) / 2 +
                                                            (risen && body >= 5 ? 0.5 : 0)
                                                        }
                                                        y={top + (risen && body >= 5 ? 0.5 : 0)}
                                                    />
                                                )}
                                            </g>
                                        );
                                    })
                                ) : (
                                    <>
                                        <path
                                            d={lineAreaPath(points, plotHeight)}
                                            fill={`url(#${id}-tint)`}
                                        />
                                        <path
                                            d={linePath(points)}
                                            fill="none"
                                            stroke={ink}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={shown.length > 240 ? 1.5 : 2}
                                        />
                                    </>
                                )}

                                {averagePoints.length > 1 && (
                                    <path
                                        d={linePath(averagePoints)}
                                        fill="none"
                                        stroke={candles ? ink : 'var(--color-neutral-600)'}
                                        strokeDasharray={candles ? undefined : '4 3'}
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                    />
                                )}

                                {lastShown && (
                                    <line
                                        shapeRendering="crispEdges"
                                        stroke={lastInk}
                                        strokeDasharray="2 3"
                                        x1={0}
                                        x2={plotWidth}
                                        y1={Math.round(lastY) + 0.5}
                                        y2={Math.round(lastY) + 0.5}
                                    />
                                )}

                                {crossX !== null && (
                                    <g
                                        shapeRendering="crispEdges"
                                        stroke="var(--color-chart-crosshair)"
                                    >
                                        <line
                                            x1={Math.round(crossX) + 0.5}
                                            x2={Math.round(crossX) + 0.5}
                                            y1={0}
                                            y2={plotHeight}
                                        />
                                        {crossY !== null && (
                                            <line
                                                x1={0}
                                                x2={plotWidth}
                                                y1={Math.round(crossY) + 0.5}
                                                y2={Math.round(crossY) + 0.5}
                                            />
                                        )}
                                    </g>
                                )}
                                {!candles && crossX !== null && reading && (
                                    <circle
                                        cx={crossX}
                                        cy={yOf(reading.close)}
                                        fill="var(--color-chart-background)"
                                        r={3.5}
                                        stroke={ink}
                                        strokeWidth={2}
                                    />
                                )}
                            </g>

                            {/* The prices, outside the frame on the right; under a tag, they give way. */}
                            {ticks.map(tick => {
                                const y = yOf(tick);
                                const hidden =
                                    (lastShown && Math.abs(y - lastY) < 14) ||
                                    (crossY !== null && Math.abs(y - crossY) < 14);
                                return hidden ? null : (
                                    <text
                                        className="text-xxs tabular-nums"
                                        dominantBaseline="middle"
                                        fill="var(--color-chart-label)"
                                        key={tick}
                                        x={plotWidth + GUTTER_GAP + PILL_PAD}
                                        y={y}
                                    >
                                        {price(tick)}
                                    </text>
                                );
                            })}
                            {timeTicks.map((i, n) => {
                                const candle = shown[i];
                                const previous = shown[timeTicks[n - 1] ?? -1];
                                const x = xOf(i);
                                if (!candle || x > plotWidth - 16) return null;
                                // Under the tag of the time being read, a label gives way.
                                if (crossX !== null && Math.abs(x - crossX) < 64) return null;
                                return (
                                    <text
                                        className="text-xxs tabular-nums"
                                        fill="var(--color-chart-label)"
                                        key={candle.time.getTime()}
                                        textAnchor={x < 20 ? 'start' : 'middle'}
                                        x={x}
                                        y={plotHeight + 16}
                                    >
                                        {writeTime(candle.time, previous?.time)}
                                    </text>
                                );
                            })}
                        </svg>

                        <div
                            aria-hidden
                            className={PLOT_FRAME}
                            data-slot="candlestick-chart-plot"
                            style={{ height: plotHeight, left: 0, top: 0, width: plotWidth }}
                        />

                        {/* The period being read, written in the plot's corner as a trading screen does. */}
                        <p
                            aria-live="polite"
                            className="pointer-events-none absolute top-2 left-2.5 flex max-w-full flex-wrap items-center gap-x-2.5 rounded-chip bg-neutral-50/80 px-1 text-xxs tabular-nums leading-5"
                            data-slot="candlestick-chart-readout"
                            style={{ maxWidth: Math.max(0, plotWidth - 20) }}
                        >
                            {marking && first && final ? (
                                <>
                                    <span className="text-neutral-600">
                                        {dayOfMonth.format(first.time)} –{' '}
                                        {dayOfMonth.format(final.time)}
                                    </span>
                                    <span className="font-medium text-neutral-950">
                                        {price(first.open)} → {price(final.close)}
                                    </span>
                                    <Change {...changeOf(first.open, final.close)} />
                                </>
                            ) : (
                                reading && (
                                    <>
                                        {candles ? (
                                            (
                                                [
                                                    ['O', reading.open],
                                                    ['H', reading.high],
                                                    ['L', reading.low],
                                                    ['C', reading.close],
                                                ] as const
                                            ).map(([name, value]) => (
                                                <span key={name}>
                                                    <span className="text-neutral-600">{name}</span>{' '}
                                                    <span className="font-medium text-neutral-950">
                                                        {price(value)}
                                                    </span>
                                                </span>
                                            ))
                                        ) : (
                                            <span>
                                                <span className="text-neutral-600">Close</span>{' '}
                                                <span className="font-medium text-neutral-950">
                                                    {price(reading.close)}
                                                </span>
                                            </span>
                                        )}
                                        {change && <Change {...change} />}
                                        {mean != null && (
                                            <span>
                                                <span className="text-neutral-600">
                                                    MA {average}
                                                </span>{' '}
                                                <span className="font-medium text-neutral-950">
                                                    {price(mean)}
                                                </span>
                                            </span>
                                        )}
                                    </>
                                )
                            )}
                        </p>

                        {lastShown && last && (
                            // The latest close, tagged on the axis at the end of its rule.
                            <span
                                className="pointer-events-none absolute -translate-y-1/2 rounded-chip border px-1.5 font-medium text-neutral-950 text-xxs tabular-nums leading-4.5"
                                style={{
                                    background: `color-mix(in oklab, ${lastInk} 16%, var(--color-chart-background))`,
                                    borderColor: `color-mix(in oklab, ${lastInk} 45%, transparent)`,
                                    left: plotWidth + GUTTER_GAP,
                                    top: lastY,
                                }}
                            >
                                {price(last.close)}
                            </span>
                        )}
                        {crossY !== null && (
                            <span
                                className="pointer-events-none absolute -translate-y-1/2 rounded-chip bg-neutral-950 px-1.5 font-medium text-neutral-50 text-xxs tabular-nums leading-4.5"
                                style={{ left: plotWidth + GUTTER_GAP, top: crossY }}
                            >
                                {price(valueAt(crossY))}
                            </span>
                        )}
                        {crossX !== null && timeTag && (
                            <span
                                className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-chip bg-neutral-950 px-1.5 font-medium text-neutral-50 text-xxs tabular-nums leading-4.5"
                                style={{
                                    left: Math.max(48, Math.min(plotWidth - 48, crossX)),
                                    top: plotHeight + 4,
                                }}
                            >
                                {timeTag}
                            </span>
                        )}

                        {/* One surface takes the pointer: the period under it is worked out from x. */}
                        <div
                            aria-label={`${label}: arrow keys read a period, plus and minus zoom, zero shows all`}
                            className={cn(
                                'absolute touch-pan-y rounded-item outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid',
                                drag?.mode === 'pan'
                                    ? 'cursor-grabbing'
                                    : whole
                                      ? 'cursor-crosshair'
                                      : 'cursor-grab',
                            )}
                            onBlur={() => setPointer(null)}
                            onDoubleClick={reset}
                            onKeyDown={onKeyDown}
                            onPointerDown={onPointerDown}
                            onPointerLeave={() => !drag && setPointer(null)}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            ref={setSurface}
                            // A slider over the periods in view: the arrow keys read along them.
                            aria-valuemax={Math.max(0, shown.length - 1)}
                            aria-valuemin={0}
                            aria-valuenow={pointed ?? Math.max(0, shown.length - 1)}
                            aria-valuetext={
                                reading
                                    ? `${writeTimeLong(reading.time)}, close ${price(reading.close)}`
                                    : undefined
                            }
                            role="slider"
                            style={{ height: plotHeight, left: 0, top: 0, width: plotWidth }}
                            tabIndex={0}
                        />

                        {withBar && (
                            <div
                                className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-between gap-2"
                                data-slot="candlestick-chart-bar"
                                style={{ paddingRight: gutter }}
                            >
                                <div className="flex min-w-0 items-center gap-0.5">
                                    {spans?.map(item => (
                                        <button
                                            aria-pressed={spanActive(item.periods)}
                                            className={cn(
                                                control,
                                                'px-2',
                                                spanActive(item.periods)
                                                    ? 'bg-neutral-950/8 text-neutral-950'
                                                    : quiet,
                                            )}
                                            disabled={
                                                item.periods !== null &&
                                                (item.periods > data.length ||
                                                    item.periods < MIN_WINDOW)
                                            }
                                            key={item.label}
                                            onClick={() => setRange(spanWindow(item.periods))}
                                            type="button"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                {zoomControls && (
                                    <div className="flex shrink-0 items-center gap-0.5 [&_svg]:size-3.5">
                                        <button
                                            aria-label="Zoom out"
                                            className={cn(control, quiet, 'w-6')}
                                            disabled={!canZoomOut}
                                            onClick={() => zoom(1 / ZOOM_STEP)}
                                            type="button"
                                        >
                                            <Minus />
                                        </button>
                                        <button
                                            aria-label="Zoom in"
                                            className={cn(control, quiet, 'w-6')}
                                            disabled={!canZoomIn}
                                            onClick={() => zoom(ZOOM_STEP)}
                                            type="button"
                                        >
                                            <Plus />
                                        </button>
                                        <button
                                            aria-label="Show every period"
                                            className={cn(control, quiet, 'w-6')}
                                            disabled={current === null}
                                            onClick={reset}
                                            type="button"
                                        >
                                            <RotateCcw />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="sr-only">
                <table>
                    <caption>{label}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Opened</th>
                            <th scope="col">Open</th>
                            <th scope="col">High</th>
                            <th scope="col">Low</th>
                            <th scope="col">Close</th>
                            {withVolume && <th scope="col">Volume</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map(candle => (
                            <tr key={candle.time.getTime()}>
                                <th scope="row">{writeTimeLong(candle.time)}</th>
                                <td>{price(candle.open)}</td>
                                <td>{price(candle.high)}</td>
                                <td>{price(candle.low)}</td>
                                <td>{price(candle.close)}</td>
                                {withVolume && <td>{candle.volume ?? ''}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};

/** A change, in the tone of its direction. */
const Change = ({ share, text }: { share: number; text: string }) => (
    <span
        className={cn(
            'font-medium',
            share > 0 ? CHANGE_INK.up : share < 0 ? CHANGE_INK.down : CHANGE_INK.neutral,
        )}
    >
        {text}
    </span>
);
