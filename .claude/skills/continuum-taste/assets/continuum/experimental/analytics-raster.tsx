'use client';

import { ArrowUpRight, ListFilter, Plus, Search } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { monotonePath } from '../components/area-chart';
import { focusRing } from '../components/button';
import { DonutChart } from '../components/donut-chart';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '../components/dropdown-menu';
import { cn } from '../lib/cn';
import {
    allocateColumns,
    BODY_CAP_ON_GRID,
    baselineIn,
    type ColumnSpec,
    type RasterParams,
    type Span,
} from './engine';
import {
    Area,
    Band,
    Mark,
    Panel,
    RasterButton,
    RasterInput,
    RasterPagination,
    RasterSegmented,
    RasterSegmentedItem,
    RasterViewport,
    Row,
    Rule,
    ShowMore,
    Text,
    useOuterRaster,
    usePages,
    useRaster,
    useShowMore,
} from './raster';
import type { Density } from './sequence-raster';

// Data -----------------------------------------------------------------------

type Filter = { id: string; label: string };
export type ListRow = {
    key: string;
    label: string;
    visitors: number;
    views?: number;
    bounce?: number;
    time?: number;
};
export type Site = { label: string; current?: boolean };

export const figmaFilters: Filter[] = [
    { id: 'device', label: 'Device: 2' },
    { id: 'os', label: 'OS: 1' },
    { id: 'browser', label: 'Browser: 1' },
    { id: 'region', label: 'Region: 1' },
    { id: 'source', label: 'Source: 1' },
    { id: 'visitor', label: 'New/Returning' },
];

