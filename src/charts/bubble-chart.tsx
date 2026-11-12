'use client';

import { type CSSProperties, type PointerEvent, useId, useState } from 'react';
import { cn } from '../lib/cn';
import type { ChartRow, ChartSeries } from './cartesian';
import { chartColor, seriesColor } from './lib/color';
import { formatCompact, formatNumber } from './lib/format';
import { PLOT_FRAME } from './lib/frame';
import { niceTicks, type Ticks } from './lib/scale';
import { useWidth } from './lib/use-size';
import { ChartTooltip, type ChartTooltipRow } from './tooltip';

export type BubbleChartProps<Row extends ChartRow> = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    /** One row per bubble. */
    data: readonly Row[];
    /** The field naming each bubble: "Northwind". */
    name: string;
    /** The field read across. */
    x: string;
    /** The field read up. */
    y: string;
    /** The field each bubble's area shows. */
    size: string;
    /** The field a bubble's group is read from; its colour follows the group. */
    group?: string;
    /**
     * The groups in their order, with their names and colours: `series-1` to `series-5` by
     * place unless given. Each `key` is a value of the `group` field. The groups found in the
     * data are used, in the order met, when this is left out.
     */
    groups?: readonly ChartSeries[];
    /** What each measure is called in the readout and on its axis: "Seats". */
    xLabel?: string;
    yLabel?: string;
    sizeLabel?: string;
    formatX?: (value: number) => string;
    formatY?: (value: number) => string;
    formatSize?: (value: number) => string;
    /**
     * `log` for a measure that runs over several powers of ten, so the small ones are not
     * all pressed into a corner; each step of the axis is then ten times the one before.
     */
    xScale?: 'linear' | 'log';
    yScale?: 'linear' | 'log';
    /** How many of the largest bubbles have their names written beside them, where they fit. */
    labels?: number;
    /** A key of two or three circles, under the plot, saying what a bubble's size stands for. */
    sizeKey?: boolean;
    height?: number;
    /** `tint`, the kit's look, a tint of each colour with a solid edge; `solid` fills each bubble. */
    fill?: 'tint' | 'solid';
    /** What the chart says when there is nothing to draw. */
    emptyLabel?: string;
    className?: string;
};

/** The room under the plot for the x axis's values, and over it for the y axis's name. */
const BOTTOM = 20;
/** Nothing stands over the plot: the y axis is named in the plot's own corner. */
const TOP = 0;
/** The room between the plot's frame and its rules: none, the frame holds the data tight. */
const PAD = 0;
const EDGE = 1.5;
/** The smallest a bubble is drawn, however small its value, so it can still be pointed at. */
const LEAST = 3;
const LABEL_HEIGHT = 14;
/** The width of one character of an 11px label, near enough to keep two names apart. */
const CHAR = 6.2;

type Scale = Ticks & { log: boolean };

/** The round numbers of a measure read in powers of ten: 1, 2 and 5 of each. */
const ROUND = [1, 2, 5] as const;

/**
 * The domain of a measure read in powers of ten, from the round number under its least to the
 * one over its most, and the rules across it: 1, 2 and 5 of each power while there is room
 * for them, the powers alone when there is not.
 */
const logTicks = (low: number, high: number, most: number): Scale => {
    const rounds = (from: number, to: number) => {
        const out: number[] = [];
        for (
            let power = Math.floor(Math.log10(from)) - 1;
            power <= Math.ceil(Math.log10(to)) + 1;
            power++
        ) {
            for (const step of ROUND) out.push(step * 10 ** power);
        }
        return out;
    };
    const all = rounds(low, high);
    const min = [...all].reverse().find(value => value <= low * 1.0001) ?? low;
    const max = all.find(value => value >= high / 1.0001) ?? high;
    const inside = all.filter(value => value >= min / 1.0001 && value <= max * 1.0001);
    const powers = inside.filter(
        value => Math.abs(Math.log10(value) - Math.round(Math.log10(value))) < 1e-9,
    );
    return {
        values: inside.length <= most ? inside : powers,
        min,
        max: max > min ? max : min * 10,
        log: true,
    };
};

