'use client';

import { type PointerEvent, useId, useState } from 'react';
import { cn } from '../lib/cn';
import type { ChartRow, ChartSeries } from './cartesian';
import { chartColor, seriesColor } from './lib/color';
import { formatCompact, formatNumber } from './lib/format';
import { ringSegmentPath } from './lib/path';
import { niceTicks } from './lib/scale';
import { useWidth } from './lib/use-size';
import { ChartTooltip } from './tooltip';

export type RoseChartProps<Row extends ChartRow> = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    /** One row per wedge, in the order they go round: hours, months, weekdays. */
    data: readonly Row[];
    /** The field naming each wedge: "09", "Mar", "Tue". */
    x: string;
    /**
     * What each wedge measures. More than one is stacked outward, each series a ring of the
     * wedge over the one before it, so the whole wedge is the total.
     */
    series: readonly ChartSeries[];
    /** The chart's height; it is drawn as a circle in the smaller of this and its width. */
    height?: number;
    formatValue?: (value: number) => string;
    /** `tint`, the kit's look, a tint of each colour with a solid edge; `solid` fills each wedge. */
    fill?: 'tint' | 'solid';
    /** What the chart says when there is nothing to draw. */
    emptyLabel?: string;
    /** While the data loads: the chart's own shape stands in, in the skeleton wash, at the size it will have. */
    loading?: boolean;
    className?: string;
};

/** The circle fills its frame: only the hairline lies between the outer ring and its edge. */
const PAD = 1;
/** The room between the frame and a category's name outside it. */
const LABEL_GAP = 8;
/** A name's line, above or under the frame. */
const LABEL_LINE = 12;
/** What a name beside the frame is allowed, at most, before the frame gives way to it. */
const LABEL_SIDE = 40;
/** The empty middle every wedge starts from, as a share of the radius. */
const HOLE = 0.1;
/** The gap between two wedges, and between two stacked rings, in px: the same all the way in. */
const GAP = 2;
const EDGE = 2;
const CORNER = 2.5;
/** The fewest pixels between two category names round the outside before some are left out. */
const LABEL_SPACING = 56;

/**
 * Where a category's name stands: round the circle, a little way past its edge, set from the
 * side it is on so it never runs back over the shape.
 */
const outsideFrame = (cx: number, cy: number, half: number, dx: number, dy: number) => ({
    anchor:
        Math.abs(dx) < 0.25 ? ('middle' as const) : dx > 0 ? ('start' as const) : ('end' as const),
    x: cx + dx * (half + LABEL_GAP),
    y: cy + dy * (half + LABEL_GAP + (Math.abs(dx) < 0.25 ? LABEL_LINE / 2 - 2 : 0)),
});

/**
 * How many categories go by between two names: every second, third or fourth when the circle is
 * crowded, counting in a step that goes into the whole, so 24 hours read 00, 03, 06 and never
 * 00, 05, 10.
 */
const labelStep = (count: number, half: number) => {
    const room = ((half + LABEL_GAP) * Math.PI * 2) / Math.max(1, count);
    return (
        [1, 2, 3, 4, 6, 8, 12].find(n => count % n === 0 && room * n >= LABEL_SPACING) ??
        Math.ceil(LABEL_SPACING / Math.max(1, room))
    );
};

/** The wedge whose spoke lies between the two quietest neighbours, where the rings' values go. */
const quietestSpoke = (totals: readonly number[]) => {
    const count = totals.length;
    let quiet = 0;
    let quietest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < count; i++) {
        const loud = Math.max(totals[i] ?? 0, totals[(i - 1 + count) % count] ?? 0);
        if (loud < quietest - 1e-9) {
            quietest = loud;
            quiet = i;
        }
    }
    return quiet;
};

/**
 * Amounts by a category that goes round, such as the hours of a day or the months of a year:
 * each category a wedge at its own place on the clock, reaching out as far as its value.
 *
 * The radius grows with the square root of the value, so a wedge's area is what is read: a
 * wedge twice the value is twice the ink, never four times. The wedges start from a small
 * hole, and the root is taken of the band between the hole and the edge, so the areas stay
 * true there too. Faint rings mark round values, written once along the quietest spoke, and
 * pointing at a wedge reads it out while the rest step back.
 */