export const lotsFilters: Filter[] = [
    ...figmaFilters,
    { id: 'page', label: 'Page: 3' },
    { id: 'campaign', label: 'Campaign: 2' },
    { id: 'country', label: 'Country: 4' },
    { id: 'language', label: 'Language: 2' },
    { id: 'referrer', label: 'Referrer: 5' },
    { id: 'medium', label: 'UTM medium: 1' },
    { id: 'screen', label: 'Screen: 2' },
    { id: 'plan', label: 'Plan: 1' },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type PageView = 'pages' | 'entry' | 'exit';

const toRows = (rows: [string, number, number][]): ListRow[] =>
    rows.map(([label, visitors, views]) => ({ key: label, label, visitors, views }));

export const figmaPages: Record<PageView, ListRow[]> = {
    pages: toRows([
        ['/', 4812, 9204],
        ['/pricing', 2140, 3388],
        ['/blog/launch-week', 1377, 1902],
        ['/docs/getting-started', 986, 2215],
        ['/changelog', 642, 811],
    ]),
    entry: toRows([
        ['/', 3904, 3904],
        ['/blog/launch-week', 1102, 1102],
        ['/pricing', 875, 875],
        ['/docs', 512, 512],
        ['/careers', 204, 204],
    ]),
    exit: toRows([
        ['/pricing', 1210, 3388],
        ['/checkout', 806, 1426],
        ['/', 733, 9204],
        ['/docs/api', 398, 1040],
        ['/contact', 187, 402],
    ]),
};

const figmaRegions: ListRow[] = [
    { key: 'nl', label: 'Netherlands', visitors: 3204 },
    { key: 'de', label: 'Germany', visitors: 2118 },
    { key: 'us', label: 'United States', visitors: 1560 },
    { key: 'be', label: 'Belgium', visitors: 904 },
    { key: 'gb', label: 'United Kingdom', visitors: 611 },
];

export const figmaSites: Site[] = [
    { label: 'eyes.dev', current: true },
    { label: 'docs.eyes.dev' },
    { label: 'blog.eyes.dev' },
    { label: 'status.eyes.dev' },
];

// Deterministic, so a reload shows the same long lists.
const pick = <T,>(list: readonly T[], seed: number) => list[seed % list.length] as T;

const SECTIONS = ['docs', 'blog', 'guides', 'changelog', 'customers', 'integrations', 'help'];
const SLUGS = [
    'getting-started',
    'pricing',
    'launch-week',
    'api',
    'webhooks',
    'teams',
    'billing',
    'migrations',
    'sso',
    'exports',
    'dashboards',
    'alerts',
    'funnels',
    'retention',
    'self-hosting',
    'privacy',
    'cookies',
    'goals',
];

export const lotsOfPages = (seed: number): ListRow[] =>
    Array.from({ length: 150 }, (_, index) => {
        const mix = index * 37 + seed * 101;
        const visitors = Math.round(5200 / (1 + index * 0.18)) + ((mix * 13) % 40);
        return {
            key: `${seed}-${index}`,
            label:
                index === 0
                    ? '/'
                    : `/${pick(SECTIONS, mix >> 1)}/${pick(SLUGS, mix)}${index > SLUGS.length ? `-${index}` : ''}`,
            visitors,
            views: visitors + ((mix * 29) % Math.max(1, visitors)),
            bounce: 22 + ((mix * 7) % 60),
            time: 18 + ((mix * 11) % 300),
        };
    });

const COUNTRIES = [
    'Netherlands',
    'Germany',
    'United States',
    'Belgium',
    'United Kingdom',
    'France',
    'Spain',
    'Italy',
    'Poland',
    'Sweden',
    'Norway',
    'Denmark',
    'Finland',
    'Ireland',
    'Portugal',
    'Austria',
    'Switzerland',
    'Czechia',
    'Hungary',
    'Romania',
    'Greece',
    'Canada',
    'Mexico',
    'Brazil',
    'Argentina',
    'Chile',
    'Colombia',
    'Japan',
    'South Korea',
    'India',
    'Singapore',
    'Indonesia',
    'Vietnam',
    'Australia',
    'New Zealand',
    'South Africa',
    'Nigeria',
    'Kenya',
    'Egypt',
    'Turkey',
    'Israel',
    'United Arab Emirates',
    'Estonia',
    'Latvia',
    'Lithuania',
    'Slovenia',
    'Croatia',
    'Iceland',
];

export const lotsOfRegions = (): ListRow[] =>
    COUNTRIES.map((label, index) => ({
        key: label,
        label,
        visitors: Math.round(3300 / (1 + index * 0.35)) + ((index * 17) % 30),
        bounce: 30 + ((index * 13) % 50),
        time: 30 + ((index * 23) % 240),
    }));

const NAMES = ['eyes', 'north', 'harbour', 'pine', 'atlas', 'quartz', 'meadow', 'orbit', 'tide'];
const PARTS = ['docs', 'blog', 'shop', 'status', 'app', 'help', 'labs', 'careers', 'press', 'api'];
const TLDS = ['dev', 'com', 'io', 'nl', 'de', 'eu'];

export const lotsOfSites = (): Site[] =>
    Array.from({ length: 200 }, (_, index) => ({
        label: `${pick(PARTS, index)}.${pick(NAMES, index * 7 + (index >> 3))}${index > 59 ? index : ''}.${pick(TLDS, index >> 2)}`,
        current: index === 0,
    })).sort((a, b) => a.label.localeCompare(b.label));

const devices = [
    { label: 'Desktop', value: 0.62, color: 'var(--pds-chart-5)' },
    { label: 'Mobile', value: 0.31, color: 'var(--pds-chart-1)' },
    { label: 'Tablet', value: 0.07, color: 'var(--pds-chart-3)' },
];
const SESSIONS = 12400;

const series = {
    sessions: { color: 'var(--pds-chart-5)', values: [4, 58, 398, 296, 236, 288, 0] },
    bounce: { color: 'var(--pds-error-500)', values: [6, 12, 21, 34, 46, 58, 67] },
    conversion: { color: 'var(--pds-success-500)', values: [2, 4, 9, 22, 38, 52, 64] },
};

// Each list view takes its own data colour, so switching reads at a glance.
const viewColors: Record<PageView, string> = {
    pages: 'var(--pds-chart-1)',
    entry: 'var(--pds-chart-2)',
    exit: 'var(--pds-chart-4)',
};
const regionColor = 'var(--pds-chart-3)';

const navigation = ['Overview', 'Pages', 'Performance', 'Traffic', 'Funnels'];

const pageSections = [
    { id: 'sessions', label: 'Sessions' },
    { id: 'rates', label: 'Rates' },
    { id: 'pages', label: 'Pages' },
    { id: 'regions', label: 'Regions' },
    { id: 'devices', label: 'Devices' },
];

export type Column = 'label' | 'visitors' | 'views' | 'share' | 'bounce' | 'time';

export const pageColumns = (lots: boolean): ColumnSpec<Column>[] => [
    { key: 'label', label: 'Page', span: 3, priority: 10, flexible: true },
    { key: 'visitors', label: 'Visitors', span: 1, priority: 9 },
    { key: 'views', label: 'Views', span: 1, priority: 6 },
    ...(lots
        ? ([
              { key: 'bounce', label: 'Bounce', span: 1, priority: 4 },
              { key: 'time', label: 'Avg. time', span: 1, priority: 3 },
          ] as ColumnSpec<Column>[])
        : []),
    { key: 'share', label: 'Share', span: 2, priority: 7 },
];

export const regionColumns = (lots: boolean): ColumnSpec<Column>[] => [
    { key: 'label', label: 'Region', span: 2, priority: 10, flexible: true },
    { key: 'visitors', label: 'Visitors', span: 1, priority: 9 },
    ...(lots
        ? ([
              { key: 'bounce', label: 'Bounce', span: 1, priority: 4 },
              { key: 'time', label: 'Avg. time', span: 1, priority: 3 },
          ] as ColumnSpec<Column>[])
        : []),
    { key: 'share', label: 'Share', span: 2, priority: 8 },
];

export const numeric = new Set<Column>(['visitors', 'views', 'bounce', 'time']);

export const formatNumber = (value: number) => value.toLocaleString('en-GB');
const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export const cellValue = (row: ListRow, column: Column) => {
    switch (column) {
        case 'label':
            return row.label;
        case 'visitors':
            return formatNumber(row.visitors);
        case 'views':
            return row.views === undefined ? '—' : formatNumber(row.views);
        case 'bounce':
            return row.bounce === undefined ? '—' : `${row.bounce}%`;
        case 'time':
            return row.time === undefined ? '—' : formatTime(row.time);
        case 'share':
            return '';
    }
};

// Helpers --------------------------------------------------------------------

/** A plain text action: no fill, no border, only colour on hover. */
const textAction = cn(
    'cursor-pointer select-none text-left transition-colors duration-150 disabled:cursor-default disabled:opacity-50',
    focusRing,
);

const place = ([start, span]: Span) => ({ gridColumn: `${start} / span ${span}` });

const useElementWidth = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        setWidth(element.clientWidth);
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setWidth(entry.contentRect.width);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
};

const scrollParentOf = (element: HTMLElement | null) => {
    let node = element?.parentElement ?? null;
    while (node) {
        const { overflowY } = getComputedStyle(node);
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
        node = node.parentElement;
    }
    return null;
};

/**
 * Which of the page's sections is in view, and a way to go to one. Works in
 * the lab's scaled frame: positions are read on screen and scaled back.
 */
