'use client';

import { type PointerEvent, useId, useState } from 'react';
import { cn } from '../lib/cn';
import type { ChartRow, ChartSeries } from './cartesian';
import { chartColor, seriesColor } from './lib/color';
import { formatCompact, formatNumber } from './lib/format';
import { extent, niceTicks } from './lib/scale';
import { useWidth } from './lib/use-size';
import { ChartTooltip } from './tooltip';

export type RadarChartProps<Row extends ChartRow> = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    /** One row per spoke. */
    data: readonly Row[];
    /** The field naming each spoke: "Jan", "Speed". */
    x: string;
    series: readonly ChartSeries[];
    height?: number;
    formatValue?: (value: number) => string;
    /**
     * How a second series is told from the first where their shapes overlap: stripes unless
     * given. `none` draws every series as a plain tint.
     */
    texture?: 'stripes' | 'dots' | 'none';
    /** While the data loads: the chart's own shape stands in, in the skeleton wash, at the size it will have. */
    loading?: boolean;
    className?: string;
};

/**
 * The circle fills its frame: only the hairline, and half a shape's line, lie between the
 * outer ring and the frame's edge.
 */
const PAD = 2;
/** The room between the frame and a spoke's name outside it. */
const LABEL_GAP = 8;
/** A name's line, above or under the frame. */
const LABEL_LINE = 12;
/** What a name beside the frame is allowed, at most, before the frame gives way to it. */
const LABEL_SIDE = 48;

/** A shape's outline through its points, closed. */
const polygon = (points: { x: number; y: number }[]) =>
    `${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} Z`;

/**
 * Where a spoke's name stands: round the circle, a little way past its edge, set from the
 * side it is on so it never runs back over the shape.
 */
const outsideFrame = (cx: number, cy: number, half: number, dx: number, dy: number) => ({
    anchor:
        Math.abs(dx) < 0.25 ? ('middle' as const) : dx > 0 ? ('start' as const) : ('end' as const),
    x: cx + dx * (half + LABEL_GAP),
    y: cy + dy * (half + LABEL_GAP + (Math.abs(dx) < 0.25 ? LABEL_LINE / 2 - 2 : 0)),
});

/**
 * Several measures of one thing, each on its own spoke, as a shape: where a shape bulges
 * is what it is strong in. Each series is the kit's line over a tint; a second series takes
 * a texture, so two shapes over each other stay two. The rings are labelled once, on their
 * quietest side, and pointing at a spoke reads every series out along it.
 */
