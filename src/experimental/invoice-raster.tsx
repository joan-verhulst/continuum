'use client';

import { Plus, Search, Send, Trash2 } from 'lucide-react';
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import { focusRing } from '../components/button';
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

export type Line = {
    id: number;
    group?: string;
    item: string;
    description: string;
    qty: number;
    price: number;
};

export type Status = 'paid' | 'sent' | 'viewed' | 'open' | 'rejected' | 'draft';

export type Event = {
    id: number;
    status: Status;
    title: string;
    actor: string;
    date: string;
    time: string;
    month: string;
};

export type Client = { label: string; current?: boolean };

export const TAX = 0.21;
export const LINES_PER_PAGE = 25;
export const EVENTS_STEP = 15;
export const DISCOUNT = 0.1;
const SOL_PER_USD = 1 / 169.85;

export const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const sol = new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

/** Each status carries one colour, on its Mark only. */
const statuses: Record<Status, { label: string; color: string }> = {
    paid: { label: 'Paid', color: 'var(--pds-success-500)' },
    sent: { label: 'Sent', color: 'var(--pds-primary-500)' },
    viewed: { label: 'Viewed', color: 'var(--pds-primary-300)' },
    open: { label: 'Open', color: 'var(--pds-warning-500)' },
    rejected: { label: 'Rejected', color: 'var(--pds-error-500)' },
    draft: { label: 'Draft', color: 'var(--pds-neutral-400)' },
};

const statusOrder: Status[] = ['paid', 'sent', 'viewed', 'open', 'rejected', 'draft'];

export const figmaLines: Line[] = [
    {
        id: 1,
        item: 'WEB-001',
        description:
            'Website design and front-end development, including responsive layouts and a component library',
        qty: 1,
        price: 4500,
    },
    {
        id: 2,
        item: 'BRD-002',
        description: 'Brand identity package with logo design, colour palette and typography guide',
        qty: 2,
        price: 1250,
    },
];

export const figmaEvents: Event[] = [
    {
        id: 6,
        status: 'rejected',
        title: 'Acme Corp rejected the invoice',
        actor: 'Acme Corp',
        date: '11/03/2025',
        time: '16:08',
        month: 'March 2025',
    },
    {
        id: 5,
        status: 'viewed',
        title: 'Acme Corp viewed the invoice',
        actor: 'Acme Corp',
        date: '11/03/2025',
        time: '15:51',
        month: 'March 2025',
    },
    {
        id: 4,
        status: 'sent',
        title: 'Invoice sent to Acme Corp',
        actor: 'Jane Cooper',
        date: '10/03/2025',
        time: '09:12',
        month: 'March 2025',
    },
    {
        id: 3,
        status: 'open',
        title: 'Status set to Open',
        actor: 'Jane Cooper',
        date: '10/03/2025',
        time: '09:10',
        month: 'March 2025',
    },
    {
        id: 2,
        status: 'draft',
        title: 'Invoice saved as draft',
        actor: 'Jane Cooper',
        date: '09/03/2025',
        time: '17:34',
        month: 'March 2025',
    },
    {
        id: 1,
        status: 'draft',
        title: 'Invoice created by Jane Cooper',
        actor: 'Jane Cooper',
        date: '09/03/2025',
        time: '17:02',
        month: 'March 2025',
    },
];

const figmaClients: Client[] = [
    { label: 'Acme Corp', current: true },
    { label: 'Harbour Street Studio' },
    { label: 'Lumen Labs' },
    { label: 'Orchard & Co' },
    { label: 'Tideline Travel' },
];

// Deterministic, so a reload shows the same long lists.
const pick = <T,>(list: T[], seed: number) => list[seed % list.length] as T;

const GROUPS = [
    {
        name: 'Discovery',
        code: 'DSC',
        price: 120,
        work: ['Stakeholder interviews', 'Competitor review', 'Analytics audit', 'Workshop'],
    },
    {
        name: 'Design',
        code: 'DSG',
        price: 110,
        work: ['Wireframes', 'High-fidelity screens', 'Design tokens', 'Prototype'],
    },
    {
        name: 'Development',
        code: 'DEV',
        price: 125,
        work: ['Front-end build', 'API integration', 'Component', 'Accessibility fixes'],
    },
    {
        name: 'Content',
        code: 'CNT',
        price: 85,
        work: ['Copywriting', 'Photography edit', 'Translation', 'SEO review'],
    },
    {
        name: 'Support',
        code: 'SUP',
        price: 95,
        work: ['Bug triage', 'Maintenance', 'Release support', 'Training session'],
    },
    {
        name: 'Hosting',
        code: 'HST',
        price: 40,
        work: ['Server capacity', 'CDN traffic', 'Backups', 'Monitoring'],
    },
];
const SUBJECTS = [
    'checkout',
    'account pages',
    'search',
    'onboarding',
    'dashboard',
    'pricing page',
    'blog',
    'help centre',
    'payments flow',
    'settings',
];

