import {
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSelectCell,
    TableTree,
    TableTreeCell,
    TableTreeRows,
} from '@contui/ui';
import { FileText, Folder } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';
import { useStageWidth } from './table';

/* ---------- A tree of rows, any depth ---------- */

type Node = { name: string; items?: Node[] };

type Column<N extends Node> = {
    head: string;
    className?: string;
    numeric?: boolean;
    cell: (node: N) => ReactNode;
};

type FoldTreeProps<N extends Node> = {
    label: string;
    nodes: N[];
    /** The first column: the tree's, holding each row's name. */
    name: { head: string; className?: string; cell: (node: N) => ReactNode };
    columns: Column<N>[];
    selection: boolean;
    guides: boolean;
    /** Which rows start open. */
    open: (node: N, depth: number) => boolean;
    /** The rows are a breakdown of the row above: every column steps in a level. */
    shift?: boolean;
    wrapperClassName?: string;
};

/** What picking a row picks: the rows at the ends of its branches. */
const leaves = <N extends Node>(node: N): string[] =>
    node.items ? (node.items as N[]).flatMap(leaves) : [node.name];

/**
 * A table whose rows fold out into rows of the same kind, as deep as the data goes: each level is
 * a `TableTree` holding its row and a `TableTreeRows` of the next level.
 */
