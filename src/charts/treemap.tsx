'use client';

import { type ReactNode, useState } from 'react';
import { Badge } from '../components/badge';
import { cn } from '../lib/cn';
import { type ChartColor, chartColor, seriesColor } from './lib/color';
import { formatNumber, formatPercent } from './lib/format';
import { PLOT_FRAME } from './lib/frame';
import { squarify } from './lib/layout';
import { useWidth } from './lib/use-size';
import { ChartTooltip } from './tooltip';

export type TreemapItem = {
    name: string;
    value: number;
    /** The change on the period before, as it should read: "+2.6%". */
    delta?: string;
    /** A 14px icon before the name. */
    icon?: ReactNode;
    color?: ChartColor;
};

export type TreemapProps = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    data: readonly TreemapItem[];
    height?: number;
    /** Writes a tile's figure; its share of the whole unless given. */
    formatValue?: (value: number, share: number) => string;
    /** While the data loads: the chart's own shape stands in, in the skeleton wash, at the size it will have. */
    loading?: boolean;
    className?: string;
};

/**
 * The stand-in's shares: one part that takes most, a few middling and a small one, as spending
 * or traffic tends to split, so the tiles read as data waiting and not as a grid.
 */
const SKELETON_SHARES = [44, 18, 13, 11, 8, 6];

/** The widths of the stand-in's names, in the tiles large enough to write one. */
const SKELETON_NAMES = [72, 88, 64, 80, 56, 68];

/** A bar on a stand-in tile, a step stronger than the tile's own wash so it reads over it. */
const SKELETON_BAR = 'color-mix(in oklab, var(--color-neutral-950) 7%, transparent)';

const GAP = 4;
/**
 * The tiles stand inside their frame's hairline with the same room as between them; the frame's
 * corner is the tiles' corner grown by that inset, so the two stay concentric.
 */
const INSET = 1 + GAP;
/**
 * Parts of a whole as tiles, each as large as its share and as square as the shares allow.
 * A tile is a tint of its colour, keyed by the same upright stroke the readout uses, and it
 * says as much as it has room for: its name, then its figure, then its change.
 */