const scaleOf = (values: readonly number[], log: boolean, most: number): Scale => {
    const positive = values.filter(value => value > 0);
    if (log && positive.length) return logTicks(Math.min(...positive), Math.max(...positive), most);
    return { ...niceTicks(0, Math.max(0, ...values), 4), log: false };
};

/** Where a value sits along `length`, the scale's floor at 0. */
const place = (value: number, scale: Scale, length: number) => {
    if (scale.log) {
        const span = Math.log10(scale.max / scale.min) || 1;
        return (Math.log10(Math.max(value, scale.min) / scale.min) / span) * length;
    }
    return scale.max > scale.min ? ((value - scale.min) / (scale.max - scale.min)) * length : 0;
};

type Box = { left: number; top: number; right: number; bottom: number };

const overlaps = (a: Box, b: Box) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/**
 * Things that have three measures, as bubbles: one measure across, one up, and the third in
 * each bubble's area, which grows as the value so a bubble twice the value is twice the ink.
 * A fourth, a group, may colour them.
 *
 * The largest bubbles are drawn first, so a small one is never hidden under a large one, and
 * the few largest have their names written beside them wherever a name fits clear of the
 * others. The largest bubble's radius is taken from the room the plot has, so a phone draws
 * smaller bubbles rather than a heap. Pointing at a bubble reads all of it out while the rest
 * step back.
 */
