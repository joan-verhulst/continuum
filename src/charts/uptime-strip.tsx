'use client';

import { type ReactNode, useLayoutEffect, useState } from 'react';
import { cn } from '../lib/cn';
import { chartColor } from './lib/color';
import { formatDateLong, formatPercent } from './lib/format';
import { PLOT_FRAME } from './lib/frame';
import { useWidth } from './lib/use-size';
import { ChartTooltip } from './tooltip';

export type UptimeState = 'operational' | 'degraded' | 'outage' | 'none';

export type UptimeDay = {
    date: Date;
    state: UptimeState;
    /** Minutes the service was down that day; an outage without it counts the whole day. */
    downtime?: number;
    /** A line on what happened, read in the readout: "Webhooks queued for 40 minutes". */
    note?: ReactNode;
};

export type UptimeService = {
    name: string;
    /** One entry a day, oldest first. */
    days: readonly UptimeDay[];
    /** The share of the period it was up, 0 to 1; worked out from the days' downtime unless given. */
    uptime?: number;
};

export type UptimeStripProps = {
    /** Says what the chart shows; it names the chart for a screen reader. */
    'aria-label': string;
    services: readonly UptimeService[];
    /** How many of the most recent days a row shows at most. */
    days?: number;
    /** The height of a day's block, in px. */
    blockHeight?: number;
    /** Writes the uptime at a row's end; a percentage to two decimals unless given. */
    formatUptime?: (share: number) => string;
    /** The line shown when there is nothing to draw. */
    emptyLabel?: string;
    /** While the data loads: the chart's own shape stands in, in the skeleton wash, at the size it will have. */
    loading?: boolean;
    className?: string;
};

const GAP = 2;
/** Narrower than this a block stops reading as a day, so the row shows fewer days instead. */
const MIN_BLOCK = 3;
const DAY_MINUTES = 24 * 60;
/** Under this the name and the uptime go over the row rather than beside it. */
const STACK_UNDER = 520;

const STATES: Record<UptimeState, { label: string; color: string }> = {
    // The usual day is a tint, so the days that went wrong are the ones that carry.
    operational: {
        label: 'Operational',
        color: `color-mix(in oklab, ${chartColor('success')} 45%, transparent)`,
    },
    degraded: { label: 'Degraded', color: chartColor('warning') },
    outage: { label: 'Outage', color: chartColor('error') },
    none: { label: 'No data', color: 'var(--color-neutral-200)' },
};

/**
 * The stand-in rows while the days load, as the widths of a name and an uptime in px: names of
 * a word, uptimes of a figure like 99.93%, so the columns are near the width they will have.
 */
const SKELETON_ROWS = [
    [48, 44],
    [72, 40],
    [64, 44],
    [40, 36],
] as const;

/** A line of text standing in as a bar, on the text's own line so the row keeps its height. */
const SkeletonText = ({
    width,
    end = false,
    text,
    figure = false,
}: {
    width: number;
    end?: boolean;
    /** The text the row will show, when known: set unseen, it sizes the column as it will be. */
    text?: string;
    /** Set in the figure's weight and numerals. */
    figure?: boolean;
}) =>
    text ? (
        <span className={cn('relative flex min-w-0 items-center text-xs', end && 'justify-end')}>
            <span className={cn('invisible truncate', figure && 'font-medium tabular-nums')}>
                {text}
            </span>
            <span
                className={cn('skeleton absolute h-2.5 rounded-chip', end ? 'right-0' : 'left-0')}
                style={{ width: `min(${width}px, 100%)` }}
            />
        </span>
    ) : (
        <span className={cn('flex shrink-0 items-center text-xs', end && 'justify-end')}>
            <span className="invisible w-0">0</span>
            <span className="skeleton h-2.5 rounded-chip" style={{ width }} />
        </span>
    );

const downtimeOf = (day: UptimeDay) => day.downtime ?? (day.state === 'outage' ? DAY_MINUTES : 0);

/** The share of the counted days the service was up; days without data are left out. */
const uptimeOf = (service: UptimeService, days: number) => {
    if (service.uptime != null) return service.uptime;
    const counted = service.days.slice(-days).filter(day => day.state !== 'none');
    if (counted.length === 0) return null;
    const down = counted.reduce((sum, day) => sum + downtimeOf(day), 0);
    return 1 - down / (counted.length * DAY_MINUTES);
};

const writeUptime = (share: number) => formatPercent(share, share === 1 ? 0 : 2);

/** "No downtime", "12 min", "1 h 24 min". */
const writeDowntime = (minutes: number) => {
    if (minutes <= 0) return 'None';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m ? `${h} h ${m} min` : `${h} h`;
};

/**
 * A row of days for each service, the most recent at the right, each day a block in the
 * colour of how it went. The blocks share the width between them; where it is too narrow
 * for every day, a row shows the most recent days that fit rather than squeeze a block
 * below a few pixels. The uptime closes the row, and a block names its day when pointed at.
 */
