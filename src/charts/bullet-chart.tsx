'use client';

import { type CSSProperties, useState } from 'react';
import { cn } from '../lib/cn';
import { type ChartColor, chartColor } from './lib/color';
import { formatNumber } from './lib/format';
import { PLOT_FRAME } from './lib/frame';

/*
 * One measure read against its target and the ranges that say how good it is, in a single
 * line: the ranges as washes behind, the measure as a bar in front, the target as a short
 * upright tick across it. A card holds several, one under the other, so a quarter's goals are
 * read down the page at a glance.
 */

export type BulletRow = {
    /** Keys the row; its name unless given. */
    key?: string;
    /** What is measured: "Revenue". */
    name: string;
    /** Where it stands. */
    value: number;
    /** What it is meant to reach, or for a lower-is-better measure stay under. */
    target?: number;
    /**
     * Where each qualitative range ends, lowest first: `[300, 400, 500]` is poor to 300,
     * fair to 400 and good to 500. The last one ends the scale unless `max` is given.
     */
    ranges?: readonly number[];
    /** Where the scale starts; zero unless given. */
    min?: number;
    /** Where the scale ends; the furthest of the ranges, the value and the target unless given. */
    max?: number;
    /**
     * The measure is better the lower it is, as churn or a response time is: the ranges deepen
     * towards the high end, and the target is met by staying at or under it.
     */
    lowerIsBetter?: boolean;
    /** Writes this row's figures; the chart's `formatValue` unless given. */
    format?: (value: number) => string;
};

export type BulletChartProps = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    data: readonly BulletRow[];
    /** Writes the figures of every row that has no `format` of its own. */
    formatValue?: (value: number) => string;
    /**
     * `above` writes each row's name and figure over its line, for a narrow card; `beside`
     * keeps the name to the left and the figure to the right, one line a row, for a wide one.
     */
    layout?: 'above' | 'beside';
    /** The measure's colour; the first series unless given. */
    color?: ChartColor;
    /**
     * `solid` fills the measure; `tint` draws it as the kit's other tinted marks, a tint of its
     * colour with a solid edge at its head.
     */
    fill?: 'solid' | 'tint';
    /** With no data, the rows are skeletons. */
    loading?: boolean;
    emptyLabel?: string;
    className?: string;
    style?: CSSProperties;
};

/** The track the ranges are drawn in, and the measure inside it. */
const TRACK = 16;
const MEASURE = 6;
/** The washes, lightest to deepest, as shares of the strongest ink over the surface. */
const WASHES = [6, 11, 17, 23];

const wash = (depth: number) =>
    `color-mix(in oklab, var(--color-neutral-950) ${WASHES[Math.min(depth, WASHES.length - 1)]}%, transparent)`;

const scaleOf = (row: BulletRow) => {
    const min = row.min ?? 0;
    const max =
        row.max ??
        Math.max(row.value, row.target ?? Number.NEGATIVE_INFINITY, ...(row.ranges ?? [min]));
    return { min, max: max > min ? max : min + 1 };
};

/** Whether the row is at its target, on the side its direction calls good. */
const metOf = (row: BulletRow) =>
    row.target === undefined
        ? undefined
        : row.lowerIsBetter
          ? row.value <= row.target
          : row.value >= row.target;

