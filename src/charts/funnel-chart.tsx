'use client';

import { useId, useState } from 'react';
import { cn } from '../lib/cn';
import { stepColor } from './lib/color';
import { formatNumber, formatPercent } from './lib/format';
import { PLOT_FRAME } from './lib/frame';
import { useWidth } from './lib/use-size';

export type FunnelStep = { name: string; value: number };

export type FunnelChartProps = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    data: readonly FunnelStep[];
    /** The shape's height, under the steps' figures. */
    height?: number;
    formatValue?: (value: number) => string;
    className?: string;
};

/**
 * Steps in order and what is lost between them: one smooth shape narrowing step by step, each
 * step in its own colour, in a frame of its own. Each step's figures stand over its column,
 * outside the frame so they never push the shape down: its name, how many, the share of the
 * first that got this far, and what was lost from the step before.
 */
/** An edge written left to right, written right to left: its curves' handles swap ends. */
const reverse = (d: string) => {
    const parts = d.trim().split(/\s+(?=[MLC])/);
    const points: { kind: string; to: string; handles?: [string, string] }[] = [];
    for (const part of parts) {
        const kind = part[0] as string;
        const coords = part.slice(1).trim().split(/\s+/);
        if (kind === 'C')
            points.push({
                kind,
                to: coords[2] as string,
                handles: [coords[0] as string, coords[1] as string],
            });
        else points.push({ kind, to: coords[0] as string });
    }
    let out = '';
    for (let i = points.length - 1; i >= 0; i--) {
        const here = points[i];
        const before = points[i - 1];
        if (!here) continue;
        if (i === points.length - 1) out += `L${here.to} `;
        if (!before) continue;
        out += here.handles
            ? `C${here.handles[1]} ${here.handles[0]} ${before.to} `
            : `L${before.to} `;
    }
    return out;
};

/** The surface left between two steps, so a change of colour is a seam and not a smear. */
const GAP = 2;
/**
 * The silhouette fills its frame: it runs from one side to the other inside the hairline, and
 * the first step's line stands just under it, half its width clear.
 */
const BORDER = 1;
const LINE = 2;
const PAD_X = BORDER;
const PAD_Y = BORDER + LINE / 2;

