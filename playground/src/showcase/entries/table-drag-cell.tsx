import {
    Badge,
    Button,
    moveItem,
    Table,
    TableBody,
    TableCell,
    TableDragCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Plus } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { AppWindow, type Entry, type InUse, icon, type Knob, type PreviewProps } from '../kit';
import { useStageWidth } from './table';

const knobs: Knob[] = [
    { id: 'rows', label: 'Move rows', switch: true, default: true },
    { id: 'columns', label: 'Move columns', switch: true, default: true },
    { id: 'resize', label: 'Resize columns', switch: true, default: true },
];

const euro = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

type Line = { id: number; item: string; by: string; quantity: number; rate: number };
type Key = 'item' | 'by' | 'quantity' | 'rate' | 'amount';

const start: Line[] = [
    { id: 1, item: 'Discovery workshop', by: 'Anna de Vries', quantity: 1, rate: 1200 },
    { id: 2, item: 'Design review', by: 'Bram Jansen', quantity: 8, rate: 95 },
    { id: 3, item: 'Build sprint', by: 'Chloé Martin', quantity: 20, rate: 105 },
    { id: 4, item: 'Workshop materials', by: 'Anna de Vries', quantity: 1, rate: 140 },
];

const columns: Record<
    Key,
    { label: string; numeric?: boolean; width?: number; cell: (line: Line) => ReactNode }
> = {
    item: { label: 'Item', cell: line => line.item },
    by: { label: 'Logged by', width: 160, cell: line => line.by },
    quantity: { label: 'Qty', numeric: true, width: 80, cell: line => line.quantity },
    rate: { label: 'Rate', numeric: true, width: 112, cell: line => euro.format(line.rate) },
    amount: {
        label: 'Amount',
        numeric: true,
        width: 120,
        cell: line => euro.format(line.quantity * line.rate),
    },
};

/**
 * An invoice's lines, in the order they print: the grip puts a line where it belongs, a head
 * dragged along the row puts a column there, and a head's edge sets the column's width. Item keeps no
 * width of its own, so it takes the room the others leave.
 */
const LinesTable = ({ knobs }: PreviewProps) => {
    const width = useStageWidth();
    const [lines, setLines] = useState(start);
    const [order, setOrder] = useState<Key[]>(['item', 'by', 'quantity', 'rate', 'amount']);
    const [widths, setWidths] = useState<Partial<Record<Key, number>>>({});
    const moveRows = Boolean(knobs.rows);
    const moveColumns = Boolean(knobs.columns);
    const resize = Boolean(knobs.resize);

    return (
        <Table wrapperClassName={width}>
            <TableHeader
                onColumnMove={(from, to) => setOrder(current => moveItem(current, from, to))}
            >
                <TableRow>
                    {moveRows && <TableHead className="w-11" />}
                    {order.map(key => {
                        const column = columns[key];
                        const set = widths[key] ?? column.width;
                        return (
                            <TableHead
                                key={key}
                                movable={moveColumns}
                                numeric={column.numeric}
                                {...(resize
                                    ? {
                                          width: set,
                                          onWidthChange: (next: number) =>
                                              setWidths(current => ({ ...current, [key]: next })),
                                      }
                                    : { style: set ? { width: set } : undefined })}
                            >
                                {column.label}
                            </TableHead>
                        );
                    })}
                </TableRow>
            </TableHeader>
            <TableBody onRowMove={(from, to) => setLines(current => moveItem(current, from, to))}>
                {lines.map(line => (
                    <TableRow key={line.id}>
                        {moveRows && <TableDragCell label={`Move ${line.item}`} />}
                        {order.map(key => (
                            <TableCell
                                className={
                                    key === 'by' || key === 'quantity' || key === 'rate'
                                        ? 'font-normal text-neutral-700'
                                        : undefined
                                }
                                key={key}
                                numeric={columns[key].numeric}
                            >
                                {columns[key].cell(line)}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const entry: Entry = {
    id: 'table-drag-cell',
    name: 'Moving and resizing',
    category: 'tables',
    description:
        'A grip that drags a row to its place, heads that drag a column along, and edges that set a column’s width.',
    span: 2,
    knobs,
    Preview: LinesTable,
};

type Task = { id: number; title: string; owner: string; status: 'Next' | 'Doing' | 'Review' };

const backlog: Task[] = [
    { id: 1, title: 'Reminders before the due date', owner: 'Bram Jansen', status: 'Doing' },
    { id: 2, title: 'Export invoices to CSV', owner: 'Chloé Martin', status: 'Review' },
    { id: 3, title: 'Partial payments', owner: 'Anna de Vries', status: 'Next' },
    { id: 4, title: 'Credit notes', owner: 'Bram Jansen', status: 'Next' },
    { id: 5, title: 'Multi-currency totals', owner: 'Chloé Martin', status: 'Next' },
];

const statusTone = { Next: 'neutral', Doing: 'primary', Review: 'warning' } as const;

/** A backlog ranked by hand: the order is the priority, so the rows are dragged into it. */
const Backlog = () => {
    const [tasks, setTasks] = useState(backlog);
    return (
        <AppWindow
            actions={
                <Button>
                    <Plus {...icon} /> Add item
                </Button>
            }
            description="Ranked by hand: the top of the list is built first."
            nav="top"
            place="reports"
            title="Roadmap"
        >
            <Table wrapperClassName="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-11" />
                        <TableHead className="w-12" numeric>
                            #
                        </TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-40">Owner</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody
                    onRowMove={(from, to) => setTasks(current => moveItem(current, from, to))}
                >
                    {tasks.map((task, index) => (
                        <TableRow key={task.id}>
                            <TableDragCell label={`Move ${task.title}`} />
                            <TableCell className="font-normal text-neutral-600" numeric>
                                {index + 1}
                            </TableCell>
                            <TableCell>{task.title}</TableCell>
                            <TableCell className="font-normal text-neutral-700">
                                {task.owner}
                            </TableCell>
                            <TableCell>
                                <Badge tone={statusTone[task.status]}>{task.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Roadmap',
    note: 'A backlog whose order is its priority: each row has a grip, and the rank follows the drop.',
    app: true,
    render: () => <Backlog />,
};
