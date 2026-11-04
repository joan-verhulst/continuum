import {
    Badge,
    Button,
    Chip,
    ChipAction,
    cn,
    countFilters,
    FilterBar,
    FilterMenu,
    FilterMenuClear,
    FilterMenuContent,
    FilterMenuGroup,
    FilterMenuItem,
    FilterMenuTrigger,
    type FilterValues,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    toggleFilter,
} from 'continuum';
import { CircleCheck, Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    type PreviewProps,
    previewIcon,
} from '../kit';

const invoiceFilters = [
    {
        id: 'status',
        label: 'Status',
        icon: <CircleCheck {...previewIcon} />,
        options: [
            { value: 'Paid', count: 128 },
            { value: 'Due soon', count: 14 },
            { value: 'Overdue', count: 6 },
        ],
    },
    {
        id: 'owner',
        label: 'Owner',
        icon: <UserRound {...previewIcon} />,
        options: [
            { value: 'Anna de Vries', count: 61 },
            { value: 'Bram Jansen', count: 52 },
            { value: 'Chloé Martin', count: 35 },
        ],
    },
];

/** "Status is Paid", "Status is Paid or Overdue", "Owner is Anna de Vries and 2 more". */
const filterChipLabel = (group: string, picked: string[]) =>
    `${group} is ${
        picked.length <= 2 ? picked.join(' or ') : `${picked[0]} and ${picked.length - 1} more`
    }`;

/** Drops one group from the applied filters, as its chip's × does. */
const withoutFilter = (values: FilterValues, group: string): FilterValues =>
    Object.fromEntries(Object.entries(values).filter(([id]) => id !== group));

const filterMenuKnobs: Knob[] = [
    { id: 'chips', label: 'Applied as chips', switch: true, default: false },
    { id: 'counts', label: 'Counts', switch: true, default: true },
];

const FilterMenuPreview = ({ knobs }: PreviewProps) => {
    const [values, setValues] = useState<FilterValues>({ status: ['Due soon', 'Overdue'] });
    const stage = useStageContainer();
    const count = countFilters(values);
    // A tile is a still: one group, and the button and its menu centred together.
    const tile = Boolean(stage?.inert);
    const groups = tile ? invoiceFilters.slice(0, 1) : invoiceFilters;

    return (
        // Room below for the open menu, so the bar and the menu sit centred on the stage.
        <div
            className={cn(
                'flex',
                tile ? 'w-60 justify-start pb-36' : 'w-[520px] justify-center',
                stage && !tile && 'pb-72',
            )}
        >
            <FilterBar onClear={knobs.chips && count > 0 ? () => setValues({}) : undefined}>
                <FilterMenu modal={stage ? false : undefined} open={stage ? true : undefined}>
                    <FilterMenuTrigger count={count} />
                    <FilterMenuContent container={stage}>
                        {groups.map(group => (
                            <FilterMenuGroup key={group.id} label={group.label}>
                                {group.options.map(option => (
                                    <FilterMenuItem
                                        checked={values[group.id]?.includes(option.value) ?? false}
                                        count={knobs.counts ? option.count : undefined}
                                        key={option.value}
                                        onCheckedChange={() =>
                                            setValues(current =>
                                                toggleFilter(current, group.id, option.value),
                                            )
                                        }
                                    >
                                        {option.value}
                                    </FilterMenuItem>
                                ))}
                            </FilterMenuGroup>
                        ))}
                        {!tile && (
                            <FilterMenuClear disabled={count === 0} onClick={() => setValues({})} />
                        )}
                    </FilterMenuContent>
                </FilterMenu>
                {knobs.chips &&
                    invoiceFilters.map(group => {
                        const picked = values[group.id];
                        if (!picked) return null;
                        return (
                            <Chip
                                icon={group.icon}
                                key={group.id}
                                action={
                                    <ChipAction
                                        label={`Remove the ${group.label.toLowerCase()} filter`}
                                        onClick={() =>
                                            setValues(current => withoutFilter(current, group.id))
                                        }
                                    />
                                }
                            >
                                {filterChipLabel(group.label, picked)}
                            </Chip>
                        );
                    })}
            </FilterBar>
        </div>
    );
};

export const entry: Entry = {
    id: 'filter-menu',
    name: 'Filter menu',
    category: 'filtering',
    description: 'Grouped checkbox filters that turn into chips, with Clear all.',
    hero: 'min-h-[440px]',
    knobs: filterMenuKnobs,
    Preview: FilterMenuPreview,
};

const filterGroups = [
    {
        id: 'status',
        label: 'Status',
        options: ['Paid', 'Due soon', 'Overdue'],
    },
    {
        id: 'owner',
        label: 'Owner',
        options: ['Anna de Vries', 'Bram Jansen', 'Chloé Martin'],
    },
];