const useSections = () => {
    const anchor = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(pageSections[0]?.id ?? '');

    useEffect(() => {
        const scroller = scrollParentOf(anchor.current);
        if (!scroller) return;

        const update = () => {
            const frame = scroller.getBoundingClientRect();
            const threshold = frame.top + frame.height / 3;
            const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
            let current = pageSections[0]?.id ?? '';
            for (const { id } of pageSections) {
                const element = scroller.querySelector(`[data-section="${id}"]`);
                if (element && element.getBoundingClientRect().top <= threshold) current = id;
            }
            setActive(atEnd ? (pageSections.at(-1)?.id ?? current) : current);
        };

        update();
        scroller.addEventListener('scroll', update, { passive: true });
        return () => scroller.removeEventListener('scroll', update);
    }, []);

    const go = (id: string) => {
        const scroller = scrollParentOf(anchor.current);
        const target = scroller?.querySelector(`[data-section="${id}"]`);
        if (!scroller || !target) return;
        const frame = scroller.getBoundingClientRect();
        const scale = frame.height / scroller.offsetHeight || 1;
        const offset = (target.getBoundingClientRect().top - frame.top) / scale;
        scroller.scrollTo({ top: scroller.scrollTop + offset - 32, behavior: 'smooth' });
        setActive(id);
    };

    return { anchor, active, go };
};

/** A row holding a 32px button or input, centred, so the row stays whole lines. */
const Control = ({
    height,
    className,
    children,
}: {
    height: number;
    className?: string;
    children: ReactNode;
}) => (
    <div className={cn('flex min-w-0 shrink-0 items-center', className)} style={{ height }}>
        {children}
    </div>
);

/** Spaces a block one line below the trimmed line above it. */
const nextLine = (line: number) => ({ marginTop: line - BODY_CAP_ON_GRID });

// Navigation -----------------------------------------------------------------

/**
 * The navigation as a field of the action colour, running to the viewport's
 * edge. It scrolls on its own, so a long site list never moves the page.
 */
const Navigation = ({ sites }: { sites: Site[] }) => {
    const outer = useOuterRaster();
    const [filter, setFilter] = useState('');
    const row = outer.line + 8;
    // The filter searches every site; the list itself shows a step at a time.
    const shown = sites.filter(site =>
        site.label.toLowerCase().includes(filter.trim().toLowerCase()),
    );
    const more = useShowMore(shown.length, 12, filter);

    return (
        <nav
            aria-label="Analytics"
            className="flex h-full flex-col overflow-y-auto text-neutral-950 [scrollbar-width:none]"
            style={{ lineHeight: `${outer.line}px` }}
        >
            <div className="flex flex-col" style={{ paddingTop: outer.line * 2 }}>
                <Row height={outer.line * 2}>
                    <Text className="font-medium">Eyes</Text>
                </Row>
            </div>

            <div className="flex flex-col" style={{ marginTop: outer.line * 4 }}>
                {navigation.map(label => {
                    const active = label === 'Overview';
                    return (
                        <Row height={row} key={label}>
                            <button
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    textAction,
                                    'relative',
                                    active
                                        ? 'text-neutral-950'
                                        : 'text-neutral-600 hover:text-neutral-950',
                                )}
                                type="button"
                            >
                                {/* The marker hangs in the margin, so the labels keep one edge. */}
                                {active && (
                                    <Mark className="absolute top-0.5 -left-3.5 bg-action" />
                                )}
                                <Text>{label}</Text>
                            </button>
                        </Row>
                    );
                })}
            </div>

            {/* The site list keeps its label and filter in view while it scrolls past */}
            <div
                className="sticky top-0 z-10 flex flex-col bg-neutral-50"
                style={{ marginTop: outer.line * 2 }}
            >
                <Row className="justify-between gap-2" height={row}>
                    <Text className="text-neutral-500">Sites</Text>
                    <Text className="text-neutral-500 tabular-nums">{sites.length}</Text>
                </Row>
                {sites.length > 8 && (
                    <Control height={outer.line * 2}>
                        <RasterInput
                            aria-label="Filter sites"
                            leadingIcon={<Search strokeWidth={1.5} />}
                            onChange={event => setFilter(event.target.value)}
                            placeholder="Filter…"
                            value={filter}
                        />
                    </Control>
                )}
            </div>

            <div className="flex flex-col">
                {shown.slice(0, more.shown).map((site, index) => (
                    <Row height={row} key={`${site.label}-${index}`}>
                        <button
                            aria-current={site.current ? 'true' : undefined}
                            className={cn(
                                textAction,
                                'relative min-w-0',
                                site.current
                                    ? 'text-neutral-950'
                                    : 'text-neutral-600 hover:text-neutral-950',
                            )}
                            type="button"
                        >
                            {site.current && (
                                <Mark className="absolute top-0.5 -left-3.5 bg-action" />
                            )}
                            <Text className="truncate">{site.label}</Text>
                        </button>
                    </Row>
                ))}
                {shown.length === 0 && (
                    <Row height={row}>
                        <Text className="text-neutral-500">No sites</Text>
                    </Row>
                )}
                {more.remaining > 0 && (
                    <Control height={outer.line * 2}>
                        <ShowMore onMore={more.more} remaining={more.remaining} step={12} />
                    </Control>
                )}
            </div>

            <div
                className="mt-auto flex flex-col"
                style={{ paddingTop: outer.line * 4, paddingBottom: outer.line * 2 }}
            >
                <Text>Northwind Agency</Text>
                <Text className="mt-1 text-neutral-500">Startup</Text>
            </div>
        </nav>
    );
};

// Chart ----------------------------------------------------------------------

/**
 * An area chart cut to the raster: the tick labels take just their own width,
 * the plot the rest; gridlines fall every few lines, so tick labels, day labels
 * and the annotation all sit on the baseline grid.
 */
