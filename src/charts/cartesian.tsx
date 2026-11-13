'use client';

import {
    type CSSProperties,
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
} from 'react';
import { cn } from '../lib/cn';
import { type ChartColor, chartColor, seriesColor } from './lib/color';
import { formatCompact, formatNumber, formatX as formatXValue } from './lib/format';
import { PLOT_FRAME } from './lib/frame';
import {
    areaPath,
    curvePath,
    lineAreaPath,
    linePath,
    type Point,
    stepAreaPath,
    stepPath,
} from './lib/path';
import { extent, niceTicks, scalePoint, scaleY, slotScale } from './lib/scale';
import { useActive } from './lib/use-active';
import { useLabelWidth, useWidth } from './lib/use-size';
import { ChartTooltip } from './tooltip';

/*
 * The frame every plotted chart shares: the scales, the grid, the labels, the marks and
 * the layer that reads a point out. An area, a line and a bar chart differ only in their
 * marks and in how they count across the x axis, so they are this with a `kind` rather
 * than three charts.
 *
 * The lines and the chrome are SVG; the bars are HTML. A bar's corner follows the theme's
 * corner scale, and only a class can say min(4px, var(--radius-chip)).
 */

export type ChartKind = 'area' | 'line' | 'bar';

export type ChartRow = Record<string, unknown>;

export type ChartSeries = {
    /** The field of each row this series plots. */
    key: string;
    /** What the legend and the tooltip call it; the key unless given. */
    name?: string;
    /** `series-1` to `series-5` by position unless given. */
    color?: ChartColor;
    /** Drawn grey and under the rest: the period before, or a series switched off. */
    muted?: boolean;
    /**
     * Bars: this series alone drawn as a tint with a solid edge, the chart's `fill` unless
     * given. A tint says something about one series (a forecast, a plan still in trial); on
     * every series it says nothing.
     */
    fill?: 'solid' | 'tint';
    /** This series' texture, the chart's `texture` unless given. */
    texture?: 'none' | 'stripes' | 'dots';
};

/** What a chart is reading out: the title of the point, and each series' value as written. */
export type ChartReading = { title: string; values: string[] };

export type ChartMarker = {
    /** The row it marks. */
    index: number;
    label: string;
    /** A small icon; without one the marker is a bulb in its tone. */
    icon?: ReactNode;
    tone?: 'neutral' | 'success' | 'warning' | 'error';
};

/** Room for the labels, and the sizes of the marks. Everything else follows the theme. */
const GUTTER_GAP = 8;
/** The row of x labels under the plot: the gap to it and one line of labels, no more. */
const AXIS_HEIGHT = 20;
/** The room between the plot's frame and the marks in it: none, the frame holds the data tight. */
const PAD = 0;
const TOP = 8;
/** A marker's pin: its size, and its inset from the plot's frame. */
const PIN = 28;
const PIN_INSET = 4;
const X_LABEL_GAP = 16;
const TOOLTIP_OFFSET = 12;
const DOT_RADIUS = 4;
const BAR_GAP = 2;
const BAR_MAX = 28;
const BAR_MIN = 2;
/** A bar takes half its slot, and a group of bars seven tenths of it. */
const BAR_SHARE = 0.5;
const GROUP_SHARE = 0.7;
/** A date axis is read in five places at most: a reader counts dates, not ticks. */
const DATE_TICKS = 5;
/**
 * Past this many points the marks are drawn finer. A 2px stroke is right for a week, where
 * the line is the subject; over a year it is a rope, and the shape of the data is lost inside
 * its own weight. The hairline the rest of the system is built from is right at that density.
 */
const DENSE = 120;
/**
 * The most marks a plot draws. Past this the readings are gathered into even periods and the
 * period's average is drawn, because a year of daily readings has a weekly rhythm in it and
 * that rhythm is all a reader sees: the trend, the slump and the bad week it is made of are
 * lost inside a sawtooth. The spread each average came from is drawn behind it, so nothing
 * is hidden — the shape of the data is the band, not a line through the middle of it.
 */
const MARKS = 60;
/**
 * The least a mark may be given. Sixty readings are comfortable across a card and a crowd on a
 * phone, so how many are drawn follows the room there is: the same data gathers into longer
 * periods on a narrow plot rather than turning to hatching.
 */
const MARK_GAP = 8;
const LEAST_MARKS = 12;

/** The row a period is drawn as: its average per series, and where it came from. */
type Period = { from: number; to: number };

/** Nothing to gather while the readings are few enough for the room to draw one by one. */
const periodsFor = (count: number, plotWidth: number): Period[] | null => {
    const marks = Math.max(LEAST_MARKS, Math.min(MARKS, Math.floor(plotWidth / MARK_GAP)));
    // Gathering two readings into one is not worth the lie; it starts once there are half again.
    if (count <= marks * 1.5) return null;
    const size = count / marks;
    return Array.from({ length: marks }, (_, i) => ({
        from: Math.round(i * size),
        to: Math.max(Math.round(i * size) + 1, Math.round((i + 1) * size)),
    }));
};

const mean = (values: readonly number[], { from, to }: Period) => {
    let total = 0;
    for (let i = from; i < to; i++) total += values[i] ?? 0;
    return total / Math.max(1, to - from);
};

type ChartContextValue = {
    data: readonly ChartRow[];
    width: number;
    height: number;
    /** The drawing area inside the labels, in the SVG's own coordinates. */
    plot: { left: number; top: number; width: number; height: number };
    xOf: (index: number) => number;
    yOf: (value: number) => number;
    activeIndex: number | null;
};

const ChartContext = createContext<ChartContextValue | null>(null);