export const RadarChart = <Row extends ChartRow>({
    'aria-label': label,
    data: rows,
    x: xKey,
    series,
    height = 300,
    formatValue = formatNumber,
    texture = 'stripes',
    loading = false,
    className,
}: RadarChartProps<Row>) => {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const [ref, width] = useWidth<HTMLDivElement>();
    const [active, setActive] = useState<number | null>(null);

    // While it loads the chart draws its stand-in, and nothing of the old answer.
    const data: readonly Row[] = loading ? [] : rows;
    const count = data.length;
    const values = series.map(line => data.map(row => Number(row[line.key]) || 0));
    const ticks = niceTicks(0, extent(values.flat()).max, 3);
    const cx = width / 2;
    const cy = height / 2;
    // The plot is a square frame round the circle; the names stand outside it.
    const half = Math.max(
        0,
        Math.min(width / 2 - LABEL_SIDE, height / 2 - LABEL_GAP - LABEL_LINE) - 1,
    );
    const radius = Math.max(0, half - PAD);
    const angle = (i: number) => -Math.PI / 2 + (i / Math.max(1, count)) * Math.PI * 2;
    const at = (i: number, value: number) => {
        const r = ticks.max > 0 ? (value / ticks.max) * radius : 0;
        return { x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) };
    };
    // The side of the rings whose two spokes reach least far, in any series.
    let quiet = 0;
    let quietest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < count; i++) {
        const loud = Math.max(
            ...values.map(column => Math.max(column[i] ?? 0, column[(i - 1 + count) % count] ?? 0)),
        );
        if (loud < quietest - 1e-9) {
            quietest = loud;
            quiet = i;
        }
    }
    // The spoke nearest the pointer, by its angle round the middle.
    const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
        const box = event.currentTarget.getBoundingClientRect();
        const turn = Math.atan2(event.clientY - box.top - cy, event.clientX - box.left - cx);
        const step = (Math.PI * 2) / Math.max(1, count);
        setActive((Math.round((turn + Math.PI / 2) / step) + count) % count);
    };

    const tip = active !== null ? at(active, ticks.max * 0.62) : null;

    return (
        <figure
            aria-busy={loading || undefined}
            aria-label={label}
            className={cn('relative m-0 min-w-0', className)}
            data-slot="radar-chart"
        >
            <div className="relative" ref={ref} style={{ height }}>
                {width > 0 && loading && (
                    <RadarSkeleton
                        cx={cx}
                        cy={cy}
                        half={half}
                        height={height}
                        id={id}
                        radius={radius}
                        // Rows kept from before keep their spokes, so the shape does not turn when they land.
                        spokes={rows.length > 2 ? rows.length : SKELETON_REACH.length}
                        width={width}
                    />
                )}
                {width > 0 && count > 2 && (
                    <svg
                        aria-hidden="true"
                        className="block overflow-visible"
                        height={height}
                        onPointerLeave={() => setActive(null)}
                        onPointerMove={onPointerMove}
                        width={width}
                    >
                        <defs>
                            {series.map((line, index) => {
                                const color = chartColor(line.color ?? seriesColor(index));
                                return (
                                    <g key={line.key}>
                                        <pattern
                                            height={6}
                                            id={`${id}-${index}-stripes`}
                                            patternTransform="rotate(45)"
                                            patternUnits="userSpaceOnUse"
                                            width={6}
                                        >
                                            <line
                                                stroke={color}
                                                strokeWidth={1.4}
                                                x1={0}
                                                x2={0}
                                                y1={0}
                                                y2={6}
                                            />
                                        </pattern>
                                        <pattern
                                            height={5}
                                            id={`${id}-${index}-dots`}
                                            patternUnits="userSpaceOnUse"
                                            width={5}
                                        >
                                            <circle cx={2.5} cy={2.5} fill={color} r={1.1} />
                                        </pattern>
                                    </g>
                                );
                            })}
                            {/* The frame's own rect and corner: the rings and shapes stay inside it. */}
                            <clipPath id={`${id}-plot`}>
                                <rect
                                    height={half * 2}
                                    style={{ rx: 'var(--radius-item)', ry: 'var(--radius-item)' }}
                                    width={half * 2}
                                    x={cx - half}
                                    y={cy - half}
                                />
                            </clipPath>
                        </defs>

                        <g clipPath={`url(#${id}-plot)`}>
                            {ticks.values.slice(1).map(tick => (
                                <path
                                    d={polygon(data.map((_, i) => at(i, tick)))}
                                    fill="none"
                                    key={tick}
                                    stroke="var(--color-chart-grid)"
                                />
                            ))}
                            {data.map((row, i) => {
                                const end = at(i, ticks.max);
                                return (
                                    <line
                                        key={String(row[xKey])}
                                        stroke={
                                            active === i
                                                ? 'var(--color-neutral-400)'
                                                : 'var(--color-chart-grid)'
                                        }
                                        x1={cx}
                                        x2={end.x}
                                        y1={cy}
                                        y2={end.y}
                                    />
                                );
                            })}

                            {series.map((line, index) => {
                                const color = chartColor(line.color ?? seriesColor(index));
                                const shape = polygon(
                                    values[index]?.map((value, i) => at(i, value)) ?? [],
                                );
                                const textured = index > 0 && texture !== 'none';
                                return (
                                    <g key={line.key}>
                                        <path
                                            d={shape}
                                            fill={color}
                                            fillOpacity={textured ? 0.08 : 0.2}
                                        />
                                        {textured && (
                                            <path
                                                d={shape}
                                                fill={`url(#${id}-${index}-${texture})`}
                                                fillOpacity={0.55}
                                            />
                                        )}
                                        <path
                                            d={shape}
                                            fill="none"
                                            stroke={color}
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                        />
                                    </g>
                                );
                            })}
                        </g>

                        {/* The point read out on each shape: a hover mark, so over the clip. */}
                        {active !== null &&
                            series.map((line, index) => {
                                const point = at(active, values[index]?.[active] ?? 0);
                                return (
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        fill={chartColor(line.color ?? seriesColor(index))}
                                        key={line.key}
                                        r={4}
                                        stroke="var(--color-chart-background)"
                                        strokeWidth={2}
                                    />
                                );
                            })}

                        {data.map((row, i) => {
                            const place = outsideFrame(
                                cx,
                                cy,
                                half,
                                Math.cos(angle(i)),
                                Math.sin(angle(i)),
                            );
                            return (
                                <text
                                    className="text-xxs"
                                    dominantBaseline="middle"
                                    fill={
                                        active === i
                                            ? 'var(--color-neutral-950)'
                                            : 'var(--color-chart-label)'
                                    }
                                    key={String(row[xKey])}
                                    textAnchor={place.anchor}
                                    x={place.x}
                                    y={place.y}
                                >
                                    {String(row[xKey])}
                                </text>
                            );
                        })}
                    </svg>
                )}

                {/*
                 * The rings' values, once, halfway along the ring's side between the two quietest
                 * neighbouring spokes: clear of the shapes, and well inside the frame.
                 */}
                {width > 0 &&
                    count > 2 &&
                    ticks.values.slice(1).map(tick => {
                        const a = at((quiet - 1 + count) % count, tick);
                        const b = at(quiet, tick);
                        const point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                        return (
                            <span
                                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-neutral-50 px-1.5 text-neutral-600 text-xxs tabular-nums leading-4"
                                key={tick}
                                style={{ left: point.x, top: point.y }}
                            >
                                {formatCompact(tick)}
                            </span>
                        );
                    })}

                {active !== null && tip && (
                    <div
                        className="pointer-events-none absolute z-10"
                        style={{
                            left: tip.x > cx ? tip.x + 12 : undefined,
                            right: tip.x <= cx ? width - tip.x + 12 : undefined,
                            top: Math.max(0, tip.y - 40),
                        }}
                    >
                        <ChartTooltip
                            rows={series.map((line, index) => ({
                                color: line.color ?? seriesColor(index),
                                name: line.name ?? line.key,
                                value: formatValue(values[index]?.[active] ?? 0),
                            }))}
                            title={String(data[active]?.[xKey] ?? '')}
                        />
                    </div>
                )}
            </div>
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
                        {data.map((row, i) => (
                            <tr key={String(row[xKey])}>
                                <th scope="row">{String(row[xKey])}</th>
                                {series.map((line, index) => (
                                    <td key={line.key}>{formatValue(values[index]?.[i] ?? 0)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};

/**
 * The stand-in's reach on each spoke, as shares of the radius: a profile strong in two places and
 * thin in one, as a real one tends to be, so it reads as a shape waiting and not a hexagon.
 */
const SKELETON_REACH = [0.84, 0.58, 0.72, 0.36, 0.5, 0.78];

/** The stand-in's rings, as shares of the radius: three, the outer just inside the frame. */
const SKELETON_RINGS = [0.32, 0.64, 0.96];

/** The stand-in's spoke names, as widths: short words, a month or a measure. */
const SKELETON_NAMES = [20, 32, 24, 28, 20, 32];

/** The stand-in's outline, a step stronger than its wash, as the line is over its tint. */
const SKELETON_EDGE = 'color-mix(in oklab, var(--color-neutral-950) 14%, transparent)';

/**
 * A radar that is loading, with the depth of a loaded one: its rings and spokes stay, a shape
 * stands in the skeleton wash with its outline over it, and short bars stand where the spokes'
 * names will. The rings' values are left out until there are values. It takes the chart's
 * room, so nothing moves when the data lands.
 */
const RadarSkeleton = ({
    id,
    width,
    height,
    cx,
    cy,
    half,
    radius,
    spokes,
}: {
    id: string;
    width: number;
    height: number;
    cx: number;
    cy: number;
    half: number;
    radius: number;
    spokes: number;
}) => {
    const angle = (i: number) => -Math.PI / 2 + (i / spokes) * Math.PI * 2;
    const at = (i: number, share: number) => ({
        x: cx + share * radius * Math.cos(angle(i)),
        y: cy + share * radius * Math.sin(angle(i)),
    });
    const around = (share: (i: number) => number) =>
        polygon(Array.from({ length: spokes }, (_, i) => at(i, share(i))));
    const shape = around(i => SKELETON_REACH[i % SKELETON_REACH.length] ?? 0.5);
    // The outline is the shape's own 2px line with round joins, a mask the wash shows through.
    const outline = `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><path d='${shape}' fill='none' stroke='black' stroke-width='2' stroke-linejoin='round'/></svg>`,
    )}")`;

    return (
        <div aria-hidden className="absolute inset-0" data-slot="chart-skeleton">
            <svg
                aria-hidden="true"
                className="block overflow-visible"
                height={height}
                width={width}
            >
                <defs>
                    <clipPath id={`${id}-skeleton`}>
                        <rect
                            height={half * 2}
                            style={{ rx: 'var(--radius-item)', ry: 'var(--radius-item)' }}
                            width={half * 2}
                            x={cx - half}
                            y={cy - half}
                        />
                    </clipPath>
                </defs>
                <g clipPath={`url(#${id}-skeleton)`} fill="none" stroke="var(--color-chart-grid)">
                    {SKELETON_RINGS.map(share => (
                        <path d={around(() => share)} key={share} />
                    ))}
                    {Array.from({ length: spokes }, (_, i) => {
                        const end = at(i, 1);
                        // biome-ignore lint/suspicious/noArrayIndexKey: the spokes never reorder
                        return <line key={i} x1={cx} x2={end.x} y1={cy} y2={end.y} />;
                    })}
                </g>
            </svg>
            <div className="skeleton absolute inset-0" style={{ clipPath: `path('${shape}')` }} />
            <div
                className="skeleton absolute inset-0"
                style={{
                    backgroundColor: SKELETON_EDGE,
                    maskImage: outline,
                    maskRepeat: 'no-repeat',
                    maskSize: '100% 100%',
                }}
            />
            {Array.from({ length: spokes }, (_, i) => {
                const place = outsideFrame(cx, cy, half, Math.cos(angle(i)), Math.sin(angle(i)));
                const wide = SKELETON_NAMES[i % SKELETON_NAMES.length] ?? 24;
                return (
                    <div
                        className="skeleton absolute h-2 rounded-chip"
                        // biome-ignore lint/suspicious/noArrayIndexKey: the spokes never reorder
                        key={i}
                        style={{
                            left:
                                place.anchor === 'start'
                                    ? place.x
                                    : place.anchor === 'end'
                                      ? place.x - wide
                                      : place.x - wide / 2,
                            top: place.y - 4,
                            width: wide,
                        }}
                    />
                );
            })}
        </div>
    );
};