const RasterAreaChart = ({
    label,
    values,
    color,
    ticks,
    step,
    format = formatNumber,
    annotation,
}: {
    label: string;
    values: number[];
    color: string;
    ticks: number[];
    /** Lines between two gridlines. */
    step: number;
    format?: (value: number) => string;
    annotation?: { index: number; label: string };
}) => {
    const { raster } = useRaster();
    const line = raster.line;
    const [ref, width] = useElementWidth();
    const id = `rx-area-${useId().replace(/[^\w-]/g, '')}`;

    const top = line; // room for the top tick's label and the annotation
    const plot = step * (ticks.length - 1) * line;
    const height = top + plot + line * 2;
    // The tick labels take only the width of the longest label, on the 4px
    // grid, and half a line of space before the plot; inside a card a whole
    // column would leave a wide empty strip on the left.
    const labelWidth =
        Math.ceil((Math.max(...ticks.map(tick => format(tick).length)) * 7.5) / raster.quantum) *
        raster.quantum;
    const left = labelWidth + line / 2;
    const min = Math.min(...ticks);
    const max = Math.max(...ticks);
    const yOf = (value: number) => top + plot - ((value - min) / (max - min || 1)) * plot;
    const xOf = (index: number) =>
        left + (days.length === 1 ? 0 : (index / (days.length - 1)) * (width - left));
    const points = values.map((value, index) => ({ x: xOf(index), y: yOf(value) }));
    const first = points[0];
    const last = points.at(-1);
    const base = yOf(Math.max(min, 0));
    const curve = monotonePath(points);
    // A tick label's baseline one quantum under its gridline, the cap centred on it.
    const tickRowTop = (y: number) => y + raster.quantum - baselineIn(line);

    return (
        <div aria-label={label} className="relative" ref={ref} role="img" style={{ height }}>
            {width > 0 && (
                <svg
                    aria-hidden="true"
                    className="absolute inset-0 block"
                    height={height}
                    width={width}
                >
                    <defs>
                        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" style={{ stopColor: color, stopOpacity: 0.33 }} />
                            <stop offset="1" style={{ stopColor: color, stopOpacity: 0 }} />
                        </linearGradient>
                    </defs>
                    {ticks.map(tick => (
                        <line
                            className={tick === min ? 'stroke-neutral-300' : 'stroke-neutral-200'}
                            key={tick}
                            x1={left}
                            x2={width}
                            y1={yOf(tick) - 0.5}
                            y2={yOf(tick) - 0.5}
                        />
                    ))}
                    {first && last && (
                        <>
                            <path
                                d={`${curve}L${last.x},${base}L${first.x},${base}Z`}
                                fill={`url(#${id})`}
                            />
                            <path
                                d={curve}
                                fill="none"
                                style={{ stroke: color }}
                                strokeWidth={1.5}
                            />
                        </>
                    )}
                    {annotation && (
                        <line
                            className="stroke-neutral-950/25"
                            strokeDasharray="4 4"
                            x1={Math.round(xOf(annotation.index)) + 0.5}
                            x2={Math.round(xOf(annotation.index)) + 0.5}
                            y1={top}
                            y2={base}
                        />
                    )}
                </svg>
            )}

            {ticks.map(tick => (
                <Row
                    className="absolute left-0 justify-end"
                    height={line}
                    key={tick}
                    style={{ top: tickRowTop(yOf(tick)), width: labelWidth }}
                >
                    <Text className="text-neutral-500 tabular-nums">{format(tick)}</Text>
                </Row>
            ))}

            {width > 0 &&
                days.map((day, index) => (
                    <Row
                        className="absolute"
                        height={line * 2}
                        key={day}
                        style={{
                            top: top + plot,
                            left: xOf(index),
                            transform:
                                index === 0
                                    ? undefined
                                    : index === days.length - 1
                                      ? 'translateX(-100%)'
                                      : 'translateX(-50%)',
                        }}
                    >
                        <Text className="text-neutral-500">{day}</Text>
                    </Row>
                ))}

            {annotation && width > 0 && (
                <Row
                    className="absolute top-0 -translate-x-1/2"
                    height={line}
                    style={{ left: xOf(annotation.index) }}
                >
                    <Text className="whitespace-nowrap text-neutral-950">{annotation.label}</Text>
                </Row>
            )}
        </div>
    );
};

// Page parts -----------------------------------------------------------------

/** A label hanging in the head column, with lines of notes under it. */
const Hanging = ({
    title,
    notes = [],
    children,
    sticky,
    besidePanel,
}: {
    title: string;
    notes?: ReactNode[];
    children?: ReactNode;
    sticky?: boolean;
    /** Drops a line, level with the content inside a card beside it rather than its edge. */
    besidePanel?: boolean;
}) => {
    const { raster, content } = useRaster();
    const row = raster.line * 2;
    const hanging = Boolean(content.head);

    return (
        <Area
            area="head"
            className={cn('flex flex-col self-start', sticky && hanging && 'sticky top-0 z-10')}
            style={besidePanel && hanging ? { paddingTop: raster.line } : undefined}
        >
            <Row height={row}>
                <Text as="h2" className="font-medium text-neutral-950">
                    {title}
                </Text>
            </Row>
            {notes.map((note, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: notes are positional
                <Row height={raster.line} key={index}>
                    <Text className="text-neutral-500">{note}</Text>
                </Row>
            ))}
            {children}
        </Area>
    );
};