const FoldTree = <N extends Node>({
    label,
    nodes,
    name,
    columns,
    selection,
    guides,
    open,
    shift,
    wrapperClassName = 'w-full',
}: FoldTreeProps<N>) => {
    const every = nodes.flatMap(leaves);
    const [picked, setPicked] = useState<string[]>([]);
    const toggle = (names: string[], on: boolean) =>
        setPicked(current =>
            on
                ? [...current.filter(n => !names.includes(n)), ...names]
                : current.filter(n => !names.includes(n)),
        );
    const allOf = (names: string[]) => names.length > 0 && names.every(n => picked.includes(n));
    const someOf = (names: string[]) => names.some(n => picked.includes(n));

    const row = (node: N, depth: number): ReactNode => {
        const own = leaves(node);
        const box = selection ? (
            <Checkbox
                aria-label={`Select ${node.name}`}
                checked={allOf(own)}
                indeterminate={someOf(own) && !allOf(own)}
                onCheckedChange={checked => toggle(own, checked === true)}
            />
        ) : undefined;
        const line = (
            <TableRow data-selected={(selection && allOf(own)) || undefined} key={node.name}>
                {selection && <TableSelectCell>{box}</TableSelectCell>}
                <TableTreeCell select={box} />
                <TableCell tree>{name.cell(node)}</TableCell>
                {columns.map(column => (
                    <TableCell
                        className="font-normal text-neutral-700"
                        key={column.head}
                        numeric={column.numeric}
                    >
                        {column.cell(node)}
                    </TableCell>
                ))}
            </TableRow>
        );
        if (!node.items) return line;

        return (
            <TableTree
                defaultOpen={open(node, depth)}
                guides={guides}
                key={node.name}
                label={`What is in ${node.name}`}
            >
                {line}
                <TableTreeRows shift={shift}>
                    {(node.items as N[]).map(child => row(child, depth + 1))}
                </TableTreeRows>
            </TableTree>
        );
    };

    return (
        <Table aria-label={label} wrapperClassName={wrapperClassName}>
            <TableHeader>
                <TableRow>
                    {selection && (
                        <TableHead className="w-11">
                            <Checkbox
                                aria-label={`Select every row of ${label}`}
                                checked={allOf(every)}
                                indeterminate={someOf(every) && !allOf(every)}
                                onCheckedChange={checked => setPicked(checked ? every : [])}
                            />
                        </TableHead>
                    )}
                    {/* The fold column: an action column after the boxes, its head empty. */}
                    <TableHead className="w-11" />
                    <TableHead className={name.className}>{name.head}</TableHead>
                    {columns.map(column => (
                        <TableHead
                            className={column.className}
                            key={column.head}
                            numeric={column.numeric}
                        >
                            {column.head}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>{nodes.map(node => row(node, 0))}</TableBody>
        </Table>
    );
};

/* ---------- The stage: folders in folders ---------- */

type File = Node & { owner: string; modified: string; size?: string; items?: File[] };

const file = (name: string, owner: string, modified: string, size: string): File => ({
    name,
    owner,
    modified,
    size,
});

const tree: File[] = [
    {
        name: 'Clients',
        owner: 'Anna de Vries',
        modified: '14 Nov',
        items: [
            {
                name: 'Acme Corp',
                owner: 'Anna de Vries',
                modified: '14 Nov',
                items: [
                    {
                        name: 'Contracts',
                        owner: 'Anna de Vries',
                        modified: '12 Nov',
                        items: [
                            file('Master agreement 2026.pdf', 'Anna de Vries', '12 Nov', '412 KB'),
                            file('Statement of work, Q4.pdf', 'Bram Jansen', '3 Nov', '188 KB'),
                        ],
                    },
                    {
                        name: 'Invoices',
                        owner: 'Bram Jansen',
                        modified: '14 Nov',
                        items: [
                            file('INV-0142.pdf', 'Bram Jansen', '14 Nov', '64 KB'),
                            file('INV-0141.pdf', 'Bram Jansen', '9 Nov', '61 KB'),
                        ],
                    },
                    file('Brief.docx', 'Chloé Martin', '2 Oct', '38 KB'),
                ],
            },
            {
                name: 'Globex',
                owner: 'Chloé Martin',
                modified: '28 Oct',
                items: [file('NDA.pdf', 'Chloé Martin', '28 Oct', '96 KB')],
            },
        ],
    },
    {
        name: 'Brand',
        owner: 'Chloé Martin',
        modified: '2 Oct',
        items: [
            file('Logo.svg', 'Chloé Martin', '2 Oct', '12 KB'),
            file('Guidelines.pdf', 'Chloé Martin', '2 Oct', '8.4 MB'),
        ],
    },
    file('Roadmap.md', 'Anna de Vries', '16 Nov', '9 KB'),
];

/** Folders open down to the level the knob asks for, along the first branch. */
const openTo = (levels: number) => (node: File, depth: number) =>
    depth < levels && (depth === 0 ? node.name === 'Clients' : node.name !== 'Globex');

const fileName = (node: File) => (
    <span className="inline-flex items-center gap-2">
        {node.items ? (
            <Folder className="size-4 shrink-0 text-neutral-500" {...icon} />
        ) : (
            <FileText className="size-4 shrink-0 text-neutral-500" {...icon} />
        )}
        {node.name}
    </span>
);

/* ---------- The stage, as a breakdown: payouts by source, sources by plan ---------- */

type Payout = Node & {
    date?: string;
    source: string;
    /** A source's colour, the chart series it is drawn in elsewhere. */
    colour?: string;
    amount: number;
    items?: Payout[];
};

const part = (name: string, source: string, amount: number): Payout => ({ name, source, amount });

/** A row whose amount is its parts' added up. */
const sum = (fields: Omit<Payout, 'amount' | 'items'>, items: Payout[]): Payout => ({
    ...fields,
    items,
    amount: items.reduce((total, item) => total + item.amount, 0),
});

const payout = (day: string, scale: number): Payout =>
    sum({ name: `Payout, ${day}`, date: `${day} 2026`, source: 'All' }, [
        sum(
            {
                name: `Subscriptions, ${day}`,
                source: 'Subscriptions',
                colour: 'var(--color-chart-1)',
            },
            [
                part(`Pro plan, ${day}`, 'Pro plan', 1240 * scale),
                part(`Team plan, ${day}`, 'Team plan', 2180 * scale),
            ],
        ),
        sum({ name: `Messages, ${day}`, source: 'Messages', colour: 'var(--color-chart-2)' }, [
            part(`Paid messages, ${day}`, 'Paid messages', 310 * scale),
            part(`Unlocks, ${day}`, 'Unlocks', 145 * scale),
        ]),
        { ...part(`Tips, ${day}`, 'Tips', 96 * scale), colour: 'var(--color-chart-3)' },
    ]);

const payouts: Payout[] = [payout('14 Nov', 1), payout('7 Nov', 0.9), payout('31 Oct', 1.1)];

const dollars = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
});

const source = (node: Payout) => (
    <span className="inline-flex items-center gap-2">
        {node.colour && (
            <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: node.colour }}
            />
        )}
        {node.source}
    </span>
);

const knobs: Knob[] = [
    {
        id: 'kind',
        label: 'What folds out',
        options: [o('breakdown', 'A breakdown: stepped in'), o('same', 'Same kind: aligned')],
        default: 'breakdown',
    },
    {
        id: 'open',
        label: 'Open',
        options: [o('1', 'One level'), o('2', 'Two levels'), o('3', 'Three levels')],
        default: '3',
    },
    { id: 'selection', label: 'Row selection', switch: true, default: true },
    { id: 'guides', label: 'Guide line', switch: true, default: true },
];

