'use client';

import { ArrowUpRight, Check, Copy, Download, EllipsisVertical } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { Button } from '../components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/dropdown-menu';
import { cn } from '../lib/cn';
import { Cartesian, type CartesianProps, type ChartRow, type ChartSeries } from './cartesian';
import { CHANGE_INK, type ChartColor, chartColor } from './lib/color';

/** The figures behind a chart, as a table: what its download and copy hand over. */
export type ChartTable = { columns: string[]; rows: (string | number)[][] };

export type ChartFrameProps = {
    /** What is measured: "Visitors". It names the chart for a screen reader too. */
    title: string;
    /** A 16px icon before the title, for a dashboard of many cards. */
    icon?: ReactNode;
    /** The figure the card leads with, for the whole period. */
    value?: ReactNode;
    /** The change on the period before, the figure alone: "+10.7%". */
    delta?: ReactNode;
    /** What the change is measured against, read after it in the quiet ink: "on last week". */
    comparison?: ReactNode;
    /** Which way the change is to be read; a leading minus is read as down without it. */
    trend?: 'up' | 'down' | 'neutral';
    /**
     * The card's own controls at its top right: a range, a metric, a view. What narrows the
     * data (filters) belongs to the page around the card, not to the card.
     */
    actions?: ReactNode;
    /** The series key, standing close over the chart it names. */
    legend?: ReactNode;
    /** With the figures, the card offers them as a CSV download and on the clipboard. */
    table?: ChartTable;
    /** The download's name, without its extension; the title unless given. */
    filename?: string;
    /** Where the chart opens in full: a round button at the header's end. */
    onOpen?: () => void;
    /**
     * `card`, Continuum's own card, the header and the chart on one surface; `framed`, a frame
     * a step off the page with the chart on a stage of its own inside it.
     */
    variant?: 'card' | 'framed';
    className?: string;
    children: ReactNode;
};

const trendInk = CHANGE_INK;

const trendOf = (delta: ReactNode): keyof typeof trendInk =>
    typeof delta === 'string' && /^\s*[-−–]/.test(delta) ? 'down' : 'up';