const Kpi = ({
    label,
    value,
    delta,
    good,
    color,
    within,
}: {
    label: string;
    value: string;
    delta: string;
    good: boolean;
    color: string;
    within: Span;
}) => {
    const { raster } = useRaster();
    const line = raster.line;

    return (
        <Panel area="main" within={within}>
            <div className="flex items-start gap-2">
                <Mark className="mt-0.5" style={{ backgroundColor: color }} />
                <Text className="text-neutral-500">{label}</Text>
            </div>
            {/* The numeral's baseline two lines under the label's */}
            <div className="flex items-end gap-2" style={{ marginTop: line * 2 - 24 }}>
                <Text className="font-medium text-[31px] text-neutral-950 tabular-nums leading-[calc(var(--rx-line)*2)] tracking-[-0.01em]">
                    {value}
                </Text>
                <Text className="whitespace-nowrap text-neutral-500">
                    <span className={good ? 'text-success-600' : 'text-error-500'}>{delta}</span>{' '}
                    last mo
                </Text>
            </div>
        </Panel>
    );
};

/** The share as a figure and a thin bar in the list's colour, scaled to the largest. */
const ShareBar = ({ share, scale }: { share: number; scale: number }) => (
    <span className="flex min-w-0 flex-1 items-start gap-2">
        <Text className="w-10 shrink-0 text-right text-neutral-600 tabular-nums">
            {(share * 100).toFixed(1)}%
        </Text>
        <span
            aria-hidden
            className="mt-1 block h-1 min-w-px"
            style={{ width: `${(share / scale) * 100}%`, backgroundColor: 'currentColor' }}
        />
    </span>
);

/**
 * A ranked list on the content's columns: names flush left, figures flush
 * right on column lines, a thin bar for the share. The header and the hanging
 * label stay in view over a long list; the least important columns go first.
 */