export const lotsOfLines = (): Line[] =>
    GROUPS.flatMap((group, groupIndex) =>
        Array.from({ length: 20 }, (_, index) => {
            const seed = groupIndex * 31 + index * 7;
            return {
                id: groupIndex * 100 + index + 1,
                group: group.name,
                item: `${group.code}-${String(index + 1).padStart(3, '0')}`,
                description: `${pick(group.work, seed)} for the ${pick(SUBJECTS, seed >> 1)}`,
                qty: 1 + ((seed * 5) % 24),
                price: group.price + ((seed * 3) % 6) * 5,
            };
        }),
    );

const titles: Record<Status, string> = {
    draft: 'Invoice saved as draft',
    open: 'Status set to Open',
    sent: 'Invoice sent to Acme Corp',
    viewed: 'Acme Corp viewed the invoice',
    rejected: 'Acme Corp rejected the invoice',
    paid: 'Acme Corp paid a deposit',
};

const two = (value: number) => String(value).padStart(2, '0');

export const lotsOfEvents = (): Event[] => {
    // Newest first, walking back from the rejection in hours.
    const cycle: Status[] = ['rejected', 'viewed', 'sent', 'open', 'draft'];
    let time = Date.UTC(2025, 2, 11, 16, 8);
    return Array.from({ length: 60 }, (_, index) => {
        const round = Math.floor(index / cycle.length);
        const step = cycle[index % cycle.length] as Status;
        const status: Status = step === 'rejected' && round % 3 === 1 ? 'paid' : step;
        const at = new Date(time);
        time -= (6 + ((index * 37) % 61)) * 3_600_000 + ((index * 13) % 60) * 60_000;
        return {
            id: 60 - index,
            status,
            title: titles[status],
            actor:
                status === 'viewed' || status === 'rejected' || status === 'paid'
                    ? 'Acme Corp'
                    : 'Jane Cooper',
            date: `${two(at.getUTCDate())}/${two(at.getUTCMonth() + 1)}/${at.getUTCFullYear()}`,
            time: `${two(at.getUTCHours())}:${two(at.getUTCMinutes())}`,
            month: at.toLocaleString('en-GB', {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
            }),
        };
    });
};

const PLACES = ['Nordic', 'Harbour', 'Lumen', 'Orchard', 'Tideline', 'Summit', 'Cedar', 'Atlas'];
const TRADES = [
    'Labs',
    'Studio',
    'Travel',
    'Foods',
    'Health',
    'Logistics',
    'Media',
    'Partners',
    'Energy',
    'Books',
    'Outdoors',
    'Systems',
    'Dental',
    'Architects',
    'Bakery',
    'Fitness',
    'Legal',
    'Motors',
    'Records',
];

export const lotsOfClients = (): Client[] => {
    const labels = new Set<string>(['Acme Corp']);
    for (let index = 0; labels.size < 150; index++) {
        labels.add(`${pick(PLACES, index)} ${pick(TRADES, index * 3 + (index >> 3))}`);
    }
    return [...labels]
        .sort((a, b) => a.localeCompare(b))
        .map(label => ({ label, current: label === 'Acme Corp' }));
};

// Each group of lines takes the next data colour, so a long invoice stays legible as it scrolls.
const groupColors = [
    'var(--pds-chart-1)',
    'var(--pds-chart-5)',
    'var(--pds-chart-2)',
    'var(--pds-chart-3)',
    'var(--pds-chart-4)',
];

type LineColumn = 'item' | 'description' | 'qty' | 'price' | 'tax' | 'usd' | 'sol';

/** On the 24-column raster an amount needs two columns; on coarser ones one is wide enough. */
const lineColumns = (columns: number): ColumnSpec<LineColumn>[] => {
    const wide = columns >= 24 ? 2 : 1;
    return [
        { key: 'item', label: 'Item', span: wide, priority: 8 },
        { key: 'description', label: 'Description', span: 3, priority: 10, flexible: true },
        { key: 'qty', label: 'Qty', span: 1, priority: 7 },
        { key: 'price', label: 'Unit price', span: wide, priority: 6 },
        { key: 'tax', label: 'Tax', span: 1, priority: 3 },
        { key: 'usd', label: 'Total USD', span: wide, priority: 9 },
        { key: 'sol', label: 'Total SOL', span: wide, priority: 5 },
    ];
};

const lineNumeric = new Set<LineColumn>(['qty', 'price', 'tax', 'usd', 'sol']);

const lineTotal = (line: Line) => line.qty * line.price * (1 + TAX);

const lineValue = (line: Line, column: LineColumn) => {
    switch (column) {
        case 'item':
            return line.item;
        case 'description':
            return line.description;
        case 'qty':
            return line.qty;
        case 'price':
            return usd.format(line.price);
        case 'tax':
            return `${TAX * 100}%`;
        case 'usd':
            return usd.format(lineTotal(line));
        case 'sol':
            return sol.format(lineTotal(line) * SOL_PER_USD);
    }
};

type EventColumn = 'date' | 'time' | 'event' | 'status' | 'actor';

const eventColumns: ColumnSpec<EventColumn>[] = [
    { key: 'date', label: 'Date', span: 2, priority: 9 },
    { key: 'time', label: 'Time', span: 1, priority: 5 },
    { key: 'event', label: 'Event', span: 2, priority: 10, flexible: true },
    { key: 'status', label: 'Status', span: 1, priority: 6 },
    { key: 'actor', label: 'By', span: 2, priority: 4 },
];

