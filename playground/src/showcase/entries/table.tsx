import {
    Badge,
    Button,
    Checkbox,
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
    TableToolbar,
    TableToolbarEnd,
} from 'continuum';
import { Mail, Plus, Send } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { AppWindow, type Entry, type InUse, icon, type Knob, type PreviewProps } from '../kit';
import {
    AddCondition,
    type Condition,
    Conditions,
    invoices,
    matches,
    tone,
} from './filter-condition';

const knobs: Knob[] = [
    { id: 'search', label: 'Search', switch: true, default: true },
    { id: 'select', label: 'Owner filter', switch: true, default: true },
    { id: 'conditions', label: 'Conditions', switch: true, default: true },
    { id: 'selection', label: 'Row selection', switch: true, default: false },
    { id: 'footer', label: 'Total in the footer', switch: true, default: false },
];

const euro = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

/** The amount as a number, from its display form ("€4,120.00"). */
const amountOf = (invoice: (typeof invoices)[number]) =>
    Number(invoice.amount.replace(/[^\d.]/g, ''));

/** Every word typed appears in the client's name or the invoice's number. */
const found = (invoice: (typeof invoices)[number], query: string) =>
    query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every(word => `${invoice.client} ${invoice.number}`.toLowerCase().includes(word));

const TablePreview = ({ knobs }: PreviewProps) => {
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
    const search = Boolean(knobs.search);
    const select = Boolean(knobs.select);
    const narrowing = Boolean(knobs.conditions);
    const selection = Boolean(knobs.selection);
    // Columns before the amount, for the footer's label cell to span.
    const leading = selection ? 5 : 4;

    const rows = invoices.filter(
        invoice =>
            (!search || found(invoice, query)) &&
            (!select || owner === 'any' || invoice.owner === owner) &&
            (!narrowing || conditions.every(condition => matches(invoice, condition))),
    );
    const bar = search || select || narrowing;
    const allPicked = rows.length > 0 && rows.every(row => picked.includes(row.number));
    const somePicked = rows.some(row => picked.includes(row.number));
    const toggle = (number: string, on: boolean) =>
        setPicked(current => (on ? [...current, number] : current.filter(n => n !== number)));
    // At the right of the conditions row while there is one, in the bar while there are none.
    const add = <AddCondition conditions={conditions} container={stage} onChange={setConditions} />;

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
            wrapperClassName={tile ? 'w-full' : 'ml-auto w-[calc(100%-264px)]'}
        >
            <TableHeader>
                <TableRow>
                    {selection && (
                        <TableHead className="w-11">
                            <Checkbox
                                aria-label="Select every invoice shown"
                                checked={allPicked}
                                indeterminate={somePicked && !allPicked}
                                onCheckedChange={checked =>
                                    setPicked(checked ? rows.map(row => row.number) : [])
                                }
                            />
                        </TableHead>
                    )}
                    <TableHead className="w-28">Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-36">Owner</TableHead>
                    <TableHead className="w-28" numeric>
                        Amount
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map(invoice => (
                    <TableRow
                        data-selected={(selection && picked.includes(invoice.number)) || undefined}
                        key={invoice.number}
                    >
                        {selection && (
                            <TableCell>
                                <Checkbox
                                    aria-label={`Select ${invoice.number}`}
                                    checked={picked.includes(invoice.number)}
                                    onCheckedChange={checked =>
                                        toggle(invoice.number, checked === true)
                                    }
                                />
                            </TableCell>
                        )}
                        <TableCell>{invoice.number}</TableCell>
                        <TableCell>{invoice.client}</TableCell>
                        <TableCell>
                            <Badge tone={tone[invoice.status]}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell className="font-normal text-neutral-700">
                            {invoice.owner}
                        </TableCell>
                        <TableCell numeric>{invoice.amount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
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
    category: 'content',
    description:
        'Ruled for data you work through: its own bar to search and pick, and the conditions under it.',
    span: 2,
    hero: 'min-h-120',
    knobs,
    Preview: TablePreview,
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
