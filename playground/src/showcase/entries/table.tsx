import {
    Badge,
    Button,
    Checkbox,
    cn,
    EditableCell,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableConditions,
    TableFooter,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableSelectCell,
    type TableSort,
    TableToolbar,
    TableToolbarEnd,
    TableTree,
    TableTreeCell,
    TableTreeHead,
    TableTreePanel,
    TableTreeRows,
} from 'continuum';
import { Mail, Plus, Send, Undo2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useStageContainer } from '../../layout';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';
import {
    AddCondition,
    type Condition,
    Conditions,
    invoices,
    matches,
    tone,
} from './filter-condition';

/** A stage table's width: beside the knobs panel on a component's page, the whole tile on the grid. */
export const useStageWidth = () =>
    useStageContainer()?.inert
        ? 'w-full'
        : 'w-full @min-[720px]/shell:ml-auto @min-[720px]/shell:w-[calc(100%-264px)]';

const knobs: Knob[] = [
    { id: 'search', label: 'Search', switch: true, default: true },
    { id: 'select', label: 'Owner filter', switch: true, default: true },
    { id: 'conditions', label: 'Conditions', switch: true, default: true },
    { id: 'sorting', label: 'Sorting', switch: true, default: true },
    { id: 'resize', label: 'Resize columns', switch: true, default: false },
    { id: 'copy', label: 'Copy the number', switch: true, default: true },
    { id: 'editable', label: 'Editable client and owner', switch: true, default: false },
    {
        id: 'fold',
        label: 'Table tree',
        options: [
            o('off', 'Off'),
            o('same', 'Same kind'),
            o('lines', 'Different content'),
            o('panel', 'Custom content'),
        ],
        default: 'lines',
    },
    { id: 'selection', label: 'Row selection', switch: true, default: false },
    { id: 'footer', label: 'Total in the footer', switch: true, default: false },
];

const owners = ['Anna de Vries', 'Bram Jansen', 'Chloé Martin'].map(name => ({
    value: name,
    label: name,
}));

type Invoice = (typeof invoices)[number];

const euro = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

/**
 * What an invoice is made of: not invoices but its lines, so they fold out under a head of their own
 * that names what the table's columns hold for them. Each invoice's lines add up to its amount.
 */
type InvoiceLine = { item: string; by: string; quantity: number; rate: number };

/**
 * An invoice's last change, as a diff of its record: not rows of anything, so it folds out as a panel
 * of its own. Each line is the record's line before (`old`) and after (`now`) the change.
 */
type DiffLine = { kind: '+' | '-' | ' '; old?: number; now?: number; text: string };
type Change = { title: string; file: string; who: string; when: string; lines: DiffLine[] };

const changeOf: Record<string, Change> = {
    'INV-0142': {
        title: 'Due date and terms changed',
        file: 'invoices/INV-0142.json',
        who: 'Bram Jansen',
        when: '2 days ago',
        lines: [
            { kind: ' ', old: 4, now: 4, text: '  "client": "Acme Corp",' },
            { kind: '-', old: 5, text: '  "due": "2026-11-30",' },
            { kind: '-', old: 6, text: '  "terms": "14 days",' },
            { kind: '+', now: 5, text: '  "due": "2026-12-15",' },
            { kind: '+', now: 6, text: '  "terms": "30 days",' },
            { kind: '+', now: 7, text: '  "reminders": ["7d", "1d"],' },
            { kind: ' ', old: 7, now: 8, text: '  "amount": 4120.00,' },
        ],
    },
    'INV-0139': {
        title: 'Marked overdue',
        file: 'invoices/INV-0139.json',
        who: 'Chloé Martin',
        when: '3 Nov',
        lines: [
            { kind: ' ', old: 4, now: 4, text: '  "client": "Globex",' },
            { kind: '-', old: 5, text: '  "status": "due",' },
            { kind: '+', now: 5, text: '  "status": "overdue",' },
            { kind: ' ', old: 6, now: 6, text: '  "amount": 1860.00,' },
        ],
    },
};

/**
 * A diff in a hairline box (`item` corners): a strip with the file and the count of lines added and
 * removed, then the lines in 11 mono, 20 apart, the old and new line numbers in two 32 gutters. A
 * removed line on the error wash with a − in its 700, an added one on the success wash with a +.
 */