export const BulletChart = ({
    'aria-label': label,
    data,
    formatValue,
    layout = 'above',
    color = 'series-1',
    fill = 'solid',
    loading = false,
    emptyLabel = 'No data yet',
    className,
    style,
}: BulletChartProps) => {
    const [active, setActive] = useState<number | null>(null);
    const writeOf = (row: BulletRow) => row.format ?? formatValue ?? formatNumber;
    const ink = chartColor(color);
    const tinted = fill === 'tint';
    const rows = loading ? [] : data;

    if (loading) {
        return (
            <figure
                aria-busy
                aria-label={label}
                className={cn('m-0 flex w-full flex-col gap-5', className)}
                data-slot="bullet-chart"
                style={style}
            >
                {[0, 1, 2].map(i => (
                    <div aria-hidden className="flex flex-col gap-2" key={i}>
                        <div className="h-3 w-24 rounded-xs bg-neutral-950/4" />
                        <div
                            className="overflow-hidden rounded-xs bg-neutral-950/4"
                            style={{ height: TRACK }}
                        >
                            <div className="size-full bg-[linear-gradient(100deg,transparent_38%,color-mix(in_oklab,var(--color-neutral-50)_85%,transparent)_50%,transparent_62%)] bg-size-[250%_100%] bg-no-repeat motion-safe:animate-shine" />
                        </div>
                    </div>
                ))}
            </figure>
        );
    }

    if (rows.length === 0) {
        return (
            <figure
                aria-label={label}
                className={cn('m-0 w-full', className)}
                data-slot="bullet-chart"
                style={style}
            >
                <p className="flex h-32 items-center justify-center rounded-item border border-neutral-200 border-dashed text-neutral-600 text-xs">
                    {emptyLabel}
                </p>
            </figure>
        );
    }

    return (
        <figure
            aria-label={label}
            className={cn(
                'm-0 w-full',
                // Beside, the rows share their columns, so every line starts and ends together.
                layout === 'above'
                    ? 'flex flex-col gap-7'
                    : // The names and figures keep 8px clear of each track's frame.
                      'grid grid-cols-[minmax(0,max-content)_minmax(0,1fr)_auto] gap-x-2 gap-y-3',
                className,
            )}
            data-slot="bullet-chart"
            onPointerLeave={() => setActive(null)}
            style={style}
        >
            {rows.map((row, index) => {
                const write = writeOf(row);
                const { min, max } = scaleOf(row);
                const at = (value: number) =>
                    `${(Math.max(0, Math.min(1, (value - min) / (max - min))) * 100).toFixed(3)}%`;
                const ranges = (row.ranges ?? []).filter(end => end > min);
                const met = metOf(row);
                const figure = write(row.value);
                const goal =
                    row.target === undefined
                        ? undefined
                        : row.lowerIsBetter
                          ? `target ≤ ${write(row.target)}`
                          : `of ${write(row.target)}`;
                const valueText = [
                    figure,
                    goal,
                    met === undefined ? undefined : met ? 'on target' : 'short of target',
                ]
                    .filter(Boolean)
                    .join(', ');
                const head = `min(var(--radius-item), ${MEASURE / 2}px)`;

                const name = (
                    <span className="min-w-0 truncate text-neutral-600 text-xs">{row.name}</span>
                );
                const figures = (
                    <span className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
                        <span
                            className={cn(
                                'font-medium text-neutral-950 tabular-nums',
                                // Above, the figure's own leading is kept tight, so the name and
                                // figure sit on their line rather than between two.
                                layout === 'above' ? 'text-lg leading-6' : 'text-xs',
                            )}
                        >
                            {figure}
                        </span>
                        {goal && (
                            <span className="text-neutral-600 text-xxs tabular-nums">{goal}</span>
                        )}
                    </span>
                );

                const line = (
                    <div className="relative min-w-0 shrink-0" style={{ height: TRACK }}>
                        {/*
                         * The track is the plot: the ranges, the measure and the target all stay
                         * inside its frame, cut to its corner.
                         */}
                        <div className="absolute inset-0 overflow-hidden rounded-item">
                            {/* The ranges, deepest where the measure is poorest. */}
                            {ranges.length === 0 ? (
                                <div className="absolute inset-0" style={{ background: wash(0) }} />
                            ) : (
                                ranges.map((end, i) => {
                                    const from = i === 0 ? min : (ranges[i - 1] ?? min);
                                    const last = i === ranges.length - 1;
                                    const depth = row.lowerIsBetter ? i : ranges.length - 1 - i;
                                    return (
                                        <div
                                            className="absolute inset-y-0"
                                            key={end}
                                            style={{
                                                background: wash(depth),
                                                left: at(from),
                                                // The last range runs to the scale's end.
                                                right: last ? 0 : undefined,
                                                width: last
                                                    ? undefined
                                                    : `calc(${at(end)} - ${at(from)})`,
                                            }}
                                        />
                                    );
                                })
                            )}
                            {/* The measure, in front: flat at the start, rounded at its head. */}
                            <div
                                className="absolute left-0 motion-safe:animate-reveal"
                                style={{
                                    background: tinted
                                        ? `color-mix(in oklab, ${ink} 20%, transparent)`
                                        : ink,
                                    borderRadius: `0 ${head} ${head} 0`,
                                    boxShadow: tinted ? `inset -2px 0 0 ${ink}` : undefined,
                                    height: MEASURE,
                                    top: (TRACK - MEASURE) / 2,
                                    width: at(row.value),
                                }}
                            />
                            {/* The target, an upright tick across the measure and the ranges. */}
                            {row.target !== undefined && (
                                <div
                                    className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-neutral-950"
                                    style={{ left: at(row.target) }}
                                />
                            )}
                        </div>
                        <div
                            aria-hidden
                            className={cn(PLOT_FRAME, 'inset-0')}
                            data-slot="chart-frame"
                        />
                    </div>
                );

                return (
                    // biome-ignore lint/a11y/useSemanticElements: a <meter> cannot hold the row's name, figures and ranges, so the row takes its role
                    <div
                        aria-label={row.name}
                        aria-valuemax={max}
                        aria-valuemin={min}
                        aria-valuenow={row.value}
                        aria-valuetext={valueText}
                        className={cn(
                            'min-w-0 transition-opacity duration-150 motion-reduce:transition-none',
                            layout === 'above'
                                ? 'flex flex-col gap-2'
                                : 'col-span-3 grid grid-cols-subgrid items-center',
                            active !== null && active !== index && 'opacity-35',
                        )}
                        data-slot="bullet-row"
                        key={row.key ?? row.name}
                        onPointerEnter={() => setActive(index)}
                        role="meter"
                    >
                        {layout === 'above' ? (
                            <>
                                <div className="flex min-w-0 items-baseline justify-between gap-3">
                                    {name}
                                    {figures}
                                </div>
                                {line}
                            </>
                        ) : (
                            <>
                                <div className="flex min-w-0 max-w-40">{name}</div>
                                {line}
                                <div className="flex justify-end">{figures}</div>
                            </>
                        )}
                    </div>
                );
            })}

            {/* The figures themselves, for a reader who cannot see the marks. */}
            <div className="sr-only">
                <table>
                    <caption>{label}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Measure</th>
                            <th scope="col">Value</th>
                            <th scope="col">Target</th>
                            <th scope="col">Ranges</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => {
                            const write = writeOf(row);
                            return (
                                <tr key={row.key ?? row.name}>
                                    <th scope="row">{row.name}</th>
                                    <td>{write(row.value)}</td>
                                    <td>
                                        {row.target === undefined
                                            ? '—'
                                            : `${row.lowerIsBetter ? '≤ ' : ''}${write(row.target)}`}
                                    </td>
                                    <td>{(row.ranges ?? []).map(write).join(', ')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};
