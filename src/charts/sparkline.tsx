'use client';

import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { type ChartColor, chartColor } from './lib/color';
import { areaPath, curvePath, type Point } from './lib/path';
import { extent, scalePoint, slotScale } from './lib/scale';
import { useWidth } from './lib/use-size';

export type SparklineLabel = {
    /** The reading the label stands under: its index in `data`. */
    at: number;
    label: ReactNode;
};

export type SparklineProps = {
    /** The readings, oldest first. */
    data: readonly number[];
    /** `area`, a line over its wash; `line`, the line alone; `bar`, a bar a reading. */
    kind?: 'area' | 'line' | 'bar';
    /**
     * The reading that is now. A line ends its solid stroke there and marks it with a dot;
     * bars before it are quieter and it stands at full strength. What comes after is a
     * forecast: a dashed line, or bars in a faint tint.
     */
    current?: number;
    /** The series' colour, `series-1` unless given. */
    color?: ChartColor;
    /** The marks' height in px, the labels under them not counted. */
    height?: number;
    /** A few places named under the marks, 11 in the quiet ink: the start, now, the end. */
    labels?: readonly SparklineLabel[];
    /** What the line shows, for a screen reader: "Net revenue, May 2026 to June 2027". */
    'aria-label': string;
    className?: string;
};

/** Bars take this share of their slot, and never more than this wide. */
const BAR_SHARE = 0.62;
const BAR_MAX = 12;
/** Room kept clear over the highest reading, so a dot on it is not cut. */
const HEADROOM = 4;
/** The least room between two labels under the marks. */
const LABEL_GAP = 8;

/**
 * Where a line's reading sits across: held in from both edges by the dot's reach, since the
 * reveal clips the marks to their box and a dot on the edge would lose its half.
 */
const lineX = (index: number, count: number, width: number) =>
    HEADROOM + scalePoint(index, count, width - HEADROOM * 2);

/**
 * A measure's recent shape in a few dozen pixels, for a stat card: no axes, no grid, no frame,
 * since the card's figure says how much and the line only says which way it went. A few places
 * named under it give the stretch it covers. It reads at a glance or not at all, so it takes
 * no pointer: the readings are in the card's figures and in the chart it opens to.
 */
export const Sparkline = ({
    data,
    kind = 'area',
    current,
    color = 'series-1',
    height = 40,
    labels,
    'aria-label': label,
    className,
}: SparklineProps) => {
    const [ref, width] = useWidth<HTMLDivElement>();
    const id = useId();
    const ink = chartColor(color);
    const now = current ?? data.length - 1;

    return (
        <figure
            aria-label={label}
            className={cn('m-0 flex min-w-0 flex-col', className)}
            role="img"
        >
            <div className="relative w-full" ref={ref} style={{ height }}>
                {width > 0 && data.length > 0 && (
                    <svg
                        aria-hidden="true"
                        className="absolute inset-0 overflow-visible motion-safe:animate-reveal"
                        height={height}
                        width={width}
                    >
                        {kind === 'bar' ? (
                            <Bars data={data} height={height} ink={ink} now={now} width={width} />
                        ) : (
                            <Line
                                data={data}
                                height={height}
                                id={id}
                                ink={ink}
                                now={now}
                                wash={kind === 'area'}
                                width={width}
                            />
                        )}
                    </svg>
                )}
            </div>
            {labels && labels.length > 0 && (
                <SparklineLabels count={data.length} kind={kind} labels={labels} width={width} />
            )}
        </figure>
    );
};

type MarksProps = {
    data: readonly number[];
    width: number;
    height: number;
    ink: string;
    now: number;
};

