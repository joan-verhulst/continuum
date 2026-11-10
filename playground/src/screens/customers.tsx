import {
    Avatar,
    Badge,
    BottomBar,
    Button,
    Checkbox,
    Dock,
    DockAction,
    DockItem,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    defaultFilterOperator,
    EmptyState,
    FilterCondition,
    FilterConditionAdd,
    FilterConditionField,
    FilterConditionOperator,
    FilterConditionRemove,
    FilterConditions,
    FilterConditionValue,
    type FilterField,
    filterOperators,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableConditions,
    TableHead,
    TableHeader,
    TableRow,
    TableSearch,
    TableToolbar,
    TableToolbarEnd,
    Toolbar,
    ToolbarButton,
    useToast,
} from 'continuum';
import {
    Archive,
    ArrowUpRight,
    Clock,
    Download,
    EllipsisVertical,
    Euro,
    Mail,
    Plus,
    SearchX,
    Upload,
    UserRound,
    X,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';
import { useScreenNav } from './shared';
import {
    allCustomers,
    type Customer,
    formatEuro,
    owners,
    PageHead,
    type Plan,
    type Status,
    statusTone,
    Workspace,
} from './workspace';

const icon = { strokeWidth: 2 } as const;

const views: ('All' | Status)[] = ['All', 'Active', 'Trial', 'Past due', 'Churned'];

const PAGE_SIZE = 10;

type Kind = keyof typeof filterOperators;

type FieldDef = FilterField & { kind: Kind; options: string[] };

const ownerField: FieldDef = {
    id: 'owner',
    label: 'Owner',
    icon: <UserRound {...icon} />,
    kind: 'many',
    options: owners.map(owner => owner.name),
};

/** What a condition can be on: the columns a select does not already cover. */
const fields: FieldDef[] = [
    ownerField,
    {
        id: 'seen',
        label: 'Last seen',
        icon: <Clock {...icon} />,
        kind: 'date',
        options: ['7 days', '30 days', '90 days'],
    },
    {
        id: 'mrr',
        label: 'Monthly revenue',
        icon: <Euro {...icon} />,
        kind: 'number',
        options: ['500', '1,000', '5,000'],
    },
];

type Condition = { field: string; operator: string; values: string[] };

const fieldOf = (id: string) => fields.find(field => field.id === id) ?? ownerField;

const amount = (value: string) => Number(value.replace(/[^\d.]/g, ''));

/** Whether a customer passes a condition. A condition without a value yet passes everyone. */
const passes = (customer: Customer, condition: Condition) => {
    // Every customer has one owner, so "is empty" keeps no one and "is not empty" everyone.
    if (condition.field === 'owner' && condition.operator === 'empty') return false;
    if (condition.field === 'owner' && condition.operator === 'notEmpty') return true;
    if (condition.values.length === 0) return true;
    switch (condition.field) {
        case 'owner': {
            const hit = condition.values.includes(customer.owner);
            if (condition.operator === 'none') return !hit;
            // One owner each: "has all of" holds only while a single name is asked for.
            if (condition.operator === 'all') return hit && condition.values.length === 1;
            return hit;
        }
        case 'seen': {
            const days = amount(condition.values[0] ?? '');
            if (condition.operator === 'last') return customer.seenDays <= days;
            if (condition.operator === 'before') return customer.seenDays > days;
            if (condition.operator === 'after') return customer.seenDays < days;
            return customer.seenDays === days;
        }
        case 'mrr': {
            const limit = amount(condition.values[0] ?? '');
            if (condition.operator === 'gt') return customer.mrr > limit;
            if (condition.operator === 'lt') return customer.mrr < limit;
            if (condition.operator === 'ne') return customer.mrr !== limit;
            return customer.mrr === limit;
        }
        default:
            return true;
    }
};

// The row opens on a click anywhere in it; the checkbox and the menu keep their clicks to themselves.
const keep = (event: MouseEvent) => event.stopPropagation();

/**
 * A list: the views in the dock, the table's own bar (a plain search, the plan select and the
 * conditions that narrow this table) inside its frame, and pages at the foot. Selecting rows swaps
 * the dock for the bar of what can be done to them all. A row opens the customer's own page.
 */
export const Customers = () => {
    const nav = useScreenNav();
    const toast = useToast();
    const [view, setView] = useState<'All' | Status>('All');
    const [query, setQuery] = useState('');
    const [plan, setPlan] = useState<'any' | Plan>('any');
    const [conditions, setConditions] = useState<Condition[]>([
        { field: 'owner', operator: 'any', values: ownerField.options.slice(0, 2) },
    ]);
    const [archived, setArchived] = useState<string[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [page, setPage] = useState(1);

    // Everything but the view narrows the counts in the dock, so each view says what it would show.
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matching = allCustomers.filter(
        customer =>
            !archived.includes(customer.id) &&
            words.every(word =>
                `${customer.name} ${customer.domain}`.toLowerCase().includes(word),
            ) &&
            (plan === 'any' || customer.plan === plan) &&
            conditions.every(condition => passes(customer, condition)),
    );
    const rows = matching.filter(customer => view === 'All' || customer.status === view);
    const counts = Object.fromEntries(
        views.map(item => [
            item,
            matching.filter(customer => item === 'All' || customer.status === item).length,
        ]),
    );

    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const current = Math.min(page, pageCount);
    const first = (current - 1) * PAGE_SIZE;
    const shown = rows.slice(first, first + PAGE_SIZE);

    // A selection only holds what is on the page now: a row filtered or paged away leaves it.
    const chosen = selected.filter(id => shown.some(row => row.id === id));
    const all = shown.length > 0 && chosen.length === shown.length;
    const some = chosen.length > 0 && !all;
    const filtered = query !== '' || plan !== 'any' || conditions.length > 0;

    const remaining = fields.filter(field => !conditions.some(c => c.field === field.id));

    const toggle = (id: string, on: boolean) =>
        setSelected(on ? [...chosen, id] : chosen.filter(item => item !== id));
    const update = (index: number, patch: Partial<Condition>) =>
        setConditions(current =>
            current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        );
    const clearFilters = () => {
        setQuery('');
        setPlan('any');
        setConditions([]);
    };

    // Archiving can be undone, so it asks nothing first and offers the undo after.
    const archive = (ids: string[]) => {
        setArchived(current => [...current, ...ids]);
        setSelected([]);
        const one = allCustomers.find(customer => customer.id === ids[0]);
        toast.add({
            title:
                ids.length === 1 && one
                    ? `${one.name} archived`
                    : `${ids.length} customers archived`,
            actionProps: {
                children: 'Undo',
                onClick: () => setArchived(current => current.filter(id => !ids.includes(id))),
            },
        });
    };

    // The list's views and its one primary action, at the panel's foot.
    const dock = (
        <BottomBar floating>
            <Dock
                aria-label="Views"
                onValueChange={value => {
                    setView(value as 'All' | Status);
                    setPage(1);
                }}
                value={view}
            >
                {views.map(item => (
                    <DockItem key={item} value={item}>
                        {item}
                        {/* The item's own colour at 70%, so it follows the pressed item onto the action fill. */}
                        <span className="font-normal tabular-nums opacity-70">{counts[item]}</span>
                    </DockItem>
                ))}
            </Dock>
            <DockAction onClick={() => nav.open('form')}>
                <Plus {...icon} />
                New customer
            </DockAction>
        </BottomBar>
    );

    // What a selection is for: the bar holds the actions on it, and clears it.
    const bulk = (
        <BottomBar floating>
            <Toolbar aria-label="Selected customers" variant="floating">
                <span className="flex items-center px-3 font-medium text-neutral-950 text-xs tabular-nums">
                    {chosen.length} selected
                </span>
                <ToolbarButton>
                    <Mail {...icon} />
                    Message
                </ToolbarButton>
                <ToolbarButton>
                    <Download {...icon} />
                    Export
                </ToolbarButton>
                <ToolbarButton onClick={() => archive(chosen)}>
                    <Archive {...icon} />
                    Archive
                </ToolbarButton>
                <ToolbarButton aria-label="Clear the selection" onClick={() => setSelected([])}>
                    <X {...icon} />
                </ToolbarButton>
            </Toolbar>
        </BottomBar>
    );

    const add = (
        <FilterConditionAdd
            fields={remaining}
            onAdd={id =>
                setConditions(current => [
                    ...current,
                    { field: id, operator: defaultFilterOperator(fieldOf(id).kind), values: [] },
                ])
            }
        />
    );

    // The bar finds and picks; the conditions narrow, in a row of their own while any apply,
    // the add button at its end. With nothing to show, the table's head goes and the bar stays.
    const toolbar = (
        <>
            <TableToolbar
                className={rows.length === 0 && conditions.length === 0 ? 'border-b-0' : undefined}
            >
                <TableSearch
                    aria-label="Search customers"
                    onChange={event => {
                        setQuery(event.target.value);
                        setPage(1);
                    }}
                    placeholder="Search customers"
                    value={query}
                />
                <TableToolbarEnd>
                    <Select
                        onValueChange={value => {
                            setPlan(value as 'any' | Plan);
                            setPage(1);
                        }}
                        value={plan}
                    >
                        <SelectTrigger aria-label="Plan" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="any">Any plan</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                            <SelectItem value="Pro">Pro</SelectItem>
                            <SelectItem value="Starter">Starter</SelectItem>
                        </SelectContent>
                    </Select>
                    {conditions.length === 0 && add}
                </TableToolbarEnd>
            </TableToolbar>
            {conditions.length > 0 && (
                <TableConditions className={rows.length === 0 ? 'border-b-0' : undefined}>
                    <FilterConditions onClear={() => setConditions([])}>
                        {conditions.map((condition, index) => {
                            const field = fieldOf(condition.field);
                            return (
                                <FilterCondition
                                    aria-label={`${field.label} filter`}
                                    key={condition.field}
                                >
                                    <FilterConditionField icon={field.icon}>
                                        {field.label}
                                    </FilterConditionField>
                                    <FilterConditionOperator
                                        onValueChange={operator => update(index, { operator })}
                                        options={filterOperators[field.kind]}
                                        value={condition.operator}
                                    />
                                    <FilterConditionValue
                                        multiple={field.kind === 'many'}
                                        onValueChange={values => update(index, { values })}
                                        options={field.options.map(value => ({ value }))}
                                        value={condition.values}
                                    />
                                    <FilterConditionRemove
                                        aria-label={`Remove the ${String(field.label).toLowerCase()} filter`}
                                        onClick={() =>
                                            setConditions(current =>
                                                current.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                </FilterCondition>
                            );
                        })}
                    </FilterConditions>
                    <TableToolbarEnd>{add}</TableToolbarEnd>
                </TableConditions>
            )}
        </>
    );

    return (
        <Workspace
            bar={chosen.length > 0 ? bulk : dock}
            place="customers"
            trail={['Customers']}
            width="wide"
        >
            {/* The counts are the dock's; the title says what the list holds. */}
            <PageHead
                description="The companies on a plan or a trial, and the ones that have left."
                title="Customers"
            >
                <Button variant="secondary">
                    <Upload {...icon} />
                    Import
                </Button>
            </PageHead>

            <div className="flex flex-col gap-4">
                <Table toolbar={toolbar}>
                    {rows.length > 0 && (
                        <>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-11">
                                        <Checkbox
                                            aria-label="Select every customer on this page"
                                            checked={all}
                                            indeterminate={some}
                                            onCheckedChange={() =>
                                                setSelected(all ? [] : shown.map(row => row.id))
                                            }
                                        />
                                    </TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="w-32">Plan</TableHead>
                                    <TableHead className="w-32">Status</TableHead>
                                    <TableHead className="w-32 text-right">
                                        Monthly revenue
                                    </TableHead>
                                    <TableHead className="w-44">Owner</TableHead>
                                    <TableHead className="w-32">Last seen</TableHead>
                                    <TableHead className="w-11">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shown.map(customer => (
                                    <TableRow
                                        className="cursor-pointer"
                                        data-selected={chosen.includes(customer.id) || undefined}
                                        key={customer.id}
                                        onClick={() => nav.open('detail', customer.id)}
                                    >
                                        <TableCell onClick={keep}>
                                            <Checkbox
                                                aria-label={`Select ${customer.name}`}
                                                checked={chosen.includes(customer.id)}
                                                onCheckedChange={on =>
                                                    toggle(customer.id, on === true)
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex min-w-0 items-center gap-3">
                                                <Avatar
                                                    alt={customer.name}
                                                    fallback={customer.initials}
                                                    size={24}
                                                />
                                                <span className="flex min-w-0 flex-col">
                                                    {/* The name is the row's link, for the keyboard and the reader. */}
                                                    <button
                                                        className="cursor-pointer truncate text-left text-neutral-950 hover:underline"
                                                        onClick={event => {
                                                            event.stopPropagation();
                                                            nav.open('detail', customer.id);
                                                        }}
                                                        type="button"
                                                    >
                                                        {customer.name}
                                                    </button>
                                                    <span className="truncate font-normal text-neutral-600 text-xxs">
                                                        {customer.domain}
                                                    </span>
                                                </span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-normal text-neutral-700">
                                            {customer.plan}
                                        </TableCell>
                                        <TableCell>
                                            <Badge tone={statusTone[customer.status]}>
                                                {customer.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {customer.mrr ? formatEuro(customer.mrr) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-2 font-normal text-neutral-700">
                                                <Avatar
                                                    alt={customer.owner}
                                                    fallback={customer.ownerInitials}
                                                    shape="round"
                                                    size={24}
                                                />
                                                {customer.owner}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-normal text-neutral-600">
                                            {customer.seen}
                                        </TableCell>
                                        <TableCell onClick={keep}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    render={
                                                        <Button
                                                            aria-label={`Actions for ${customer.name}`}
                                                            size="icon-sm"
                                                            variant="ghost"
                                                        />
                                                    }
                                                >
                                                    <EllipsisVertical {...icon} />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            nav.open('detail', customer.id)
                                                        }
                                                    >
                                                        <ArrowUpRight {...icon} />
                                                        Open
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Mail {...icon} />
                                                        Message
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => archive([customer.id])}
                                                        variant="danger"
                                                    >
                                                        <Archive {...icon} />
                                                        Archive
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </>
                    )}
                </Table>

                {rows.length > 0 ? (
                    <Pagination
                        onPageChange={setPage}
                        page={current}
                        pageCount={pageCount}
                        results={`Showing ${first + 1}–${first + shown.length} of ${rows.length}`}
                    />
                ) : filtered ? (
                    <EmptyState
                        action={
                            <Button onClick={clearFilters} variant="secondary">
                                Clear the filters
                            </Button>
                        }
                        description={`No ${view === 'All' ? '' : `${view.toLowerCase()} `}customer matches the search and the filters.`}
                        icon={<SearchX {...icon} />}
                        title="Nothing matches"
                    />
                ) : (
                    <EmptyState
                        action={
                            <Button onClick={() => setView('All')} variant="secondary">
                                Show all customers
                            </Button>
                        }
                        description="A customer shows here as soon as it has this status."
                        icon={<UserRound {...icon} />}
                        title={
                            view === 'All' ? 'No customers' : `No ${view.toLowerCase()} customers`
                        }
                    />
                )}
            </div>
        </Workspace>
    );
};