/** The plot's coordinates, for an overlay drawn as a chart's child. */
export const useChart = () => {
    const value = useContext(ChartContext);
    if (!value) throw new Error('useChart() is only for a chart’s own children.');
    return value;
};

export type CartesianProps<Row extends ChartRow, X = unknown> = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    data: readonly Row[];
    /** The field holding the x value: a Date or a number is a measure, a string a category. */
    x: string;
    series: readonly ChartSeries[];
    kind: ChartKind;
    /** Bars: stack the series rather than standing them side by side. */
    stacked?: boolean;
    /** Including the x labels. */
    height?: number;
    formatX?: (value: X, row: Row, index: number) => string;
    /** The tooltip's title; the long date, or `formatX`, unless given. */
    formatTitle?: (value: X, row: Row, index: number) => string;
    /** The y labels; compact en-GB unless given. It writes the tooltip's values too. */
    formatY?: (value: number) => string;
    /** The tooltip's values alone, where they want more room than an axis label. */
    formatValue?: (value: number) => string;
    /** Holds the axis down, for a measure with a ceiling such as a rate. */
    yMax?: number;
    /** How many x labels to aim for; fewer are drawn where they would not fit. */
    xTicks?: number;
    yTicks?: number;
    markers?: readonly ChartMarker[];
    /**
     * How a reading is joined to the next. `smooth` is a curve that never overshoots a
     * neighbour, `linear` the straight run between them, and `step` holds each value across
     * its own period, for a measure that was only ever true of that period. A chart of many
     * readings draws straight whatever is asked, since at two pixels a span a curve says
     * nothing and only costs the slope maths.
     */
    curve?: 'smooth' | 'linear' | 'step';
    /**
     * A texture in the tint under a line: diagonal stripes or a field of dots. Left out, the
     * chart follows the theme, which may ask for one (`--chart-texture-stripes: 1` or
     * `--chart-texture-dots: 1`) and asks for none by default; `none` holds it plain.
     */
    texture?: 'none' | 'stripes' | 'dots';
    /**
     * Bars: `solid` fills each bar; `tint` draws it as every other mark in the kit is drawn, a
     * tint of its colour with a solid edge at its data end, and takes the texture.
     */
    fill?: 'solid' | 'tint';
    /** A tick at each reading, for a chart whose readings are few and worth pointing out. */
    points?: boolean;
    /** From this row on the line is dashed: the period is not over. */
    incompleteFrom?: number;
    /** False for a chart too small to read out; a function writes its own readout. */
    tooltip?: boolean | ((row: Row, index: number) => ReactNode);
    grid?: boolean;
    xAxis?: boolean;
    yAxis?: boolean;
    onSelect?: (row: Row, index: number) => void;
    /**
     * Told what is being read, as it is written in the readout, and null when nothing is. A card
     * that holds the chart shows it in its own header instead of in a panel over the plot.
     */
    onRead?: (reading: ChartReading | null) => void;
    /** With no data, the plot is a skeleton; with data, the marks wait at half strength. */
    loading?: boolean;
    emptyLabel?: string;
    className?: string;
    style?: CSSProperties;
    /** Overlays drawn in the plot's coordinates, with `useChart()`. */
    children?: ReactNode;
};

const toNumber = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;

const colorOf = (line: ChartSeries, index: number) =>
    line.muted ? chartColor('neutral') : chartColor(line.color ?? seriesColor(index));

/** The indices to label, spread evenly, the first and last always among them. */
const labelIndices = (count: number, wanted: number) => {
    if (count === 0) return [];
    const take = Math.max(1, Math.min(wanted, count));
    if (take === 1) return [0];
    const indices = new Set<number>();
    for (let i = 0; i < take; i++) indices.add(Math.round((i * (count - 1)) / (take - 1)));
    return [...indices].sort((a, b) => a - b);
};