const Line = ({
    data,
    width,
    height,
    ink,
    now,
    wash,
    id,
}: MarksProps & { wash: boolean; id: string }) => {
    const { min, max } = extent(data);
    /*
     * A line stands on its own range, not on zero: the shape is what it is for. But never on less
     * than a fifth of its level, so a measure that held steady reads as steady rather than as a
     * swing of a few seconds blown up to the full height.
     */
    const middle = (min + max) / 2;
    const span = Math.max(max - min, Math.abs(middle) * 0.2) || 1;
    const low = middle - span / 2;
    const points: Point[] = data.map((value, i) => ({
        x: lineX(i, data.length, width),
        y: HEADROOM + (1 - (value - low) / span) * (height - HEADROOM * 2),
    }));
    const done = points.slice(0, now + 1);
    const ahead = points.slice(now);
    const dot = points[now];

    return (
        <>
            {wash && done.length > 1 && (
                <>
                    <defs>
                        <linearGradient id={`${id}-wash`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" stopColor={ink} stopOpacity={0.2} />
                            <stop offset="1" stopColor={ink} stopOpacity={0.04} />
                        </linearGradient>
                    </defs>
                    <path d={areaPath(done, height)} fill={`url(#${id}-wash)`} />
                </>
            )}
            {ahead.length > 1 && (
                <path
                    d={curvePath(ahead)}
                    fill="none"
                    stroke={ink}
                    strokeDasharray="6 4"
                    strokeOpacity={0.5}
                    strokeWidth={1.5}
                />
            )}
            {done.length > 1 && (
                <path
                    d={curvePath(done)}
                    fill="none"
                    stroke={ink}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                />
            )}
            {dot && (
                <circle
                    cx={dot.x}
                    cy={dot.y}
                    fill={ink}
                    r={3}
                    stroke="var(--color-neutral-50)"
                    strokeWidth={2}
                />
            )}
        </>
    );
};

const Bars = ({ data, width, height, ink, now }: MarksProps) => {
    const { max } = extent([0, ...data]);
    const { slot, center } = slotScale(data.length, width);
    const bar = Math.max(2, Math.min(slot * BAR_SHARE, BAR_MAX));
    const radius = Math.min(3, bar / 2);

    return (
        <>
            {data.map((value, i) => {
                const size = Math.max(2, (value / (max || 1)) * height);
                // Before now quieter, now itself full, after it a forecast in a faint tint.
                const opacity = i === now ? 1 : i < now ? 0.45 : 0.18;
                return (
                    <path
                        d={barPath(center(i) - bar / 2, height - size, bar, size, radius)}
                        fill={ink}
                        fillOpacity={opacity}
                        // biome-ignore lint/suspicious/noArrayIndexKey: a reading's place is its key
                        key={i}
                    />
                );
            })}
        </>
    );
};

/** A bar flat on the baseline, rounded at its head. */
const barPath = (x: number, y: number, w: number, h: number, r: number) => {
    const radius = Math.min(r, h);
    return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
};

/**
 * The named places, each under its reading: the first held to the left edge, the last to the
 * right, one between centred on its reading. One that would run into a neighbour is left out,
 * the ends kept first.
 */
const SparklineLabels = ({
    labels,
    count,
    width,
    kind,
}: {
    labels: readonly SparklineLabel[];
    count: number;
    width: number;
    kind: SparklineProps['kind'];
}) => {
    const xOf = (at: number) =>
        kind === 'bar' ? slotScale(count, width).center(at) : lineX(at, count, width);
    const ref = useRef<HTMLDivElement>(null);
    // Each label's width as set, measured: the theme's font decides it, not a guess.
    const [sizes, setSizes] = useState<readonly number[]>([]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: new labels are new widths to measure
    useLayoutEffect(() => {
        const node = ref.current;
        if (!node || width === 0) return;
        setSizes(Array.from(node.children, child => (child as HTMLElement).offsetWidth));
    }, [width, labels]);

    const lastIndex = labels.length > 1 ? labels.length - 1 : -1;
    const shown = new Set<number>([0, lastIndex]);
    if (sizes.length === labels.length) {
        // The ends stand first; each label between is kept when it clears both its neighbours.
        const end = lastIndex > 0 ? width - (sizes[lastIndex] ?? 0) - LABEL_GAP : width;
        let reach = (sizes[0] ?? 0) + LABEL_GAP;
        for (let i = 1; i < lastIndex; i++) {
            const half = (sizes[i] ?? 0) / 2;
            const x = xOf(labels[i]?.at ?? 0);
            if (x - half >= reach && x + half <= end) {
                shown.add(i);
                reach = x + half + LABEL_GAP;
            }
        }
    }

    return (
        <div
            className="relative mt-2 h-3.5 text-[11px] text-neutral-600 tabular-nums leading-3.5"
            ref={ref}
        >
            {labels.map(({ at, label }, i) => (
                <span
                    className="absolute top-0 whitespace-nowrap"
                    // biome-ignore lint/suspicious/noArrayIndexKey: the labels are given in order
                    key={i}
                    style={{
                        ...(i === 0
                            ? { left: 0 }
                            : i === lastIndex
                              ? { right: 0 }
                              : { left: xOf(at), transform: 'translateX(-50%)' }),
                        visibility: shown.has(i) ? undefined : 'hidden',
                    }}
                >
                    {label}
                </span>
            ))}
        </div>
    );
};