const filteredInvoices = [
    {
        number: 'INV-0142',
        client: 'Acme Corp',
        status: 'Due soon',
        owner: 'Anna de Vries',
        due: '8 Nov',
        amount: '€4,120.00',
    },
    {
        number: 'INV-0141',
        client: 'Northwind Traders',
        status: 'Paid',
        owner: 'Bram Jansen',
        due: '2 Nov',
        amount: '€1,980.00',
    },
    {
        number: 'INV-0139',
        client: 'Globex',
        status: 'Overdue',
        owner: 'Bram Jansen',
        due: '28 Oct',
        amount: '€1,860.00',
    },
    {
        number: 'INV-0137',
        client: 'Initech',
        status: 'Paid',
        owner: 'Anna de Vries',
        due: '25 Oct',
        amount: '€920.00',
    },
    {
        number: 'INV-0134',
        client: 'Umbrella Health',
        status: 'Overdue',
        owner: 'Chloé Martin',
        due: '21 Oct',
        amount: '€2,340.00',
    },
    {
        number: 'INV-0132',
        client: 'Soylent Labs',
        status: 'Due soon',
        owner: 'Chloé Martin',
        due: '10 Nov',
        amount: '€1,560.00',
    },
    {
        number: 'INV-0131',
        client: 'Hooli',
        status: 'Paid',
        owner: 'Bram Jansen',
        due: '18 Oct',
        amount: '€6,480.00',
    },
    {
        number: 'INV-0129',
        client: 'Stark Logistics',
        status: 'Overdue',
        owner: 'Anna de Vries',
        due: '14 Oct',
        amount: '€5,400.00',
    },
];

const statusTone: Record<string, 'success' | 'warning' | 'error'> = {
    Paid: 'success',
    'Due soon': 'warning',
    Overdue: 'error',
};

const FilteredInvoices = () => {
    const stage = useStageContainer();
    const [values, setValues] = useState<FilterValues>({ status: ['Due soon', 'Overdue'] });
    const count = countFilters(values);
    const rows = filteredInvoices.filter(invoice =>
        Object.entries(values).every(([group, picked]) =>
            picked.includes(group === 'status' ? invoice.status : invoice.owner),
        ),
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <FilterBar>
                    <FilterMenu modal={false} open>
                        <FilterMenuTrigger count={count} />
                        <FilterMenuContent container={stage}>
                            {filterGroups.map(group => (
                                <FilterMenuGroup key={group.id} label={group.label}>
                                    {group.options.map(option => (
                                        <FilterMenuItem
                                            checked={values[group.id]?.includes(option) ?? false}
                                            count={
                                                filteredInvoices.filter(invoice =>
                                                    [invoice.status, invoice.owner].includes(
                                                        option,
                                                    ),
                                                ).length
                                            }
                                            key={option}
                                            onCheckedChange={() =>
                                                setValues(current =>
                                                    toggleFilter(current, group.id, option),
                                                )
                                            }
                                        >
                                            {option}
                                        </FilterMenuItem>
                                    ))}
                                </FilterMenuGroup>
                            ))}
                            <FilterMenuClear disabled={count === 0} onClick={() => setValues({})} />
                        </FilterMenuContent>
                    </FilterMenu>
                </FilterBar>
                <span className="text-neutral-600 text-xs tabular-nums">
                    {rows.length} of {filteredInvoices.length} invoices
                </span>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map(invoice => (
                        <TableRow key={invoice.number}>
                            <TableCell className="text-neutral-600 tabular-nums">
                                {invoice.number}
                            </TableCell>
                            <TableCell className="font-medium text-neutral-950">
                                {invoice.client}
                            </TableCell>
                            <TableCell className="text-neutral-600">{invoice.owner}</TableCell>
                            <TableCell className="text-neutral-600">{invoice.due}</TableCell>
                            <TableCell className="text-right text-neutral-950 tabular-nums">
                                {invoice.amount}
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                    {rows.length === 0 && (
                        <TableRow>
                            <TableCell className="text-neutral-600" colSpan={6}>
                                No invoices match these filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

const InvoicesFiltered = () => (
    <AppScene
        page={{
            nav: 'top',
            place: 'invoices',
            title: 'Invoices',
            description: 'Everything billed this year, newest first.',
            actions: (
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            ),
            children: <FilteredInvoices />,
        }}
    />
);

export const inUse: InUse = {
    title: 'Filtered invoices',
    note: 'The menu open over the invoices it narrows; its button counts what is picked.',
    bare: true,
    render: () => <InvoicesFiltered />,
};
