'use client';

import {
    type CSSProperties,
    Fragment,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
    useCallback,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import type { ChartRow, ChartSeries } from './cartesian';
import { type ChartColor, chartColor, seriesColor } from './lib/color';
import { formatCompact, formatNumber, formatX as formatXValue } from './lib/format';
import { PLOT_FRAME } from './lib/frame';
import { extent, niceTicks } from './lib/scale';
import { useWidth } from './lib/use-size';
import { ChartTooltip } from './tooltip';

/*
 * The bar chart turned on its side: the categories down the left, each bar growing to the
 * right from a flat foot on zero. It takes the bar chart's props under the bar chart's names
 * (`x` is still the category, `formatY` still writes the value axis), so one becomes the other
 * by its name alone. On its side a bar has the room along it for its own figures, so each
 * segment carries its value inside it wherever the value fits.
 */

export type HorizontalBarChartProps<Row extends ChartRow, X = unknown> = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    data: readonly Row[];
    /**
     * The field naming each row, down the side. Called `x` as in the bar chart this is turned
     * from, so either chart takes the other's props unchanged.
     */
    x: string;
    series: readonly ChartSeries[];
    /**
     * Stack the series into one bar a row, as parts of a total the reader is meant to add up;
     * false stands them side by side, one under the other. Stacked unless turned off.
     */
    stacked?: boolean;
    /**
     * The chart's whole height, the value axis included. Left out, it follows the rows: each is
     * given the room a bar reads in with a figure inside it, so ten rows are twice as tall as five.
     */
    height?: number;
    /** Writes each row's name down the side. */
    formatX?: (value: X, row: Row, index: number) => string;
    /** The readout's title; `formatX` unless given. */
    formatTitle?: (value: X, row: Row, index: number) => string;
    /** The value axis' labels at the foot; compact en-GB unless given. It writes the figures too. */
    formatY?: (value: number) => string;
    /** The figures alone, in the segments, past the bars and in the readout. */
    formatValue?: (value: number) => string;
    /** Holds the value axis down, for a measure with a ceiling such as a rate. */
    yMax?: number;
    /** How many value labels to aim for; as many as fit the width unless given. */
    yTicks?: number;
    /**
     * Each segment's figure inside it. A segment too short to hold its figure goes without
     * rather than spilling it over its neighbour; the readout still has it.
     */
    labels?: boolean;
    /** Each bar's figure past its end: a stack's total, or a lone bar's own value. */
    total?: boolean;
    /**
     * `solid` fills each bar; `tint` draws it as every other mark in the kit is drawn, a tint of
     * its colour with a solid edge at its data end, and takes the texture.
     */
    fill?: 'solid' | 'tint';
    /**
     * A texture in a tinted bar: diagonal stripes or a field of dots. Left out, the chart
     * follows the theme (`--chart-texture-stripes: 1` or `--chart-texture-dots: 1`).
     */
    texture?: 'none' | 'stripes' | 'dots';
    /** False for a chart too small to read out; a function writes its own readout. */
    tooltip?: boolean | ((row: Row, index: number) => ReactNode);
    /** The hairlines up from each value label. */
    grid?: boolean;
    /** The rows' names down the side: the bar chart's x axis, turned. */
    xAxis?: boolean;
    /** The value labels at the foot: the bar chart's y axis, turned. */
    yAxis?: boolean;
    onSelect?: (row: Row, index: number) => void;
    /** With no data, the plot is a skeleton. */
    loading?: boolean;
    emptyLabel?: string;
    className?: string;
    style?: CSSProperties;
};