const eventNumeric = new Set<EventColumn>(['date', 'time']);

/** A plain text action: no fill, no border, only colour on hover. */
const textAction = cn(
    'cursor-pointer select-none text-left transition-colors duration-150',
    focusRing,
);

const colourAction = cn(textAction, 'text-primary-500 hover:text-primary-700');

/**
 * Padding that puts the first line of a block where Row would put it in a row
 * of this height, and keeps the block a whole number of lines tall after the
 * last, so multi-line text and the rows beside it share the baseline grid.
 */
const lineBox = (height: number): CSSProperties => ({
    paddingTop: baselineIn(height) - BODY_CAP_ON_GRID,
    paddingBottom: height - baselineIn(height),
});

const place = ([start, span]: Span) => ({ gridColumn: `${start} / span ${span}` });

/**
 * Holds a 32px button or input centred in a row of whole lines, so it keeps the
 * row's height and its edges land on the 4px grid.
 */
const Slot = ({
    height,
    className,
    style,
    children,
}: {
    height: number;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}) => (
    <div className={cn('flex min-w-0 items-center', className)} style={{ height, ...style }}>
        {children}
    </div>
);

/**
 * The navigation on the page's own colour: the active item marked by a small
 * square hanging in the margin. It scrolls on its own, so a long client list
 * never moves the page.
 */
const Navigation = ({ clients }: { clients: Client[] }) => {
    const outer = useOuterRaster();
    const [filter, setFilter] = useState('');
    const row = outer.line + 8;
    const shown = clients.filter(client =>
        client.label.toLowerCase().includes(filter.trim().toLowerCase()),
    );
    // A long list shows a dozen at a time; the filter still searches all of them.
    const more = useShowMore(shown.length, 12, filter);

    const item = (label: string, options: { active?: boolean; trailing?: ReactNode } = {}) => (
        <Row className="justify-between gap-2" height={row} key={label}>
            <button
                aria-current={options.active ? 'page' : undefined}
                className={cn(
                    textAction,
                    'relative min-w-0',
                    options.active ? 'text-neutral-950' : 'text-neutral-600 hover:text-neutral-950',
                )}
                type="button"
            >
                {/* The marker hangs in the margin, so the labels keep one edge. */}
                {options.active && <Mark className="absolute top-0.5 -left-3.5 bg-action" />}
                <Text className="truncate">{label}</Text>
            </button>
            {options.trailing}
        </Row>
    );

    const label = (text: string) => (
        <Row height={row}>
            <Text className="text-neutral-500">{text}</Text>
        </Row>
    );

    return (
        <nav
            aria-label="Payments"
            className="flex h-full flex-col overflow-y-auto [scrollbar-width:none]"
            style={{ lineHeight: `${outer.line}px` }}
        >
            <div className="flex flex-col" style={{ paddingTop: outer.line * 2 }}>
                <Row height={outer.line * 2}>
                    <Text className="font-medium text-neutral-950">Northwind Studio</Text>
                </Row>
            </div>

            <div className="flex flex-col" style={{ marginTop: outer.line * 4 }}>
                <Slot height={outer.line * 2}>
                    <RasterButton className="w-full justify-start" variant="secondary">
                        <Plus strokeWidth={1.5} />
                        New invoice
                    </RasterButton>
                </Slot>
                <div style={{ height: outer.line }} />
                {item('Home')}
                {item('Notifications', {
                    trailing: (
                        <span className="flex items-start gap-2">
                            <Mark className="mt-0.5 bg-primary-500" />
                            <Text className="text-neutral-950 tabular-nums">2</Text>
                        </span>
                    ),
                })}
            </div>

            <div className="flex flex-col" style={{ marginTop: outer.line * 2 }}>
                {label('Payments')}
                {item('Payees')}
                {item('Invoices', { active: true })}
                {item('Payment history')}
                {item('Start new payment')}
            </div>

            <div className="flex flex-col" style={{ marginTop: outer.line * 2 }}>
                {label('Account')}
                {item('Settings')}
            </div>

            {/* The client list keeps its label and filter in view while it scrolls past */}
            <div
                className="sticky top-0 z-10 flex flex-col bg-neutral-50"
                style={{ marginTop: outer.line * 2 }}
            >
                <Row className="justify-between gap-2" height={row}>
                    <Text className="text-neutral-500">Clients</Text>
                    <Text className="text-neutral-500 tabular-nums">{clients.length}</Text>
                </Row>
                {clients.length > 8 && (
                    <Slot height={outer.line * 2}>
                        <RasterInput
                            aria-label="Filter clients"
                            leadingIcon={<Search strokeWidth={1.5} />}
                            onChange={event => setFilter(event.target.value)}
                            placeholder="Filter…"
                            value={filter}
                        />
                    </Slot>
                )}
            </div>

            <div className="flex flex-col">
                {shown.slice(0, more.shown).map(client => (
                    <Row height={row} key={client.label}>
                        <button
                            className={cn(
                                textAction,
                                'min-w-0',
                                client.current
                                    ? 'text-neutral-950'
                                    : 'text-neutral-600 hover:text-neutral-950',
                            )}
                            type="button"
                        >
                            <Text className="truncate">{client.label}</Text>
                        </button>
                    </Row>
                ))}
                {shown.length === 0 && (
                    <Row height={row}>
                        <Text className="text-neutral-500">No clients</Text>
                    </Row>
                )}
                {more.remaining > 0 && (
                    <Slot height={outer.line * 2}>
                        <ShowMore
                            onAll={more.all}
                            onMore={more.more}
                            remaining={more.remaining}
                            step={12}
                        />
                    </Slot>
                )}
            </div>

            <div
                className="mt-auto flex flex-col"
                style={{ paddingTop: outer.line * 4, paddingBottom: outer.line * 2 }}
            >
                <Text className="text-neutral-950">Jane Cooper</Text>
                <Text className="mt-1 text-neutral-500">jane@northwind.studio</Text>
            </div>
        </nav>
    );
};