const csvCell = (cell: string | number) => {
    const text = String(cell);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** The table as CSV, or with tabs between its cells for pasting into a sheet. */
const serialize = ({ columns, rows }: ChartTable, separator: ',' | '\t') =>
    [columns, ...rows]
        .map(row =>
            row.map(cell => (separator === ',' ? csvCell(cell) : String(cell))).join(separator),
        )
        .join('\n');

/**
 * The card any chart sits in, the same for every chart in the kit, in two parts with clear
 * room between them.
 *
 * The head says what the card is and what it came to: the title on the line its controls
 * stand on, the figure under it, and whatever narrows the data under that. The figure is the
 * loudest thing on the card and nothing inside the chart is as large, so the eye lands on it
 * first and reads the chart as where it came from.
 *
 * The plot is the key and the chart, the key close over the chart it names.
 *
 * `framed` puts the plot on a stage of its own inside a frame a step off the page; the
 * stage's corners are the frame's less the gap between them, so the two stay concentric.
 */
export const ChartFrame = ({
    title,
    icon,
    value,
    delta,
    comparison,
    trend,
    actions,
    legend,
    table,
    filename,
    onOpen,
    variant = 'card',
    className,
    children,
}: ChartFrameProps) => {
    const framed = variant === 'framed';

    return (
        <section
            aria-label={title}
            className={cn(
                'flex min-w-0 flex-col border border-neutral-200 shadow-card',
                framed ? 'rounded-panel bg-neutral-100 p-1' : 'rounded-card bg-neutral-50 p-6',
                className,
            )}
            data-slot="chart-card"
        >
            <header
                className={cn('flex min-w-0 flex-col', framed && 'px-5 pt-4 pb-5')}
                data-slot="chart-card-head"
            >
                {/* The title stands level with the controls, so the two read as one line. */}
                <div className="flex min-h-control min-w-0 items-center justify-between gap-4">
                    <h3 className="flex min-w-0 items-center gap-2 font-medium text-neutral-600 text-xs">
                        {icon && (
                            <span aria-hidden className="flex shrink-0 [&_svg]:size-4">
                                {icon}
                            </span>
                        )}
                        <span className="truncate">{title}</span>
                    </h3>
                    {(actions || table || onOpen) && (
                        <div className="-mr-2 flex shrink-0 items-center gap-1">
                            {actions && <div className="mr-1 flex items-center">{actions}</div>}
                            {table && <ChartFigures filename={filename ?? title} table={table} />}
                            {onOpen && (
                                <Button
                                    aria-label={`Open ${title}`}
                                    onClick={onOpen}
                                    size="icon"
                                    variant="ghost"
                                >
                                    <ArrowUpRight />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
                {value != null && (
                    <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                        <span className="font-medium text-2xl text-neutral-950 tabular-nums">
                            {value}
                        </span>
                        {(delta != null || comparison != null) && (
                            // A line under a figure that has no change to show still reads.
                            <span className="text-xs">
                                {delta != null && (
                                    <span
                                        className={cn(
                                            'font-medium tabular-nums',
                                            trendInk[trend ?? trendOf(delta)],
                                        )}
                                    >
                                        {delta}
                                    </span>
                                )}
                                {comparison != null && (
                                    <span className="text-neutral-600">
                                        {delta != null && ' '}
                                        {comparison}
                                    </span>
                                )}
                            </span>
                        )}
                    </p>
                )}
            </header>
            <div
                className={cn(
                    // The key names the chart's colours, so it stands with the chart, close over it.
                    'flex min-w-0 flex-col gap-2.5',
                    framed
                        ? 'rounded-[calc(var(--radius-panel)-4px)] border border-neutral-200 bg-neutral-50 p-5'
                        : 'mt-5',
                )}
                data-slot="chart-card-plot"
            >
                {legend}
                {children}
            </div>
        </section>
    );
};

/** The card's menu for its figures: a CSV download, and a copy for pasting into a sheet. */
const ChartFigures = ({ table, filename }: { table: ChartTable; filename: string }) => {
    const [copied, setCopied] = useState(false);

    const download = () => {
        const blob = new Blob([serialize(table, ',')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const copy = async () => {
        await navigator.clipboard.writeText(serialize(table, '\t'));
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button aria-label="The chart's figures" size="icon" variant="ghost" />}
            >
                <EllipsisVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={download}>
                    <Download strokeWidth={2} />
                    Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem closeOnClick={false} onClick={copy}>
                    {copied ? <Check strokeWidth={2} /> : <Copy strokeWidth={2} />}
                    {copied ? 'Copied' : 'Copy for a sheet'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export type ChartCardProps<Row extends ChartRow, X = unknown> = Omit<
    CartesianProps<Row, X>,
    'aria-label' | 'className' | 'style' | 'onRead' | 'kind'
> &
    Omit<ChartFrameProps, 'children' | 'legend' | 'table'> & {
        kind?: CartesianProps<Row, X>['kind'];
        /** Offer the figures as a download and a copy; on unless turned off. */
        figures?: boolean;
    };

const dateCell = (value: unknown) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '');

/**
 * A plotted chart in its card. With two series and more, the key under the header is also
 * the way to turn one off: a series switched off leaves the chart and gives the rest its
 * room, and keeps its colour for when it comes back.
 */
export const ChartCard = <Row extends ChartRow, X = unknown>({
    title,
    icon,
    value,
    delta,
    comparison,
    trend,
    actions,
    filename,
    onOpen,
    variant,
    figures = true,
    kind = 'area',
    className,
    series,
    height = 220,
    ...chart
}: ChartCardProps<Row, X>) => {
    // Each series keeps the colour of its place, so turning one off never repaints the rest.
    const placed = useMemo(
        () =>
            series.map((line, index) => ({
                ...line,
                color: line.color ?? (`series-${Math.min(index + 1, 5)}` as ChartColor),
            })),
        [series],
    );
    const [off, setOff] = useState<ReadonlySet<string>>(new Set());
    const shown = placed.filter(line => !off.has(line.key));

    const toggle = (key: string) =>
        setOff(current => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key);
            // The last series showing stays: a chart of nothing says nothing.
            else if (placed.length - next.size > 1) next.add(key);
            return next;
        });

    const table = useMemo<ChartTable>(
        () => ({
            columns: [chart.x, ...shown.map(line => line.name ?? line.key)],
            rows: chart.data.map(row => [
                dateCell(row[chart.x]),
                ...shown.map(line => {
                    const cell = row[line.key];
                    return typeof cell === 'number' ? cell : '';
                }),
            ]),
        }),
        [chart.data, chart.x, shown],
    );

    return (
        <ChartFrame
            actions={actions}
            className={className}
            comparison={comparison}
            delta={delta}
            filename={filename}
            icon={icon}
            onOpen={onOpen}
            variant={variant}
            legend={
                placed.length > 1 ? (
                    <ChartKey off={off} onToggle={toggle} series={placed} />
                ) : undefined
            }
            table={figures ? table : undefined}
            title={title}
            trend={trend}
            value={value}
        >
            <Cartesian {...chart} aria-label={title} height={height} kind={kind} series={shown} />
        </ChartFrame>
    );
};

export type ChartKeyProps = {
    /** Each series' colour as the chart draws it: `series-1` to `series-5` by place unless given. */
    series: readonly ChartSeries[];
    /** The series switched off. */
    off?: ReadonlySet<string>;
    /** Given, each series is a toggle; without it the key only names them. */
    onToggle?: (key: string) => void;
    className?: string;
};

/**
 * The key over a chart in its card, the same for every chart: a stroke of each colour and its
 * name, in the body size and the quiet ink. As toggles, a series switched off keeps its place
 * and its colour, struck through, so it can be found to turn back on.
 */
export const ChartKey = ({ series, off, onToggle, className }: ChartKeyProps) => (
    <ul
        className={cn('-ml-1.5 flex min-w-0 flex-wrap gap-x-1 gap-y-1', className)}
        data-slot="chart-key"
    >
        {series.map((line, index) => {
            const hidden = off?.has(line.key) ?? false;
            const face = (
                <>
                    <span
                        aria-hidden
                        className="h-3 w-0.75 shrink-0 rounded-full transition-opacity duration-150"
                        style={{
                            background: chartColor(
                                line.color ?? (`series-${Math.min(index + 1, 5)}` as ChartColor),
                            ),
                            opacity: hidden ? 0.3 : 1,
                        }}
                    />
                    <span
                        className={cn(
                            'truncate transition-colors duration-150',
                            hidden ? 'text-neutral-400 line-through' : 'text-neutral-600',
                        )}
                    >
                        {line.name ?? line.key}
                    </span>
                </>
            );
            const shape = 'flex h-6 min-w-0 items-center gap-2 rounded-chip px-1.5 text-xs';

            return (
                <li key={line.key}>
                    {onToggle ? (
                        <button
                            aria-pressed={!hidden}
                            className={cn(
                                shape,
                                'cursor-pointer outline-none transition-colors duration-150 hover:bg-neutral-950/5 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-solid focus-visible:outline-offset-1 motion-reduce:transition-none',
                            )}
                            onClick={() => onToggle(line.key)}
                            type="button"
                        >
                            {face}
                        </button>
                    ) : (
                        <span className={shape}>{face}</span>
                    )}
                </li>
            );
        })}
    </ul>
);