/** Room for the labels, and the sizes of the marks. Everything else follows the theme. */
const GUTTER_GAP = 8;
const AXIS_HEIGHT = 20;
/** The room a row is given when the chart is not told its height. */
const ROW = 36;
/** A grouped row gives each of its bars this much, and keeps the same air round the group. */
const GROUPED_BAR = 12;
const BAR_GAP = 2;
const BAR_MAX = 24;
const BAR_MIN = 2;
/** A bar takes this share of its row, a group of bars a little more. */
const BAR_SHARE = 0.56;
const GROUP_SHARE = 0.72;
/** A figure needs this much clear on each side of it inside its segment. */
const LABEL_PAD = 6;
/** And a bar at least this thick, or the figure is taller than the bar it sits in. */
const LABEL_MIN_THICKNESS = 15;
const TOTAL_GAP = 6;
/** The value axis is read in about this many px a label. */
const TICK_ROOM = 100;
/** Past this share of the width the rows' names are cut short rather than squeeze the bars. */
const GUTTER_MAX = 0.36;
const TOOLTIP_GAP = 4;

const toNumber = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;

const colorNameOf = (line: ChartSeries, index: number): ChartColor =>
    line.muted ? 'neutral' : (line.color ?? (`series-${Math.min(index + 1, 5)}` as ChartColor));

const colorOf = (line: ChartSeries, index: number) =>
    line.muted ? chartColor('neutral') : chartColor(line.color ?? seriesColor(index));

/**
 * The ink a figure takes on a solid fill: near white on a deep colour, near black on a light
 * one. It is worked out from the fill itself, in CSS, so a theme's own colours and the dark
 * mode's get the right one without the chart knowing what they are.
 */
const inkOn = (color: string) => `oklch(from ${color} clamp(0.2, (0.66 - l) * 1000, 0.99) 0 0)`;

/** The two textures as CSS: the same stripes and dots as the bar chart's. */
const TEXTURES = {
    stripes: (color: string) =>
        `repeating-linear-gradient(135deg, color-mix(in oklab, ${color} 50%, transparent) 0 1.2px, transparent 1.2px 6px)`,
    dots: (color: string) =>
        `radial-gradient(color-mix(in oklab, ${color} 55%, transparent) 1.1px, transparent 1.4px) 0 0 / 6px 6px`,
};

/**
 * How wide each of a set of labels is, measured in the theme's own font rather than guessed.
 * The probe holds each label once, out of sight; its layout width is read, so a chart drawn in
 * a scaled frame measures what it will draw.
 */
const useTextWidths = (texts: readonly string[]) => {
    const ref = useRef<HTMLDivElement>(null);
    const [widths, setWidths] = useState<ReadonlyMap<string, number>>(() => new Map());
    const key = texts.join('\u0000');

    // biome-ignore lint/correctness/useExhaustiveDependencies: the probe is read again when its texts change
    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        const read = () => {
            const next = new Map<string, number>();
            for (const child of Array.from(node.children)) {
                next.set(child.textContent ?? '', (child as HTMLElement).offsetWidth + 1);
            }
            setWidths(next);
        };
        read();
        // A font that loads late, or a theme's own size, resizes the probe: read it again.
        const observer = new ResizeObserver(read);
        observer.observe(node);
        return () => observer.disconnect();
    }, [key]);

    return [ref, widths] as const;
};

type Segment = {
    key: string;
    row: number;
    series: number;
    value: number;
    color: string;
    tinted: boolean;
    texture?: 'none' | 'stripes' | 'dots';
    positive: boolean;
    head: boolean;
    x: number;
    y: number;
    width: number;
    thickness: number;
};