/**
 * A section's name and its column labels. With room for hanging labels they
 * share one sticky row; without, the name stacks above and only the column
 * labels stay in view.
 */
const SectionHeader = <Key extends string>({
    id,
    title,
    columns,
    numeric,
}: {
    id: string;
    title: string;
    columns: { key: Key; label: string; within: Span }[];
    numeric: Set<Key>;
}) => {
    const { raster, content } = useRaster();
    const row = raster.line * 2;
    const hanging = Boolean(content.head);
    const heading = (
        <Text as="h2" className="font-medium text-neutral-950">
            {title}
        </Text>
    );

    return (
        <>
            {!hanging && (
                <Band id={id}>
                    <Area area="main">
                        <Row height={row}>{heading}</Row>
                    </Area>
                </Band>
            )}
            <Band className="sticky top-0 z-20 bg-neutral-50" id={hanging ? id : undefined}>
                {hanging && (
                    <Area area="head">
                        <Row height={row}>{heading}</Row>
                    </Area>
                )}
                {/* The hairline under the column names travels with them */}
                <Area
                    area="main"
                    className="grid grid-cols-subgrid shadow-[inset_0_-1px_0_var(--pds-neutral-200)]"
                >
                    {columns.map(column => (
                        <Row
                            className={cn(numeric.has(column.key) && 'justify-end')}
                            height={row}
                            key={column.key}
                            style={place(column.within)}
                        >
                            <Text className="truncate text-neutral-500">{column.label}</Text>
                        </Row>
                    ))}
                </Area>
            </Band>
        </>
    );
};

/** A label hanging beside its rows, staying there while they scroll past. */
const HangingLabel = ({
    color,
    title,
    note,
}: {
    color: string;
    title: string;
    note: ReactNode;
}) => {
    const { raster, content } = useRaster();
    const row = raster.line * 2;
    const hanging = Boolean(content.head);

    return (
        <Area
            area="head"
            className={cn('flex flex-col self-start', hanging && 'sticky z-10')}
            style={hanging ? { top: row } : undefined}
        >
            <Row className="gap-2" height={row}>
                <Mark className="mt-0.5" style={{ backgroundColor: color }} />
                <Text className="text-neutral-950">{title}</Text>
            </Row>
            {hanging && (
                <Row height={row} style={{ paddingLeft: 16 }}>
                    <Text className="text-neutral-500 tabular-nums">{note}</Text>
                </Row>
            )}
        </Area>
    );
};

const Details = ({ onHistory }: { onHistory: () => void }) => {
    const { raster, content } = useRaster();
    const row = raster.line * 2;
    const main = content.main[1];
    // Labels take the left columns of the content; every value starts on the same column line.
    const labelSpan = main >= 12 ? 3 : main >= 6 ? 2 : 1;
    const valueSpan = main - labelSpan;
    const readable = Math.min(valueSpan, Math.max(4, Math.round((main * 2) / 3)));

    const group = (items: { term: string; value: ReactNode; prose?: boolean }[]) => (
        <dl className="col-span-full grid grid-cols-subgrid">
            {items.map(entry => (
                <div className="col-span-full grid grid-cols-subgrid" key={entry.term}>
                    <dt style={{ ...lineBox(row), ...place([1, labelSpan]) }}>
                        <Text className="truncate text-neutral-500">{entry.term}</Text>
                    </dt>
                    <dd
                        className={cn(!entry.prose && 'flex min-w-0 items-start gap-2')}
                        style={{
                            ...lineBox(row),
                            ...place([labelSpan + 1, entry.prose ? readable : valueSpan]),
                        }}
                    >
                        {entry.value}
                    </dd>
                </div>
            ))}
        </dl>
    );

    return (
        <Band style={{ marginTop: raster.line * 2 }}>
            <Area area="head" className="flex flex-col">
                <Row height={row}>
                    <Text as="h2" className="font-medium text-neutral-950">
                        Invoice details
                    </Text>
                </Row>
                <Slot height={row}>
                    <RasterButton variant="secondary">Edit details</RasterButton>
                </Slot>
            </Area>
            <Area area="main" className="grid grid-cols-subgrid">
                {group([
                    {
                        term: 'Status',
                        value: (
                            <>
                                <Mark
                                    className="mt-0.5"
                                    style={{ backgroundColor: statuses.rejected.color }}
                                />
                                <Text className="text-neutral-950">Rejected</Text>
                                <button
                                    className={cn(colourAction, 'ml-auto')}
                                    onClick={onHistory}
                                    type="button"
                                >
                                    <Text>View status history</Text>
                                </button>
                            </>
                        ),
                    },
                    {
                        term: 'Rejection message',
                        prose: true,
                        value: (
                            <Text as="p" className="text-neutral-950">
                                The breakdown of the development work is not detailed enough. Please
                                list each service separately with its hours, and adjust the due date
                                to the end of the month.
                            </Text>
                        ),
                    },
                ])}
                <div className="col-span-full" style={{ height: raster.line }} />
                {group([
                    {
                        term: 'Receiver',
                        value: <Text className="text-neutral-950">Acme Corp</Text>,
                    },
                    {
                        term: 'Subject',
                        value: (
                            <Text className="truncate text-neutral-950">
                                Website development services
                            </Text>
                        ),
                    },
                    {
                        term: 'Due date',
                        value: <Text className="text-neutral-950 tabular-nums">11/03/2025</Text>,
                    },
                    {
                        term: 'Cryptocurrency',
                        value: (
                            <>
                                <Text className="text-neutral-950">SOL</Text>
                                <Text className="text-neutral-500">Solana</Text>
                            </>
                        ),
                    },
                    {
                        term: 'Discount',
                        value: (
                            <Text className="text-neutral-950 tabular-nums">{DISCOUNT * 100}%</Text>
                        ),
                    },
                ])}
            </Area>
        </Band>
    );
};