export const UptimeStrip = ({
    'aria-label': label,
    services,
    days = 90,
    blockHeight = 28,
    formatUptime = writeUptime,
    emptyLabel = 'No services to show.',
    loading = false,
    className,
}: UptimeStripProps) => {
    const [rootRef, rootWidth] = useWidth<HTMLElement>();
    // Held in state, not a ref: the first row's strip is a new node when the stand-in rows give
    // way to the services, and the width has to be read from the one on the page.
    const [strip, setStrip] = useState<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    useLayoutEffect(() => {
        if (!strip) return;
        const read = () => setWidth(strip.clientWidth);
        read();
        const observer = new ResizeObserver(read);
        observer.observe(strip);
        return () => observer.disconnect();
    }, [strip]);
    const [active, setActive] = useState<{ row: number; day: number } | null>(null);
    const stacked = rootWidth > 0 && rootWidth < STACK_UNDER;
    const longest = services.reduce((most, service) => Math.max(most, service.days.length), 0);
    // While it loads there are no days to count, so the row is as long as it was asked to be.
    const period = loading ? days : Math.min(days, longest);
    const fits = width > 0 ? Math.max(1, Math.floor((width + GAP) / (MIN_BLOCK + GAP))) : period;
    const shown = Math.min(period, fits);
    const block = shown > 0 ? (width - GAP * (shown - 1)) / shown : 0;

    const grid = cn(
        'grid min-w-0 items-center',
        // The names and the uptimes keep 8px clear of the frames.
        stacked ? 'grid-cols-1 gap-y-2' : 'grid-cols-[auto_minmax(0,1fr)_auto] gap-x-2 gap-y-3',
    );

    const axis = (
        <>
            {!stacked && <span />}
            <div
                aria-hidden
                className="flex justify-between text-xxs"
                style={{
                    color: 'var(--color-chart-label)',
                    // 8px under the last frame, where the rows between them keep 12px.
                    marginTop: stacked ? 0 : -4,
                }}
            >
                <span>{shown} days ago</span>
                <span>Today</span>
            </div>
            {!stacked && <span />}
        </>
    );

    if (loading) {
        // As many rows as there are services, when they are known; the days are what loads.
        const count = services.length || SKELETON_ROWS.length - 1;
        return (
            <figure
                aria-busy
                aria-label={label}
                className={cn('m-0 min-w-0', className)}
                data-slot="uptime-strip"
                ref={rootRef}
            >
                <div aria-hidden className={grid} data-slot="chart-skeleton">
                    {Array.from({ length: count }, (_, row) => {
                        const [name, uptime] = SKELETON_ROWS[row % SKELETON_ROWS.length] ?? [];
                        // A known service lends its name and figure, unseen, so the columns keep their widths.
                        const service = services[row];
                        const share = service ? uptimeOf(service, period) : null;
                        const nameText = service?.name;
                        const figureText = share == null ? undefined : formatUptime(share);
                        return (
                            // biome-ignore lint/suspicious/noArrayIndexKey: a stand-in row is its place.
                            <div className="contents" key={row}>
                                {stacked ? (
                                    <div
                                        className={cn(
                                            'flex min-w-0 items-center justify-between gap-3',
                                            row > 0 && 'mt-2',
                                        )}
                                    >
                                        <SkeletonText text={nameText} width={name ?? 48} />
                                        <SkeletonText
                                            end
                                            figure
                                            text={figureText}
                                            width={uptime ?? 44}
                                        />
                                    </div>
                                ) : (
                                    <span className="flex min-w-0 max-w-48">
                                        <SkeletonText text={nameText} width={name ?? 48} />
                                    </span>
                                )}
                                {/* The days at their own size and gaps, each a block of the wash. */}
                                <div className="relative min-w-0">
                                    <div
                                        className="flex min-w-0 overflow-hidden rounded-item"
                                        ref={row === 0 ? setStrip : undefined}
                                        style={{ gap: GAP, height: blockHeight }}
                                    >
                                        {width > 0 &&
                                            Array.from({ length: shown }, (_, index) => (
                                                <span
                                                    className="skeleton h-full min-w-0 flex-1 rounded-[2px]"
                                                    // biome-ignore lint/suspicious/noArrayIndexKey: a block is its place in the row.
                                                    key={index}
                                                />
                                            ))}
                                    </div>
                                    <div
                                        aria-hidden
                                        className={cn(PLOT_FRAME, 'inset-0')}
                                        data-slot="chart-frame"
                                    />
                                </div>
                                {!stacked && (
                                    <SkeletonText
                                        end
                                        figure
                                        text={figureText}
                                        width={uptime ?? 44}
                                    />
                                )}
                            </div>
                        );
                    })}
                    {axis}
                </div>
            </figure>
        );
    }

    if (services.length === 0 || period === 0) {
        return (
            <figure
                aria-label={label}
                className={cn('m-0 min-w-0', className)}
                data-slot="uptime-strip"
            >
                <p className="flex h-32 items-center justify-center rounded-item border border-neutral-300 border-dashed text-neutral-600 text-xs">
                    {emptyLabel}
                </p>
            </figure>
        );
    }

    const name = (service: UptimeService) => (
        <span className="min-w-0 truncate text-neutral-600 text-xs" title={service.name}>
            {service.name}
        </span>
    );

    const uptime = (service: UptimeService) => {
        const share = uptimeOf(service, period);
        return (
            <span className="shrink-0 text-right font-medium text-neutral-950 text-xs tabular-nums">
                {share == null ? '–' : formatUptime(share)}
            </span>
        );
    };

    return (
        <figure
            aria-label={label}
            className={cn('m-0 min-w-0', className)}
            data-slot="uptime-strip"
            ref={rootRef}
        >
            <div className={grid}>
                {services.map((service, row) => {
                    const recent = service.days.slice(-shown);
                    // A service watched for fewer days than the others starts later, so its days still meet the axis.
                    const pad = shown - recent.length;
                    return (
                        <div className="contents" key={service.name}>
                            {stacked ? (
                                <div
                                    className={cn(
                                        'flex min-w-0 items-baseline justify-between gap-3',
                                        row > 0 && 'mt-2',
                                    )}
                                >
                                    {name(service)}
                                    {uptime(service)}
                                </div>
                            ) : (
                                <span className="flex min-w-0 max-w-48">{name(service)}</span>
                            )}
                            {/*
                             * Each row's blocks fill a frame of their own, cut to its corner: the
                             * frame hugs the days, and the name and uptime stand outside it.
                             */}
                            <div
                                className="relative min-w-0"
                                onPointerLeave={() => setActive(null)}
                            >
                                <div
                                    className="flex min-w-0 overflow-hidden rounded-item"
                                    ref={row === 0 ? setStrip : undefined}
                                    style={{ gap: GAP, height: blockHeight }}
                                >
                                    {width > 0 &&
                                        Array.from({ length: shown }, (_, index) => {
                                            const day = index < pad ? null : recent[index - pad];
                                            const state = day?.state ?? 'none';
                                            const lit =
                                                active === null ||
                                                active.row !== row ||
                                                active.day === index;
                                            return (
                                                <span
                                                    className="h-full min-w-0 flex-1 rounded-[2px] transition-opacity duration-150 motion-reduce:transition-none"
                                                    // biome-ignore lint/suspicious/noArrayIndexKey: a block is its place in the row.
                                                    key={index}
                                                    onPointerEnter={() =>
                                                        setActive({ row, day: index })
                                                    }
                                                    style={{
                                                        background: STATES[state].color,
                                                        opacity: lit ? 1 : 0.35,
                                                    }}
                                                />
                                            );
                                        })}
                                </div>
                                <div
                                    aria-hidden
                                    className={cn(PLOT_FRAME, 'inset-0')}
                                    data-slot="chart-frame"
                                />
                                {active?.row === row &&
                                    (() => {
                                        const day =
                                            active.day < pad ? null : recent[active.day - pad];
                                        const x = active.day * (block + GAP) + block / 2;
                                        const side =
                                            x < 96 ? 'left' : x > width - 96 ? 'right' : 'centre';
                                        const state = day?.state ?? 'none';
                                        return (
                                            <div
                                                className="pointer-events-none absolute z-10"
                                                style={{
                                                    bottom: blockHeight + 6,
                                                    left:
                                                        side === 'left'
                                                            ? Math.max(0, x - block / 2)
                                                            : side === 'centre'
                                                              ? x
                                                              : undefined,
                                                    right:
                                                        side === 'right'
                                                            ? Math.max(0, width - x - block / 2)
                                                            : undefined,
                                                    transform:
                                                        side === 'centre'
                                                            ? 'translateX(-50%)'
                                                            : undefined,
                                                }}
                                            >
                                                <ChartTooltip
                                                    rows={[
                                                        {
                                                            color: STATES[state].color,
                                                            name: 'State',
                                                            value: STATES[state].label,
                                                        },
                                                        ...(day && state !== 'none'
                                                            ? [
                                                                  {
                                                                      name: 'Downtime',
                                                                      value: writeDowntime(
                                                                          downtimeOf(day),
                                                                      ),
                                                                  },
                                                              ]
                                                            : []),
                                                    ]}
                                                    title={
                                                        day
                                                            ? `${service.name}, ${formatDateLong(day.date)}`
                                                            : service.name
                                                    }
                                                >
                                                    {day?.note && (
                                                        <p className="mt-2 max-w-56 text-neutral-600 text-xxs">
                                                            {day.note}
                                                        </p>
                                                    )}
                                                </ChartTooltip>
                                            </div>
                                        );
                                    })()}
                            </div>
                            {!stacked && uptime(service)}
                        </div>
                    );
                })}
                {axis}
            </div>
            <div className="sr-only">
                <table>
                    <caption>{label}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Service</th>
                            <th scope="col">Uptime</th>
                            <th scope="col">Days degraded</th>
                            <th scope="col">Days with an outage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(service => {
                            const share = uptimeOf(service, period);
                            const recent = service.days.slice(-period);
                            return (
                                <tr key={service.name}>
                                    <th scope="row">{service.name}</th>
                                    <td>{share == null ? '–' : formatUptime(share)}</td>
                                    <td>{recent.filter(day => day.state === 'degraded').length}</td>
                                    <td>{recent.filter(day => day.state === 'outage').length}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </figure>
    );
};