export const RoseChart = <Row extends ChartRow>({
    'aria-label': label,
    data,
    x: xKey,
    series,
    height = 320,
    formatValue = formatNumber,
    fill = 'tint',
    emptyLabel = 'Nothing to show yet',
    loading = false,
    className,
}: RoseChartProps<Row>) => {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const [ref, width] = useWidth<HTMLDivElement>();
    const [active, setActive] = useState<number | null>(null);

    const count = data.length;
    const values = series.map(line => data.map(row => Math.max(0, Number(row[line.key]) || 0)));
    const totals = data.map((_, i) => values.reduce((sum, column) => sum + (column[i] ?? 0), 0));
    const peak = Math.max(0, ...totals);
    // While it loads the chart draws its stand-in and nothing else, never the last rows.
    const empty = !loading && (count === 0 || peak <= 0);
    const drawn = !loading && !empty;
    const ticks = niceTicks(0, peak, 3);

    const cx = width / 2;
    const cy = height / 2;
    // The plot is a square frame round the circle; the names stand outside it.
    const half = Math.max(
        0,
        Math.min(width / 2 - LABEL_SIDE, height / 2 - LABEL_GAP - LABEL_LINE) - 1,
    );
    const outer = Math.max(0, half - PAD);
    const hole = outer * HOLE;
    // The area between the hole and a ring grows as the value, so the radius as its root.
    const radiusOf = (value: number) =>
        ticks.max > 0
            ? Math.sqrt(
                  hole ** 2 + (Math.min(value, ticks.max) / ticks.max) * (outer ** 2 - hole ** 2),
              )
            : hole;
    const step = (Math.PI * 2) / Math.max(1, count);
    // Each wedge is centred on its own angle, so the first stands upright at twelve o'clock.
    const startOf = (i: number) => (i - 0.5) * step;
    const point = (radius: number, angle: number) => ({
        x: cx + radius * Math.sin(angle),
        y: cy - radius * Math.cos(angle),
    });

    const every = labelStep(count, half);
    // The ring values go along the spoke between the two quietest neighbours, clear of the wedges.
    const spoke = startOf(quietestSpoke(totals));

    const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
        const box = event.currentTarget.getBoundingClientRect();
        const dx = event.clientX - box.left - cx;
        const dy = event.clientY - box.top - cy;
        if (Math.hypot(dx, dy) > outer + 8) {
            setActive(null);
            return;
        }
        const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
        setActive((Math.round(angle / step) + count) % count);
    };

    // The readout stands off the wedge's outer edge and grows away from the middle, both across
    // and up or down, so it never lies over the wedge it reads.
    const shown = active;
    const tipAngle = shown !== null ? shown * step : 0;
    const tip = shown !== null ? point(radiusOf(totals[shown] ?? 0) + 10, tipAngle) : null;
    const right = Math.sin(tipAngle) >= -1e-6;
    const above = Math.cos(tipAngle) > 0;

    return (
        <figure
            aria-busy={loading || undefined}
            aria-label={label}
            className={cn('relative m-0 min-w-0', className)}
            data-slot="rose-chart"
        >
            <div className="relative" ref={ref} style={{ height }}>
                {width > 0 && empty && (
                    <p className="absolute inset-0 flex items-center justify-center rounded-item border border-neutral-200 border-dashed text-neutral-600 text-xs">
                        {emptyLabel}
                    </p>
                )}
                {width > 0 && loading && (
                    <RoseSkeleton fill={fill} half={half} height={height} width={width} />
                )}
                {width > 0 && drawn && (
                    <svg
                        aria-hidden="true"
                        className="block overflow-visible"
                        height={height}
                        onPointerLeave={() => setActive(null)}
                        onPointerMove={onPointerMove}
                        width={width}
                    >
                        {/* The frame's own rect and corner: the rings and wedges stay inside it. */}
                        <defs>
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
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    fill="none"
                                    key={tick}
                                    r={radiusOf(tick)}
                                    stroke="var(--color-chart-grid)"
                                />
                            ))}

                            {data.map((row, i) => {
                                const from = startOf(i);
                                const to = startOf(i) + step;
                                let reached = 0;
                                return (
                                    <g
                                        className="transition-opacity duration-150 motion-reduce:transition-none"
                                        key={String(row[xKey])}
                                        opacity={active === null || active === i ? 1 : 0.35}
                                    >
                                        {series.map((line, index) => {
                                            const value = values[index]?.[i] ?? 0;
                                            const inner = radiusOf(reached);
                                            reached += value;
                                            const outerEdge = radiusOf(reached);
                                            if (value <= 0 || outerEdge - inner < 0.5) return null;
                                            const color = chartColor(
                                                line.color ?? seriesColor(index),
                                            );
                                            const edge = outerEdge - EDGE / 2;
                                            // The edge stops short of the rounded corners, as the donut's does.
                                            const inset = Math.min(
                                                (CORNER + GAP / 2 + EDGE / 2) / edge,
                                                (to - from) / 3,
                                            );
                                            const a = point(edge, from + inset);
                                            const b = point(edge, to - inset);
                                            return (
                                                <g key={line.key}>
                                                    <path
                                                        d={ringSegmentPath(
                                                            cx,
                                                            cy,
                                                            outerEdge,
                                                            inner,
                                                            from,
                                                            to,
                                                            CORNER,
                                                        )}
                                                        fill={color}
                                                        fillOpacity={fill === 'solid' ? 1 : 0.2}
                                                        // The gap is the page drawn over the seam, so it keeps its
                                                        // width down to the middle, where an angle would close.
                                                        stroke="var(--color-chart-background)"
                                                        strokeWidth={GAP}
                                                    />
                                                    {fill === 'tint' && outerEdge - inner >= 3 && (
                                                        <path
                                                            d={`M${a.x.toFixed(2)},${a.y.toFixed(2)} A${edge},${edge} 0 0 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`}
                                                            fill="none"
                                                            stroke={color}
                                                            strokeLinecap="round"
                                                            strokeWidth={EDGE}
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </g>
                                );
                            })}
                        </g>

                        {data.map((row, i) => {
                            if (i % every !== 0 && active !== i) return null;
                            const angle = i * step;
                            const place = outsideFrame(
                                cx,
                                cy,
                                half,
                                Math.sin(angle),
                                -Math.cos(angle),
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

                {/* The rings' values, once, along the quietest spoke. */}
                {width > 0 &&
                    drawn &&
                    ticks.values.slice(1).map(tick => {
                        const at = point(radiusOf(tick), spoke);
                        return (
                            <span
                                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-neutral-50 px-1.5 text-neutral-600 text-xxs tabular-nums leading-4"
                                key={tick}
                                style={{ left: at.x, top: at.y }}
                            >
                                {formatCompact(tick)}
                            </span>
                        );
                    })}

                {drawn && shown !== null && tip && (
                    <div
                        className="pointer-events-none absolute z-10"
                        style={{
                            left: right ? tip.x : undefined,
                            right: right ? undefined : width - tip.x,
                            top: above ? undefined : tip.y,
                            bottom: above ? height - tip.y : undefined,
                        }}
                    >
                        <ChartTooltip
                            footer={
                                series.length > 1 ? (
                                    <span className="flex justify-between gap-4 text-xs">
                                        <span className="text-neutral-600">Total</span>
                                        <span className="font-medium text-neutral-950 tabular-nums">
                                            {formatValue(totals[shown] ?? 0)}
                                        </span>
                                    </span>
                                ) : undefined
                            }
                            rows={series.map((line, index) => ({
                                color: line.color ?? seriesColor(index),
                                name: line.name ?? line.key,
                                value: formatValue(values[index]?.[shown] ?? 0),
                            }))}
                            title={String(data[shown]?.[xKey] ?? '')}
                        />
                    </div>
                )}
            </div>
            {!loading && (
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
                                        <td key={line.key}>
                                            {formatValue(values[index]?.[i] ?? 0)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </figure>
    );
};

/**
 * The stand-in's wedges, as shares of the outer edge's value, round from twelve o'clock: a
 * day's shape, quiet at night and long through the working hours, so a few reach far and a few
 * stay near the middle.
 */
const SKELETON_REACH = [0.3, 0.16, 0.1, 0.14, 0.38, 0.7, 0.92, 0.8, 0.58, 0.66, 0.48, 0.42];

/**
 * The stand-in's rings, as shares of the outer edge's value: two round values under the
 * headroom, as a loaded chart draws them, with the longest wedge reaching past the last.
 */
const SKELETON_RINGS = [0.4, 0.8];

/** The stand-in's edge, a step stronger than its wash, as a wedge's line is over its tint. */
const SKELETON_EDGE = 'color-mix(in oklab, var(--color-neutral-950) 14%, transparent)';

/** A name's stand-in: a short bar at the 11px names' height. */
const SKELETON_NAME = { width: 14, height: 8 };

/**
 * A wedge from the hole out to its reach, with its sides drawn in by half the gap, so the gap
 * between two wedges keeps its width down to the middle as the loaded chart's does. A clip
 * cannot be stroked, so the gap is drawn into the shape instead.
 */
const wedgePath = (
    cx: number,
    cy: number,
    outer: number,
    inner: number,
    from: number,
    to: number,
) => {
    const at = (radius: number, angle: number) =>
        `${(cx + radius * Math.sin(angle)).toFixed(2)},${(cy - radius * Math.cos(angle)).toFixed(2)}`;
    const side = (radius: number) => Math.asin(Math.min(1, GAP / 2 / radius));
    if (to - side(inner) <= from + side(inner)) return '';
    return `M${at(outer, from + side(outer))} A${outer},${outer} 0 0 1 ${at(outer, to - side(outer))} L${at(inner, to - side(inner))} A${inner},${inner} 0 0 0 ${at(inner, from + side(inner))} Z`;
};

/**
 * A rose that is loading, with the depth of a loaded one: its rings stay, its wedges stand in
 * the skeleton wash at a day's varied reach with their edges, the rings' values and the names
 * round the outside are short bars where they will be, and the light crosses all of it. It is
 * drawn in the circle the loaded chart takes, so nothing moves when the data lands.
 */
const RoseSkeleton = ({
    width,
    height,
    half,
    fill,
}: {
    width: number;
    height: number;
    half: number;
    fill: 'tint' | 'solid';
}) => {
    const outer = Math.max(0, half - PAD);
    if (outer <= 0) return null;
    const cx = width / 2;
    const cy = height / 2;
    const hole = outer * HOLE;
    const radiusOf = (share: number) => Math.sqrt(hole ** 2 + share * (outer ** 2 - hole ** 2));
    const count = SKELETON_REACH.length;
    const step = (Math.PI * 2) / count;
    const startOf = (i: number) => (i - 0.5) * step;
    const point = (radius: number, angle: number) => ({
        x: cx + radius * Math.sin(angle),
        y: cy - radius * Math.cos(angle),
    });

    const wash = SKELETON_REACH.map((share, i) =>
        wedgePath(cx, cy, radiusOf(share), hole + GAP / 2, startOf(i), startOf(i) + step),
    ).join(' ');
    // The edge as the loaded one is drawn: a band along the outside with round ends, short of the corners.
    const edge = SKELETON_REACH.map((share, i) => {
        const reach = radiusOf(share);
        const inset = (CORNER + GAP / 2) / reach;
        return ringSegmentPath(
            cx,
            cy,
            reach,
            reach - EDGE,
            startOf(i) + inset,
            startOf(i) + step - inset,
            EDGE / 2,
        );
    }).join(' ');
    const every = labelStep(count, half);
    const spoke = startOf(quietestSpoke(SKELETON_REACH));

    return (
        <div aria-hidden className="absolute inset-0" data-slot="chart-skeleton">
            <svg
                aria-hidden="true"
                className="absolute inset-0 block"
                height={height}
                width={width}
            >
                {SKELETON_RINGS.map(share => (
                    <circle
                        cx={cx}
                        cy={cy}
                        fill="none"
                        key={share}
                        r={radiusOf(share)}
                        stroke="var(--color-chart-grid)"
                    />
                ))}
            </svg>
            <div className="skeleton absolute inset-0" style={{ clipPath: `path('${wash}')` }} />
            {fill === 'tint' && (
                <div
                    className="skeleton absolute inset-0"
                    style={{ backgroundColor: SKELETON_EDGE, clipPath: `path('${edge}')` }}
                />
            )}
            {SKELETON_REACH.map((_, i) => {
                if (i % every !== 0) return null;
                const angle = i * step;
                const place = outsideFrame(cx, cy, half, Math.sin(angle), -Math.cos(angle));
                const left =
                    place.anchor === 'middle'
                        ? place.x - SKELETON_NAME.width / 2
                        : place.anchor === 'end'
                          ? place.x - SKELETON_NAME.width
                          : place.x;
                return (
                    <div
                        className="skeleton absolute rounded-chip"
                        // biome-ignore lint/suspicious/noArrayIndexKey: the stand-in never reorders
                        key={i}
                        style={{
                            ...SKELETON_NAME,
                            left,
                            top: place.y - SKELETON_NAME.height / 2,
                        }}
                    />
                );
            })}
            {/* The rings' values: the pill's own size, on the page's colour so the ring stops at it. */}
            {SKELETON_RINGS.map(share => {
                const at = point(radiusOf(share), spoke);
                return (
                    <span
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-50"
                        key={share}
                        style={{ left: at.x, top: at.y }}
                    >
                        <span className="skeleton block h-4.5 w-7 rounded-full" />
                    </span>
                );
            })}
        </div>
    );
};
