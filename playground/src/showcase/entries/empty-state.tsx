import {
    Badge,
    Button,
    Chip,
    ChipAction,
    EmptyState,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { CalendarDays, CircleAlert, CircleCheck, FileText, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
} from '../kit';

const emptyKnobs: Knob[] = [
    {
        id: 'kind',
        label: 'Why it is empty',
        options: [o('first', 'Nothing yet'), o('filtered', 'Filtered to nothing')],
        default: 'first',
    },
    { id: 'icon', label: 'Icon', switch: true, default: true },
    { id: 'action', label: 'Action', switch: true, default: true },
];

const EmptyStatePreview = ({ knobs }: PreviewProps) =>
    knobs.kind === 'filtered' ? (
        <EmptyState
            action={knobs.action && <Button variant="secondary">Clear filters</Button>}
            className="w-[460px]"
            description="No invoices are overdue and owned by Bram Jansen."
            icon={knobs.icon && <Search {...previewIcon} />}
            title="Nothing matches these filters"
        />
    ) : (
        <EmptyState
            action={
                knobs.action && (
                    <Button variant="secondary">
                        New invoice <Plus {...previewIcon} />
                    </Button>
                )
            }
            className="w-[460px]"
            description="Invoices you send show up here, with when they are due and who has paid."
            icon={knobs.icon && <FileText {...previewIcon} />}
            title="No invoices yet"
        />
    );

export const entry: Entry = {
    id: 'empty-state',
    name: 'Empty state',
    category: 'messages',
    description: 'A dashed panel saying what goes here, with one action.',
    knobs: emptyKnobs,
    Preview: EmptyStatePreview,
};

const thisQuarter = [
    { number: 'INV-0142', client: 'Acme Corp', amount: '€4,120.00', status: 'Due soon' },
    { number: 'INV-0141', client: 'Northwind', amount: '€1,980.00', status: 'Paid' },
    { number: 'INV-0139', client: 'Globex', amount: '€1,860.00', status: 'Paid' },
    { number: 'INV-0134', client: 'Umbrella Health', amount: '€2,340.00', status: 'Due soon' },
] as const;

const NoOverdue = () => {
    const [filtered, setFiltered] = useState(true);

    return (
        <AppWindow
            actions={
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            }
            description="Everything you have sent, with when it is due and who has paid."
            nav="rail"
            place="invoices"
            title="Invoices"
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                    <Chip icon={<CalendarDays {...icon} />}>This quarter</Chip>
                    {filtered ? (
                        <Chip
                            action={
                                <ChipAction
                                    label="Remove the overdue filter"
                                    onClick={() => setFiltered(false)}
                                />
                            }
                            icon={<CircleAlert {...icon} />}
                        >
                            Status is Overdue
                        </Chip>
                    ) : (
                        <Button onClick={() => setFiltered(true)} variant="ghost">
                            <Plus {...icon} /> Overdue only
                        </Button>
                    )}
                </div>
                {filtered ? (
                    <EmptyState
                        action={
                            <Button onClick={() => setFiltered(false)} variant="secondary">
                                Show all invoices
                            </Button>
                        }
                        description="Everything sent this quarter has been paid or is not due yet."
                        icon={<CircleCheck {...icon} />}
                        title="No overdue invoices"
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead numeric>Amount</TableHead>
                                <TableHead align="right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {thisQuarter.map(invoice => (
                                <TableRow key={invoice.number}>
                                    <TableCell className="text-neutral-600">
                                        {invoice.number}
                                    </TableCell>
                                    <TableCell className="font-medium text-neutral-950">
                                        {invoice.client}
                                    </TableCell>
                                    <TableCell numeric>{invoice.amount}</TableCell>
                                    <TableCell align="right">
                                        <Badge
                                            tone={invoice.status === 'Paid' ? 'success' : 'warning'}
                                        >
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Filtered to nothing',
    note: 'An invoice list filtered to nothing says so where the table would be, and offers the way back.',
    app: true,
    render: () => <NoOverdue />,
};
