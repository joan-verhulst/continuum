import {
    Avatar,
    Badge,
    Button,
    Chip,
    ChipAction,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import {
    CalendarDays,
    CircleCheck,
    Globe,
    Layers,
    Pencil,
    Plus,
    UserRound,
    Users,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { type Customer, customers, formatEuro, statusTone } from '../../screens/workspace';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    opts,
    type PreviewProps,
    previewIcon,
} from '../kit';

const chipKnobs: Knob[] = [
    { id: 'variant', label: 'Variant', options: opts('soft', 'outline'), default: 'soft' },
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 25px'), o('md', 'md · 29px')],
        default: 'sm',
    },
    { id: 'click', label: 'Takes a click', switch: true, default: false },
    {
        id: 'action',
        label: 'Action',
        options: [o('remove', 'Remove'), o('edit', 'Edit'), o('none', 'None')],
        default: 'remove',
    },
    { id: 'icon', label: 'Icon', switch: true, default: true },
];

const initialFilters = [
    { id: 'range', label: 'Last 30 days', Icon: CalendarDays },
    { id: 'country', label: 'Country is Netherlands', Icon: Globe },
    { id: 'device', label: 'Device is mobile', Icon: Users },
];

const ChipPreview = ({ knobs }: PreviewProps) => {
    const [filters, setFilters] = useState(initialFilters);
    const [last, setLast] = useState<string>();
    const variant = knobs.variant as 'soft' | 'outline';
    const size = knobs.size as 'sm' | 'md';

    return (
        <div className="flex max-w-96 flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
                {filters.map(filter => (
                    <Chip
                        action={
                            knobs.action === 'remove' ? (
                                <ChipAction
                                    onClick={() =>
                                        setFilters(current =>
                                            current.filter(item => item.id !== filter.id),
                                        )
                                    }
                                />
                            ) : knobs.action === 'edit' ? (
                                <ChipAction
                                    label={`Edit ${filter.label}`}
                                    onClick={() => setLast(`Editing ${filter.label}`)}
                                >
                                    <Pencil aria-hidden strokeWidth={2} />
                                </ChipAction>
                            ) : undefined
                        }
                        icon={knobs.icon ? <filter.Icon {...previewIcon} /> : undefined}
                        key={filter.id}
                        onClick={knobs.click ? () => setLast(`Opened ${filter.label}`) : undefined}
                        size={size}
                        variant={variant}
                    >
                        {filter.label}
                    </Chip>
                ))}
                {filters.length < initialFilters.length && (
                    <Button
                        onClick={() => setFilters(initialFilters)}
                        size="icon-sm"
                        variant="ghost"
                    >
                        <Plus {...previewIcon} />
                        <span className="sr-only">Restore filters</span>
                    </Button>
                )}
            </div>
            <span className="text-neutral-500 text-xxs">
                {last ?? 'Click a chip or its action'}
            </span>
        </div>
    );
};

export const entry: Entry = {
    id: 'chip',
    name: 'Chip',
    category: 'filtering',
    description: 'A short value in a pill that can take a click and end in one action.',
    knobs: chipKnobs,
    Preview: ChipPreview,
};

type CustomerFilter = {
    id: string;
    label: string;
    icon: ReactNode;
    keeps: (customer: Customer) => boolean;
};

const appliedFilters: CustomerFilter[] = [
    {
        id: 'status',
        label: 'Status is Active',
        icon: <CircleCheck {...icon} />,
        keeps: customer => customer.status === 'Active',
    },
    {
        id: 'plan',
        label: 'Plan is Pro or Enterprise',
        icon: <Layers {...icon} />,
        keeps: customer => customer.plan !== 'Starter',
    },
    {
        id: 'owner',
        label: 'Owner is not Liam Ortiz',
        icon: <UserRound {...icon} />,
        keeps: customer => customer.owner !== 'Liam Ortiz',
    },
];

const FilteredCustomers = () => {
    const [filters, setFilters] = useState(appliedFilters);
    const rows = customers.filter(customer => filters.every(filter => filter.keeps(customer)));

    return (
        <AppWindow
            actions={
                <Button>
                    <Plus {...icon} /> Add customer
                </Button>
            }
            description={`${rows.length} of ${customers.length} customers`}
            place="customers"
            title="Customers"
            trail={['Customers']}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {filters.map(filter => (
                        <Chip
                            action={
                                <ChipAction
                                    label={`Remove ${filter.label}`}
                                    onClick={() =>
                                        setFilters(current =>
                                            current.filter(item => item.id !== filter.id),
                                        )
                                    }
                                />
                            }
                            icon={filter.icon}
                            key={filter.id}
                        >
                            {filter.label}
                        </Chip>
                    ))}
                    {filters.length < appliedFilters.length ? (
                        <Button onClick={() => setFilters(appliedFilters)} variant="ghost">
                            <Plus {...icon} /> Add filter
                        </Button>
                    ) : (
                        <Button onClick={() => setFilters([])} variant="ghost">
                            Clear all
                        </Button>
                    )}
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
                        {rows.map(customer => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <span className="flex items-center gap-2.5">
                                        <Avatar fallback={customer.initials} size={24} />
                                        <span className="font-medium text-neutral-950">
                                            {customer.name}
                                        </span>
                                    </span>
                                </TableCell>
                                <TableCell className="text-neutral-600">{customer.plan}</TableCell>
                                <TableCell className="text-neutral-600">{customer.owner}</TableCell>
                                <TableCell className="text-right text-neutral-950 tabular-nums">
                                    {formatEuro(customer.mrr)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge tone={statusTone[customer.status]}>
                                        {customer.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Filtered customers',
    note: 'Each applied filter as a chip over the list it narrows; its × takes it off.',
    app: true,
    render: () => <FilteredCustomers />,
};
