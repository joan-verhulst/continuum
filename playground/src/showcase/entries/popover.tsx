import {
    Badge,
    Button,
    Checkbox,
    cn,
    Field,
    FieldLabel,
    Input,
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Columns3, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { AppScene, type Entry, type InUse, icon, Labelled, previewIcon } from '../kit';

const columnNames = ['Owner', 'Status', 'Amount', 'Due date'];

const PopoverPreview = () => {
    const [shown, setShown] = useState(['Owner', 'Status', 'Amount']);
    const stage = useStageContainer();

    return (
        <div className={stage ? 'pb-48' : 'contents'}>
            <Popover modal={stage ? false : undefined} open={stage ? true : undefined}>
                <PopoverTrigger render={<Button variant="secondary" />}>
                    <Columns3 {...previewIcon} /> Columns
                </PopoverTrigger>
                <PopoverContent
                    className="w-56"
                    container={stage}
                    finalFocus={stage ? false : undefined}
                    initialFocus={stage ? false : undefined}
                >
                    <PopoverHeader>
                        <PopoverTitle>Columns</PopoverTitle>
                        <PopoverDescription>Pick what the table shows.</PopoverDescription>
                    </PopoverHeader>
                    <div className="flex flex-col gap-2.5">
                        {columnNames.map(column => (
                            <Labelled key={column} label={column}>
                                <Checkbox
                                    checked={shown.includes(column)}
                                    onCheckedChange={checked =>
                                        setShown(current =>
                                            checked
                                                ? [...current, column]
                                                : current.filter(name => name !== column),
                                        )
                                    }
                                />
                            </Labelled>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export const entry: Entry = {
    id: 'popover',
    name: 'Popover',
    category: 'overlays',
    description: 'An anchored panel for pickers and quick edits.',
    hero: 'min-h-80',
    Preview: PopoverPreview,
};

type Column = 'Client' | 'Status' | 'Amount' | 'Due' | 'Owner';

const columnOrder: Column[] = ['Client', 'Status', 'Amount', 'Due', 'Owner'];

const invoices = [
    {
        client: 'Northwind Traders',
        number: 'INV-0142',
        status: 'Due soon',
        amount: '€4,120.00',
        due: '28 Oct',
        owner: 'Maya Chen',
    },
    {
        client: 'Globex',
        number: 'INV-0141',
        status: 'Paid',
        amount: '€1,240.00',
        due: '21 Oct',
        owner: 'Liam Ortiz',
    },
    {
        client: 'Initech',
        number: 'INV-0139',
        status: 'Overdue',
        amount: '€980.00',
        due: '14 Oct',
        owner: 'Sara Kim',
    },
    {
        client: 'Umbrella Health',
        number: 'INV-0138',
        status: 'Paid',
        amount: '€6,200.00',
        due: '12 Oct',
        owner: 'Maya Chen',
    },
    {
        client: 'Soylent Labs',
        number: 'INV-0137',
        status: 'Due soon',
        amount: '€1,560.00',
        due: '30 Oct',
        owner: 'Noah Patel',
    },
    {
        client: 'Stark Logistics',
        number: 'INV-0136',
        status: 'Paid',
        amount: '€5,400.00',
        due: '9 Oct',
        owner: 'Sara Kim',
    },
] as const;

const invoiceTone = { Paid: 'success', 'Due soon': 'warning', Overdue: 'error' } as const;

const right: Column[] = ['Amount'];

const cell = (column: Column, row: (typeof invoices)[number]) => {
    if (column === 'Client')
        return (
            <span className="flex flex-col gap-0.5">
                <span className="font-medium text-neutral-950">{row.client}</span>
                <span className="text-neutral-600 text-xxs">{row.number}</span>
            </span>
        );
    if (column === 'Status') return <Badge tone={invoiceTone[row.status]}>{row.status}</Badge>;
    if (column === 'Amount')
        return <span className="text-neutral-950 tabular-nums">{row.amount}</span>;
    if (column === 'Due') return <span className="text-neutral-600">{row.due}</span>;
    return <span className="text-neutral-700">{row.owner}</span>;
};

const InvoicesWithColumns = () => {
    const stage = useStageContainer();
    const [shown, setShown] = useState<Column[]>(['Client', 'Status', 'Amount', 'Due']);
    const columns = columnOrder.filter(column => shown.includes(column));

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <Input
                    aria-label="Search invoices"
                    className="w-search"
                    leadingIcon={<Search {...icon} />}
                    placeholder="Search invoices"
                    size="sm"
                />
                <Popover modal={false} open>
                    <PopoverTrigger render={<Button variant="secondary" />}>
                        <Columns3 {...icon} /> Columns
                    </PopoverTrigger>
                    <PopoverContent
                        align="end"
                        className="w-56"
                        container={stage}
                        finalFocus={false}
                        initialFocus={false}
                    >
                        <PopoverHeader>
                            <PopoverTitle>Columns</PopoverTitle>
                            <PopoverDescription>Pick what the table shows.</PopoverDescription>
                        </PopoverHeader>
                        <div className="flex flex-col gap-2.5">
                            {columnOrder.map(column => (
                                <Field className="flex-row items-center gap-2.5" key={column}>
                                    <Checkbox
                                        checked={shown.includes(column)}
                                        // The client names the row, so it stays.
                                        disabled={column === 'Client'}
                                        onCheckedChange={checked =>
                                            setShown(current =>
                                                checked
                                                    ? [...current, column]
                                                    : current.filter(name => name !== column),
                                            )
                                        }
                                    />
                                    <FieldLabel className="cursor-pointer">{column}</FieldLabel>
                                </Field>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map(column => (
                            <TableHead
                                className={cn(right.includes(column) && 'text-right')}
                                key={column}
                            >
                                {column}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map(row => (
                        <TableRow key={row.number}>
                            {columns.map(column => (
                                <TableCell
                                    className={cn(right.includes(column) && 'text-right')}
                                    key={column}
                                >
                                    {cell(column, row)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
};

export const inUse: InUse = {
    title: 'Invoice columns',
    note: 'The table’s column settings in a panel anchored to the button that opened it.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                nav: 'rail',
                place: 'invoices',
                title: 'Invoices',
                description: '38 sent this month, €48,260 in all.',
                actions: (
                    <Button>
                        <Plus {...icon} /> New invoice
                    </Button>
                ),
                children: <InvoicesWithColumns />,
            }}
        />
    ),
};