export const HorizontalBarChart = <Row extends ChartRow, X = unknown>({
    'aria-label': label,
    data: rows,
    x: xKey,
    series,
    stacked = true,
    height: givenHeight,
    formatX,
    formatTitle,
    formatY,
    formatValue,
    yMax,
    yTicks,
    labels = true,
    total = false,
    fill = 'solid',
    texture,
    tooltip = true,
    grid = true,
    xAxis = true,
    yAxis = true,
    onSelect,
    loading = false,
    emptyLabel = 'No data yet',
    className,
    style,
}: HorizontalBarChartProps<Row, X>) => {
    const [containerRef, width] = useWidth<HTMLDivElement>();
    const [active, setActive] = useState<number | null>(null);
    const clipId = `plot-${useId().replace(/:/g, '')}`;

    const data: readonly Row[] = loading ? [] : rows;
    const empty = data.length === 0;
    const writeAxis = formatY ?? formatCompact;
    const writeValue = formatValue ?? formatY ?? formatNumber;
    const count = series.length;
    const grouped = !stacked && count > 1;
    // A bar of one segment carries its figure past its end when the total is asked for.
    const lone = !stacked || count === 1;

    // Each row is given room for its bar; a group of bars, room for each of them.
    const rowRoom = grouped ? Math.max(ROW, count * GROUPED_BAR + (count - 1) * BAR_GAP + 16) : ROW;
    const bottom = yAxis ? AXIS_HEIGHT : 0;
    // While loading, the rows the chart was given (or five) keep its height, so nothing moves when they land.
    const rowsShown = loading ? rows.length || 5 : empty ? 5 : data.length;
    const height = givenHeight ?? rowsShown * rowRoom + bottom;
    const plotHeight = Math.max(0, height - bottom);
    const slot = empty ? plotHeight : plotHeight / data.length;

    const readings = useMemo(
        () => series.map(line => data.map(row => toNumber(row[line.key]))),
        [data, series],
    );
    const sums = useMemo(
        () => data.map((_, i) => readings.reduce((sum, column) => sum + (column[i] ?? 0), 0)),
        [data, readings],
    );

    const labelOf = useCallback(
        (row: Row | undefined, i: number) => {
            const value = row?.[xKey];
            return row && formatX ? formatX(value as X, row, i) : formatXValue(value);
        },
        [formatX, xKey],
    );
    const names = useMemo(() => data.map(labelOf), [data, labelOf]);

    // Every figure the chart may draw, measured once so each knows whether it fits.
    const figures = useMemo(() => {
        const all = new Set<string>();
        for (const column of readings) for (const value of column) all.add(writeValue(value));
        if (total) for (const sum of sums) all.add(writeValue(sum));
        return [...all];
    }, [readings, sums, total, writeValue]);
    const [figureProbe, figureWidths] = useTextWidths(figures);
    // While loading, the names of the rows it was given are measured, never drawn, so the plot keeps its place.
    const measured = useMemo(
        () => (loading ? rows.map(labelOf) : names),
        [loading, rows, labelOf, names],
    );
    const [nameProbe, nameWidths] = useTextWidths(measured);
    const widestName = Math.max(
        loading && rows.length === 0 ? 64 : 0,
        ...measured.map(name => nameWidths.get(name) ?? 0),
    );

    const left =
        xAxis && (!empty || loading)
            ? Math.min(widestName, Math.round(width * GUTTER_MAX)) + GUTTER_GAP
            : 0;
    // The plot, and the frame round it, take the width past the names.
    const plotWidth = Math.max(0, width - left);

    /*
     * The value axis. The data sets the domain, and the axis is read in as many places as the
     * width has room for. With the totals drawn past the bars, the domain reaches far enough
     * that the longest bar's figure still ends inside the chart.
     */
    const ticks = useMemo(() => {
        const span = extent(stacked ? sums : readings.flat());
        const wanted = yTicks ?? Math.max(2, Math.min(8, Math.floor(plotWidth / TICK_ROOM)));
        const nice = niceTicks(span.min, span.max, wanted, yMax);
        if (!total || plotWidth <= 0) return nice;
        const ends = stacked ? sums : readings.flat();
        let max = nice.max;
        for (const value of ends) {
            if (value <= 0) continue;
            const room = plotWidth - TOTAL_GAP - (figureWidths.get(writeValue(value)) ?? 0);
            if (room > 0) max = Math.max(max, nice.min + ((value - nice.min) * plotWidth) / room);
        }
        return { ...nice, max };
    }, [figureWidths, plotWidth, readings, stacked, sums, total, writeValue, yMax, yTicks]);

    const xOf = useCallback(
        (value: number) =>
            left +
            (ticks.max === ticks.min
                ? 0
                : ((value - ticks.min) / (ticks.max - ticks.min)) * plotWidth),
        [left, plotWidth, ticks],
    );
    const baseline = xOf(Math.max(ticks.min, 0));
    const axisLabels = useMemo(() => ticks.values.map(writeAxis), [ticks, writeAxis]);
    const [axisProbe, axisWidths] = useTextWidths(axisLabels);

    const thickness = Math.max(
        BAR_MIN,
        grouped
            ? (Math.min(slot * GROUP_SHARE, BAR_MAX * count + BAR_GAP * (count - 1)) -
                  BAR_GAP * (count - 1)) /
                  count
            : Math.min(slot * BAR_SHARE, BAR_MAX),
    );

    const segments = useMemo(() => {
        if (empty || plotWidth <= 0) return [];
        const out: Segment[] = [];
        data.forEach((_, row) => {
            const middle = slot * (row + 0.5);
            const groupThickness = grouped ? thickness * count + BAR_GAP * (count - 1) : thickness;
            let right = baseline;
            let leftEdge = baseline;
            const placed: Segment[] = [];
            series.forEach((line, index) => {
                const value = readings[index]?.[row] ?? 0;
                const positive = value >= 0;
                const size = Math.abs(xOf(value) - xOf(0));
                const shared = {
                    key: `${row}-${line.key}`,
                    row,
                    series: index,
                    value,
                    color: colorOf(line, index),
                    tinted: (line.fill ?? fill) === 'tint',
                    texture: line.texture ?? texture,
                    positive,
                    thickness,
                };
                if (!stacked || count === 1) {
                    placed.push({
                        ...shared,
                        head: size > 0,
                        x: positive ? baseline : baseline - size,
                        y:
                            middle -
                            groupThickness / 2 +
                            (grouped ? index * (thickness + BAR_GAP) : 0),
                        width: size,
                    });
                    return;
                }
                // A stacked segment starts where the one before it stopped, two pixels clear of it.
                const from = positive ? right : leftEdge;
                const gap = from === baseline ? 0 : BAR_GAP;
                if (positive) right = from + size;
                else leftEdge = from - size;
                placed.push({
                    ...shared,
                    head: false,
                    x: positive ? from + gap : from - size,
                    y: middle - thickness / 2,
                    width: Math.max(0, size - gap),
                });
            });
            if (stacked && count > 1) {
                // Only the stack's far end is rounded: the last segment drawn on either side.
                const lastRight = placed.findLastIndex(s => s.positive && s.width > 0);
                const lastLeft = placed.findLastIndex(s => !s.positive && s.width > 0);
                for (const at of [lastRight, lastLeft]) {
                    const segment = placed[at];
                    if (segment) segment.head = true;
                }
            }
            out.push(...placed);
        });
        return out;
    }, [
        baseline,
        count,
        data,
        empty,
        fill,
        grouped,
        plotWidth,
        readings,
        series,
        slot,
        stacked,
        texture,
        thickness,
        xOf,
    ]);

    // Where each bar ends, for the figure drawn past it.
    const ends = useMemo(() => {
        if (!total || empty) return [];
        if (lone)
            return segments.map(segment => ({
                key: segment.key,
                row: segment.row,
                text: writeValue(segment.value),
                positive: segment.positive,
                at: segment.positive ? segment.x + segment.width : segment.x,
                y: segment.y + segment.thickness / 2,
            }));
        return data.map((_, row) => {
            const sum = sums[row] ?? 0;
            const own = segments.filter(segment => segment.key.startsWith(`${row}-`));
            const reach =
                sum >= 0
                    ? Math.max(baseline, ...own.map(s => s.x + s.width))
                    : Math.min(baseline, ...own.map(s => s.x));
            return {
                key: String(row),
                row,
                text: writeValue(sum),
                positive: sum >= 0,
                at: reach,
                y: slot * (row + 0.5),
            };
        });
    }, [baseline, data, empty, lone, segments, slot, sums, total, writeValue]);

    /*
     * Which row is being read: the one under the pointer, or the one the arrow keys walked to.
     * A reader aims at a row, never at a bar, so the pointer's height is snapped to its row.
     */
    const rowAt = (y: number) =>
        Math.max(0, Math.min(data.length - 1, Math.floor(y / Math.max(1, slot))));
    const onPointerMove = (event: PointerEvent<HTMLElement>) => {
        if (empty) return;
        const box = event.currentTarget.getBoundingClientRect();
        // The layer's own height against its drawn one: a chart in a scaled frame still reads true.
        const scale = box.height / Math.max(1, event.currentTarget.offsetHeight);
        setActive(rowAt((event.clientY - box.top) / scale));
    };
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (empty) return;
        const last = data.length - 1;
        const step = (by: number) =>
            setActive(current =>
                Math.max(0, Math.min(last, (current ?? (by > 0 ? -1 : data.length)) + by)),
            );
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                step(1);
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                step(-1);
                break;
            case 'Home':
                setActive(0);
                break;
            case 'End':
                setActive(last);
                break;
            case 'Escape':
                setActive(null);
                break;
            default:
                return;
        }
        event.preventDefault();
    };

    const activeRow = active !== null ? data[active] : undefined;
    const readable = tooltip !== false && !empty;

    const titleOf = (index: number) => {
        const row = data[index];
        if (!row) return '';
        const value = row[xKey];
        if (formatTitle) return formatTitle(value as X, row, index);
        if (formatX) return formatX(value as X, row, index);
        return formatXValue(value, true);
    };
    const readoutOf = (index: number) =>
        `${titleOf(index)}: ${series
            .map((line, i) => `${line.name ?? line.key} ${writeValue(readings[i]?.[index] ?? 0)}`)
            .join(', ')}`;

    // The readout stands at the far end of the values, beside the row: under it in the top
    // half, over it in the bottom half, and held inside the chart when it is taller than the room.
    const below = active !== null && active < data.length / 2;
    const rowTop = active !== null ? slot * active : 0;

    return (
        <figure
            aria-busy={loading || undefined}
            aria-label={label}
            className={cn('relative m-0 w-full', className)}
            data-slot="horizontal-bar-chart"
            style={{ height, ...style }}
        >
            {/* The labels, measured in the theme's own font before they are placed. */}
            <div
                aria-hidden
                className="pointer-events-none invisible absolute top-0 left-0 w-max text-xxs"
                ref={nameProbe}
            >
                {[...new Set(measured)].map(text => (
                    <div className="w-max whitespace-nowrap" key={text}>
                        {text}
                    </div>
                ))}
            </div>
            <div
                aria-hidden
                className="pointer-events-none invisible absolute top-0 left-0 w-max font-medium text-xxs tabular-nums"
                ref={figureProbe}
            >
                {figures.map(text => (
                    <div className="w-max whitespace-nowrap" key={text}>
                        {text}
                    </div>
                ))}
            </div>
            <div
                aria-hidden
                className="pointer-events-none invisible absolute top-0 left-0 w-max text-xxs tabular-nums"
                ref={axisProbe}
            >
                {[...new Set(axisLabels)].map(text => (
                    <div className="w-max whitespace-nowrap" key={text}>
                        {text}
                    </div>
                ))}
            </div>

            <div
                className={cn(
                    'relative size-full transition-opacity duration-200 motion-reduce:transition-none',
                    // It appears once it knows how wide it is, rather than jumping into place.
                    width > 0 ? 'opacity-100' : 'opacity-0',
                )}
                ref={containerRef}
            >
                {width > 0 && (
                    <>
                        {(!empty || loading) && (
                            // The plot's own place in its card; the names and the axis stand outside it.
                            <div
                                aria-hidden
                                className={PLOT_FRAME}
                                data-slot="chart-frame"
                                style={{ height: plotHeight, left, top: 0, width: plotWidth }}
                            />
                        )}
                        {/* The marks are drawn for the eye; the table below carries the figures. */}
                        <svg
                            aria-hidden="true"
                            className="absolute inset-0 block overflow-visible"
                            height={height}
                            width={width}
                        >
                            {/* Whatever is drawn in the plot stays in its frame, corners and all. */}
                            <defs>
                                <clipPath id={clipId}>
                                    <rect
                                        height={plotHeight}
                                        style={{ rx: 'var(--radius-item)' }}
                                        width={plotWidth}
                                        x={left}
                                        y={0}
                                    />
                                </clipPath>
                            </defs>
                            {grid && !loading && !empty && (
                                <g clipPath={`url(#${clipId})`}>
                                    {ticks.values
                                        // A rule on the frame's own edge is the frame's.
                                        .filter(tick => {
                                            const at = Math.round(xOf(tick));
                                            return at > left + 1 && at < width - 2;
                                        })
                                        .map(tick => (
                                            // Half a pixel off the whole one, so a 1px rule lands crisp.
                                            <line
                                                key={tick}
                                                shapeRendering="crispEdges"
                                                stroke="var(--color-chart-grid)"
                                                x1={Math.round(xOf(tick)) + 0.5}
                                                x2={Math.round(xOf(tick)) + 0.5}
                                                y1={0}
                                                y2={plotHeight}
                                            />
                                        ))}
                                </g>
                            )}
                            {yAxis &&
                                !empty &&
                                ticks.values.map((tick, i) => {
                                    const at = xOf(tick);
                                    const half = (axisWidths.get(axisLabels[i] ?? '') ?? 0) / 2;
                                    // Centred under its rule, unless that would run off an edge.
                                    const anchor =
                                        at - half < left
                                            ? 'start'
                                            : at + half > width
                                              ? 'end'
                                              : 'middle';
                                    return (
                                        <text
                                            className="text-xxs tabular-nums"
                                            fill="var(--color-chart-label)"
                                            key={tick}
                                            textAnchor={anchor}
                                            x={
                                                anchor === 'start'
                                                    ? left
                                                    : anchor === 'end'
                                                      ? width
                                                      : at
                                            }
                                            y={plotHeight + 16}
                                        >
                                            {axisLabels[i]}
                                        </text>
                                    );
                                })}
                        </svg>

                        {xAxis &&
                            !empty &&
                            names.map((name, index) => (
                                <div
                                    className={cn(
                                        'absolute flex items-center text-xxs transition-colors duration-150 motion-reduce:transition-none',
                                        active === index && 'text-neutral-950',
                                    )}
                                    key={`${index}-${name}`}
                                    style={{
                                        color:
                                            active === index
                                                ? undefined
                                                : 'var(--color-chart-label)',
                                        height: slot,
                                        left: 0,
                                        top: slot * index,
                                        width: Math.max(0, left - GUTTER_GAP),
                                    }}
                                >
                                    <span className="truncate">{name}</span>
                                </div>
                            ))}

                        {/*
                         * The bars, clipped to the frame's rect and corner. The layer inside is
                         * set back by the gutter, so the marks keep the chart's own coordinates.
                         */}
                        <div
                            className="pointer-events-none absolute overflow-hidden rounded-item"
                            data-slot="chart-bars"
                            style={{ height: plotHeight, left, top: 0, width: plotWidth }}
                        >
                            <div className="absolute top-0" style={{ height, left: -left, width }}>
                                {active !== null && (
                                    // The row being read, on the item corner as a hovered row is.
                                    <div
                                        className="absolute rounded-item"
                                        style={{
                                            background: 'var(--color-chart-band)',
                                            height: Math.max(0, slot - 2),
                                            left: left + 3,
                                            top: rowTop + 1,
                                            width: Math.max(0, plotWidth - 6),
                                        }}
                                    />
                                )}
                                {/*
                                 * The bars wipe in from their foot once, as they would grow: a
                                 * keyframe, so a chart printed or in a background tab is still drawn.
                                 */}
                                <div className="absolute inset-0 motion-safe:animate-reveal">
                                    {segments.map(segment => {
                                        if (segment.width <= 0) return null;
                                        /*
                                         * A bar stands flat on zero and is rounded at its far end, on
                                         * the item corner: rounded at one end, it never turns into a pill.
                                         */
                                        const head = segment.head
                                            ? `min(var(--radius-item), ${segment.thickness / 2}px)`
                                            : '0px';
                                        const { tinted, texture: grain, color } = segment;
                                        const text = writeValue(segment.value);
                                        const textWidth =
                                            figureWidths.get(text) ?? Number.POSITIVE_INFINITY;
                                        const labelled =
                                            labels &&
                                            !(total && lone) &&
                                            segment.thickness >= LABEL_MIN_THICKNESS &&
                                            segment.width >= textWidth + LABEL_PAD * 2;

                                        return (
                                            <div
                                                className={cn(
                                                    // The row being read is marked by its band, as a column is in the bar chart.
                                                    'absolute flex items-center justify-center overflow-hidden',
                                                )}
                                                key={segment.key}
                                                style={{
                                                    background: tinted
                                                        ? `color-mix(in oklab, ${color} 20%, transparent)`
                                                        : color,
                                                    borderRadius: segment.positive
                                                        ? `0 ${head} ${head} 0`
                                                        : `${head} 0 0 ${head}`,
                                                    // The bar's own line at its data end, as a line
                                                    // stands over the tint under it.
                                                    boxShadow: tinted
                                                        ? `inset ${segment.positive ? -2 : 2}px 0 0 ${color}`
                                                        : undefined,
                                                    height: segment.thickness,
                                                    left: segment.x,
                                                    top: segment.y,
                                                    width: segment.width,
                                                }}
                                            >
                                                {tinted &&
                                                    grain !== 'none' &&
                                                    (['stripes', 'dots'] as const)
                                                        .filter(
                                                            kindOf => !grain || grain === kindOf,
                                                        )
                                                        .map(kindOf => (
                                                            <span
                                                                aria-hidden
                                                                className="absolute inset-0"
                                                                key={kindOf}
                                                                style={{
                                                                    background:
                                                                        TEXTURES[kindOf](color),
                                                                    // Asked for outright it shows; otherwise the theme says.
                                                                    opacity: grain
                                                                        ? 1
                                                                        : `var(--chart-texture-${kindOf}, 0)`,
                                                                }}
                                                            />
                                                        ))}
                                                {labelled && (
                                                    <span
                                                        className={cn(
                                                            'relative font-medium text-xxs tabular-nums',
                                                            tinted && 'text-neutral-950',
                                                        )}
                                                        style={
                                                            tinted
                                                                ? undefined
                                                                : { color: inkOn(color) }
                                                        }
                                                    >
                                                        {text}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {ends.map(end => (
                                        <span
                                            className={cn(
                                                'absolute flex -translate-y-1/2 items-center whitespace-nowrap font-medium text-neutral-950 text-xxs tabular-nums',
                                            )}
                                            key={end.key}
                                            style={
                                                end.positive
                                                    ? { left: end.at + TOTAL_GAP, top: end.y }
                                                    : {
                                                          right: width - end.at + TOTAL_GAP,
                                                          top: end.y,
                                                      }
                                            }
                                        >
                                            {end.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <ChartSkeleton
                                height={plotHeight}
                                left={left}
                                top={0}
                                width={plotWidth}
                            />
                        )}

                        {empty && !loading && (
                            <p
                                className="absolute flex items-center justify-center rounded-item border border-neutral-200 border-dashed text-neutral-600 text-xs"
                                style={{ height: plotHeight, left: 0, top: 0, width }}
                            >
                                {emptyLabel}
                            </p>
                        )}

                        {readable && active !== null && activeRow && (
                            <div
                                className={cn(
                                    'pointer-events-none absolute inset-y-0 right-0 z-10 flex flex-col',
                                    !below && 'justify-end',
                                )}
                            >
                                {below && (
                                    <div
                                        className="min-h-0 shrink"
                                        style={{ height: rowTop + slot + TOOLTIP_GAP }}
                                    />
                                )}
                                <div className="shrink-0">
                                    {typeof tooltip === 'function' ? (
                                        tooltip(activeRow, active)
                                    ) : (
                                        <ChartTooltip
                                            footer={
                                                stacked && count > 1 ? (
                                                    <ChartTooltipTotal
                                                        value={writeValue(sums[active] ?? 0)}
                                                    />
                                                ) : undefined
                                            }
                                            rows={series.map((line, i) => ({
                                                color: colorNameOf(line, i),
                                                name: line.name ?? line.key,
                                                value: writeValue(readings[i]?.[active] ?? 0),
                                            }))}
                                            title={titleOf(active)}
                                        />
                                    )}
                                </div>
                                {!below && (
                                    <div
                                        className="min-h-0 shrink"
                                        style={{ height: height - rowTop + TOOLTIP_GAP }}
                                    />
                                )}
                            </div>
                        )}

                        {!empty && (readable || onSelect) && (
                            // One tab stop over the plot: the arrow keys walk the rows, and Enter
                            // picks the one being read, as a click on it would.
                            <button
                                aria-label={`${label}. Read each row with the arrow keys.`}
                                className={cn(
                                    'absolute rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2',
                                    onSelect ? 'cursor-pointer' : 'cursor-default',
                                )}
                                data-slot="chart-hover-layer"
                                onBlur={() => setActive(null)}
                                onClick={() => {
                                    const row = active !== null ? data[active] : undefined;
                                    if (row && active !== null) onSelect?.(row, active);
                                }}
                                onKeyDown={onKeyDown}
                                onPointerCancel={() => setActive(null)}
                                onPointerLeave={() => setActive(null)}
                                onPointerMove={onPointerMove}
                                style={{
                                    height: plotHeight,
                                    left: 0,
                                    top: 0,
                                    touchAction: 'pan-y',
                                    width,
                                }}
                                type="button"
                            />
                        )}
                    </>
                )}
            </div>

            <p aria-live="polite" className="sr-only">
                {active !== null && activeRow ? readoutOf(active) : ''}
            </p>

            {/* The figures themselves, for a reader who cannot see the marks. */}
            <div className="sr-only">
                <table>
                    <caption>{label}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{xKey}</th>
                            {series.map(line => (
                                <th key={line.key} scope="col">
                                    {line.name ?? line.key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {names.map((text, index) => (
                            <tr key={`${index}-${text}`}>
                                <th scope="row">{text}</th>
                                {series.map((line, i) => (
                                    <td key={line.key}>{writeValue(readings[i]?.[index] ?? 0)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};

/** The stand-in bars' lengths, as shares of the plot: a ranking, longest first. */
const SKELETON_LENGTHS = [0.86, 0.72, 0.6, 0.47, 0.38, 0.3, 0.24, 0.2];

/**
 * A chart that is loading: a ranking of bars in the skeleton wash, longest first, each with a
 * short label before it, and the band of light crossing them. It takes the plot's room, so
 * nothing moves when the data lands.
 */
const ChartSkeleton = ({
    left,
    top,
    width,
    height,
}: {
    left: number;
    top: number;
    width: number;
    height: number;
}) => {
    if (width <= 0 || height <= 0) return null;
    const rows = Math.max(3, Math.min(SKELETON_LENGTHS.length, Math.floor(height / ROW)));
    const row = height / rows;
    const bar = Math.min(BAR_MAX, row * BAR_SHARE);
    // The names' column the chart keeps while loading, and the plot past it, exactly as loaded.
    const gutter = Math.max(0, left - GUTTER_GAP);
    const plotLeft = left;
    const plotWidth = width;

    return (
        <div
            aria-hidden
            className="absolute inset-x-0"
            data-slot="chart-skeleton"
            style={{ height, top }}
        >
            {Array.from({ length: rows }, (_, i) => {
                const y = i * row + (row - bar) / 2;
                return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: the rows never reorder
                    <Fragment key={i}>
                        <div
                            className="skeleton absolute h-2.5 rounded-chip"
                            style={{
                                left: 0,
                                top: y + bar / 2 - 5,
                                width: gutter * (i % 2 ? 0.6 : 0.8),
                            }}
                        />
                        <div
                            className="skeleton absolute rounded-r-chip"
                            style={{
                                height: bar,
                                left: plotLeft,
                                top: y,
                                width: plotWidth * (SKELETON_LENGTHS[i] ?? 0.2),
                            }}
                        />
                    </Fragment>
                );
            })}
        </div>
    );
};

const ChartTooltipTotal = ({ value }: { value: string }) => (
    <span className="flex items-center justify-between gap-4">
        <span className="text-neutral-600 text-xs">Total</span>
        <span className="font-medium text-neutral-950 text-xs tabular-nums">{value}</span>
    </span>
);