const FoldPreview = ({ knobs }: PreviewProps) => {
    const width = useStageWidth();
    const levels = Number(knobs.open);

    if (knobs.kind === 'breakdown')
        return (
            <FoldTree<Payout>
                columns={[
                    { head: 'Source', className: 'w-56', cell: source },
                    {
                        head: 'Amount',
                        className: 'w-32',
                        numeric: true,
                        cell: node => dollars.format(node.amount),
                    },
                ]}
                guides={Boolean(knobs.guides)}
                key={`breakdown-${levels}`}
                label="Payouts"
                name={{ head: 'Date', cell: node => node.date }}
                nodes={payouts}
                open={(node, depth) =>
                    depth < levels &&
                    (depth === 0 ? node.name === 'Payout, 14 Nov' : node.source === 'Subscriptions')
                }
                selection={Boolean(knobs.selection)}
                shift
                wrapperClassName={width}
            />
        );

    return (
        <FoldTree<File>
            columns={[
                { head: 'Owner', className: 'w-36', cell: node => node.owner },
                { head: 'Modified', className: 'w-24', cell: node => node.modified },
                { head: 'Size', className: 'w-20', numeric: true, cell: node => node.size ?? '—' },
            ]}
            guides={Boolean(knobs.guides)}
            // A new tree when the knob moves, so the folds start as it says.
            key={`same-${levels}`}
            label="Files"
            name={{ head: 'Name', cell: fileName }}
            nodes={tree}
            open={openTo(levels)}
            selection={Boolean(knobs.selection)}
            wrapperClassName={width}
        />
    );
};

export const entry: Entry = {
    id: 'table-tree',
    name: 'Table tree',
    category: 'tables',
    description:
        'A row that opens to more rows under it, which can open in turn: rows of the same kind on the same columns (folders in folders), or a breakdown stepped in a level (a payout by source, by plan).',
    span: 2,
    hero: 'min-h-120',
    knobs,
    Preview: FoldPreview,
};

/* ---------- In use: a budget, down to its lines ---------- */

type Line = Node & { budget: number; spent: number; items?: Line[] };

const line = (name: string, budget: number, spent: number): Line => ({ name, budget, spent });

/** A group's budget and spend are its lines' added up. */
const group = (name: string, items: Line[]): Line => ({
    name,
    items,
    budget: items.reduce((sum, item) => sum + item.budget, 0),
    spent: items.reduce((sum, item) => sum + item.spent, 0),
});

const budget: Line[] = [
    group('Marketing', [
        group('Paid ads', [line('Search ads', 24000, 19800), line('Social ads', 18000, 16400)]),
        group('Events', [line('Conference booth', 12000, 12000), line('Meetups', 4000, 1500)]),
        line('Content', 9000, 6200),
    ]),
    group('Product', [
        group('Design', [line('Contractors', 30000, 22500), line('Research panels', 6000, 2400)]),
        line('Tooling', 8000, 7100),
    ]),
    group('Engineering', [
        group('Infrastructure', [line('Hosting', 42000, 35700), line('Monitoring', 7200, 6000)]),
        line('Hiring', 15000, 4000),
    ]),
];

const euro = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

const Budget = () => (
    <AppWindow
        description="This year's budget, by team, down to each line."
        place="reports"
        title="Budget 2026"
        trail={['Reports', 'Budget 2026']}
        width="wide"
    >
        <FoldTree<Line>
            columns={[
                {
                    head: 'Budget',
                    className: 'w-28',
                    numeric: true,
                    cell: n => euro.format(n.budget),
                },
                {
                    head: 'Spent',
                    className: 'w-28',
                    numeric: true,
                    cell: n => euro.format(n.spent),
                },
                {
                    head: 'Left',
                    className: 'w-28',
                    numeric: true,
                    cell: n => euro.format(n.budget - n.spent),
                },
            ]}
            guides
            label="Budget 2026"
            name={{ head: 'Line', cell: n => n.name }}
            nodes={budget}
            open={(node, depth) =>
                depth === 0 ? node.name === 'Marketing' : node.name === 'Paid ads'
            }
            selection={false}
        />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Budget',
    note: 'Teams fold out into their groups, and groups into their lines, every level on the same columns, so a group’s figures read against its lines’.',
    app: true,
    render: () => <Budget />,
};