export const Cartesian = <Row extends ChartRow, X = unknown>({
    'aria-label': label,
    data: rows,
    x: xKey,
    series,
    kind,
    stacked = false,
    height = 240,
    formatX,
    formatTitle,
    formatY,
    formatValue,
    yMax,
    xTicks,
    yTicks = 4,
    markers,
    curve = 'smooth',
    points: showPoints = false,
    texture,
    fill = 'solid',
    incompleteFrom,
    tooltip = true,
    grid = true,
    xAxis = true,
    yAxis = true,
    onSelect,
    onRead,
    loading = false,
    emptyLabel = 'No data yet',
    className,
    style,
    children,
}: CartesianProps<Row, X>) => {
    // React's own ids carry characters a URL fragment should not, so they are stripped.
    const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const [containerRef, width] = useWidth<HTMLDivElement>();
    const [yProbeRef, yLabelWidth] = useLabelWidth();
    const [xProbeRef, xLabelWidth] = useLabelWidth();

    /*
     * While it loads a chart draws its skeleton and nothing else. Holding the last rows at half
     * strength is not a loading state: it is the old answer looking unwell, and a reader cannot
     * tell whether to trust it.
     */
    const data: readonly Row[] = loading ? [] : rows;
    const empty = data.length === 0;
    const writeAxis = formatY ?? formatCompact;
    const writeValue = formatValue ?? formatY ?? formatNumber;
    const bars = kind === 'bar';

    // The plot is what the labels leave. It is known before the marks, because how many marks
    // there is room for decides how the readings are gathered.
    // While loading, the value axis keeps its column, so the plot does not widen and then narrow
    // when the data lands: measured from the rows' labels when there are rows, else a short one.
    const left = (yAxis && (!empty || loading) ? yLabelWidth + GUTTER_GAP : 0) + PAD;
    const top = TOP;
    const bottom = (xAxis ? AXIS_HEIGHT : 0) + PAD;
    const plotWidth = Math.max(0, width - left - PAD);
    const plotHeight = Math.max(0, height - top - bottom);

    // Every series' numbers as given, before any gathering.
    const readings = useMemo(
        () => series.map(line => data.map(row => toNumber(row[line.key]))),
        [data, series],
    );

    /*
     * What is actually drawn. Few enough readings and it is the readings themselves; past that
     * it is one mark per period, holding the period's average and the spread it came from.
     */
    const periods = useMemo(
        () => (bars ? null : periodsFor(data.length, plotWidth)),
        [bars, data.length, plotWidth],
    );
    const columns = useMemo(
        () =>
            periods
                ? readings.map(values => periods.map(period => mean(values, period)))
                : readings,
        [periods, readings],
    );
    /** The row each mark stands for: the reading itself, or the period's first. */
    const rowAt = useCallback(
        (index: number) => data[periods ? (periods[index]?.from ?? 0) : index],
        [data, periods],
    );
    const marksCount = periods ? periods.length : data.length;
    /**
     * A row of the data as the mark that now carries it. Anything a caller points at — a marker,
     * the row a period stops being measured at — names a row, and must follow it into its period.
     */
    const markOf = (row: number) => {
        if (!periods) return Math.max(0, Math.min(marksCount - 1, row));
        const found = periods.findIndex(period => row < period.to);
        return found === -1 ? periods.length - 1 : found;
    };
    const cutAt = incompleteFrom === undefined ? undefined : markOf(incompleteFrom);
    const sums = useMemo(
        () =>
            stacked && bars
                ? data.map((_, i) => columns.reduce((total, column) => total + (column[i] ?? 0), 0))
                : [],
        [bars, columns, data, stacked],
    );

    const ticks = useMemo(() => {
        const span = extent(stacked && bars ? sums : columns.flat());
        return niceTicks(span.min, span.max, yTicks, yMax);
    }, [bars, columns, stacked, sums, yMax, yTicks]);

    const yLabels = useMemo(() => ticks.values.map(writeAxis), [ticks, writeAxis]);
    // The labels the value axis is measured from while loading: the ones the given rows will have,
    // or a short stand-in when there are none yet. They are measured, never drawn.
    const heldLabels = useMemo(() => {
        if (!loading) return yLabels;
        if (rows.length === 0) return [writeAxis(1000)];
        const values = rows.map(row => series.map(line => toNumber(row[line.key])));
        const span = extent(
            stacked && bars
                ? values.map(row => row.reduce((total, value) => total + value, 0))
                : values.flat(),
        );
        return niceTicks(span.min, span.max, yTicks, yMax).values.map(writeAxis);
    }, [bars, loading, rows, series, stacked, writeAxis, yLabels, yMax, yTicks]);
    const labelOf = useCallback(
        (row: Row | undefined, i: number) => {
            const value = row?.[xKey];
            return row && formatX ? formatX(value as X, row, i) : formatXValue(value);
        },
        [formatX, xKey],
    );
    // One label per mark; the table below keeps a label for every reading.
    const xLabels = useMemo(
        () => Array.from({ length: marksCount }, (_, i) => labelOf(rowAt(i), i)),
        [labelOf, marksCount, rowAt],
    );
    const rawLabels = useMemo(() => data.map(labelOf), [data, labelOf]);

    const slots = useMemo(() => slotScale(data.length, plotWidth), [data.length, plotWidth]);
    const xOf = useMemo(
        () => (index: number) =>
            left + (bars ? slots.center(index) : scalePoint(index, marksCount, plotWidth)),
        [bars, marksCount, left, plotWidth, slots],
    );
    const yOf = useMemo(
        () => (value: number) => top + scaleY(value, ticks, plotHeight),
        [plotHeight, ticks],
    );
    const baseline = yOf(Math.max(ticks.min, 0));

    const { active, handlers } = useActive(marksCount, xOf);

    const readable = tooltip !== false && !empty;
    // The plot still answers the pointer when a card reads it out in place of the panel.
    const hoverable = (readable || !!onRead) && !empty;
    const activeRow = active !== null ? rowAt(active) : undefined;

    // Only as many x labels as fit without touching, however many were asked for.
    const shown = useMemo(() => {
        if (!xAxis || empty) return [];
        const room = Math.max(
            1,
            Math.floor((plotWidth + X_LABEL_GAP) / Math.max(1, xLabelWidth + X_LABEL_GAP)),
        );
        const dates = data[0]?.[xKey] instanceof Date;
        const wanted = xTicks ?? (dates ? DATE_TICKS : marksCount);
        return labelIndices(marksCount, Math.min(wanted, room));
    }, [data, empty, marksCount, plotWidth, xAxis, xKey, xLabelWidth, xTicks]);

    // The marks do not depend on the pointer, so moving it never redraws them.
    const marks = useMemo(() => {
        if (empty || bars || plotWidth <= 0 || plotHeight <= 0) return null;
        // A muted series sits under the rest, whatever order it was given in.
        const order = series.map((line, index) => ({ line, index }));
        order.sort((a, b) => Number(b.line.muted ?? false) - Number(a.line.muted ?? false));

        return order.map(({ line, index }) => {
            const column = columns[index] ?? [];
            const color = colorOf(line, index);
            const points: Point[] = Array.from({ length: marksCount }, (_, i) => ({
                x: xOf(i),
                y: yOf(column[i] ?? 0),
            }));
            const solid = cutAt === undefined ? points : points.slice(0, cutAt + 1);
            const dashed = cutAt === undefined ? [] : points.slice(cutAt);
            const dense = marksCount > DENSE;
            const stroke = dense ? 1 : line.muted ? 1.5 : 2;
            // Many readings are drawn straight whatever was asked: see the curve prop.
            const shape = dense ? 'linear' : curve;
            const draw = shape === 'step' ? stepPath : shape === 'linear' ? linePath : curvePath;
            const fillUnder =
                shape === 'step' ? stepAreaPath : shape === 'linear' ? lineAreaPath : areaPath;
            /*
             * A fill reads under one or two series; past that they are lines. Dense, it reads
             * under one alone: a year of daily readings has a weekly rhythm in it, and two
             * sawtooth washes over each other are mud whatever colours they are.
             */
            const filled = kind === 'area' && !line.muted && series.length <= (dense ? 1 : 2);

            return (
                <g data-slot="chart-series" key={line.key}>
                    {filled && (
                        /*
                         * The tint holds all the way down rather than fading out, and stands
                         * on a rounded foot: the fill's own edge is the baseline.
                         */
                        <g
                            style={{
                                clipPath:
                                    'inset(0 round 0 0 var(--radius-item) var(--radius-item))',
                            }}
                        >
                            <defs>
                                <linearGradient
                                    gradientUnits="userSpaceOnUse"
                                    id={`${gradientId}-${index}`}
                                    x1={0}
                                    x2={0}
                                    y1={yOf(extent(column).max)}
                                    y2={baseline}
                                >
                                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.08} />
                                </linearGradient>
                                <pattern
                                    height={7}
                                    id={`${gradientId}-${index}-stripes`}
                                    patternTransform="rotate(45)"
                                    patternUnits="userSpaceOnUse"
                                    width={7}
                                >
                                    <line
                                        stroke={color}
                                        strokeWidth={1.2}
                                        x1={0}
                                        x2={0}
                                        y1={0}
                                        y2={7}
                                    />
                                </pattern>
                                <pattern
                                    height={6}
                                    id={`${gradientId}-${index}-dots`}
                                    patternUnits="userSpaceOnUse"
                                    width={6}
                                >
                                    <circle cx={3} cy={3} fill={color} r={1.1} />
                                </pattern>
                                <linearGradient
                                    id={`${gradientId}-fade`}
                                    x1="0"
                                    x2="0"
                                    y1="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor="white" stopOpacity={0.55} />
                                    <stop offset="100%" stopColor="white" stopOpacity={0.12} />
                                </linearGradient>
                                <mask
                                    id={`${gradientId}-${index}-thin`}
                                    maskContentUnits="objectBoundingBox"
                                >
                                    <rect fill={`url(#${gradientId}-fade)`} height={1} width={1} />
                                </mask>
                            </defs>
                            <path
                                d={fillUnder(points, baseline)}
                                fill={`url(#${gradientId}-${index})`}
                            />
                            {(line.texture ?? texture) !== 'none' &&
                                (['stripes', 'dots'] as const)
                                    .filter(
                                        kindOf =>
                                            !(line.texture ?? texture) ||
                                            (line.texture ?? texture) === kindOf,
                                    )
                                    .map(kindOf => (
                                        <path
                                            d={fillUnder(points, baseline)}
                                            fill={`url(#${gradientId}-${index}-${kindOf})`}
                                            key={kindOf}
                                            mask={`url(#${gradientId}-${index}-thin)`}
                                            // Asked for outright it shows; otherwise the theme says.
                                            style={
                                                (line.texture ?? texture)
                                                    ? undefined
                                                    : {
                                                          opacity: `var(--chart-texture-${kindOf}, 0)`,
                                                      }
                                            }
                                        />
                                    ))}
                        </g>
                    )}
                    {points.length === 1 && points[0] ? (
                        // One reading has no line in it; drawn as a line it would be nothing at all.
                        <circle cx={points[0].x} cy={points[0].y} fill={color} r={3} />
                    ) : (
                        <path
                            d={draw(solid)}
                            fill="none"
                            stroke={color}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={stroke}
                        />
                    )}
                    {showPoints &&
                        !dense &&
                        points.map(point => (
                            // Where a reading was actually taken, for a chart of few enough of them.
                            <circle
                                cx={point.x}
                                cy={point.y}
                                fill="var(--color-chart-background)"
                                key={`${point.x},${point.y}`}
                                r={2.5}
                                stroke={color}
                                strokeWidth={1.5}
                            />
                        ))}
                    {dashed.length > 1 && (
                        // The period is not over, so its last stretch is not a measured value.
                        <path
                            d={draw(dashed)}
                            fill="none"
                            stroke={color}
                            strokeDasharray="6 4"
                            strokeLinecap="round"
                            strokeWidth={stroke}
                        />
                    )}
                </g>
            );
        });
    }, [
        bars,
        baseline,
        columns,
        curve,
        cutAt,
        empty,
        showPoints,
        texture,
        gradientId,
        kind,
        marksCount,
        plotHeight,
        plotWidth,
        series,
        xOf,
        yOf,
    ]);

    const barLayout = useMemo(() => {
        if (!bars || empty || plotWidth <= 0) return [];
        const count = series.length;
        const grouped = !stacked && count > 1;
        const groupWidth = grouped
            ? Math.min(slots.slot * GROUP_SHARE, BAR_MAX * count + BAR_GAP * (count - 1))
            : Math.min(slots.slot * BAR_SHARE, BAR_MAX);
        const barWidth = Math.max(
            BAR_MIN,
            grouped ? (groupWidth - BAR_GAP * (count - 1)) / count : groupWidth,
        );

        return data.flatMap((_, row) => {
            let up = baseline;
            let down = baseline;
            return series.map((line, index) => {
                const value = columns[index]?.[row] ?? 0;
                const positive = value >= 0;
                const size = Math.abs(yOf(value) - baseline);
                const center = xOf(row);
                const x = grouped
                    ? center - groupWidth / 2 + index * (barWidth + BAR_GAP)
                    : center - barWidth / 2;
                const shared = {
                    key: `${row}-${line.key}`,
                    color: colorOf(line, index),
                    tinted: (line.fill ?? fill) === 'tint',
                    texture: line.texture ?? texture,
                    width: barWidth,
                    positive,
                    x,
                };

                if (!stacked)
                    return {
                        ...shared,
                        height: size,
                        head: true,
                        y: positive ? yOf(value) : baseline,
                    };

                // A stacked segment starts where the one under it stopped, two pixels clear of it.
                const from = positive ? up : down;
                const gap = from === baseline ? 0 : BAR_GAP;
                if (positive) up = from - size;
                else down = from + size;
                return {
                    ...shared,
                    height: Math.max(0, size - gap),
                    // Only the stack's head is rounded; where two segments meet it is square.
                    head: index === count - 1,
                    y: positive ? from - size : from + gap,
                };
            });
        });
    }, [
        bars,
        baseline,
        columns,
        data,
        empty,
        fill,
        plotWidth,
        series,
        slots,
        stacked,
        texture,
        xOf,
        yOf,
    ]);

    const context: ChartContextValue = {
        data,
        width,
        height,
        plot: { left, top, width: plotWidth, height: plotHeight },
        xOf,
        yOf,
        activeIndex: active,
    };

    const tooltipRows = (index: number) =>
        series.map((line, i) => ({
            color: (line.muted ? 'neutral' : (line.color ?? seriesColor(i))) as ChartColor,
            name: line.name ?? line.key,
            value: writeValue(columns[i]?.[index] ?? 0),
        }));

    /**
     * A gathered chart says so: the readout names the period it covers and the low to high the
     * average was taken from, which is the only place the band behind the line is explained.
     */
    const periodFooter = (index: number) => {
        const period = periods?.[index];
        if (!period || series.length !== 1) return undefined;
        const low = Math.min(...(readings[0] ?? []).slice(period.from, period.to));
        const high = Math.max(...(readings[0] ?? []).slice(period.from, period.to));
        const days = period.to - period.from;
        return (
            <span className="flex items-center justify-between gap-4">
                <span className="text-neutral-600 text-xs">{days} days, low to high</span>
                <span className="font-medium text-neutral-950 text-xs tabular-nums">
                    {writeValue(low)}–{writeValue(high)}
                </span>
            </span>
        );
    };

    const titleOf = (index: number) => {
        const row = rowAt(index);
        if (!row) return '';
        const value = row[xKey];
        if (formatTitle) return formatTitle(value as X, row, index);
        const period = periods?.[index];
        if (period) {
            const last = data[period.to - 1];
            const from = labelOf(row, index);
            const to = last ? labelOf(last, period.to - 1) : from;
            return from === to ? from : `${from} – ${to}`;
        }
        if (formatX) return formatX(value as X, row, index);
        return formatXValue(value, true);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: a reading is told when the point changes, not on every render
    useEffect(() => {
        if (!onRead) return;
        onRead(
            active === null || !rowAt(active)
                ? null
                : {
                      title: titleOf(active),
                      values: series.map((_, i) => writeValue(columns[i]?.[active] ?? 0)),
                  },
        );
    }, [active, columns]);

    const readoutOf = (index: number) =>
        `${titleOf(index)}: ${series
            .map((line, i) => `${line.name ?? line.key} ${writeValue(columns[i]?.[index] ?? 0)}`)
            .join(', ')}`;

    return (
        <ChartContext.Provider value={context}>
            <figure
                aria-busy={loading || undefined}
                aria-label={label}
                className={cn('relative m-0 w-full', className)}
                data-slot="chart"
                style={{ height, ...style }}
            >
                {/*
                 * The labels, measured in the theme's own font before they are placed: each
                 * box is as wide as its widest line, so the gutter follows the font on its own.
                 */}
                <div
                    aria-hidden
                    className="pointer-events-none invisible absolute top-0 left-0 w-max text-xxs tabular-nums"
                    ref={yProbeRef}
                >
                    {heldLabels.map(text => (
                        <div key={text}>{text}</div>
                    ))}
                </div>
                <div
                    aria-hidden
                    className="pointer-events-none invisible absolute top-0 left-0 w-max text-xxs tabular-nums"
                    ref={xProbeRef}
                >
                    {xLabels.map((text, i) => (
                        <div key={`${i}-${text}`}>{text}</div>
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
                            {/* The marks are drawn for the eye; the table below carries the figures. */}
                            <svg
                                aria-hidden="true"
                                className="block overflow-visible"
                                height={height}
                                width={width}
                            >
                                {/*
                                 * The frame's own rect and corner: the marks and their grid are
                                 * held inside it, so nothing runs past its hairline or its round.
                                 */}
                                <defs>
                                    <clipPath id={`${gradientId}-plot`}>
                                        <rect
                                            height={plotHeight}
                                            style={{
                                                rx: 'var(--radius-item)',
                                                ry: 'var(--radius-item)',
                                            }}
                                            width={plotWidth}
                                            x={left}
                                            y={top}
                                        />
                                    </clipPath>
                                </defs>
                                <g clipPath={`url(#${gradientId}-plot)`}>
                                    {grid &&
                                        !loading &&
                                        ticks.values
                                            .filter(
                                                tick =>
                                                    !(
                                                        kind === 'area' &&
                                                        series.length <= 2 &&
                                                        tick === Math.max(ticks.min, 0)
                                                    ),
                                            )
                                            .map(tick => (
                                                // Half a pixel off the whole one, so a 1px rule lands crisp.
                                                <line
                                                    key={tick}
                                                    shapeRendering="crispEdges"
                                                    stroke="var(--color-chart-grid)"
                                                    x1={left}
                                                    x2={left + plotWidth}
                                                    y1={Math.round(yOf(tick)) + 0.5}
                                                    y2={Math.round(yOf(tick)) + 0.5}
                                                />
                                            ))}
                                </g>

                                {yAxis &&
                                    !empty &&
                                    ticks.values.map((tick, i) => (
                                        <text
                                            className="text-xxs tabular-nums"
                                            dominantBaseline="middle"
                                            fill="var(--color-chart-label)"
                                            key={tick}
                                            textAnchor="end"
                                            x={left - PAD - GUTTER_GAP}
                                            y={yOf(tick)}
                                        >
                                            {yLabels[i]}
                                        </text>
                                    ))}

                                {shown.map(index => (
                                    <text
                                        className="text-xxs tabular-nums"
                                        fill="var(--color-chart-label)"
                                        key={index}
                                        textAnchor={
                                            bars || (index > 0 && index < data.length - 1)
                                                ? 'middle'
                                                : index === 0
                                                  ? 'start'
                                                  : 'end'
                                        }
                                        x={xOf(index)}
                                        y={top + plotHeight + PAD + 16}
                                    >
                                        {xLabels[index]}
                                    </text>
                                ))}

                                {/* A hovered bar is marked by its slot, which is easier to aim at. */}

                                {/*
                                 * The marks wipe in from the left once, in the time a reader
                                 * takes to look at the card: it says which way the x axis runs
                                 * before a label is read. A keyframe, not a state flipped on the
                                 * next frame: a chart in a background tab, a print or a picture
                                 * of the page never gets that frame, and would stay blank.
                                 */}
                                <g clipPath={`url(#${gradientId}-plot)`}>
                                    <g className="motion-safe:animate-reveal">{marks}</g>
                                </g>

                                {!bars && active !== null && (
                                    <g data-slot="chart-crosshair">
                                        {/*
                                         * The rule fades out at both ends: solid from edge to
                                         * edge it reads as heavy as the data it is pointing at.
                                         */}
                                        <defs>
                                            <linearGradient
                                                id={`${gradientId}-crosshair`}
                                                x1="0"
                                                x2="0"
                                                y1="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="var(--color-chart-crosshair)"
                                                    stopOpacity="0"
                                                />
                                                <stop
                                                    offset="14%"
                                                    stopColor="var(--color-chart-crosshair)"
                                                    stopOpacity="1"
                                                />
                                                <stop
                                                    offset="86%"
                                                    stopColor="var(--color-chart-crosshair)"
                                                    stopOpacity="1"
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="var(--color-chart-crosshair)"
                                                    stopOpacity="0"
                                                />
                                            </linearGradient>
                                        </defs>
                                        <rect
                                            fill={`url(#${gradientId}-crosshair)`}
                                            height={plotHeight}
                                            shapeRendering="crispEdges"
                                            width={1}
                                            x={Math.round(xOf(active))}
                                            y={top}
                                        />
                                        {series.map((line, index) => (
                                            <circle
                                                cx={xOf(active)}
                                                cy={yOf(columns[index]?.[active] ?? 0)}
                                                fill={colorOf(line, index)}
                                                key={line.key}
                                                r={DOT_RADIUS}
                                                stroke="var(--color-chart-background)"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </g>
                                )}

                                {markers?.map(marker => {
                                    const at = markOf(marker.index);
                                    const cx = xOf(at);
                                    const foot = top + plotHeight;

                                    return (
                                        <g key={`${marker.index}-${marker.label}`}>
                                            <line
                                                shapeRendering="crispEdges"
                                                stroke="var(--color-neutral-400)"
                                                x1={Math.round(cx) + 0.5}
                                                x2={Math.round(cx) + 0.5}
                                                y1={top + PIN_INSET + PIN}
                                                y2={foot}
                                            />
                                            <path
                                                d={`M${cx - 5},${foot + 1} l5,-6 l5,6 Z`}
                                                fill="var(--color-neutral-950)"
                                            />
                                        </g>
                                    );
                                })}

                                {children}
                            </svg>

                            {bars && (
                                // Held to the frame's rect and corner, as the SVG marks are.
                                <div
                                    className="pointer-events-none absolute overflow-hidden rounded-item"
                                    data-slot="chart-bars"
                                    style={{ height: plotHeight, left, top, width: plotWidth }}
                                >
                                    {active !== null && (
                                        // The hovered slot, on the item corner as a hovered row is.
                                        <div
                                            className="absolute rounded-item"
                                            style={{
                                                background: 'var(--color-chart-band)',
                                                height: plotHeight,
                                                left: slots.slot * active + 2,
                                                top: 0,
                                                width: Math.max(0, slots.slot - 4),
                                            }}
                                        />
                                    )}
                                    {barLayout.map(bar => {
                                        /*
                                         * A bar stands flat on the baseline and is rounded at its
                                         * head, on the item corner: rounded at one end, it never
                                         * turns into a pill.
                                         */
                                        const head = bar.head
                                            ? `min(var(--radius-item), ${bar.width / 2}px)`
                                            : '0px';
                                        const { tinted, texture: grain } = bar;

                                        return (
                                            <div
                                                className="absolute overflow-hidden"
                                                key={bar.key}
                                                style={{
                                                    background: tinted
                                                        ? `color-mix(in oklab, ${bar.color} 20%, transparent)`
                                                        : bar.color,
                                                    borderRadius: bar.positive
                                                        ? `${head} ${head} 0 0`
                                                        : `0 0 ${head} ${head}`,
                                                    // The bar's own line at its data end, as a
                                                    // line stands over the tint under it.
                                                    boxShadow: tinted
                                                        ? `inset 0 ${bar.positive ? 2 : -2}px 0 ${bar.color}`
                                                        : undefined,
                                                    height: bar.height,
                                                    left: bar.x - left,
                                                    top: bar.y - top,
                                                    width: bar.width,
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
                                                                    background: TEXTURES[kindOf](
                                                                        bar.color,
                                                                    ),
                                                                    // Asked for outright it shows; otherwise the theme says.
                                                                    opacity: grain
                                                                        ? 1
                                                                        : `var(--chart-texture-${kindOf}, 0)`,
                                                                }}
                                                            />
                                                        ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {markers?.map(marker => (
                                <ChartMarkerPin
                                    key={`${marker.index}-${marker.label}`}
                                    marker={marker}
                                    // Inside the plot's frame, held off its sides at the first and last point.
                                    x={Math.min(
                                        Math.max(
                                            xOf(markOf(marker.index)),
                                            left + PIN / 2 + PIN_INSET,
                                        ),
                                        left + plotWidth - PIN / 2 - PIN_INSET,
                                    )}
                                    y={top + PIN_INSET + PIN / 2}
                                />
                            ))}

                            {(!empty || loading) && (
                                // The plot's own place in the card: the marks and their grid inside, the labels out.
                                <div
                                    aria-hidden
                                    className={PLOT_FRAME}
                                    data-slot="chart-plot"
                                    style={{
                                        height: plotHeight + PAD * 2,
                                        left: left - PAD,
                                        top: top - PAD,
                                        width: plotWidth + PAD * 2,
                                    }}
                                />
                            )}

                            {loading && (
                                <ChartSkeleton
                                    height={plotHeight}
                                    kind={kind}
                                    left={left}
                                    top={top}
                                    width={plotWidth}
                                />
                            )}

                            {empty && !loading && (
                                <p
                                    className="absolute flex items-center justify-center text-neutral-600 text-xs"
                                    style={{ height: plotHeight, left, top, width: plotWidth }}
                                >
                                    {emptyLabel}
                                </p>
                            )}

                            {readable && active !== null && activeRow && (
                                /*
                                 * The readout sits at the plot's top, on the side of the
                                 * crosshair with more room. It holds that height whatever the
                                 * pointer does: with two series there is no empty half to duck
                                 * into, and a panel that jumps is worse than one that covers a
                                 * little of a line the reader is not looking at.
                                 */
                                <div
                                    className="pointer-events-none absolute z-10"
                                    style={{
                                        left:
                                            xOf(active) > width / 2
                                                ? undefined
                                                : xOf(active) + TOOLTIP_OFFSET,
                                        right:
                                            xOf(active) > width / 2
                                                ? width - (xOf(active) - TOOLTIP_OFFSET)
                                                : undefined,
                                        top,
                                    }}
                                >
                                    {typeof tooltip === 'function' ? (
                                        tooltip(activeRow, active)
                                    ) : (
                                        <ChartTooltip
                                            footer={
                                                stacked && series.length > 1 ? (
                                                    <ChartTooltipTotal
                                                        value={writeValue(sums[active] ?? 0)}
                                                    />
                                                ) : (
                                                    periodFooter(active)
                                                )
                                            }
                                            rows={tooltipRows(active)}
                                            // A bubble only where there is a rule to say it from.
                                            tail={
                                                bars
                                                    ? 'none'
                                                    : xOf(active) > width / 2
                                                      ? 'right'
                                                      : 'left'
                                            }
                                            title={titleOf(active)}
                                        />
                                    )}
                                </div>
                            )}

                            {hoverable && (
                                // One tab stop over the plot: the arrow keys walk the points, and
                                // Enter picks the one being read, as a click on it would.
                                <button
                                    aria-label={`${label}. Read each point with the arrow keys.`}
                                    className={cn(
                                        'absolute rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2',
                                        onSelect ? 'cursor-pointer' : 'cursor-default',
                                    )}
                                    data-slot="chart-hover-layer"
                                    onClick={() => {
                                        const row = active !== null ? data[active] : undefined;
                                        if (row && active !== null) onSelect?.(row, active);
                                    }}
                                    style={{
                                        height: plotHeight,
                                        left,
                                        top,
                                        touchAction: 'pan-y',
                                        width: plotWidth,
                                    }}
                                    type="button"
                                    {...handlers}
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
                            {rawLabels.map((text, index) => (
                                <tr key={`${index}-${text}`}>
                                    <th scope="row">{text}</th>
                                    {series.map((line, i) => (
                                        <td key={line.key}>
                                            {writeValue(readings[i]?.[index] ?? 0)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </figure>
        </ChartContext.Provider>
    );
};

/**
 * The stand-in's heights, as shares of the plot: a week that climbs, peaks late and falls back,
 * as a measure over time tends to, so the shape reads as data waiting rather than a wave.
 */
const SKELETON_LEVELS = [0.5, 0.62, 0.58, 0.82, 0.76, 0.42, 0.5];

/** Where the stand-in's grid sits, as shares of the plot's height: the rules a loaded chart draws. */
const SKELETON_RULES = [0.08, 0.38, 0.68];

/** The edge of the stand-in's curve, a step stronger than its wash, as a line is over its tint. */
const SKELETON_EDGE = 'color-mix(in oklab, var(--color-neutral-950) 14%, transparent)';

/**
 * A chart that is loading, with the depth of a loaded one: its frame and grid stay, and the
 * shape of its kind stands in the skeleton wash with the light crossing it. An area is a curve
 * with a firm edge over a wash that fades towards the baseline, as the real one does; a line is
 * the edge alone; a bar chart its bars. It takes the plot's room, so nothing moves when the data
 * lands.
 */
const ChartSkeleton = ({
    kind,
    left,
    top,
    width,
    height,
}: {
    kind: ChartKind;
    left: number;
    top: number;
    width: number;
    height: number;
}) => {
    if (width <= 0 || height <= 0) return null;
    const step = width / (SKELETON_LEVELS.length - 1);
    const points = SKELETON_LEVELS.map((level, i) => ({ x: i * step, y: height * (1 - level) }));
    // The edge: a 2px ribbon along the curve.
    const edge = `${curvePath(points)} L${width},${(points.at(-1)?.y ?? 0) + 2} ${curvePath(
        points.map(point => ({ ...point, y: point.y + 2 })).reverse(),
    ).replace(/^M/, 'L')} Z`;
    // About one bar per 48px, never fewer than five.
    const bars = Math.max(5, Math.round(width / 48));
    const slot = width / bars;

    return (
        <div
            aria-hidden
            className="absolute"
            data-slot="chart-skeleton"
            style={{ height, left, top, width }}
        >
            {SKELETON_RULES.map(share => (
                <div
                    className="absolute inset-x-0 h-px"
                    key={share}
                    style={{
                        backgroundColor: 'var(--color-chart-grid)',
                        top: Math.round(height * share),
                    }}
                />
            ))}
            {kind === 'bar' ? (
                Array.from({ length: bars }, (_, i) => {
                    const at = Math.round(
                        (i / Math.max(1, bars - 1)) * (SKELETON_LEVELS.length - 1),
                    );
                    return (
                        <div
                            className="skeleton absolute bottom-0 rounded-t-chip"
                            // biome-ignore lint/suspicious/noArrayIndexKey: the bars never reorder
                            key={i}
                            style={{
                                height: height * (SKELETON_LEVELS[at] ?? 0.5),
                                left: i * slot + slot * 0.2,
                                width: slot * 0.6,
                            }}
                        />
                    );
                })
            ) : (
                <>
                    {kind === 'area' && (
                        <div
                            className="skeleton absolute inset-0"
                            style={{
                                clipPath: `path('${areaPath(points, height)}')`,
                                // The wash fades towards the baseline, as an area's tint does.
                                maskImage:
                                    'linear-gradient(to bottom, black 20%, transparent 100%)',
                            }}
                        />
                    )}
                    <div
                        className="skeleton absolute inset-0"
                        style={{ backgroundColor: SKELETON_EDGE, clipPath: `path('${edge}')` }}
                    />
                </>
            )}
        </div>
    );
};

/** The two textures as CSS, for marks drawn in HTML: the same stripes and dots as the SVG fills. */
const TEXTURES = {
    stripes: (color: string) =>
        `repeating-linear-gradient(135deg, color-mix(in oklab, ${color} 50%, transparent) 0 1.2px, transparent 1.2px 6px)`,
    dots: (color: string) =>
        `radial-gradient(color-mix(in oklab, ${color} 55%, transparent) 1.1px, transparent 1.4px) 0 0 / 6px 6px`,
};

const ChartTooltipTotal = ({ value }: { value: string }) => (
    <span className="flex items-center justify-between gap-4">
        <span className="text-neutral-600 text-xs">Total</span>
        <span className="font-medium text-neutral-950 text-xs tabular-nums">{value}</span>
    </span>
);

const toneFill: Record<string, string> = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    neutral: 'bg-neutral-400',
};

/*
 * A marker sits just inside the plot's top edge, within the chart's frame, and it carries its
 * tone: a release and an outage are not the same news.
 */
const toneRing: Record<string, string> = {
    success: 'border-success-500/40',
    warning: 'border-warning-500/40',
    error: 'border-error-500/40',
    neutral: 'border-neutral-300',
};

const toneInk: Record<string, string> = {
    success: 'text-success-700',
    warning: 'text-warning-700',
    error: 'text-error-600',
};

/** What a marker puts on the plot's top edge: a disc round its icon, or a bulb in its tone. */
const ChartMarkerPin = ({ marker, x, y }: { marker: ChartMarker; x: number; y: number }) => (
    <button
        className="group absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2"
        data-slot="chart-marker"
        style={{ left: x, top: y }}
        type="button"
    >
        <span
            className={cn(
                // Big enough to read the icon and to aim at, and lifted off the plot so it is
                // plainly a note about the data and not a part of it.
                'flex size-7 items-center justify-center rounded-full border bg-neutral-50 shadow-float transition-colors duration-150 group-hover:bg-neutral-100 motion-reduce:transition-none [&_svg]:size-4',
                toneRing[marker.tone ?? 'neutral'],
                marker.tone && marker.tone !== 'neutral'
                    ? toneInk[marker.tone]
                    : 'text-neutral-700',
            )}
        >
            {marker.icon ?? (
                <span className={cn('size-2.5 rounded-full', toneFill[marker.tone ?? 'neutral'])} />
            )}
        </span>
        <span className="sr-only">{marker.label}</span>
        <span
            aria-hidden
            className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-item border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 font-medium text-neutral-950 text-xxs opacity-0 shadow-float transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
            {marker.label}
        </span>
    </button>
);