export const Treemap = ({
    'aria-label': label,
    data,
    height = 280,
    formatValue,
    loading = false,
    className,
}: TreemapProps) => {
    const [ref, width] = useWidth<HTMLDivElement>();
    const [active, setActive] = useState<number | null>(null);
    const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0);
    // While it loads, the stand-in's shares are tiled as the data will be, by the same layout.
    const tiles = squarify(loading ? SKELETON_SHARES : data.map(item => item.value), {
        x: INSET,
        y: INSET,
        width: Math.max(0, width - INSET * 2) + GAP,
        height: Math.max(0, height - INSET * 2) + GAP,
    });

    return (
        <figure
            aria-busy={loading || undefined}
            aria-label={label}
            className={cn('relative m-0 min-w-0', className)}
            data-slot="treemap"
        >
            <div className="relative" ref={ref} style={{ height }}>
                {/* The tiles are held to the frame's rect and corner, never past its hairline. */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ borderRadius: `calc(var(--radius-item) + ${INSET}px)` }}
                >
                    {width > 0 && loading && (
                        <div aria-hidden className="absolute inset-0" data-slot="chart-skeleton">
                            {tiles.map((tile, index) => {
                                if (tile.width <= GAP || tile.height <= GAP) return null;
                                const w = tile.width - GAP;
                                const h = tile.height - GAP;
                                return (
                                    <div
                                        className="skeleton absolute flex flex-col justify-between overflow-hidden rounded-item p-5"
                                        // biome-ignore lint/suspicious/noArrayIndexKey: the stand-in never reorders
                                        key={index}
                                        style={{ height: h, left: tile.x, top: tile.y, width: w }}
                                    >
                                        {/*
                                         * Where a tile would write its name and figure, a bar
                                         * holds each line at its height, a step firmer than
                                         * the tile it sits on.
                                         */}
                                        {w >= 96 && h >= 56 && (
                                            <span className="flex min-w-0 items-center text-xs">
                                                <span className="invisible w-0">0</span>
                                                <span
                                                    className="skeleton h-2.5 min-w-0 rounded-chip"
                                                    style={{
                                                        backgroundColor: SKELETON_BAR,
                                                        width: SKELETON_NAMES[index] ?? 64,
                                                    }}
                                                />
                                            </span>
                                        )}
                                        {h >= 84 && w >= 80 && (
                                            <span className="flex min-w-0 items-center text-lg">
                                                <span className="invisible w-0">0</span>
                                                <span
                                                    className="skeleton h-[0.75em] w-12 min-w-0 rounded-chip"
                                                    style={{ backgroundColor: SKELETON_BAR }}
                                                />
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {width > 0 &&
                        !loading &&
                        data.map((item, index) => {
                            const tile = tiles[index];
                            if (!tile || tile.width <= GAP || tile.height <= GAP) return null;
                            const w = tile.width - GAP;
                            const h = tile.height - GAP;
                            const color = chartColor(item.color ?? seriesColor(index));
                            const share = total ? item.value / total : 0;
                            const named = w >= 96 && h >= 56;
                            const figured = h >= 84 && w >= 80;

                            return (
                                <div
                                    className="absolute flex flex-col justify-between overflow-hidden rounded-item p-5 transition-colors duration-150 motion-reduce:transition-none"
                                    key={item.name}
                                    onPointerEnter={() => setActive(index)}
                                    onPointerLeave={() => setActive(null)}
                                    style={{
                                        background: `color-mix(in oklab, ${color} ${active === index ? 26 : 16}%, transparent)`,
                                        height: h,
                                        left: tile.x,
                                        top: tile.y,
                                        width: w,
                                    }}
                                >
                                    {named && (
                                        <span className="flex min-w-0 items-center gap-2 font-medium text-neutral-950 text-xs">
                                            {!item.icon && (
                                                <span
                                                    aria-hidden
                                                    className="h-3 w-0.75 shrink-0 rounded-full"
                                                    style={{ background: color }}
                                                />
                                            )}
                                            {item.icon && (
                                                <span
                                                    aria-hidden
                                                    className="flex shrink-0 [&_svg]:size-3.5"
                                                    style={{ color }}
                                                >
                                                    {item.icon}
                                                </span>
                                            )}
                                            <span className="truncate">{item.name}</span>
                                        </span>
                                    )}
                                    {figured && (
                                        <span className="flex min-w-0 items-end justify-between gap-2">
                                            {/*
                                             * One size on every tile, a step under the card's own
                                             * figure: the tile's area already says how large it is.
                                             */}
                                            <span className="font-medium text-lg text-neutral-950 tabular-nums">
                                                {formatValue
                                                    ? formatValue(item.value, share)
                                                    : formatPercent(share)}
                                            </span>
                                            {/*
                                             * The change is a deeper tint of the tile's own colour,
                                             * so the tile keeps one hue; its sign says which way.
                                             */}
                                            {item.delta && w >= 120 && (
                                                <Badge
                                                    className="self-center text-neutral-950 tabular-nums"
                                                    style={{
                                                        background: `color-mix(in oklab, ${color} 24%, transparent)`,
                                                    }}
                                                    variant="pill"
                                                >
                                                    {item.delta}
                                                </Badge>
                                            )}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                </div>
                {(() => {
                    // A tile too small to write its own name and figure is read out beside it, in
                    // the readout every chart uses.
                    const tile = active !== null && !loading ? tiles[active] : undefined;
                    const item = active !== null ? data[active] : undefined;
                    if (!tile || !item) return null;
                    const w = tile.width - GAP;
                    const h = tile.height - GAP;
                    if (w >= 80 && h >= 84) return null;
                    const share = total ? item.value / total : 0;
                    const left = tile.x + w / 2 < width / 2;
                    return (
                        <div
                            className="pointer-events-none absolute z-10"
                            style={{
                                left: left ? tile.x + w + 8 : undefined,
                                right: left ? undefined : width - tile.x + 8,
                                top: Math.max(0, Math.min(height - 64, tile.y)),
                            }}
                        >
                            <ChartTooltip
                                rows={[
                                    {
                                        color:
                                            item.color ??
                                            (`series-${Math.min((active ?? 0) + 1, 5)}` as ChartColor),
                                        name: item.name,
                                        value: formatValue
                                            ? formatValue(item.value, share)
                                            : formatPercent(share),
                                    },
                                ]}
                            />
                        </div>
                    );
                })()}
                <div
                    aria-hidden
                    className={cn(PLOT_FRAME, 'inset-0')}
                    style={{ borderRadius: `calc(var(--radius-item) + ${INSET}px)` }}
                />
            </div>
            <div className={cn('sr-only', loading && 'hidden')}>
                <table>
                    <caption>{label}</caption>
                    <tbody>
                        {data.map(item => (
                            <tr key={item.name}>
                                <th scope="row">{item.name}</th>
                                <td>{formatNumber(item.value)}</td>
                                <td>{formatPercent(total ? item.value / total : 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};
