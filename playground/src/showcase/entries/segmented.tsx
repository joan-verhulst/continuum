import {
    Avatar,
    Badge,
    Button,
    Input,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { CalendarDays, Clock, Plus, Search, Timer } from 'lucide-react';
import { useState } from 'react';
import { customers, formatEuro, statusTone } from '../../screens/workspace';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    type PreviewProps,
    previewIcon,
} from '../kit';

const segmentedKnobs: Knob[] = [
    { id: 'icons', label: 'Icons', switch: true, default: false },
    { id: 'fill', label: 'Fill the width', switch: true, default: false },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const SegmentedPreview = ({ knobs }: PreviewProps) => (
    <div className={knobs.fill ? 'w-80' : undefined}>
        <SegmentedControl aria-label="Range" defaultValue="30d" fill={Boolean(knobs.fill)}>
            <SegmentedControlItem value="7d">
                {knobs.icons && <Clock {...previewIcon} />}7d
            </SegmentedControlItem>
            <SegmentedControlItem value="30d">
                {knobs.icons && <CalendarDays {...previewIcon} />}30d
            </SegmentedControlItem>
            <SegmentedControlItem value="12m">
                {knobs.icons && <Timer {...previewIcon} />}12m
            </SegmentedControlItem>
            <SegmentedControlItem disabled={Boolean(knobs.disabled)} value="all">
                All time
            </SegmentedControlItem>
        </SegmentedControl>
    </div>
);

export const entry: Entry = {
    id: 'segmented',
    name: 'Segmented control',
    category: 'inputs',
    description: 'Filters in place; always holds one value.',
    knobs: segmentedKnobs,
    Preview: SegmentedPreview,
};

const statuses = ['All', 'Active', 'Trial', 'Past due', 'Churned'] as const;

type StatusFilter = (typeof statuses)[number];

const CustomerList = () => {
    const [status, setStatus] = useState<StatusFilter>('All');
    const shown = customers.filter(customer => status === 'All' || customer.status === status);
    const count = (filter: StatusFilter) =>
        filter === 'All'
            ? customers.length
            : customers.filter(customer => customer.status === filter).length;

    return (
        <AppWindow
            actions={
                <Button>
                    <Plus {...icon} /> Add customer
                </Button>
            }
            description={`${customers.length} companies, ${formatEuro(
                customers.reduce((sum, customer) => sum + customer.mrr, 0),
            )} a month.`}
            nav="top"
            place="customers"
            title="Customers"
        >
            <div className="flex items-center justify-between gap-4">
                <Select onValueChange={value => setStatus(value as StatusFilter)} value={status}>
                    <SelectTrigger
                        aria-label="Status"
                        className="@max-shell-compact/shell:inline-flex hidden"
                        size="sm"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(filter => (
                            <SelectItem key={filter} value={filter}>
                                {filter} ({count(filter)})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <SegmentedControl
                    aria-label="Status"
                    className="@max-shell-compact/shell:hidden"
                    onValueChange={value => setStatus(value as StatusFilter)}
                    value={status}
                >
                    {statuses.map(filter => (
                        <SegmentedControlItem key={filter} value={filter}>
                            {filter}
                            <span className="text-neutral-600 tabular-nums">{count(filter)}</span>
                        </SegmentedControlItem>
                    ))}
                </SegmentedControl>
                <Input
                    aria-label="Search customers"
                    className="@max-shell-compact/shell:w-auto w-56 @max-shell-compact/shell:min-w-0 @max-shell-compact/shell:flex-1"
                    leadingIcon={<Search {...icon} />}
                    placeholder="Search customers"
                    size="sm"
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">MRR</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shown.slice(0, 6).map(customer => (
                        <TableRow key={customer.id}>
                            <TableCell>
                                <span className="flex items-center gap-2.5 font-medium text-neutral-950">
                                    <Avatar fallback={customer.initials} size={24} />
                                    {customer.name}
                                </span>
                            </TableCell>
                            <TableCell className="text-neutral-600">{customer.plan}</TableCell>
                            <TableCell className="text-neutral-600">{customer.owner}</TableCell>
                            <TableCell className="text-right text-neutral-950 tabular-nums">
                                {formatEuro(customer.mrr)}
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge tone={statusTone[customer.status]}>{customer.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Customers by status',
    note: 'A segmented control over the customers table, filtering it in place by status.',
    app: true,
    render: () => <CustomerList />,
};