const Diff = ({ change }: { change: Change }) => {
    const added = change.lines.filter(line => line.kind === '+').length;
    const removed = change.lines.filter(line => line.kind === '-').length;

    return (
        <div className="overflow-hidden rounded-item border border-neutral-200 bg-neutral-50">
            <div className="flex h-8 items-center justify-between gap-3 border-neutral-200 border-b bg-neutral-100 px-3 text-xxs">
                <span className="truncate font-mono text-neutral-800">{change.file}</span>
                <span className="flex shrink-0 gap-2 font-medium font-mono">
                    <span className="text-success-700">+{added}</span>
                    <span className="text-error-700">−{removed}</span>
                </span>
            </div>
            <div className="py-1 font-mono text-xxs leading-5">
                {change.lines.map(line => (
                    <div
                        className={cn(
                            'grid grid-cols-[32px_32px_16px_1fr] text-neutral-800',
                            line.kind === '-' && 'bg-error-500/10',
                            line.kind === '+' && 'bg-success-500/10',
                        )}
                        key={`${line.kind}${line.old ?? ''}-${line.now ?? ''}`}
                    >
                        <span className="select-none pr-2 text-right text-neutral-500">
                            {line.old}
                        </span>
                        <span className="select-none pr-2 text-right text-neutral-500">
                            {line.now}
                        </span>
                        <span
                            aria-hidden={line.kind === ' '}
                            className={cn(
                                'select-none',
                                line.kind === '-' && 'text-error-700',
                                line.kind === '+' && 'text-success-700',
                            )}
                        >
                            {line.kind === '-' ? '−' : line.kind}
                        </span>
                        <span className="whitespace-pre pr-3">{line.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const linesOf: Record<string, InvoiceLine[]> = {
    'INV-0142': [
        { item: 'Design review', by: 'Anna de Vries', quantity: 8, rate: 140 },
        { item: 'Build sprint', by: 'Bram Jansen', quantity: 20, rate: 150 },
    ],
    'INV-0141': [
        { item: 'Retainer, November', by: 'Bram Jansen', quantity: 1, rate: 1500 },
        { item: 'Hosting', by: 'Bram Jansen', quantity: 12, rate: 40 },
    ],
    'INV-0139': [
        { item: 'Workshop', by: 'Chloé Martin', quantity: 1, rate: 1200 },
        { item: 'Travel', by: 'Chloé Martin', quantity: 1, rate: 660 },
    ],
};

/** The amount as a number, from its display form ("€4,120.00"). */
const amountOf = (invoice: Invoice) => Number(invoice.amount.replace(/[^\d.]/g, ''));

/** Every word typed appears in the client's name or the invoice's number. */
const found = (invoice: Invoice, query: string) =>
    query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every(word => `${invoice.client} ${invoice.number}`.toLowerCase().includes(word));

/** An invoice split into parts, each an invoice of its own with an even share of the amount. */
const split = (invoice: Invoice, statuses: string[], name: (index: number) => string): Invoice[] =>
    statuses.map((status, index) => ({
        ...invoice,
        number: name(index),
        status,
        amount: euro.format(amountOf(invoice) / statuses.length),
    }));

/**
 * The invoices paid in instalments, and the instalments paid in parts: rows of the same kind as the
 * row they belong to, so they fill the same columns, two levels deep. The rest fold out nothing.
 */
const instalmentStatus: Record<string, string[]> = {
    'INV-0142': ['Paid', 'Due soon'],
    'INV-0141': ['Paid', 'Paid'],
    'INV-0139': ['Paid', 'Overdue'],
};
const partStatus: Record<string, string[]> = {
    'INV-0142-1': ['Paid', 'Paid'],
    'INV-0142-2': ['Paid', 'Due soon'],
    'INV-0139-2': ['Paid', 'Overdue'],
};

/** An invoice's instalments (INV-0142-1), or an instalment's parts (INV-0142-1a). */
const partsOf = (invoice: Invoice): Invoice[] | undefined => {
    const instalments = instalmentStatus[invoice.number];
    if (instalments) return split(invoice, instalments, i => `${invoice.number}-${i + 1}`);
    const parts = partStatus[invoice.number];
    return parts && split(invoice, parts, i => `${invoice.number}${'ab'[i]}`);
};

type SortKey = 'number' | 'client' | 'amount';

const compare: Record<SortKey, (a: Invoice, b: Invoice) => number> = {
    number: (a, b) => a.number.localeCompare(b.number),
    client: (a, b) => a.client.localeCompare(b.client),
    amount: (a, b) => amountOf(a) - amountOf(b),
};

/**
 * The invoice list, every part of the table on it, set by knobs: the Table entry's stage, and the
 * Table tree entry's with the bar off.
 */
export const InvoiceTable = ({ knobs }: PreviewProps) => {
    // Off a stage (an in-use piece) the menus portal to the page, not into nothing.
    const stage = useStageContainer() ?? undefined;
    // On the page the knobs panel sits over the stage's top left; a tile on the grid has none.
    const tile = Boolean(stage?.inert);
    const [query, setQuery] = useState('');
    const [owner, setOwner] = useState('any');
    const [conditions, setConditions] = useState<Condition[]>([
        { field: 'status', operator: 'any', values: ['Due soon', 'Overdue'] },
    ]);
    const [picked, setPicked] = useState<string[]>([]);
    const [order, setOrder] = useState<{ key: SortKey; sort: TableSort }>({
        key: 'amount',
        sort: 'none',
    });
    const search = Boolean(knobs.search);
    const select = Boolean(knobs.select);
    const narrowing = Boolean(knobs.conditions);
    const selection = Boolean(knobs.selection);
    const sorting = Boolean(knobs.sorting);
    const copy = Boolean(knobs.copy);
    const kind = String(knobs.fold);
    const fold = kind !== 'off';
    const editable = Boolean(knobs.editable);
    const resize = Boolean(knobs.resize);
    const [widths, setWidths] = useState<Record<string, number>>({});
    // A resizable head's props: its width (none for Client, which takes the rest until resized).
    const sized = (key: string, base?: number) =>
        resize
            ? {
                  width: widths[key] ?? base,
                  onWidthChange: (width: number) =>
                      setWidths(current => ({ ...current, [key]: width })),
              }
            : {};
    // Whether the line hangs from an open chevron; the Table tree entry switches it.
    const guides = knobs.guides === undefined ? true : Boolean(knobs.guides);
    const [edits, setEdits] = useState<Record<string, Partial<Invoice>>>({});
    const edit = (number: string, change: Partial<Invoice>) =>
        setEdits(current => ({ ...current, [number]: { ...current[number], ...change } }));
    // Columns before the amount, for the footer's label cell to span.
    const leading = 4 + (selection ? 1 : 0) + (fold ? 1 : 0);

    const shown = invoices.filter(
        invoice =>
            (!search || found(invoice, query)) &&
            (!select || owner === 'any' || invoice.owner === owner) &&
            (!narrowing || conditions.every(condition => matches(invoice, condition))),
    );
    const rows =
        sorting && order.sort !== 'none'
            ? [...shown].sort(
                  (a, b) => compare[order.key](a, b) * (order.sort === 'ascending' ? 1 : -1),
              )
            : shown;
    const bar = search || select || narrowing;
    // While rows fold, a row with parts is picked through them: what is picked is the rows at the
    // ends of its branches, and its box shows whether all, some or none of them are.
    const childrenOf = (invoice: Invoice) => (kind === 'same' ? partsOf(invoice) : undefined);
    const lines = (invoice: Invoice) => (kind === 'lines' ? linesOf[invoice.number] : undefined);
    const lineId = (invoice: Invoice, line: InvoiceLine) => `${invoice.number} · ${line.item}`;
    const pickable = (invoice: Invoice): string[] =>
        lines(invoice)?.map(line => lineId(invoice, line)) ??
        childrenOf(invoice)?.flatMap(pickable) ?? [invoice.number];
    const everyPickable = rows.flatMap(pickable);
    const allPicked = everyPickable.length > 0 && everyPickable.every(n => picked.includes(n));
    const somePicked = everyPickable.some(n => picked.includes(n));
    const toggle = (numbers: string[], on: boolean) =>
        setPicked(current =>
            on
                ? [...current.filter(n => !numbers.includes(n)), ...numbers]
                : current.filter(n => !numbers.includes(n)),
        );
    // At the right of the conditions row while there is one, in the bar while there are none.
    const add = <AddCondition conditions={conditions} container={stage} onChange={setConditions} />;
    // A sortable head's props, or none while sorting is off.
    const sortOf = (key: SortKey) =>
        sorting
            ? {
                  sort: order.key === key ? order.sort : ('none' as TableSort),
                  onSortChange: (sort: TableSort) => setOrder({ key, sort }),
              }
            : {};
    // While rows can fold, a row's controls (its box and its chevron) share its first cell.
    const foldColumn = fold;

    const row = (raw: Invoice, { nested, own }: { nested?: boolean; own?: string[] } = {}) => {
        const invoice = { ...raw, ...edits[raw.number] };
        const numbers = own ?? [invoice.number];
        const all = numbers.every(n => picked.includes(n));
        const some = numbers.some(n => picked.includes(n));
        const box = selection ? (
            <Checkbox
                aria-label={`Select ${invoice.number}`}
                checked={all}
                indeterminate={some && !all}
                onCheckedChange={checked => toggle(numbers, checked === true)}
            />
        ) : undefined;

        return (
            <TableRow data-selected={(selection && all) || undefined} key={invoice.number}>
                {/* A nested row's box moves into the fold column, under its parent's chevron. */}
                {selection && <TableSelectCell>{box}</TableSelectCell>}
                {foldColumn && <TableTreeCell select={box} />}
                <TableCell copy={copy ? invoice.number : undefined} tree={foldColumn}>
                    {invoice.number}
                </TableCell>
                {/* An instalment's client is its invoice's: said again, quieter, as meta. */}
                {editable ? (
                    <EditableCell
                        className={cn(nested && 'font-normal text-neutral-700')}
                        label={`Client of ${invoice.number}`}
                        onValueChange={client => edit(invoice.number, { client })}
                        value={invoice.client}
                    />
                ) : (
                    <TableCell className={cn(nested && 'font-normal text-neutral-700')}>
                        {invoice.client}
                    </TableCell>
                )}
                <TableCell>
                    <Badge tone={tone[invoice.status]}>{invoice.status}</Badge>
                </TableCell>
                {editable ? (
                    <EditableCell
                        className="font-normal text-neutral-700"
                        container={stage}
                        label={`Owner of ${invoice.number}`}
                        onValueChange={owner => edit(invoice.number, { owner })}
                        options={owners}
                        value={invoice.owner}
                    />
                ) : (
                    <TableCell className="font-normal text-neutral-700">{invoice.owner}</TableCell>
                )}
                <TableCell numeric>{invoice.amount}</TableCell>
            </TableRow>
        );
    };

    // A row and, when it has parts, the fold that opens to them, as deep as they go. The first
    // invoice and its first instalment start open, so two levels of chevrons show.
    // An invoice's lines: a head of their own, naming the columns for them, then a row a line.
    const lineRows = (invoice: Invoice, list: InvoiceLine[]) => (
        <TableTreeRows>
            <TableTreeHead>
                {selection && <TableSelectCell />}
                <TableTreeCell />
                <TableHead tree>Item</TableHead>
                <TableHead>Logged by</TableHead>
                <TableHead numeric>Qty</TableHead>
                <TableHead numeric>Rate</TableHead>
                <TableHead numeric>Amount</TableHead>
            </TableTreeHead>
            {list.map(line => {
                const id = lineId(invoice, line);
                const on = picked.includes(id);
                const box = selection ? (
                    <Checkbox
                        aria-label={`Select ${line.item}`}
                        checked={on}
                        onCheckedChange={checked => toggle([id], checked === true)}
                    />
                ) : undefined;
                return (
                    <TableRow data-selected={(selection && on) || undefined} key={id}>
                        {selection && <TableSelectCell>{box}</TableSelectCell>}
                        <TableTreeCell select={box} />
                        <TableCell tree>{line.item}</TableCell>
                        <TableCell className="font-normal text-neutral-700">{line.by}</TableCell>
                        <TableCell className="font-normal text-neutral-700" numeric>
                            {line.quantity}
                        </TableCell>
                        <TableCell className="font-normal text-neutral-700" numeric>
                            {euro.format(line.rate)}
                        </TableCell>
                        <TableCell numeric>{euro.format(line.quantity * line.rate)}</TableCell>
                    </TableRow>
                );
            })}
        </TableTreeRows>
    );

    const folding = (invoice: Invoice, depth = 0): ReactNode => {
        const change = kind === 'panel' ? changeOf[invoice.number] : undefined;
        if (change)
            return (
                <TableTree
                    defaultOpen={invoice.number === rows[0]?.number}
                    guides={guides}
                    key={invoice.number}
                    label={`Last change to ${invoice.number}`}
                >
                    {row(invoice)}
                    <TableTreeRows>
                        <TableTreePanel
                            aside={
                                <div className="flex flex-col items-start gap-1">
                                    <p className="font-medium text-neutral-900">{change.title}</p>
                                    <p>
                                        {change.who}, {change.when}
                                    </p>
                                    <Button className="mt-3" variant="secondary">
                                        <Undo2 {...icon} /> Revert
                                    </Button>
                                </div>
                            }
                            asideSpan={2}
                            selection={selection}
                        >
                            <Diff change={change} />
                        </TableTreePanel>
                    </TableTreeRows>
                </TableTree>
            );
        const list = lines(invoice);
        if (list)
            return (
                <TableTree
                    defaultOpen={invoice.number === rows[0]?.number}
                    guides={guides}
                    key={invoice.number}
                    label={`Lines of ${invoice.number}`}
                >
                    {row(invoice, { own: pickable(invoice) })}
                    {lineRows(invoice, list)}
                </TableTree>
            );
        const children = childrenOf(invoice);
        const nested = depth > 0;
        if (!children) return row(invoice, { nested });

        return (
            <TableTree
                defaultOpen={
                    depth === 0 ? invoice.number === rows[0]?.number : invoice.number.endsWith('-1')
                }
                guides={guides}
                key={invoice.number}
                label={`${depth === 0 ? 'Instalments' : 'Parts'} of ${invoice.number}`}
            >
                {row(invoice, { nested, own: pickable(invoice) })}
                <TableTreeRows>{children.map(child => folding(child, depth + 1))}</TableTreeRows>
            </TableTree>
        );
    };

    const selectAll = selection ? (
        <Checkbox
            aria-label="Select every invoice shown"
            checked={allPicked}
            indeterminate={somePicked && !allPicked}
            onCheckedChange={checked => setPicked(checked ? everyPickable : [])}
        />
    ) : undefined;

    return (
        <Table
            toolbar={
                bar && (
                    <>
                        <TableToolbar>
                            {search && (
                                <TableSearch
                                    aria-label="Search invoices"
                                    onChange={event => setQuery(event.target.value)}
                                    placeholder="Search invoices"
                                    value={query}
                                />
                            )}
                            <TableToolbarEnd>
                                {select && (
                                    <Select
                                        onValueChange={value => setOwner(String(value))}
                                        value={owner}
                                    >
                                        <SelectTrigger aria-label="Owner" size="sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="end" container={stage}>
                                            <SelectItem value="any">Any owner</SelectItem>
                                            <SelectItem value="Anna de Vries">
                                                Anna de Vries
                                            </SelectItem>
                                            <SelectItem value="Bram Jansen">Bram Jansen</SelectItem>
                                            <SelectItem value="Chloé Martin">
                                                Chloé Martin
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                {narrowing && conditions.length === 0 && add}
                            </TableToolbarEnd>
                        </TableToolbar>
                        {narrowing && conditions.length > 0 && (
                            <TableConditions>
                                <Conditions
                                    conditions={conditions}
                                    container={stage}
                                    onChange={setConditions}
                                    withAdd={false}
                                />
                                <TableToolbarEnd>{add}</TableToolbarEnd>
                            </TableConditions>
                        )}
                    </>
                )
            }
            wrapperClassName={
                tile
                    ? 'w-full'
                    : 'w-full @min-[720px]/shell:ml-auto @min-[720px]/shell:w-[calc(100%-264px)]'
            }
        >
            <TableHeader>
                <TableRow>
                    {selection && <TableHead className="w-11">{selectAll}</TableHead>}
                    {/* The fold column: an action column after the boxes, its head empty. */}
                    {foldColumn && <TableHead className="w-11" />}
                    <TableHead className="w-36" {...sortOf('number')} {...sized('number', 144)}>
                        Invoice
                    </TableHead>
                    <TableHead {...sortOf('client')} {...sized('client')}>
                        Client
                    </TableHead>
                    <TableHead className="w-28" {...sized('status', 112)}>
                        Status
                    </TableHead>
                    <TableHead className="w-36" {...sized('owner', 144)}>
                        Owner
                    </TableHead>
                    <TableHead
                        className="w-28"
                        numeric
                        {...sortOf('amount')}
                        {...sized('amount', 112)}
                    >
                        Amount
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>{rows.map(invoice => folding(invoice))}</TableBody>
            {knobs.footer && (
                <TableFooter>
                    {/* The total, set off from the rows above by a hairline. */}
                    <TableRow className="[&>td]:border-neutral-200 [&>td]:border-t [&>td]:pt-3 [&>td]:pb-4">
                        <TableCell colSpan={leading}>
                            Total of {rows.length} {rows.length === 1 ? 'invoice' : 'invoices'}
                        </TableCell>
                        <TableCell numeric>
                            {euro.format(rows.reduce((sum, row) => sum + amountOf(row), 0))}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            )}
        </Table>
    );
};

export const entry: Entry = {
    id: 'table',
    name: 'Table',
    category: 'tables',
    description:
        'Ruled for data you work through: its own bar to search and pick, and the head, cell and fold parts together.',
    span: 2,
    hero: 'min-h-120',
    knobs,
    Preview: InvoiceTable,
};

const phases = [
    {
        title: 'Welcome',
        hint: 'day 0 to 3',
        steps: [
            { subject: 'Welcome to Acme', delay: 'Immediately', sent: 1240, opened: 812 },
            { subject: 'Send your first invoice', delay: '1 day', sent: 1188, opened: 604 },
        ],
    },
    {
        title: 'Activation',
        hint: 'week 1 to 2',
        steps: [
            { subject: 'Invite your team', delay: '4 days', sent: 1032, opened: 455 },
            { subject: 'Get paid faster with reminders', delay: '7 days', sent: 1001, opened: 538 },
            { subject: 'Your first month in numbers', delay: '14 days', sent: 980, opened: 520 },
        ],
    },
];

const SequenceTable = () => (
    <AppWindow
        actions={
            <>
                <Button variant="secondary">
                    <Send {...icon} /> Send a test
                </Button>
                <Button>
                    <Plus {...icon} /> Add email
                </Button>
            </>
        }
        description="Five emails over two weeks, sent to every new customer."
        nav="top"
        place="customers"
        title="Onboarding sequence"
    >
        <Table wrapperClassName="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead numeric>Sent</TableHead>
                    <TableHead numeric>Opened</TableHead>
                    <TableHead numeric>Open rate</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {phases.map(phase => [
                    <TableGroupRow hint={phase.hint} key={phase.title}>
                        {phase.title}
                    </TableGroupRow>,
                    ...phase.steps.map(step => (
                        <TableRow key={step.subject}>
                            <TableCell>
                                <span className="inline-flex items-center gap-2">
                                    <Mail className="size-4 text-neutral-600" {...icon} />
                                    {step.subject}
                                </span>
                            </TableCell>
                            <TableCell className="font-normal text-neutral-600">
                                {step.delay}
                            </TableCell>
                            <TableCell numeric>{step.sent.toLocaleString('en-GB')}</TableCell>
                            <TableCell numeric>{step.opened.toLocaleString('en-GB')}</TableCell>
                            <TableCell numeric>
                                <Badge tone={step.opened / step.sent > 0.5 ? 'success' : 'neutral'}>
                                    {Math.round((step.opened / step.sent) * 100)}%
                                </Badge>
                            </TableCell>
                        </TableRow>
                    )),
                ])}
            </TableBody>
        </Table>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Onboarding sequence',
    note: 'A sequence’s emails in a ruled table, grouped into phases, the numbers right-aligned.',
    app: true,
    render: () => <SequenceTable />,
};
