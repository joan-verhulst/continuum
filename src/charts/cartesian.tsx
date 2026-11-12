'use client';

import {
    type CSSProperties,
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Skeleton } from '../components/skeleton';
import { cn } from '../lib/cn';
import { type ChartColor, chartColor, seriesColor } from './lib/color';
import { formatCompact, formatNumber, formatX as formatXValue } from './lib/format';
import {
    areaPath,
    bandPath,
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
};

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
const AXIS_HEIGHT = 24;
const TOP = 8;
const TOP_WITH_MARKERS = 36;
const X_LABEL_GAP = 16;
const DOT_RADIUS = 4;
const BAR_GAP = 2;
const BAR_MAX = 28;
const BAR_MIN = 2;
/** A bar takes half its slot, and a group of bars seven tenths of it. */
const BAR_SHARE = 0.6;
/** A column on its own is a block the width of an icon well, not a stick. */
const COLUMN_MAX = 40;
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

/*
 * One series is drawn in ink. Everything else in the system that shows an amount, a bar
 * list's bar or a meter's fill, is neutral, and colour is kept for telling things apart; a
 * chart of one measure has nothing to tell apart. Two series and more take the theme's own.
 */
const INK = 'var(--color-neutral-950)';

const colorOf = (line: ChartSeries, index: number, count: number) => {
    if (line.muted) return chartColor('neutral');
    if (line.color) return chartColor(line.color);
    return count === 1 ? INK : seriesColor(index);
};

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
    data,
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
    incompleteFrom,
    tooltip = true,
    grid = true,
    xAxis = true,
    yAxis = true,
    onSelect,
    loading = false,
    emptyLabel = 'No data yet',
    className,
    style,
    children,
}: CartesianProps<Row, X>) => {
    const [containerRef, width] = useWidth<HTMLDivElement>();
    const [yProbeRef, yLabelWidth] = useLabelWidth();
    const [xProbeRef, xLabelWidth] = useLabelWidth();

    const empty = data.length === 0;
    const hasMarkers = !!markers?.length;
    const writeAxis = formatY ?? formatCompact;
    const writeValue = formatValue ?? formatY ?? formatNumber;
    const bars = kind === 'bar';

    // The plot is what the labels leave. It is known before the marks, because how many marks
    // there is room for decides how the readings are gathered.
    const left = yAxis && !empty ? yLabelWidth + GUTTER_GAP : 0;
    const top = hasMarkers ? TOP_WITH_MARKERS : TOP;
    const bottom = xAxis ? AXIS_HEIGHT : 0;
    const plotWidth = Math.max(0, width - left);
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
    const spread = useMemo(
        () =>
            periods
                ? readings.map(values =>
                      periods.map(({ from, to }) => {
                          const slice = values.slice(from, to);
                          return { low: Math.min(...slice), high: Math.max(...slice) };
                      }),
                  )
                : null,
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
        [plotHeight, ticks, top],
    );
    const baseline = yOf(Math.max(ticks.min, 0));
    // The column a reading is hovered by: a bar's slot less a little air, or the run between
    // two points of a line, held between a width worth aiming at and one that stays a column.
    const barsWide =
        !stacked && series.length > 1
            ? Math.min(
                  slots.slot * GROUP_SHARE,
                  BAR_MAX * series.length + BAR_GAP * (series.length - 1),
              )
            : Math.min(slots.slot * BAR_SHARE, COLUMN_MAX);
    const columnWidth = bars
        ? Math.min(Math.max(8, slots.slot - 4), barsWide + 16)
        : Math.max(20, Math.min(40, marksCount > 1 ? plotWidth / (marksCount - 1) : 40));
    // The readout stands clear of the column it reads, never over it.
    const readoutGap = columnWidth / 2 + 8;

    const { active, handlers } = useActive(marksCount, xOf);

    /*
     * The marks wipe in from the left once, in the time a reader takes to look at the card.
     * It says which way the x axis runs before a single label is read. It happens on the
     * compositor (a clip, not a layout), and reduced motion gets the finished chart.
     */
    const [revealed, setRevealed] = useState(false);
    useEffect(() => {
        if (width === 0) return;
        const frame = requestAnimationFrame(() => setRevealed(true));
        return () => cancelAnimationFrame(frame);
    }, [width]);
    const readable = tooltip !== false && !empty;
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
            const color = colorOf(line, index, series.length);
            const points: Point[] = Array.from({ length: marksCount }, (_, i) => ({
                x: xOf(i),
                y: yOf(column[i] ?? 0),
            }));
            // Two spreads over each other are the mud the gathering was meant to clear up.
            const band = line.muted || series.length > 1 ? undefined : spread?.[index];
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
                    {band && (
                        // What each average was taken from: the period's low to its high.
                        <path
                            d={bandPath(
                                band.map((at, i) => ({ x: xOf(i), y: yOf(at.high) })),
                                band.map((at, i) => ({ x: xOf(i), y: yOf(at.low) })),
                            )}
                            fill={color}
                            fillOpacity={0.16}
                        />
                    )}
                    {filled && (
                        // A flat wash, as every fill in the system is; nothing here fades.
                        <path
                            d={fillUnder(points, baseline)}
                            fill={color}
                            fillOpacity={series.length === 1 ? 0.06 : 0.1}
                        />
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
        kind,
        marksCount,
        plotHeight,
        plotWidth,
        series,
        spread,
        xOf,
        yOf,
    ]);

    const barLayout = useMemo(() => {
        if (!bars || empty || plotWidth <= 0) return [];
        const count = series.length;
        const grouped = !stacked && count > 1;
        const groupWidth = grouped
            ? Math.min(slots.slot * GROUP_SHARE, BAR_MAX * count + BAR_GAP * (count - 1))
            : Math.min(slots.slot * BAR_SHARE, COLUMN_MAX);
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
                    row,
                    key: `${row}-${line.key}`,
                    color: colorOf(line, index, count),
                    width: barWidth,
                    positive,
                    x,
                };

                if (!stacked)
                    return {
                        ...shared,
                        height: size,
                        first: true,
                        rounded: true,
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
                    first: gap === 0,
                    // Only the segment on top of the stack is rounded.
                    rounded: index === count - 1,
                    y: positive ? from - size : from + gap,
                };
            });
        });
    }, [bars, baseline, columns, data, empty, plotWidth, series, slots, stacked, xOf, yOf]);

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
            color: colorOf(line, i, series.length) as ChartColor,
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
                    {yLabels.map(text => (
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
                            {active !== null && !empty && !bars && (
                                /*
                                 * What is being read is marked the way a hovered row is: the 5%
                                 * wash, on item corners, over the reading's own column. No rule
                                 * is drawn through the data to point at it.
                                 */
                                <div
                                    className="pointer-events-none absolute rounded-item bg-neutral-950/5"
                                    data-slot="chart-active"
                                    style={{
                                        height: plotHeight,
                                        left: xOf(active) - columnWidth / 2,
                                        top,
                                        width: columnWidth,
                                    }}
                                />
                            )}
                            {/* The marks are drawn for the eye; the table below carries the figures. */}
                            <svg
                                aria-hidden="true"
                                className="relative block overflow-visible"
                                height={height}
                                width={width}
                            >
                                {grid &&
                                    !empty &&
                                    ticks.values.map(tick => (
                                        // Half a pixel off the whole one, so a 1px rule lands crisp.
                                        <line
                                            key={tick}
                                            shapeRendering="crispEdges"
                                            // The baseline is the hairline every divider in the
                                            // system is; the rules above it are only a wash.
                                            stroke={
                                                tick === Math.max(ticks.min, 0)
                                                    ? 'var(--color-chart-grid)'
                                                    : 'color-mix(in oklab, var(--color-neutral-950) 7%, transparent)'
                                            }
                                            x1={left}
                                            x2={width}
                                            y1={Math.round(yOf(tick)) + 0.5}
                                            y2={Math.round(yOf(tick)) + 0.5}
                                        />
                                    ))}

                                {yAxis &&
                                    !empty &&
                                    ticks.values.map((tick, i) => (
                                        <text
                                            className="text-xxs tabular-nums"
                                            dominantBaseline="middle"
                                            fill="var(--color-chart-label)"
                                            key={tick}
                                            textAnchor="end"
                                            x={left - GUTTER_GAP}
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
                                        y={top + plotHeight + AXIS_HEIGHT - GUTTER_GAP}
                                    >
                                        {xLabels[index]}
                                    </text>
                                ))}

                                <g
                                    className="transition-[clip-path] duration-700 ease-out-strong motion-reduce:transition-none"
                                    opacity={loading ? 0.5 : 1}
                                    style={{
                                        clipPath: revealed ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                                    }}
                                >
                                    {marks}
                                </g>

                                {!bars && active !== null && (
                                    <g data-slot="chart-crosshair">
                                        {series.map((line, index) => (
                                            <circle
                                                cx={xOf(active)}
                                                cy={yOf(columns[index]?.[active] ?? 0)}
                                                fill={colorOf(line, index, series.length)}
                                                key={line.key}
                                                r={DOT_RADIUS}
                                                stroke="var(--color-chart-background)"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </g>
                                )}

                                {markers?.map(marker => (
                                    <line
                                        key={`${marker.index}-${marker.label}`}
                                        shapeRendering="crispEdges"
                                        stroke="var(--color-neutral-400)"
                                        x1={Math.round(xOf(markOf(marker.index))) + 0.5}
                                        x2={Math.round(xOf(markOf(marker.index))) + 0.5}
                                        y1={top - 6}
                                        y2={top + plotHeight}
                                    />
                                ))}

                                {children}
                            </svg>

                            {bars && (
                                <div
                                    className={cn(
                                        'pointer-events-none absolute inset-0',
                                        loading && 'opacity-50',
                                    )}
                                    data-slot="chart-bars"
                                >
                                    {barLayout
                                        .filter(bar => bar.first)
                                        .map(bar => (
                                            // The column's track: the amount is read against it,
                                            // and it darkens under the pointer as a row does.
                                            <div
                                                className={cn(
                                                    'absolute transition-colors duration-150 motion-reduce:transition-none',
                                                    bar.row === active
                                                        ? 'bg-neutral-950/8'
                                                        : 'bg-neutral-950/4',
                                                )}
                                                key={`track-${bar.key}`}
                                                style={{
                                                    borderRadius: `min(var(--radius-item), ${bar.width / 2}px)`,
                                                    height: plotHeight,
                                                    left: bar.x,
                                                    top,
                                                    width: bar.width,
                                                }}
                                            />
                                        ))}
                                    {barLayout.map(bar => {
                                        const corner = `min(var(--radius-item), ${bar.width / 2}px)`;
                                        const head = bar.rounded ? corner : '0px';
                                        const foot = bar.first ? corner : '0px';

                                        return (
                                            <div
                                                className="absolute"
                                                key={bar.key}
                                                style={{
                                                    background: bar.color,
                                                    // A block on the system's own corner, whole
                                                    // where it stands alone and squared only
                                                    // where it meets the next segment of a stack.
                                                    borderRadius: bar.positive
                                                        ? `${head} ${head} ${foot} ${foot}`
                                                        : `${foot} ${foot} ${head} ${head}`,
                                                    height: bar.height,
                                                    left: bar.x,
                                                    top: bar.y,
                                                    width: bar.width,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {markers?.map(marker => (
                                <ChartMarkerPin
                                    key={`${marker.index}-${marker.label}`}
                                    marker={marker}
                                    x={xOf(markOf(marker.index))}
                                    y={top / 2}
                                />
                            ))}

                            {loading && empty && (
                                <Skeleton
                                    className="absolute"
                                    style={{ height: plotHeight, left, top, width: plotWidth }}
                                />
                            )}

                            {empty && !loading && (
                                <p
                                    className="absolute flex items-center justify-center rounded-item border border-neutral-200 border-dashed text-neutral-600 text-xs"
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
                                                : xOf(active) + readoutGap,
                                        right:
                                            xOf(active) > width / 2
                                                ? width - (xOf(active) - readoutGap)
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
                                            title={titleOf(active)}
                                        />
                                    )}
                                </div>
                            )}

                            {readable && (
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
                <table className="sr-only">
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
                                    <td key={line.key}>{writeValue(readings[i]?.[index] ?? 0)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </figure>
        </ChartContext.Provider>
    );
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
 * A marker sits in the band above the plot rather than across its top rule, so it reads as a
 * note in the margin and not as a stray mark on the data. It is the system's icon tile at a
 * marker's size: chip corners, a hairline well, or the tone at 20% behind its own glyph as an
 * alert's well is. Its label is the tooltip's chip.
 */
const toneWell: Record<string, string> = {
    success: 'bg-success-500/20',
    warning: 'bg-warning-500/20',
    error: 'bg-error-500/20',
    neutral: 'border border-neutral-200 bg-neutral-50 group-hover:bg-neutral-100',
};

const toneInk: Record<string, string> = {
    success: 'text-success-700',
    warning: 'text-warning-700',
    error: 'text-error-600',
};

/** What a marker puts on the plot's top edge: a disc round its icon, or a bulb in its tone. */
const ChartMarkerPin = ({ marker, x, y }: { marker: ChartMarker; x: number; y: number }) => (
    <button
        className="group absolute flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-chip outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-2"
        data-slot="chart-marker"
        style={{ left: x, top: y }}
        type="button"
    >
        <span
            className={cn(
                'flex size-6 items-center justify-center rounded-chip transition-colors duration-150 motion-reduce:transition-none [&_svg]:size-3.5',
                toneWell[marker.tone ?? 'neutral'],
                marker.tone && marker.tone !== 'neutral'
                    ? toneInk[marker.tone]
                    : 'text-neutral-700',
            )}
        >
            {marker.icon ?? (
                <span className={cn('size-2 rounded-full', toneFill[marker.tone ?? 'neutral'])} />
            )}
        </span>
        <span className="sr-only">{marker.label}</span>
        <span
            aria-hidden
            className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-chip bg-neutral-950 px-2 py-1 font-medium text-neutral-50 text-xxs opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
            {marker.label}
        </span>
    </button>
);