const RankedList = ({
    section,
    title,
    rows,
    specs,
    color,
    filterable,
    notes,
    children,
    actionLabel,
    paging,
    scope = '',
}: {
    section: string;
    title: string;
    rows: ListRow[];
    specs: ColumnSpec<Column>[];
    color: string;
    filterable: boolean;
    notes: ReactNode[];
    children?: ReactNode;
    actionLabel?: string;
    /** For a long list: pages of a fixed size, or a reveal a step at a time. */
    paging?: { kind: 'pages' | 'more'; size: number };
    /** What else the rows depend on (a view), so changing it starts the list over. */
    scope?: string;
}) => {
    const { raster, content } = useRaster();
    const row = raster.line * 2;
    const columns = allocateColumns(content.main[1], specs);
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState<{ key: Column; ascending: boolean }>({
        key: 'visitors',
        ascending: false,
    });

    const total = rows.reduce((sum, item) => sum + item.visitors, 0) || 1;
    const scale = Math.max(...rows.map(item => item.visitors / total), 0.0001);
    const query = filter.trim().toLowerCase();
    const shown = rows
        .filter(item => item.label.toLowerCase().includes(query))
        .sort((a, b) => {
            const key = sort.key === 'share' ? 'visitors' : sort.key;
            const order =
                key === 'label'
                    ? a.label.localeCompare(b.label)
                    : ((a[key] as number | undefined) ?? 0) - ((b[key] as number | undefined) ?? 0);
            return sort.ascending ? order : -order;
        });

    // Both hooks always run; the one not asked for gets an endless size and does nothing.
    const resetKey = `${scope}|${query}|${sort.key}|${sort.ascending}`;
    const pages = usePages(
        shown.length,
        paging?.kind === 'pages' ? paging.size : Number.POSITIVE_INFINITY,
        resetKey,
    );
    const more = useShowMore(
        shown.length,
        paging?.kind === 'more' ? paging.size : Number.POSITIVE_INFINITY,
        resetKey,
    );
    const visible = shown.slice(pages.start, pages.end).slice(0, more.shown);

    return (
        <Band data-section={section} style={{ marginTop: raster.line * 4 }}>
            <Hanging notes={notes} sticky title={title}>
                {children}
                {filterable && (
                    <>
                        <Control className="mt-[var(--rx-line)]" height={row}>
                            <RasterInput
                                aria-label={`Filter ${title.toLowerCase()}`}
                                leadingIcon={<Search strokeWidth={1.5} />}
                                onChange={event => setFilter(event.target.value)}
                                placeholder={`Filter ${title.toLowerCase()}…`}
                                value={filter}
                            />
                        </Control>
                        <Row height={raster.line}>
                            <Text className="text-neutral-500 tabular-nums">
                                {shown.length === rows.length
                                    ? `${rows.length} in all`
                                    : `${shown.length} of ${rows.length}`}
                            </Text>
                        </Row>
                    </>
                )}
            </Hanging>

            <Area area="main" className="grid grid-cols-subgrid content-start">
                {/* The column names stay in view over a long list, on the page's own colour */}
                <div className="sticky top-0 z-10 col-span-full grid grid-cols-subgrid bg-neutral-50">
                    {/* Its hairline travels with it, over the first row's top pixel */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-full h-px bg-neutral-200"
                    />
                    {columns.map(column => {
                        const active = sort.key === column.key;
                        return (
                            <Row
                                className={cn(numeric.has(column.key) && 'justify-end')}
                                height={row}
                                key={column.key}
                                style={place(column.within)}
                            >
                                <button
                                    className={cn(
                                        textAction,
                                        'flex min-w-0 items-start gap-1',
                                        active
                                            ? 'text-neutral-950'
                                            : 'text-neutral-500 hover:text-neutral-950',
                                    )}
                                    onClick={() =>
                                        setSort(current => ({
                                            key: column.key,
                                            ascending:
                                                current.key === column.key
                                                    ? !current.ascending
                                                    : column.key === 'label',
                                        }))
                                    }
                                    type="button"
                                >
                                    <Text className="truncate">{column.label}</Text>
                                    {active && <Text>{sort.ascending ? '↑' : '↓'}</Text>}
                                </button>
                            </Row>
                        );
                    })}
                </div>

                {visible.map(item => (
                    <div
                        className="group relative col-span-full grid grid-cols-subgrid hover:bg-neutral-950/[0.03]"
                        key={item.key}
                    >
                        {columns.map(column => (
                            <Row
                                className={cn(numeric.has(column.key) && 'justify-end')}
                                height={row}
                                key={column.key}
                                style={{
                                    ...place(column.within),
                                    ...(column.key === 'share' ? { color } : undefined),
                                }}
                            >
                                {column.key === 'share' ? (
                                    <ShareBar scale={scale} share={item.visitors / total} />
                                ) : (
                                    <Text
                                        className={cn(
                                            'truncate',
                                            column.key === 'label'
                                                ? 'text-neutral-950'
                                                : 'text-neutral-600',
                                            numeric.has(column.key) && 'tabular-nums',
                                        )}
                                    >
                                        {cellValue(item, column.key)}
                                    </Text>
                                )}
                            </Row>
                        ))}
                        {actionLabel && (
                            <div className="absolute top-1 -right-9">
                                <RasterButton
                                    aria-label={`${actionLabel} ${item.label}`}
                                    className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                                    size="icon-sm"
                                    variant="ghost"
                                >
                                    <ArrowUpRight strokeWidth={1.5} />
                                </RasterButton>
                            </div>
                        )}
                    </div>
                ))}
                {shown.length === 0 && (
                    <Row className="col-span-full" height={row}>
                        <Text className="text-neutral-500">Nothing matches “{filter}”</Text>
                    </Row>
                )}
                {/* A line under the last row, on the content's columns; only for a long list */}
                {pages.pageCount > 1 && (
                    <div className="col-span-full" style={{ marginTop: raster.line }}>
                        <Control height={row}>
                            <RasterPagination
                                {...pages}
                                className="w-full"
                                label={`${title} pages`}
                            />
                        </Control>
                    </div>
                )}
                {paging && more.remaining > 0 && (
                    <div className="col-span-full" style={{ marginTop: raster.line }}>
                        <Control height={row}>
                            <ShowMore
                                onAll={more.all}
                                onMore={more.more}
                                remaining={more.remaining}
                                step={paging.size}
                            />
                        </Control>
                    </div>
                )}
            </Area>
        </Band>
    );
};

/** Two equal halves of the content, a column apart when the count is odd; stacked when narrow. */
export const halves = (main: number): [Span, Span] | null => {
    if (main < 6) return null;
    const half = Math.floor(main / 2);
    return [
        [1, half],
        [main - half + 1, half],
    ];
};

/** A third of the content's columns per figure, or the whole width when that gets too narrow. */
export const thirds = (main: number): Span[] => {
    const span = main % 3 === 0 ? main / 3 : main >= 6 ? 2 : main;
    return [0, 1, 2].map(index => [span === main ? 1 : 1 + index * span, span]);
};

const DevicesBand = () => {
    const { raster, content } = useRaster();
    const line = raster.line;
    const row = line * 2;
    const main = content.main[1];
    const stacked = main < 6;
    const donutSpan = stacked ? main : main >= 9 ? 3 : 2;
    const legendSpan: Span = stacked ? [1, main] : [donutSpan + 1, main - donutSpan];
    const size = line * 10;
    const legend = allocateColumns(legendSpan[1], [
        { key: 'label', label: 'Device', span: 1, priority: 10, flexible: true },
        { key: 'share', label: 'Share', span: 1, priority: 9 },
        { key: 'sessions', label: 'Sessions', span: 1, priority: 5 },
    ]);
    // The centre's two lines, their baselines a line apart around the middle.
    const centreBaseline = size / 2 - raster.quantum;

    return (
        <Band data-section="devices" style={{ marginTop: line * 2 }}>
            <Hanging notes={['Share of sessions', 'Last 7 days']} title="Devices" />
            <Area area="main" className="grid grid-cols-subgrid content-start">
                <div className="relative" style={{ ...place([1, donutSpan]), height: size }}>
                    <DonutChart
                        aria-label={devices
                            .map(device => `${device.label} ${Math.round(device.value * 100)}%`)
                            .join(', ')}
                        gap={raster.quantum}
                        rings={devices.map(device => ({ ...device }))}
                        size={size}
                        thickness={line / 2}
                    />
                    <div
                        className="absolute flex flex-col items-center text-center"
                        style={{ top: centreBaseline - BODY_CAP_ON_GRID, left: 0, width: size }}
                    >
                        <Text className="font-medium text-neutral-950 tabular-nums">12.4k</Text>
                        <span className="block" style={nextLine(line)}>
                            <Text className="text-neutral-500">sessions</Text>
                        </span>
                    </div>
                </div>
                <div
                    className="grid grid-cols-subgrid content-start"
                    style={{ ...place(legendSpan), marginTop: stacked ? line * 2 : 0 }}
                >
                    {legend.map(column => (
                        <Row
                            className={cn(column.key !== 'label' && 'justify-end')}
                            height={row}
                            key={column.key}
                            style={place(column.within)}
                        >
                            <Text className="text-neutral-500">{column.label}</Text>
                        </Row>
                    ))}
                    {devices.map(device => (
                        <div className="col-span-full grid grid-cols-subgrid" key={device.label}>
                            {legend.map(column => (
                                <Row
                                    className={cn('gap-2', column.key !== 'label' && 'justify-end')}
                                    height={row}
                                    key={column.key}
                                    style={place(column.within)}
                                >
                                    {column.key === 'label' && (
                                        <Mark
                                            className="mt-0.5"
                                            style={{ backgroundColor: device.color }}
                                        />
                                    )}
                                    <Text
                                        className={cn(
                                            'tabular-nums',
                                            column.key === 'label'
                                                ? 'text-neutral-950'
                                                : 'text-neutral-600',
                                        )}
                                    >
                                        {column.key === 'label'
                                            ? device.label
                                            : column.key === 'share'
                                              ? `${Math.round(device.value * 100)}%`
                                              : formatNumber(Math.round(SESSIONS * device.value))}
                                    </Text>
                                </Row>
                            ))}
                        </div>
                    ))}
                </div>
            </Area>
        </Band>
    );
};

// Page -----------------------------------------------------------------------

const AnalyticsPage = ({ density }: { density: Density }) => {
    const { raster, content } = useRaster();
    const line = raster.line;
    const row = line * 2;
    const lots = density === 'lots';
    const main = content.main[1];

    const available = lots ? lotsFilters : figmaFilters;
    const [chosen, setChosen] = useState<{ density: Density; ids: string[] }>();
    const ids =
        chosen?.density === density ? chosen.ids : available.slice(0, 6).map(filter => filter.id);
    const filters = available.filter(filter => ids.includes(filter.id));
    const setIds = (next: string[]) => setChosen({ density, ids: next });

    const [view, setView] = useState<PageView>('pages');
    const pages = useMemo(
        () =>
            lots
                ? { pages: lotsOfPages(1), entry: lotsOfPages(2), exit: lotsOfPages(3) }
                : figmaPages,
        [lots],
    );
    const regions = useMemo(() => (lots ? lotsOfRegions() : figmaRegions), [lots]);

    const sections = useSections();
    const kpis = thirds(main);
    const rates = halves(main);

    return (
        <>
            {/* Breadcrumb */}
            <Band>
                <Area area="head">
                    <Row height={row}>
                        <Text className="text-neutral-500">Analytics</Text>
                    </Row>
                </Area>
                <Area area="main" className="flex justify-between gap-6">
                    <Row height={row}>
                        <Text className="text-neutral-950">Overview</Text>
                    </Row>
                    <Control height={row}>
                        <RasterButton>
                            <Plus strokeWidth={1.5} />
                            Add to Ask
                        </RasterButton>
                    </Control>
                </Area>
            </Band>

            {/* Filters as text on the content's columns, each with its own way out */}
            <Band style={{ marginTop: line }}>
                <Area area="head" className="flex flex-col">
                    <Row className="gap-2" height={row}>
                        <Text className="text-neutral-500">Filters</Text>
                        <Text className="text-neutral-500 tabular-nums">{filters.length}</Text>
                    </Row>
                    {content.head && (
                        <Control height={row}>
                            {/* Pulled into the gutter so its label keeps the column's edge */}
                            <RasterButton
                                className="-ml-3"
                                disabled={filters.length === 0}
                                onClick={() => setIds([])}
                                variant="ghost"
                            >
                                Clear all
                            </RasterButton>
                        </Control>
                    )}
                </Area>
                <Area area="main" className="grid grid-cols-subgrid content-start">
                    {filters.map(filter => (
                        <Row
                            className="group gap-2"
                            height={row}
                            key={filter.id}
                            style={{ gridColumn: 'span 2' }}
                        >
                            <Mark className="mt-0.5 bg-action" />
                            <Text className="truncate text-neutral-950 tabular-nums">
                                {filter.label}
                            </Text>
                            <button
                                aria-label={`Remove ${filter.label}`}
                                className={cn(
                                    textAction,
                                    'text-neutral-500 hover:text-neutral-950',
                                )}
                                onClick={() => setIds(ids.filter(id => id !== filter.id))}
                                type="button"
                            >
                                <Text>×</Text>
                            </button>
                        </Row>
                    ))}
                    {filters.length === 0 && (
                        <Row className="col-span-full" height={row}>
                            <Text className="text-neutral-500">No filters applied</Text>
                        </Row>
                    )}
                    {!content.head && filters.length > 0 && (
                        <Control className="col-span-full" height={row}>
                            <RasterButton
                                className="-ml-3"
                                onClick={() => setIds([])}
                                variant="ghost"
                            >
                                Clear all
                            </RasterButton>
                        </Control>
                    )}
                </Area>
            </Band>

            <Rule style={{ marginTop: line * 2 }} />

            {/* Title */}
            <Band style={{ marginTop: line * 2 }}>
                <Area area="main">
                    <Text
                        as="h1"
                        className="font-medium text-[31px] text-neutral-950 leading-[calc(var(--rx-line)*2)] tracking-[-0.01em]"
                    >
                        Analytics — Overview
                    </Text>
                </Area>
            </Band>

            {/* Key figures as cards on the content's column lines, a gutter apart */}
            <Band style={{ marginTop: line * 4, rowGap: raster.gutter }}>
                {/* One line down, level with the cards' labels */}
                <Area area="head" style={{ paddingTop: line }}>
                    <Text className="text-neutral-500">Last 7 days</Text>
                    <span className="block" style={nextLine(line)}>
                        <Text className="text-neutral-500">against last month</Text>
                    </span>
                </Area>
                <Kpi
                    color={series.sessions.color}
                    delta="+10.7%"
                    good
                    label="Sessions"
                    value="12.4k"
                    within={kpis[0] as Span}
                />
                <Kpi
                    color={series.bounce.color}
                    delta="+10.7%"
                    good={false}
                    label="Bounce rate"
                    value="67%"
                    within={kpis[1] as Span}
                />
                <Kpi
                    color={series.conversion.color}
                    delta="+10.7%"
                    good
                    label="Conversion rate"
                    value="45%"
                    within={kpis[2] as Span}
                />
            </Band>

            {/* Sessions over time */}
            <Band data-section="sessions" style={{ marginTop: line * 4 }}>
                <Hanging besidePanel notes={['Per day, last 7 days']} title="Sessions over time" />
                <Panel area="main">
                    <RasterAreaChart
                        color={series.sessions.color}
                        label="Sessions per day, last week"
                        step={4}
                        ticks={[0, 100, 200, 300, 400]}
                        values={series.sessions.values}
                    />
                </Panel>
            </Band>

            {/* Bounce and conversion, side by side on the content's columns */}
            <Band data-section="rates" style={{ marginTop: line * 4, rowGap: raster.gutter }}>
                <Hanging
                    besidePanel
                    notes={['Share of sessions, per day', 'Deploy on Fri']}
                    title="Rates"
                />
                {(
                    [
                        ['Bounce rate', series.bounce],
                        ['Conversion rate', series.conversion],
                    ] as const
                ).map(([name, data], index) => (
                    <Panel area="main" key={name} within={rates?.[index]}>
                        <Row className="gap-2" height={row}>
                            <Mark className="mt-0.5" style={{ backgroundColor: data.color }} />
                            <Text className="text-neutral-950">{name}</Text>
                        </Row>
                        <RasterAreaChart
                            annotation={{ index: 4, label: 'Deploy' }}
                            color={data.color}
                            format={value => `${value}%`}
                            label={`${name} per day`}
                            step={3}
                            ticks={[0, 25, 50, 75, 100]}
                            values={data.values}
                        />
                    </Panel>
                ))}
            </Band>

            <RankedList
                actionLabel="Open"
                color={viewColors[view]}
                filterable={lots}
                key={`pages-${view}`}
                notes={['Last 7 days']}
                paging={{ kind: 'pages', size: 20 }}
                rows={pages[view]}
                scope={view}
                section="pages"
                specs={pageColumns(lots)}
                title="Top pages"
            >
                {/* 34px tall, so it is given whole lines of its own */}
                <Control className="mt-[var(--rx-line)]" height={Math.ceil(34 / line) * line}>
                    <RasterSegmented
                        aria-label="Which pages"
                        fill
                        onValueChange={next => setView(next as PageView)}
                        value={view}
                    >
                        {(['pages', 'entry', 'exit'] as const).map(option => (
                            <RasterSegmentedItem key={option} value={option}>
                                {view === option && (
                                    <Mark style={{ backgroundColor: viewColors[option] }} />
                                )}
                                {option === 'pages' ? 'All' : option === 'entry' ? 'Entry' : 'Exit'}
                            </RasterSegmentedItem>
                        ))}
                    </RasterSegmented>
                </Control>
            </RankedList>

            <RankedList
                color={regionColor}
                filterable={lots}
                notes={['Visitors by country']}
                paging={{ kind: 'more', size: 10 }}
                rows={regions}
                section="regions"
                specs={regionColumns(lots)}
                title="Regions"
            />

            <Rule style={{ marginTop: line * 4 }} />

            <DevicesBand />

            {/* The page's sections and its filters, on the content's columns */}
            <Band
                className="sticky bottom-0 z-20 bg-neutral-50"
                ref={sections.anchor}
                style={{ marginTop: line * 4, paddingBlock: line }}
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-neutral-200"
                />
                <Area area="all" className="flex items-center justify-between gap-6">
                    <div className="flex flex-wrap gap-x-6">
                        {pageSections.map(({ id, label }) => (
                            <Row height={line * 2} key={id}>
                                <button
                                    aria-current={sections.active === id ? 'location' : undefined}
                                    className={cn(
                                        textAction,
                                        'flex items-start gap-2',
                                        sections.active === id
                                            ? 'text-neutral-950'
                                            : 'text-neutral-500 hover:text-neutral-950',
                                    )}
                                    onClick={() => sections.go(id)}
                                    type="button"
                                >
                                    {sections.active === id && (
                                        <Mark className="mt-0.5 bg-action" />
                                    )}
                                    <Text>{label}</Text>
                                </button>
                            </Row>
                        ))}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <RasterButton
                                aria-label={`Filters, ${filters.length} applied`}
                                variant="secondary"
                            >
                                <ListFilter strokeWidth={1.5} />
                                Filters
                                <span className="text-neutral-500 tabular-nums">
                                    {filters.length}
                                </span>
                            </RasterButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top">
                            <DropdownMenuLabel>Filters</DropdownMenuLabel>
                            {available.map(filter => (
                                <DropdownMenuCheckboxItem
                                    checked={ids.includes(filter.id)}
                                    key={filter.id}
                                    onCheckedChange={checked =>
                                        setIds(
                                            checked
                                                ? available
                                                      .filter(
                                                          f =>
                                                              f.id === filter.id ||
                                                              ids.includes(f.id),
                                                      )
                                                      .map(f => f.id)
                                                : ids.filter(id => id !== filter.id),
                                        )
                                    }
                                    onSelect={event => event.preventDefault()}
                                >
                                    {filter.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Area>
            </Band>
        </>
    );
};

type AnalyticsRasterProps = {
    params: RasterParams;
    containerMax: number;
    height: number;
    density: Density;
    overlay: boolean;
};

/**
 * The analytics overview on a raster, with few borders: cards for the key
 * figures and the charts, hairlines between the page's main parts, and real
 * buttons and inputs. Figures stand on column lines, chart titles hang beside
 * their charts, and colour marks only data and state.
 */
export const AnalyticsRaster = ({
    params,
    containerMax,
    height,
    density,
    overlay,
}: AnalyticsRasterProps) => {
    const sites = useMemo(() => (density === 'lots' ? lotsOfSites() : figmaSites), [density]);

    return (
        <RasterViewport
            containerMax={containerMax}
            height={height}
            nav={<Navigation sites={sites} />}
            overlay={overlay}
            params={params}
        >
            <AnalyticsPage density={density} />
        </RasterViewport>
    );
};