export const BubbleChart = <Row extends ChartRow>({
    'aria-label': label,
    data,
    name: nameKey,
    x: xKey,
    y: yKey,
    size: sizeKey,
    group: groupKey,
    groups: givenGroups,
    xLabel = xKey,
    yLabel = yKey,
    sizeLabel = sizeKey,
    formatX = formatNumber,
    formatY = formatNumber,
    formatSize = formatNumber,
    xScale = 'linear',
    yScale = 'linear',
    labels = 3,
    sizeKey: showSizeKey = true,
    height = 340,
    fill = 'tint',
    emptyLabel = 'Nothing to show yet',
    className,
}: BubbleChartProps<Row>) => {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const [ref, width] = useWidth<HTMLDivElement>();
    const [active, setActive] = useState<number | null>(null);

    const points = data
        .map((row, index) => ({
            index,
            name: String(row[nameKey] ?? ''),
            x: Number(row[xKey]) || 0,
            y: Number(row[yKey]) || 0,
            size: Math.max(0, Number(row[sizeKey]) || 0),
            group: groupKey ? String(row[groupKey] ?? '') : '',
        }))
        .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));

    const groups: ChartSeries[] = givenGroups
        ? [...givenGroups]
        : [...new Set(points.map(point => point.group))].map(key => ({ key }));
    const colorOf = (group: string) => {
        const index = groups.findIndex(item => item.key === group);
        const item = groups[index];
        return item?.color ?? (groupKey && index >= 0 ? seriesColor(index) : seriesColor(0));
    };
    const groupName = (group: string) => groups.find(item => item.key === group)?.name ?? group;

    const xTick = formatX === formatNumber ? formatCompact : formatX;
    const yTick = formatY === formatNumber ? formatCompact : formatY;
    const plotHeight = Math.max(0, height - BOTTOM - TOP - PAD * 2);
    // Where the plot starts, inside its frame.
    const plotTop = TOP + PAD;
    // A rule every 36px up at the closest, and every 72px across, where the values are wider.
    const ys = scaleOf(
        points.map(point => point.y),
        yScale === 'log',
        Math.max(2, Math.floor(plotHeight / 36)),
    );
    // The y values' gutter, as wide as the widest of them.
    const gutter =
        Math.ceil(Math.max(1, ...ys.values.map(tick => yTick(tick).length)) * CHAR) + 8 + PAD;
    const plotWidth = Math.max(0, width - gutter - PAD);
    const xs = scaleOf(
        points.map(point => point.x),
        xScale === 'log',
        Math.max(2, Math.floor(plotWidth / 72)),
    );
    const biggest = Math.max(0, ...points.map(point => point.size));
    const empty = points.length === 0;

    // The largest bubble takes a share of the plot's shorter side, within reason.
    const most = Math.max(8, Math.min(36, Math.min(plotWidth, plotHeight) * 0.1));
    const radiusOf = (value: number) =>
        biggest > 0 ? Math.max(LEAST, Math.sqrt(value / biggest) * most) : LEAST;
    // The plot keeps the largest bubble's radius clear at its top and right, and a small one's at
    // its foot and left, and the frame's hairline clear of both, so a bubble at either end of a
    // measure stays whole inside the frame rather than being cut by it.
    const low = LEAST + 8;
    const high = most + 8;
    const xOf = (value: number) =>
        gutter + low + place(value, xs, Math.max(0, plotWidth - low - high));
    const yOf = (value: number) =>
        plotTop + plotHeight - low - place(value, ys, Math.max(0, plotHeight - low - high));

    const drawn = points
        .map(point => ({ ...point, cx: xOf(point.x), cy: yOf(point.y), r: radiusOf(point.size) }))
        // The largest first, so the small ones lie on top and stay in reach.
        .sort((a, b) => b.r - a.r);

    // Names beside the few largest, on whichever side has room clear of the names already placed.
    const named: { index: number; x: number; y: number; anchor: 'start' | 'end' | 'middle' }[] = [];
    const taken: Box[] = [];
    for (const point of drawn.slice(0, Math.max(0, labels))) {
        const w = point.name.length * CHAR;
        const h = LABEL_HEIGHT;
        // Beside it first, then over and under it, then off its four shoulders.
        const side = point.r + 4;
        const shoulder = point.r * 0.72 + 3;
        const tries = [
            { x: point.cx + side, y: point.cy, anchor: 'start' as const, left: point.cx + side },
            { x: point.cx - side, y: point.cy, anchor: 'end' as const, left: point.cx - side - w },
            {
                x: point.cx,
                y: point.cy - point.r - 9,
                anchor: 'middle' as const,
                left: point.cx - w / 2,
            },
            {
                x: point.cx,
                y: point.cy + point.r + 9,
                anchor: 'middle' as const,
                left: point.cx - w / 2,
            },
            ...[-1, 1].flatMap(up => [
                {
                    x: point.cx + shoulder,
                    y: point.cy + up * (shoulder + 5),
                    anchor: 'start' as const,
                    left: point.cx + shoulder,
                },
                {
                    x: point.cx - shoulder,
                    y: point.cy + up * (shoulder + 5),
                    anchor: 'end' as const,
                    left: point.cx - shoulder - w,
                },
            ]),
        ];
        for (const attempt of tries) {
            const box = {
                left: attempt.left,
                top: attempt.y - h / 2,
                right: attempt.left + w,
                bottom: attempt.y + h / 2,
            };
            const inside =
                // A name stays inside the frame, clear of its line.
                box.left >= gutter - PAD + 4 &&
                box.right <= gutter + plotWidth + PAD - 4 &&
                box.top >= TOP + 4 &&
                box.bottom <= plotTop + plotHeight + PAD - 4;
            // Clear of the other bubbles too, but for a sliver of their edge.
            const onBubble = drawn.some(
                other =>
                    other !== point &&
                    Math.hypot(
                        other.cx - Math.max(box.left, Math.min(other.cx, box.right)),
                        other.cy - Math.max(box.top, Math.min(other.cy, box.bottom)),
                    ) <
                        other.r - 1,
            );
            if (inside && !onBubble && !taken.some(other => overlaps(box, other))) {
                taken.push(box);
                named.push({
                    index: point.index,
                    x: attempt.x,
                    y: attempt.y,
                    anchor: attempt.anchor,
                });
                break;
            }
        }
    }

    // The bubble under the pointer: the smallest one it is inside, else the nearest within reach.
    const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
        const box = event.currentTarget.getBoundingClientRect();
        const px = event.clientX - box.left;
        const py = event.clientY - box.top;
        let found: number | null = null;
        let best = Number.POSITIVE_INFINITY;
        for (const point of drawn) {
            const distance = Math.hypot(point.cx - px, point.cy - py);
            const reach = point.r + 6;
            // Inside a bubble, a smaller one wins; outside every bubble, the nearest edge does.
            const score = distance <= point.r ? point.r - 1000 : distance - point.r;
            if (distance <= reach && score < best) {
                best = score;
                found = point.index;
            }
        }
        setActive(found);
    };

    const shown = active !== null ? drawn.find(point => point.index === active) : undefined;
    const right = shown ? shown.cx < gutter + plotWidth / 2 : true;

    // The key's circles: the round number under the largest value, then a tenth and a hundredth
    // of it, for as long as the circle is still larger than the least a bubble is drawn.
    const top = biggest > 0 ? 10 ** Math.floor(Math.log10(biggest)) : 0;
    const keyTop =
        top > 0 ? ([5, 2, 1].map(step => step * top).find(value => value <= biggest) ?? top) : 0;
    const keyValues = [keyTop / 100, keyTop / 10, keyTop].filter(
        value => value > 0 && radiusOf(value) > LEAST + 1,
    );

    // The size key stands inside the plot, in the first corner no bubble reaches; a plot with
    // none free has it underneath instead.
    const keyRadii = keyValues
        .slice(-2)
        .map(value => ({ r: radiusOf(value), text: formatSize(value) }));
    const keyBox = sizeKeyBox(keyRadii);
    const withKey = showSizeKey && !empty && keyRadii.length > 0 && width > 0;
    const keyRight = gutter + plotWidth - 12 - keyBox.width;
    const keyFoot = plotTop + plotHeight - 12 - keyBox.height;
    const keyAt = [
        { x: keyRight, y: keyFoot },
        { x: gutter + 12, y: plotTop + 12 },
        { x: gutter + 12, y: keyFoot },
        { x: keyRight, y: plotTop + 12 },
    ].find(
        corner =>
            keyBox.width < plotWidth / 2 &&
            keyBox.height < plotHeight / 2 &&
            drawn.every(point => {
                const dx =
                    point.cx - Math.max(corner.x, Math.min(point.cx, corner.x + keyBox.width));
                const dy =
                    point.cy - Math.max(corner.y, Math.min(point.cy, corner.y + keyBox.height));
                return Math.hypot(dx, dy) > point.r + 8;
            }),
    );

    const rows = (point: (typeof drawn)[number]): ChartTooltipRow[] => [
        ...(groupKey
            ? [{ name: groupName(point.group), value: '', color: colorOf(point.group) }]
            : []),
        { name: xLabel, value: formatX(point.x) },
        { name: yLabel, value: formatY(point.y) },
        { name: sizeLabel, value: formatSize(point.size) },
    ];

    return (
        <figure
            aria-label={label}
            className={cn('relative m-0 min-w-0', className)}
            data-slot="bubble-chart"
        >
            <div className="relative" ref={ref} style={{ height }}>
                {width > 0 && empty && (
                    <p className="absolute inset-0 flex items-center justify-center rounded-item border border-neutral-200 border-dashed text-neutral-600 text-xs">
                        {emptyLabel}
                    </p>
                )}
                {width > 0 && !empty && (
                    // The plot's own place in the card: the bubbles and rules inside, the labels out.
                    <div
                        aria-hidden
                        className={PLOT_FRAME}
                        data-slot="bubble-chart-plot"
                        style={{
                            height: plotHeight + PAD * 2,
                            left: gutter - PAD,
                            top: TOP,
                            width: plotWidth + PAD * 2,
                        }}
                    />
                )}
                {width > 0 && !empty && (
                    <svg
                        aria-hidden="true"
                        className="block overflow-visible"
                        height={height}
                        onPointerLeave={() => setActive(null)}
                        onPointerMove={onPointerMove}
                        width={width}
                    >
                        {/* The y axis's name in the plot's top corner, the x axis's at the end of its own. */}
                        <text
                            className="text-xxs"
                            dominantBaseline="middle"
                            fill="var(--color-chart-label)"
                            x={gutter + 10}
                            y={plotTop + 14}
                        >
                            {yLabel}
                        </text>

                        {ys.values.map(tick => (
                            <text
                                className="text-xxs tabular-nums"
                                dominantBaseline="middle"
                                fill="var(--color-chart-label)"
                                key={`y-${tick}`}
                                textAnchor="end"
                                x={gutter - PAD - 8}
                                y={yOf(tick)}
                            >
                                {yTick(tick)}
                            </text>
                        ))}
                        {xs.values.map((tick, i) => {
                            const last = i === xs.values.length - 1;
                            return (
                                <text
                                    className="text-xxs tabular-nums"
                                    fill="var(--color-chart-label)"
                                    key={`x-${tick}`}
                                    textAnchor={last ? 'end' : i === 0 ? 'start' : 'middle'}
                                    x={xOf(tick)}
                                    y={plotTop + plotHeight + PAD + 16}
                                >
                                    {last ? `${xTick(tick)} ${xLabel.toLowerCase()}` : xTick(tick)}
                                </text>
                            );
                        })}

                        {/*
                         * The frame's own rect and corner: the rules, the bubbles and their
                         * names are held inside it, so nothing runs past its hairline.
                         */}
                        <defs>
                            <clipPath id={`${id}-plot`}>
                                <rect
                                    height={plotHeight + PAD * 2}
                                    style={{ rx: 'var(--radius-item)', ry: 'var(--radius-item)' }}
                                    width={plotWidth + PAD * 2}
                                    x={gutter - PAD}
                                    y={TOP}
                                />
                            </clipPath>
                        </defs>
                        <g clipPath={`url(#${id}-plot)`}>
                            {ys.values
                                // A rule on the frame's own edge would only thicken it.
                                .filter(
                                    tick =>
                                        Math.abs(yOf(tick) - plotTop) > 4 &&
                                        Math.abs(yOf(tick) - plotTop - plotHeight) > 4,
                                )
                                .map(tick => (
                                    <line
                                        key={`y-${tick}`}
                                        stroke="var(--color-chart-grid)"
                                        x1={gutter}
                                        x2={gutter + plotWidth}
                                        y1={yOf(tick)}
                                        y2={yOf(tick)}
                                    />
                                ))}
                            {xs.values
                                .filter(
                                    tick =>
                                        Math.abs(xOf(tick) - gutter) > 4 &&
                                        Math.abs(xOf(tick) - gutter - plotWidth) > 4,
                                )
                                .map(tick => (
                                    <line
                                        key={`x-${tick}`}
                                        stroke="var(--color-chart-grid)"
                                        x1={xOf(tick)}
                                        x2={xOf(tick)}
                                        y1={plotTop}
                                        y2={plotTop + plotHeight}
                                    />
                                ))}

                            {shown && (
                                // Two quiet rules from the bubble back to its axes, to read it off them.
                                <g stroke="var(--color-neutral-400)" strokeDasharray="2 3">
                                    <line
                                        x1={gutter}
                                        x2={shown.cx - shown.r}
                                        y1={shown.cy}
                                        y2={shown.cy}
                                    />
                                    <line
                                        x1={shown.cx}
                                        x2={shown.cx}
                                        y1={shown.cy + shown.r}
                                        y2={plotTop + plotHeight}
                                    />
                                </g>
                            )}

                            {drawn.map(point => {
                                const color = chartColor(colorOf(point.group));
                                return (
                                    <circle
                                        className="transition-opacity duration-150 motion-reduce:transition-none"
                                        cx={point.cx}
                                        cy={point.cy}
                                        fill={
                                            fill === 'solid'
                                                ? color
                                                : `color-mix(in oklab, ${color} 20%, var(--color-chart-background))`
                                        }
                                        key={point.index}
                                        opacity={
                                            active === null || active === point.index ? 1 : 0.35
                                        }
                                        r={Math.max(0.5, point.r - EDGE / 2)}
                                        stroke={
                                            fill === 'solid'
                                                ? 'var(--color-chart-background)'
                                                : color
                                        }
                                        strokeWidth={fill === 'solid' ? 1 : EDGE}
                                    />
                                );
                            })}
                            {shown && (
                                // The one pointed at, again on top, so a bubble over it cannot hide it.
                                <circle
                                    cx={shown.cx}
                                    cy={shown.cy}
                                    fill={
                                        fill === 'solid'
                                            ? chartColor(colorOf(shown.group))
                                            : `color-mix(in oklab, ${chartColor(colorOf(shown.group))} 20%, var(--color-chart-background))`
                                    }
                                    r={Math.max(0.5, shown.r - EDGE / 2)}
                                    stroke={chartColor(colorOf(shown.group))}
                                    strokeWidth={2}
                                />
                            )}

                            {named.map(item => (
                                <text
                                    className="text-xxs transition-opacity duration-150 motion-reduce:transition-none"
                                    dominantBaseline="middle"
                                    fill="var(--color-neutral-600)"
                                    key={item.index}
                                    opacity={active === null || active === item.index ? 1 : 0.35}
                                    textAnchor={item.anchor}
                                    x={item.x}
                                    y={item.y}
                                >
                                    {drawn.find(point => point.index === item.index)?.name}
                                </text>
                            ))}
                        </g>
                    </svg>
                )}

                {withKey && keyAt && (
                    <SizeKey
                        label={sizeLabel}
                        radii={keyRadii}
                        style={{ left: keyAt.x, position: 'absolute', top: keyAt.y }}
                    />
                )}

                {shown && (
                    <div
                        className="pointer-events-none absolute z-10"
                        style={{
                            left: right ? shown.cx + shown.r + 10 : undefined,
                            right: right ? undefined : width - shown.cx + shown.r + 10,
                            top: Math.max(0, Math.min(height - 132, shown.cy - 40)),
                        }}
                    >
                        <ChartTooltip rows={rows(shown)} title={shown.name} />
                    </div>
                )}
            </div>

            {withKey && !keyAt && <SizeKey label={sizeLabel} radii={keyRadii} />}

            <div className="sr-only">
                <table>
                    <caption>{label}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{nameKey}</th>
                            {groupKey && <th scope="col">{groupKey}</th>}
                            <th scope="col">{xLabel}</th>
                            <th scope="col">{yLabel}</th>
                            <th scope="col">{sizeLabel}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {points.map(point => (
                            <tr key={point.index}>
                                <th scope="row">{point.name}</th>
                                {groupKey && <td>{groupName(point.group)}</td>}
                                <td>{formatX(point.x)}</td>
                                <td>{formatY(point.y)}</td>
                                <td>{formatSize(point.size)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};

const KEY_LABEL = 16;
const KEY_TEXT = 56;

/** The room the size key takes: its title, the circles on one foot, and their values beside. */
const sizeKeyBox = (radii: { r: number }[]) => {
    const largest = Math.max(0, ...radii.map(item => item.r));
    return { width: largest * 2 + 12 + KEY_TEXT, height: KEY_LABEL + largest * 2 + 2 };
};

/**
 * What a bubble's size reads as: the reference circles nested on one foot, as bubbles of
 * those sizes would sit, each with a short leader from its top to its value, under the name
 * of what the size measures. A note on the plot, so it stands in it.
 */
const SizeKey = ({
    label,
    radii,
    style,
}: {
    label: string;
    radii: { r: number; text: string }[];
    style?: CSSProperties;
}) => {
    const largest = Math.max(...radii.map(item => item.r));
    const box = sizeKeyBox(radii);
    const foot = box.height - KEY_LABEL - 1;
    const labelAt = largest * 2 + 12;
    return (
        <div
            className={cn(
                'pointer-events-none flex flex-col text-neutral-600 text-xxs',
                !style && 'mt-3 items-end',
            )}
            data-slot="bubble-chart-size-key"
            style={style}
        >
            <span className="h-4 leading-4">{label}</span>
            <svg
                aria-hidden="true"
                className="overflow-visible"
                height={box.height - KEY_LABEL}
                width={box.width}
            >
                {radii.map(item => {
                    const top = foot - item.r * 2;
                    return (
                        <g key={item.text}>
                            <circle
                                cx={largest + 0.5}
                                cy={foot - item.r}
                                fill="none"
                                r={Math.max(0.5, item.r - 0.5)}
                                stroke="var(--color-neutral-400)"
                            />
                            <line
                                stroke="var(--color-neutral-400)"
                                strokeDasharray="2 2"
                                x1={largest + 0.5}
                                x2={labelAt - 4}
                                y1={top + 0.5}
                                y2={top + 0.5}
                            />
                            <text
                                className="text-xxs tabular-nums"
                                dominantBaseline="middle"
                                fill="var(--color-chart-label)"
                                x={labelAt}
                                y={top + 1}
                            >
                                {item.text}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
