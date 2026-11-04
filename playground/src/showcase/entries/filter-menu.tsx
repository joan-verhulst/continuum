import {
    Badge,
    Card,
    CardHeader,
    CardTitle,
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
    toggleFilter,
} from 'continuum';
import { CircleCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { type Entry, type InUse, type Knob, type PreviewProps, previewIcon, scene } from '../kit';

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
        amount: '€4,120.00',
    },
    {
        number: 'INV-0139',
        client: 'Globex',
        status: 'Overdue',
        owner: 'Bram Jansen',
        amount: '€1,860.00',
    },
    {
        number: 'INV-0137',
        client: 'Initech',
        status: 'Paid',
        owner: 'Anna de Vries',
        amount: '€920.00',
    },
    {
        number: 'INV-0134',
        client: 'Umbrella',
        status: 'Overdue',
        owner: 'Chloé Martin',
        amount: '€2,340.00',
    },
    {
        number: 'INV-0131',
        client: 'Hooli',
        status: 'Paid',
        owner: 'Bram Jansen',
        amount: '€6,480.00',
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
        <Card className="w-full max-w-xl gap-4 self-start">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <span className="text-neutral-600 text-xs tabular-nums">
                    {rows.length} of {filteredInvoices.length}
                </span>
            </CardHeader>
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
                                                [invoice.status, invoice.owner].includes(option),
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
            <ul className="flex flex-col gap-3">
                {rows.map(invoice => (
                    <li className="flex items-center gap-3 text-xs" key={invoice.number}>
                        <span className="w-20 shrink-0 text-neutral-500 tabular-nums">
                            {invoice.number}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                            {invoice.client}
                        </span>
                        <Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge>
                        <span className="w-20 shrink-0 text-right text-neutral-900 tabular-nums">
                            {invoice.amount}
                        </span>
                    </li>
                ))}
                {rows.length === 0 && (
                    <li className="text-neutral-600 text-xs">No invoices match these filters.</li>
                )}
            </ul>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Filtered invoices',
    note: 'The menu open over the list it narrows, the count of what is picked on its button.',
    bare: true,
    render: scene(<FilteredInvoices />, 'min-h-[480px] items-start'),
};