const LineActions = ({ item, onDelete }: { item: string; onDelete: () => void }) => (
    <RasterButton
        aria-label={`Delete ${item}`}
        className="text-error-500 opacity-0 hover:text-error-600 focus-visible:opacity-100 group-hover:opacity-100"
        onClick={onDelete}
        size="icon-sm"
        variant="ghost"
    >
        <Trash2 strokeWidth={1.5} />
    </RasterButton>
);

const InvoiceLines = ({
    lines,
    onAdd,
    onRemove,
}: {
    lines: Line[];
    onAdd: () => void;
    onRemove: (id: number) => void;
}) => {
    const { raster, content } = useRaster();
    const [filter, setFilter] = useState('');
    const row = raster.line * 2;
    const columns = allocateColumns(content.main[1], lineColumns(raster.columns));
    const query = filter.trim().toLowerCase();
    const shown = query
        ? lines.filter(line => `${line.item} ${line.description}`.toLowerCase().includes(query))
        : lines;
    // A long invoice reads a page at a time; the totals below still count every line.
    const pages = usePages(shown.length, LINES_PER_PAGE, filter);
    const onPage = shown.slice(pages.start, pages.end);

    // A group's label speaks for all its lines, also those on other pages.
    const groupStats = new Map<string | undefined, { count: number; total: number }>();
    for (const line of shown) {
        const stats = groupStats.get(line.group) ?? { count: 0, total: 0 };
        stats.count += 1;
        stats.total += lineTotal(line);
        groupStats.set(line.group, stats);
    }

    const groups: { name?: string; lines: Line[] }[] = [];
    for (const line of onPage) {
        const last = groups.at(-1);
        if (last && last.name === line.group) last.lines.push(line);
        else groups.push({ name: line.group, lines: [line] });
    }
    const groupNames = [...new Set(lines.map(line => line.group))];
    const colorOf = (name?: string) =>
        groupColors[Math.max(0, groupNames.indexOf(name)) % groupColors.length] as string;

    const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
    const tax = subtotal * TAX;
    const discount = (subtotal + tax) * DISCOUNT;
    const total = subtotal + tax - discount;

    // Totals sit under the amount columns; their names start on the first numeric column line.
    const usdColumn = columns.find(column => column.key === 'usd');
    const solColumn = columns.find(column => column.key === 'sol');
    const firstNumeric = columns.find(column => lineNumeric.has(column.key));
    const labelStart =
        firstNumeric && usdColumn && firstNumeric.within[0] < usdColumn.within[0]
            ? firstNumeric.within[0]
            : 1;
    const labelSpan = Math.max(1, (usdColumn?.within[0] ?? 2) - labelStart);
    // The totals card runs from the label column to the last amount column.
    const totalsEnd = Math.max(
        labelStart + labelSpan - 1,
        ...[usdColumn, solColumn].map(column =>
            column ? column.within[0] + column.within[1] - 1 : 0,
        ),
    );
    const totalsSpan: Span = [labelStart, totalsEnd - labelStart + 1];
    // Inside the card, columns count from its own first one.
    const inCard = ([start, span]: Span) => place([start - labelStart + 1, span]);
    const filterSpan = Math.min(content.main[1], Math.max(4, Math.round(content.main[1] / 3)));
    const totals = [
        { label: 'Subtotal', value: subtotal },
        { label: `Tax ${TAX * 100}%`, value: tax },
        { label: `Discount ${DISCOUNT * 100}%`, value: -discount },
    ];

    const totalRow = (label: string, value: number, strong?: boolean) => (
        <div className="col-span-full grid grid-cols-subgrid" key={label}>
            <Row height={row} style={inCard([labelStart, labelSpan])}>
                <Text
                    className={cn(
                        'truncate',
                        strong ? 'font-medium text-neutral-950' : 'text-neutral-500',
                    )}
                >
                    {label}
                </Text>
            </Row>
            {usdColumn && (
                <Row className="justify-end" height={row} style={inCard(usdColumn.within)}>
                    <Text
                        className={cn(
                            'tabular-nums',
                            strong ? 'font-medium text-neutral-950' : 'text-neutral-600',
                        )}
                    >
                        {value < 0 ? `−${usd.format(-value)}` : usd.format(value)}
                    </Text>
                </Row>
            )}
            {solColumn && (
                <Row className="justify-end" height={row} style={inCard(solColumn.within)}>
                    <Text
                        className={cn(
                            'tabular-nums',
                            strong ? 'font-medium text-neutral-950' : 'text-neutral-600',
                        )}
                    >
                        {value < 0
                            ? `−${sol.format(-value * SOL_PER_USD)}`
                            : sol.format(value * SOL_PER_USD)}
                    </Text>
                </Row>
            )}
        </div>
    );

    let number = pages.start;

    return (
        <>
            {lines.length > 12 && (
                <Band style={{ marginTop: raster.line * 2 }}>
                    <Area area="main" within={[1, filterSpan]}>
                        <Slot height={row}>
                            <RasterInput
                                aria-label="Filter invoice lines"
                                leadingIcon={<Search strokeWidth={1.5} />}
                                onChange={event => setFilter(event.target.value)}
                                placeholder={`Filter ${lines.length} lines…`}
                                value={filter}
                            />
                        </Slot>
                    </Area>
                </Band>
            )}

            <div
                className="col-span-full grid grid-cols-subgrid"
                style={{ marginTop: lines.length > 12 ? 0 : raster.line * 2 }}
            >
                <SectionHeader
                    columns={columns}
                    id="invoice-lines"
                    numeric={lineNumeric}
                    title="Invoice lines"
                />

                {groups.map(group => {
                    const color = colorOf(group.name);
                    const stats = groupStats.get(group.name);

                    return (
                        <Band
                            key={group.name ?? 'lines'}
                            style={{ marginTop: group.name ? raster.line : 0 }}
                        >
                            {group.name && (
                                <HangingLabel
                                    color={color}
                                    note={`${stats?.count ?? 0} · ${usd.format(stats?.total ?? 0)}`}
                                    title={group.name}
                                />
                            )}
                            <Area area="main" className="grid grid-cols-subgrid">
                                {group.lines.map(line => {
                                    number += 1;
                                    return (
                                        <div
                                            className="group relative col-span-full grid grid-cols-subgrid hover:bg-neutral-950/[0.03]"
                                            key={line.id}
                                        >
                                            {/* The line number hangs in the gutter before the content's edge */}
                                            <Row
                                                className="absolute justify-end"
                                                height={row}
                                                style={{
                                                    right: '100%',
                                                    width: raster.gutter * 3,
                                                    paddingRight: raster.gutter / 2,
                                                    color,
                                                }}
                                            >
                                                <Text className="tabular-nums">{number}</Text>
                                            </Row>
                                            {columns.map(column => (
                                                <Row
                                                    className={cn(
                                                        lineNumeric.has(column.key) &&
                                                            'justify-end',
                                                    )}
                                                    height={row}
                                                    key={column.key}
                                                    style={place(column.within)}
                                                >
                                                    <Text
                                                        className={cn(
                                                            'truncate',
                                                            column.key === 'description'
                                                                ? 'text-neutral-950'
                                                                : 'text-neutral-600',
                                                            lineNumeric.has(column.key) &&
                                                                'tabular-nums',
                                                        )}
                                                    >
                                                        {lineValue(line, column.key)}
                                                    </Text>
                                                </Row>
                                            ))}
                                            <div className="absolute top-0.5 -right-9">
                                                <LineActions
                                                    item={line.item}
                                                    onDelete={() => onRemove(line.id)}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </Area>
                        </Band>
                    );
                })}

                {shown.length === 0 && (
                    <Band>
                        <Area area="main">
                            <Row height={row}>
                                <Text className="text-neutral-500">
                                    {lines.length === 0 ? 'No lines yet' : 'No matching lines'}
                                </Text>
                            </Row>
                        </Area>
                    </Band>
                )}

                {pages.pageCount > 1 && (
                    <Band style={{ marginTop: raster.line }}>
                        <Area area="main">
                            <Slot height={row}>
                                <RasterPagination
                                    {...pages}
                                    className="w-full"
                                    label="Invoice line pages"
                                />
                            </Slot>
                        </Area>
                    </Band>
                )}

                <Band style={{ marginTop: raster.line }}>
                    <Area area="main">
                        {/* The ghost button's padding hangs outside, so its icon keeps the column edge */}
                        <Slot height={row}>
                            <RasterButton className="-ml-3" onClick={onAdd} variant="ghost">
                                <Plus strokeWidth={1.5} />
                                Add invoice line
                            </RasterButton>
                        </Slot>
                    </Area>
                </Band>

                {/*
                 * The totals are one thing, so they get the one card: its edges sit
                 * in the gutters and its figures stay on the amount columns above.
                 */}
                <Band style={{ marginTop: raster.line * 2 }}>
                    <Area area="head" style={{ paddingTop: raster.line }}>
                        <Row height={row}>
                            <Text className="text-neutral-500 tabular-nums">
                                {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                            </Text>
                        </Row>
                    </Area>
                    <Panel
                        area="main"
                        className="grid grid-cols-subgrid"
                        style={{ marginInline: -raster.gutter }}
                        within={totalsSpan}
                    >
                        {totals.map(entry => totalRow(entry.label, entry.value))}
                        <div className="col-span-full" style={{ height: raster.line }} />
                        {totalRow('Total', total, true)}
                    </Panel>
                </Band>
            </div>
        </>
    );
};

const StatusHistory = ({ events }: { events: Event[] }) => {
    const { raster, content } = useRaster();
    const [only, setOnly] = useState<Status>();
    const row = raster.line * 2;
    const columns = allocateColumns(content.main[1], eventColumns);
    const shown = only ? events.filter(event => event.status === only) : events;
    const more = useShowMore(shown.length, EVENTS_STEP, only);

    // A month's label counts all its events, also those not shown yet.
    const monthCounts = new Map<string, number>();
    for (const event of shown) {
        monthCounts.set(event.month, (monthCounts.get(event.month) ?? 0) + 1);
    }

    const months: { month: string; events: Event[] }[] = [];
    for (const event of shown.slice(0, more.shown)) {
        const last = months.at(-1);
        if (last && last.month === event.month) last.events.push(event);
        else months.push({ month: event.month, events: [event] });
    }

    const cell = (event: Event, column: EventColumn) => {
        switch (column) {
            case 'date':
                return event.date;
            case 'time':
                return event.time;
            case 'event':
                return event.title;
            case 'status':
                return statuses[event.status].label;
            case 'actor':
                return event.actor;
        }
    };

    return (
        <>
            {events.length > 12 && (
                <Band style={{ marginTop: raster.line * 2 }}>
                    <Area area="main">
                        <Slot height={row}>
                            <RasterSegmented
                                aria-label="Filter by status"
                                onValueChange={value =>
                                    setOnly(value === 'all' ? undefined : (value as Status))
                                }
                                value={only ?? 'all'}
                            >
                                <RasterSegmentedItem value="all">
                                    All
                                    <span className="text-neutral-500 tabular-nums">
                                        {events.length}
                                    </span>
                                </RasterSegmentedItem>
                                {statusOrder.map(status => {
                                    const count = events.filter(
                                        event => event.status === status,
                                    ).length;
                                    if (count === 0) return null;
                                    return (
                                        <RasterSegmentedItem key={status} value={status}>
                                            <Mark
                                                style={{ backgroundColor: statuses[status].color }}
                                            />
                                            {statuses[status].label}
                                            <span className="text-neutral-500 tabular-nums">
                                                {count}
                                            </span>
                                        </RasterSegmentedItem>
                                    );
                                })}
                            </RasterSegmented>
                        </Slot>
                    </Area>
                </Band>
            )}

            <div
                className="col-span-full grid grid-cols-subgrid"
                style={{ marginTop: events.length > 12 ? 0 : raster.line * 2 }}
            >
                <SectionHeader
                    columns={columns}
                    id="invoice-history"
                    numeric={eventNumeric}
                    title="Status history"
                />

                {months.map((month, index) => {
                    const count = monthCounts.get(month.month) ?? month.events.length;
                    return (
                        <Band
                            key={month.month}
                            style={{ marginTop: index === 0 ? 0 : raster.line }}
                        >
                            <HangingLabel
                                color="var(--pds-neutral-300)"
                                note={`${count} ${count === 1 ? 'event' : 'events'}`}
                                title={month.month}
                            />
                            <Area area="main" className="grid grid-cols-subgrid">
                                {month.events.map(event => (
                                    <div
                                        className="relative col-span-full grid grid-cols-subgrid"
                                        key={event.id}
                                    >
                                        {/* The status marks hang in the gutter as one timeline */}
                                        <Row
                                            className="absolute justify-end"
                                            height={row}
                                            style={{
                                                right: '100%',
                                                width: raster.gutter,
                                                paddingRight: raster.gutter / 2,
                                            }}
                                        >
                                            <Mark
                                                className="mt-0.5"
                                                style={{
                                                    backgroundColor: statuses[event.status].color,
                                                }}
                                            />
                                        </Row>
                                        {columns.map(column => (
                                            <Row
                                                className={cn(
                                                    column.key === 'time' && 'justify-end',
                                                )}
                                                height={row}
                                                key={column.key}
                                                style={place(column.within)}
                                            >
                                                <Text
                                                    className={cn(
                                                        'truncate',
                                                        column.key === 'event'
                                                            ? 'text-neutral-950'
                                                            : column.key === 'time' ||
                                                                column.key === 'actor'
                                                              ? 'text-neutral-500'
                                                              : 'text-neutral-600',
                                                        eventNumeric.has(column.key) &&
                                                            'tabular-nums',
                                                    )}
                                                >
                                                    {cell(event, column.key)}
                                                </Text>
                                            </Row>
                                        ))}
                                    </div>
                                ))}
                            </Area>
                        </Band>
                    );
                })}

                {more.remaining > 0 && (
                    <Band style={{ marginTop: raster.line }}>
                        <Area area="main">
                            <Slot height={row}>
                                <ShowMore
                                    onAll={more.all}
                                    onMore={more.more}
                                    remaining={more.remaining}
                                    step={EVENTS_STEP}
                                />
                            </Slot>
                        </Area>
                    </Band>
                )}
            </div>
        </>
    );
};

const InvoicePage = ({
    lines,
    events,
    onAdd,
    onRemove,
}: {
    lines: Line[];
    events: Event[];
    onAdd: () => void;
    onRemove: (id: number) => void;
}) => {
    const { raster, content } = useRaster();
    const line = raster.line;
    const descriptionSpan = Math.min(
        content.main[1],
        Math.max(4, Math.round((content.main[1] * 2) / 3)),
    );
    const showHistory = () =>
        document
            .getElementById('invoice-history')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return (
        <>
            <Band>
                <Area area="head">
                    <Row height={line * 2}>
                        <Text className="text-neutral-500">Payments</Text>
                    </Row>
                </Area>
                <Area area="main">
                    <Row height={line * 2}>
                        <Text className="text-neutral-950">Batch #12345</Text>
                    </Row>
                </Area>
            </Band>

            <Band style={{ marginTop: line * 4 }}>
                <Area area="head">
                    <dl className="flex flex-col">
                        <Text as="dt" className="text-neutral-500">
                            Invoice created
                        </Text>
                        <Text as="dd" className="mt-1 text-neutral-950 tabular-nums">
                            09/03/2025
                        </Text>
                    </dl>
                </Area>
                <Area area="main">
                    <Text
                        as="h1"
                        className="font-medium text-[31px] text-neutral-950 leading-[calc(var(--rx-line)*2)] tracking-[-0.01em]"
                    >
                        Edit invoice INV-0412
                    </Text>
                </Area>
            </Band>

            <Band style={{ marginTop: line * 2 }}>
                <Area area="main" within={[1, descriptionSpan]}>
                    <Text as="p" className="text-neutral-600">
                        Follow the invoice from draft to payment. Every change to its details or
                        lines is logged in the status history.
                    </Text>
                </Area>
            </Band>

            {/* Hairlines only between the major sections, each two lines below the last */}
            <Rule style={{ marginTop: line * 2 }} />

            <Details onHistory={showHistory} />

            <Rule style={{ marginTop: line * 2 }} />

            <InvoiceLines lines={lines} onAdd={onAdd} onRemove={onRemove} />

            <Rule style={{ marginTop: line * 2 }} />

            <StatusHistory events={events} />

            {/* The invoice's state and its actions, under a hairline that stays with them */}
            <Band
                className="sticky bottom-0 z-20 bg-neutral-50 shadow-[inset_0_1px_0_var(--pds-neutral-200)]"
                style={{ marginTop: line * 4, paddingBlock: line }}
            >
                <Area area="all" className="flex items-center justify-between gap-6">
                    <div className="flex items-start gap-2">
                        <Mark
                            className="mt-0.5"
                            style={{ backgroundColor: statuses.rejected.color }}
                        />
                        <Text className="text-neutral-950">Rejected</Text>
                        <Text className="text-neutral-500 tabular-nums">Due 11/03/2025</Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <RasterButton variant="secondary">Save as draft</RasterButton>
                        <RasterButton>
                            Resend invoice
                            <Send strokeWidth={1.5} />
                        </RasterButton>
                    </div>
                </Area>
            </Band>
        </>
    );
};

type InvoiceRasterProps = {
    params: RasterParams;
    containerMax: number;
    height: number;
    density: Density;
    overlay: boolean;
};

/**
 * The invoice editor on a raster. Columns and space separate labels from values
 * and row from row; a few hairlines part the sections, one card holds the
 * totals, and colour marks status and data.
 */
export const InvoiceRaster = ({
    params,
    containerMax,
    height,
    density,
    overlay,
}: InvoiceRasterProps) => {
    const seeded = useMemo(() => (density === 'lots' ? lotsOfLines() : figmaLines), [density]);
    const events = useMemo(() => (density === 'lots' ? lotsOfEvents() : figmaEvents), [density]);
    const clients = useMemo(() => (density === 'lots' ? lotsOfClients() : figmaClients), [density]);
    const [edits, setEdits] = useState<{ density: Density; lines: Line[] }>();
    const lines = edits?.density === density ? edits.lines : seeded;
    const setLines = (update: (current: Line[]) => Line[]) =>
        setEdits({ density, lines: update(lines) });

    return (
        <RasterViewport
            containerMax={containerMax}
            height={height}
            nav={<Navigation clients={clients} />}
            overlay={overlay}
            params={params}
        >
            <InvoicePage
                events={events}
                lines={lines}
                onAdd={() =>
                    setLines(current => {
                        const last = current.at(-1);
                        const id = Math.max(0, ...current.map(entry => entry.id)) + 1;
                        return [
                            ...current,
                            {
                                id,
                                group: last?.group,
                                item: `SUP-${String(id).padStart(3, '0')}`,
                                description: 'Monthly support and maintenance retainer',
                                qty: 1,
                                price: 800,
                            },
                        ];
                    })
                }
                onRemove={id => setLines(current => current.filter(entry => entry.id !== id))}
            />
        </RasterViewport>
    );
};
