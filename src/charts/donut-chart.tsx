'use client';

import { type ReactNode, useState } from 'react';
import { cn } from '../lib/cn';
import { type ChartColor, chartColor, seriesColor } from './lib/color';
import { formatCompact, formatNumber, formatPercent } from './lib/format';
import { ringSegmentPath } from './lib/path';

export type DonutSlice = { name: string; value: number; color?: ChartColor };

export type DonutChartProps = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    data: readonly DonutSlice[];
    /** Across, in px. */
    size?: number;
    /**
     * The top half of the ring, the figure standing under its arch: the same shares in half the
     * height, for a short card or a row of them.
     */
    half?: boolean;
    /** What the total in the centre counts: "sessions". */
    label?: ReactNode;
    /**
     * The total in the centre. Off in a card that already leads with it: the middle then stays
     * empty until a slice is pointed at, rather than saying the card's figure twice.
     */
    total?: boolean;
    formatValue?: (value: number) => string;
    /** `tint`, the kit's look, a tint of each colour with a solid edge; `solid` fills each slice. */
    fill?: 'tint' | 'solid';
    className?: string;
};

/** Past five slices the rest are one, in grey: six colours are not told apart. */
const MOST = 5;
const GAP = 0.04;
const EDGE = 2.5;
/** The corner of each slice, on all four of its ends. */
const CORNER = 4;

/**
 * Shares of a whole as a ring, drawn the way every chart in the kit is: each slice a tint of
 * its colour with a solid edge along the outside, as a line stands over the tint under it.
 * The total sits in the middle; pointing at a slice puts its own figure there instead and
 * lets the rest step back. Half, the ring runs over the top from left to right and the
 * figure stands on the line its two feet stand on.
 */
export const DonutChart = ({
    'aria-label': label,
    data,
    size = 160,
    half = false,
    label: caption,
    total: showTotal = true,
    formatValue = formatNumber,
    fill = 'tint',
    className,
}: DonutChartProps) => {
    const [active, setActive] = useState<number | null>(null);

    const slices =
        data.length > MOST
            ? [
                  ...data.slice(0, MOST - 1),
                  {
                      name: 'Other',
                      value: data.slice(MOST - 1).reduce((sum, slice) => sum + slice.value, 0),
                      color: 'neutral' as ChartColor,
                  },
              ]
            : data;
    const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
    const outer = size / 2;
    const thickness = Math.max(14, Math.round(size * 0.14));
    const inner = outer - thickness;
    // A ring starts at twelve o'clock and goes all the way round; half of one starts at nine.
    const origin = half ? -Math.PI / 2 : 0;
    const turn = half ? Math.PI : Math.PI * 2;
    // Half a ring is as tall as its radius, and a pixel more for the edge's round end.
    const height = half ? Math.ceil(outer) + 1 : size;

    let start = origin;
    const arcs = slices.map((slice, index) => {
        const sweep = total > 0 ? (Math.max(0, slice.value) / total) * turn : 0;
        const from = start + (slices.length > 1 ? GAP / 2 : 0);
        const to = start + sweep - (slices.length > 1 ? GAP / 2 : 0);
        start += sweep;
        return { ...slice, from, to, color: chartColor(slice.color ?? seriesColor(index)) };
    });

    const shown = active !== null ? slices[active] : undefined;
    const edge = outer - EDGE / 2;
    const point = (angle: number) => ({
        x: outer + edge * Math.sin(angle),
        y: outer - edge * Math.cos(angle),
    });

    return (
        <figure
            aria-label={label}
            className={cn('relative m-0 shrink-0', className)}
            data-slot="donut-chart"
            style={{ height, width: size }}
        >
            <svg aria-hidden="true" className="block" height={height} width={size}>
                {total <= 0 ? (
                    <path
                        d={ringSegmentPath(
                            outer,
                            outer,
                            outer,
                            inner,
                            origin,
                            origin + turn,
                            CORNER,
                        )}
                        fill="var(--color-neutral-950)"
                        fillOpacity={0.05}
                    />
                ) : (
                    arcs.map((arc, index) =>
                        arc.to <= arc.from ? null : (
                            <g
                                className="cursor-default transition-opacity duration-150 motion-reduce:transition-none"
                                key={arc.name}
                                onPointerEnter={() => setActive(index)}
                                onPointerLeave={() => setActive(null)}
                                opacity={active === null || active === index ? 1 : 0.35}
                            >
                                <path
                                    d={ringSegmentPath(
                                        outer,
                                        outer,
                                        outer,
                                        inner,
                                        arc.from,
                                        arc.to,
                                        CORNER,
                                    )}
                                    fill={arc.color}
                                    fillOpacity={fill === 'solid' ? 1 : 0.2}
                                />
                                {/* The slice's own line along its outside edge. */}
                                {fill === 'tint' && (
                                    <path
                                        d={`M${point(arc.from + 0.02).x},${point(arc.from + 0.02).y} A${edge},${edge} 0 ${arc.to - arc.from > Math.PI ? 1 : 0} 1 ${point(arc.to - 0.02).x},${point(arc.to - 0.02).y}`}
                                        fill="none"
                                        stroke={arc.color}
                                        strokeLinecap="round"
                                        strokeWidth={EDGE}
                                    />
                                )}
                            </g>
                        ),
                    )
                )}
            </svg>
            <figcaption
                aria-live="polite"
                className={cn(
                    'pointer-events-none absolute inset-x-0 flex flex-col items-center gap-0.5 text-center',
                    // Half, the figure stands on the feet's line, inside the arch.
                    half ? 'bottom-0 justify-end' : 'inset-y-0 justify-center',
                )}
            >
                {(shown || showTotal) && (
                    <>
                        <span className="font-medium text-lg text-neutral-950 tabular-nums">
                            {shown ? formatValue(shown.value) : formatCompact(total)}
                        </span>
                        <span
                            className="truncate text-neutral-600 text-xxs"
                            style={{ maxWidth: Math.max(0, inner * 2 - 16) }}
                        >
                            {shown
                                ? `${shown.name} · ${formatPercent(total ? shown.value / total : 0)}`
                                : caption}
                        </span>
                    </>
                )}
            </figcaption>
            <div className="sr-only">
                <table>
                    <caption>{label}</caption>
                    <tbody>
                        {slices.map(slice => (
                            <tr key={slice.name}>
                                <th scope="row">{slice.name}</th>
                                <td>{formatValue(slice.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};