export const FunnelChart = ({
    'aria-label': label,
    data,
    height = 160,
    formatValue = formatNumber,
    className,
}: FunnelChartProps) => {
    const [ref, width] = useWidth<HTMLDivElement>();
    // The step under the pointer stays; the rest, and their figures, step back.
    const [active, setActive] = useState<number | null>(null);
    const dim = (i: number) =>
        cn(
            'transition-opacity duration-150 motion-reduce:transition-none',
            active !== null && active !== i && 'opacity-35',
        );
    const first = data[0]?.value ?? 0;
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    // The drawing is the frame's inside; the columns share it.
    const inner = Math.max(0, width - PAD_X * 2);
    const column = data.length ? inner / data.length : 0;
    /*
     * The funnel's silhouette, centred top to bottom: each step is as thick as its share of
     * the first, holds that thickness over most of its column, and eases into the next step's
     * over the rest, so the narrowing reads as a flow and not as a staircase. An inner core,
     * thinner and stronger, gives the body its depth.
     */
    const middle = height / 2;
    const reach = height / 2 - PAD_Y;
    const half = (value: number, share = 1) =>
        Math.max(2, first > 0 ? (value / first) * reach * share : 2);
    const edge = (share: number, side: 1 | -1) => {
        let d = '';
        data.forEach((step, i) => {
            const x0 = PAD_X + i * column;
            const hold = x0 + column * 0.5;
            const x1 = PAD_X + (i + 1) * column;
            const yy = middle - side * half(step.value, share);
            const next = data[i + 1];
            d += i === 0 ? `M${x0},${yy} ` : '';
            d += `L${hold},${yy} `;
            if (next) {
                const ny = middle - side * half(next.value, share);
                const pull = (x1 - hold) / 2;
                d += `C${hold + pull},${yy} ${x1 - pull},${ny} ${x1},${ny} `;
            } else d += `L${x1},${yy} `;
        });
        return d;
    };
    const body = (share: number) => {
        const top = edge(share, 1);
        // Back along the bottom: the same edge, mirrored, walked right to left.
        const bottomPoints = edge(share, -1);
        return `${top} L${PAD_X + inner},${middle + half(data.at(-1)?.value ?? 0, share)} ${reverse(bottomPoints)} Z`;
    };

    // Where two steps meet: a faint rule from the frame's top to its foot.
    const divider = (i: number) => Math.round(PAD_X + (i + 1) * column - GAP / 2);

    return (
        <figure
            aria-label={label}
            className={cn('m-0 flex min-w-0 flex-col gap-2', className)}
            data-slot="funnel-chart"
            onPointerLeave={() => setActive(null)}
        >
            <ol
                className="relative grid min-w-0"
                style={{
                    gridTemplateColumns: `repeat(${Math.max(1, data.length)}, minmax(0, 1fr))`,
                    paddingInline: PAD_X,
                }}
            >
                {data.map((step, i) => {
                    const before = data[i - 1];
                    const lost = before && before.value > 0 ? 1 - step.value / before.value : 0;
                    return (
                        <li
                            className={cn('flex min-w-0 flex-col gap-1 pr-3', dim(i))}
                            key={step.name}
                            onPointerEnter={() => setActive(i)}
                        >
                            <span className="flex min-w-0 items-center gap-2 text-neutral-600 text-xs">
                                <span
                                    aria-hidden
                                    className="h-3 w-0.75 shrink-0 rounded-full"
                                    style={{ background: stepColor(i) }}
                                />
                                <span className="truncate">{step.name}</span>
                            </span>
                            {/* The figure and its caption are a pair, held closer than the name over them. */}
                            <span className="flex flex-col gap-0.5">
                                <span className="font-medium text-lg text-neutral-950 tabular-nums">
                                    {formatValue(step.value)}
                                </span>
                                <span className="flex flex-wrap gap-x-1.5 text-xxs tabular-nums">
                                    <span className="text-neutral-600">
                                        {formatPercent(first ? step.value / first : 0, 1)}
                                    </span>
                                    {before && lost > 0 && (
                                        <span className="text-error-600">
                                            −{formatPercent(lost, 1)}
                                        </span>
                                    )}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ol>
            <div className="relative" ref={ref} style={{ height }}>
                {width > 0 && (
                    <svg
                        aria-hidden="true"
                        className="block overflow-visible"
                        height={height}
                        onPointerMove={event => {
                            const x =
                                event.clientX - event.currentTarget.getBoundingClientRect().left;
                            const at = Math.floor((x - PAD_X) / Math.max(1, column));
                            setActive(Math.max(0, Math.min(data.length - 1, at)));
                        }}
                        width={width}
                    >
                        {/* Held to the frame's rect and corners. */}
                        <defs>
                            <clipPath id={`${id}-plot`}>
                                <rect
                                    height={height}
                                    style={{ rx: 'var(--radius-item)', ry: 'var(--radius-item)' }}
                                    width={width}
                                    x={0}
                                    y={0}
                                />
                            </clipPath>
                            {data.map((step, i) => (
                                // Each step's own stretch of the shape, two pixels clear of the next.
                                <clipPath id={`${id}-step-${i}`} key={step.name}>
                                    <rect
                                        height={height + 8}
                                        width={Math.max(
                                            0,
                                            column - (i < data.length - 1 ? GAP : 0),
                                        )}
                                        x={PAD_X + i * column}
                                        y={-4}
                                    />
                                </clipPath>
                            ))}
                        </defs>
                        <g clipPath={`url(#${id}-plot)`}>
                            {/*
                             * One shape, coloured step by step: the silhouette flows through, and
                             * each step is told by its colour, walking the theme's steps in order.
                             */}
                            {data.map((step, i) => {
                                const color = stepColor(i);
                                return (
                                    <g
                                        className={dim(i)}
                                        clipPath={`url(#${id}-step-${i})`}
                                        key={step.name}
                                    >
                                        <path d={body(1)} fill={color} fillOpacity={0.14} />
                                        <path d={body(0.55)} fill={color} fillOpacity={0.2} />
                                        <path
                                            d={edge(1, 1)}
                                            fill="none"
                                            stroke={color}
                                            strokeLinecap="round"
                                            strokeWidth={LINE}
                                        />
                                        <path
                                            d={edge(1, -1)}
                                            fill="none"
                                            stroke={color}
                                            strokeLinecap="round"
                                            strokeWidth={LINE}
                                        />
                                    </g>
                                );
                            })}
                        </g>
                    </svg>
                )}
                {width > 0 &&
                    data
                        .slice(1)
                        .map((step, i) => (
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-y-px w-px bg-neutral-950/8"
                                key={step.name}
                                style={{ left: divider(i) }}
                            />
                        ))}
                <div aria-hidden className={cn(PLOT_FRAME, 'inset-0')} />
            </div>
        </figure>
    );
};
