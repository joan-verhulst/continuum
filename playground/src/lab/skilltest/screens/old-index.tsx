import {
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    BottomBar,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Checkbox,
    DateRangePicker,
    type DateRangeValue,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Dock,
    DockAction,
    DockCount,
    DockItem,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    defaultDateRangePresets,
    EmptyState,
    FilterMenu,
    FilterMenuClear,
    FilterMenuContent,
    FilterMenuGroup,
    FilterMenuItem,
    FilterMenuTrigger,
    HeaderBar,
    NavItem,
    PageContent,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    Table,
    TableBody,
    TableCell,
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
    ArrowUpRight,
    Ban,
    Bird,
    ChartColumn,
    CircleCheck,
    Copy,
    Download,
    EllipsisVertical,
    FileText,
    House,
    Plus,
    Receipt,
    SearchX,
    Send,
    Settings,
    Users,
    X,
} from 'lucide-react';
import { type MouseEvent, type RefObject, useLayoutEffect, useRef, useState } from 'react';

/*
 * Kestrel's invoice list: an index page. The column is the wide one (1080), the statuses are the
 * list's views in the floating dock beside the one primary action (New invoice), the table's own
 * bar finds and narrows, and selecting rows swaps the dock for the bar of what can be done to them.
 */

const icon = { strokeWidth: 2 } as const;

type Status = 'Draft' | 'Sent' | 'Overdue' | 'Paid';

type Invoice = {
    id: string;
    customer: string;
    /** Issue and due dates as the list writes them; a draft has neither. */
    issued?: string;
    due?: string;
    amount: number;
    status: Status;
};

/** The first page of 48, newest first, as the content gives it. */
const firstPage: Invoice[] = [
    {
        id: 'INV-0142',
        customer: 'Harbour & Co',
        issued: '16 Nov',
        due: '30 Nov',
        amount: 2420,
        status: 'Sent',
    },
    {
        id: 'INV-0141',
        customer: 'Northwind',
        issued: '13 Nov',
        due: '27 Nov',
        amount: 1860,
        status: 'Sent',
    },
    {
        id: 'INV-0140',
        customer: 'Lumen Labs',
        issued: '21 Oct',
        due: '4 Nov',
        amount: 1150,
        status: 'Overdue',
    },
    {
        id: 'INV-0139',
        customer: 'Atlas Freight',
        issued: '19 Oct',
        due: '2 Nov',
        amount: 3200,
        status: 'Paid',
    },
    {
        id: 'INV-0138',
        customer: 'Harbour & Co',
        issued: '15 Oct',
        due: '29 Oct',
        amount: 2980,
        status: 'Paid',
    },
    {
        id: 'INV-0137',
        customer: 'Orbit Coffee',
        issued: '14 Oct',
        due: '28 Oct',
        amount: 640,
        status: 'Overdue',
    },
    {
        id: 'INV-0136',
        customer: 'Northwind',
        issued: '9 Oct',
        due: '23 Oct',
        amount: 1860,
        status: 'Paid',
    },
    { id: 'INV-0135', customer: 'Fieldwork Studio', amount: 4100, status: 'Draft' },
    {
        id: 'INV-0134',
        customer: 'Atlas Freight',
        issued: '2 Oct',
        due: '16 Oct',
        amount: 3200,
        status: 'Paid',
    },
    {
        id: 'INV-0133',
        customer: 'Lumen Labs',
        issued: '30 Sep',
        due: '14 Oct',
        amount: 980,
        status: 'Paid',
    },
];

const TOTAL = 48;
const PAGE_SIZE = 10;

/** How many invoices the workspace holds in each status, all 48 of them. */
const statusCounts: Record<Status, number> = { Draft: 3, Sent: 12, Overdue: 4, Paid: 29 };

const views: ('All' | Status)[] = ['All', 'Draft', 'Sent', 'Overdue', 'Paid'];

/** Status colours mean status: a draft is nothing yet, sent is information, overdue a warning. */
const statusTone: Record<Status, 'neutral' | 'primary' | 'warning' | 'success'> = {
    Draft: 'neutral',
    Sent: 'primary',
    Overdue: 'warning',
    Paid: 'success',
};

const customers = [
    'Harbour & Co',
    'Northwind',
    'Lumen Labs',
    'Atlas Freight',
    'Orbit Coffee',
    'Fieldwork Studio',
];

const initials = (name: string) =>
    name
        .split(' ')
        .filter(word => /^\w/.test(word))
        .slice(0, 2)
        .map(word => word[0])
        .join('')
        .toUpperCase();

const euro = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
});

/** On a phone the issue date folds into Filter as the picker's own quick ranges. */
const quickRanges = defaultDateRangePresets.filter(preset =>
    ['Last 7 days', 'Last 30 days', 'This month', 'Last month'].includes(preset.label),
);

const months: Record<string, number> = { Sep: 8, Oct: 9, Nov: 10 };

/** The issue date as a day, for the date filter; the list's dates are all in 2026. */
const issuedOn = (invoice: Invoice) => {
    if (!invoice.issued) return undefined;
    const [day, month] = invoice.issued.split(' ');
    return new Date(2026, months[month ?? ''] ?? 0, Number(day));
};

const inRange = (invoice: Invoice, range: DateRangeValue | undefined) => {
    if (!range) return true;
    const day = issuedOn(invoice);
    if (!day) return false;
    const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    const to = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate());
    return day >= from && day <= to;
};

/**
 * Whether the shell is compact (under its 640), for what a container query cannot do: change
 * which controls the bar offers, not only how they sit.
 */
const useShellCompact = (ref: RefObject<HTMLElement | null>) => {
    const [compact, setCompact] = useState(false);
    useLayoutEffect(() => {
        const shell = ref.current?.closest<HTMLElement>('[data-slot="app-shell"]');
        if (!shell) return;
        const limit =
            Number.parseFloat(
                getComputedStyle(shell).getPropertyValue('--container-shell-compact'),
            ) || 640;
        const measure = () => setCompact(shell.clientWidth < limit);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(shell);
        return () => observer.disconnect();
    }, [ref]);
    return compact;
};

// The checkbox and the row's menu keep their clicks; a click anywhere else opens the invoice.
const keep = (event: MouseEvent) => event.stopPropagation();

/** The product's mark on a dark square: the workspace in the sidebar's footer. */
const WorkspaceMark = () => (
    <span className="grid size-full place-items-center bg-neutral-950 text-neutral-50 [&_svg]:size-4">
        <Bird {...icon} />
    </span>
);

const places = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
];

/** The places, settings apart under the workspace, and who is signed in. No create button. */
const KestrelSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Bird {...icon} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Main">
            {places.map(place => (
                <NavItem active={place.id === 'invoices'} icon={place.icon} key={place.id}>
                    {place.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace" label="Workspace">
            <NavItem icon={<Settings {...icon} />}>Settings</NavItem>
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={<WorkspaceMark />}
                name="Kestrel Studio"
                detail="Joan Verhulst"
            />
        </SidebarFooter>
    </Sidebar>
);

export default function OldIndex() {
    const toast = useToast();
    const [invoices, setInvoices] = useState(firstPage);
    const [view, setView] = useState<'All' | Status>('All');
    const [query, setQuery] = useState('');
    const [customer, setCustomer] = useState('any');
    const [range, setRange] = useState<DateRangeValue | undefined>();
    // Which quick range set the period, when one did, so the folded menu can tick it.
    const [preset, setPreset] = useState<string | undefined>();
    const [selected, setSelected] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [voiding, setVoiding] = useState<Invoice | undefined>();

    const frame = useRef<HTMLDivElement>(null);
    const compact = useShellCompact(frame);

    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const narrowed = query !== '' || customer !== 'any' || range !== undefined;
    const matching = invoices.filter(
        invoice =>
            words.every(word => `${invoice.id} ${invoice.customer}`.toLowerCase().includes(word)) &&
            (customer === 'any' || invoice.customer === customer) &&
            inRange(invoice, range),
    );
    const rows = matching.filter(invoice => view === 'All' || invoice.status === view);

    // Only the first page is loaded: the workspace's counts stand for all 48, moved by what was
    // done to the rows here; once the list is narrowed, the counts are what the narrowing leaves.
    const counts: Record<'All' | Status, number> = narrowed
        ? {
              All: matching.length,
              Draft: matching.filter(i => i.status === 'Draft').length,
              Sent: matching.filter(i => i.status === 'Sent').length,
              Overdue: matching.filter(i => i.status === 'Overdue').length,
              Paid: matching.filter(i => i.status === 'Paid').length,
          }
        : {
              All: invoices.length + (TOTAL - firstPage.length),
              ...(Object.fromEntries(
                  (Object.keys(statusCounts) as Status[]).map(status => [
                      status,
                      statusCounts[status] +
                          invoices.filter(i => i.status === status).length -
                          firstPage.filter(i => i.status === status).length,
                  ]),
              ) as Record<Status, number>),
          };
    const total = counts[view];
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(page, pageCount);
    const first = (current - 1) * PAGE_SIZE;

    const chosen = selected.filter(id => rows.some(row => row.id === id));
    const all = rows.length > 0 && chosen.length === rows.length;
    const some = chosen.length > 0 && !all;

    const toggle = (id: string, on: boolean) =>
        setSelected(on ? [...chosen, id] : chosen.filter(item => item !== id));
    const clearFilters = () => {
        setQuery('');
        setCustomer('any');
        setRange(undefined);
        setPreset(undefined);
        setPage(1);
    };
    const applied = (customer === 'any' ? 0 : 1) + (range ? 1 : 0);

    const plural = (n: number) => (n === 1 ? 'invoice' : 'invoices');

    // Marking paid can be undone, so it asks nothing first and offers the undo after.
    const markPaid = (ids: string[]) => {
        const before = invoices;
        const unpaid = ids.filter(id => before.find(i => i.id === id)?.status !== 'Paid');
        setInvoices(current =>
            current.map(i => (unpaid.includes(i.id) ? { ...i, status: 'Paid' } : i)),
        );
        setSelected([]);
        toast.add({
            title:
                unpaid.length === 1
                    ? `${unpaid[0]} marked as paid`
                    : `${unpaid.length} invoices marked as paid`,
            actionProps: { children: 'Undo', onClick: () => setInvoices(before) },
        });
    };

    const remind = (ids: string[]) => {
        // A reminder goes only where money is still owed: never for a draft or a paid invoice.
        const owed = ids.filter(id => {
            const status = invoices.find(i => i.id === id)?.status;
            return status === 'Sent' || status === 'Overdue';
        });
        setSelected([]);
        toast.add({
            title:
                owed.length === 0
                    ? 'No reminder sent'
                    : owed.length === 1
                      ? `Reminder sent for ${owed[0]}`
                      : `Reminders sent for ${owed.length} invoices`,
            description:
                owed.length < ids.length ? 'Drafts and paid invoices get no reminder.' : undefined,
        });
    };

    const download = (ids: string[]) => {
        setSelected([]);
        toast.add({ title: `${ids.length} ${plural(ids.length)} downloaded as PDF` });
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
                        <DockCount>{counts[item]}</DockCount>
                    </DockItem>
                ))}
            </Dock>
            <DockAction>
                <Plus {...icon} />
                New invoice
            </DockAction>
        </BottomBar>
    );

    // What a selection is for: the bar holds the actions on it, and clears it.
    const bulk = (
        <BottomBar floating>
            <Toolbar aria-label="Selected invoices" variant="floating">
                <span className="flex items-center px-3 font-medium text-neutral-950 text-xs tabular-nums">
                    {chosen.length} selected
                </span>
                <ToolbarButton onClick={() => remind(chosen)}>
                    <Send {...icon} />
                    Send reminder
                </ToolbarButton>
                <ToolbarButton onClick={() => markPaid(chosen)}>
                    <CircleCheck {...icon} />
                    Mark as paid
                </ToolbarButton>
                <ToolbarButton onClick={() => download(chosen)}>
                    <Download {...icon} />
                    Download PDF
                </ToolbarButton>
                <ToolbarButton aria-label="Clear the selection" onClick={() => setSelected([])}>
                    <X {...icon} />
                </ToolbarButton>
            </Toolbar>
        </BottomBar>
    );

    const datePicker = (
        <DateRangePicker
            align="end"
            aria-label="Issue date"
            className="w-56"
            onValueChange={value => {
                setRange(value);
                setPreset(undefined);
                setPage(1);
            }}
            placeholder="Issue date"
            size="sm"
            value={range}
        />
    );

    // The bar finds and narrows: a search, then the customer and the issue date. Status is not
    // here: it is the list's views, in the dock. On a phone both fold into the one Filter button.
    const toolbar = (
        <TableToolbar className={rows.length === 0 ? 'border-b-0' : undefined}>
            <TableSearch
                aria-label="Search invoices"
                onChange={event => {
                    setQuery(event.target.value);
                    setPage(1);
                }}
                placeholder="Search invoices"
                value={query}
            />
            <TableToolbarEnd>
                {compact ? (
                    <FilterMenu>
                        <FilterMenuTrigger count={applied} />
                        <FilterMenuContent align="end">
                            <FilterMenuGroup label="Customer">
                                {customers.map(name => (
                                    <FilterMenuItem
                                        checked={customer === name}
                                        key={name}
                                        onCheckedChange={on => {
                                            setCustomer(on ? name : 'any');
                                            setPage(1);
                                        }}
                                    >
                                        {name}
                                    </FilterMenuItem>
                                ))}
                            </FilterMenuGroup>
                            <FilterMenuGroup label="Issued">
                                {quickRanges.map(item => (
                                    <FilterMenuItem
                                        checked={preset === item.label}
                                        key={item.label}
                                        onCheckedChange={on => {
                                            setRange(on ? item.range() : undefined);
                                            setPreset(on ? item.label : undefined);
                                            setPage(1);
                                        }}
                                    >
                                        {item.label}
                                    </FilterMenuItem>
                                ))}
                            </FilterMenuGroup>
                            <FilterMenuClear
                                count={applied}
                                onClick={() => {
                                    setCustomer('any');
                                    setRange(undefined);
                                    setPreset(undefined);
                                }}
                            />
                        </FilterMenuContent>
                    </FilterMenu>
                ) : (
                    <>
                        <Select
                            onValueChange={value => {
                                setCustomer(value);
                                setPage(1);
                            }}
                            value={customer}
                        >
                            <SelectTrigger aria-label="Customer" size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="any">Any customer</SelectItem>
                                {customers.map(name => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {datePicker}
                    </>
                )}
            </TableToolbarEnd>
        </TableToolbar>
    );

    return (
        <AppShell className="h-dvh min-h-0">
            <KestrelSidebar />
            <AppPanel>
                <HeaderBar>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">
                                    <BreadcrumbHome />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Invoices</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBar>
                <div className="min-h-0 flex-1 overflow-auto">
                    <PageContent className="flex flex-col gap-10 pb-24" width="wide">
                        {/* The count is the dock's; the line says what the list holds. */}
                        <div className="flex @max-shell-compact/shell:flex-col @max-shell-compact/shell:items-start items-end justify-between gap-6">
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <h1 className="font-medium text-2xl text-neutral-950">Invoices</h1>
                                <p className="text-neutral-600 text-sm">
                                    Every invoice the studio has drafted or sent, newest first.
                                </p>
                            </div>
                            <div className="flex @max-shell-compact/shell:hidden shrink-0 items-center gap-2">
                                <Button variant="secondary">
                                    <Download {...icon} />
                                    Export CSV
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4" ref={frame}>
                            <Table toolbar={toolbar}>
                                {rows.length > 0 && (
                                    <>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-11">
                                                    <Checkbox
                                                        aria-label="Select every invoice on this page"
                                                        checked={all}
                                                        indeterminate={some}
                                                        onCheckedChange={() =>
                                                            setSelected(
                                                                all ? [] : rows.map(row => row.id),
                                                            )
                                                        }
                                                    />
                                                </TableHead>
                                                <TableHead className="w-32">Invoice</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead className="w-28">Status</TableHead>
                                                <TableHead className="w-28" optional>
                                                    Issued
                                                </TableHead>
                                                <TableHead className="w-28" optional>
                                                    Due
                                                </TableHead>
                                                <TableHead className="w-32 text-right">
                                                    Amount
                                                </TableHead>
                                                <TableHead className="w-11">
                                                    <span className="sr-only">Actions</span>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map(invoice => (
                                                <TableRow
                                                    className="cursor-pointer"
                                                    data-selected={
                                                        chosen.includes(invoice.id) || undefined
                                                    }
                                                    key={invoice.id}
                                                >
                                                    <TableCell onClick={keep}>
                                                        <Checkbox
                                                            aria-label={`Select ${invoice.id}`}
                                                            checked={chosen.includes(invoice.id)}
                                                            onCheckedChange={on =>
                                                                toggle(invoice.id, on === true)
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="tabular-nums">
                                                        {/* The number is the row's link, for the keyboard and the reader. */}
                                                        <button
                                                            className="cursor-pointer text-left text-neutral-950 hover:underline"
                                                            type="button"
                                                        >
                                                            {invoice.id}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="flex min-w-0 items-center gap-3 font-normal text-neutral-700">
                                                            <Avatar
                                                                alt={invoice.customer}
                                                                fallback={initials(
                                                                    invoice.customer,
                                                                )}
                                                                size={24}
                                                            />
                                                            <span className="truncate">
                                                                {invoice.customer}
                                                            </span>
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge tone={statusTone[invoice.status]}>
                                                            {invoice.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell
                                                        className="font-normal text-neutral-700 tabular-nums"
                                                        optional
                                                    >
                                                        {invoice.issued ?? (
                                                            <span className="text-neutral-600">
                                                                Not issued
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        className="font-normal text-neutral-700 tabular-nums"
                                                        optional
                                                    >
                                                        {invoice.due ?? (
                                                            <span className="text-neutral-600">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {euro.format(invoice.amount)}
                                                    </TableCell>
                                                    <TableCell onClick={keep}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                render={
                                                                    <Button
                                                                        aria-label={`Actions for ${invoice.id}`}
                                                                        size="icon-sm"
                                                                        variant="ghost"
                                                                    />
                                                                }
                                                            >
                                                                <EllipsisVertical {...icon} />
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>
                                                                    <ArrowUpRight {...icon} />
                                                                    Open
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        toast.add({
                                                                            title: `${invoice.id} duplicated as a draft`,
                                                                        })
                                                                    }
                                                                >
                                                                    <Copy {...icon} />
                                                                    Duplicate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setVoiding(invoice)
                                                                    }
                                                                    variant="danger"
                                                                >
                                                                    <Ban {...icon} />
                                                                    Void
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
                                    results={`Showing ${first + 1}–${first + rows.length} of ${total}`}
                                />
                            ) : narrowed ? (
                                <EmptyState
                                    action={
                                        <Button onClick={clearFilters} variant="secondary">
                                            Clear the filters
                                        </Button>
                                    }
                                    description={`No ${view === 'All' ? '' : `${view.toLowerCase()} `}invoice matches the search and the filters.`}
                                    icon={<SearchX {...icon} />}
                                    title="Nothing matches"
                                />
                            ) : (
                                <EmptyState
                                    action={
                                        <Button onClick={() => setView('All')} variant="secondary">
                                            Show all invoices
                                        </Button>
                                    }
                                    description="An invoice shows here as soon as it has this status."
                                    icon={<FileText {...icon} />}
                                    title={`No ${view.toLowerCase()} invoices`}
                                />
                            )}
                        </div>
                    </PageContent>
                </div>
                {chosen.length > 0 ? bulk : dock}
            </AppPanel>

            {/* Voiding cannot be undone, so it is confirmed, the primary named by its verb. */}
            <Dialog
                onOpenChange={open => {
                    if (!open) setVoiding(undefined);
                }}
                open={voiding !== undefined}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Void {voiding?.id}?</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            The invoice to {voiding?.customer} for{' '}
                            {voiding ? euro.format(voiding.amount) : ''} stays on record but can no
                            longer be paid. This cannot be undone.
                        </DialogDescription>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button
                            onClick={() => {
                                const id = voiding?.id;
                                setInvoices(current => current.filter(i => i.id !== id));
                                setVoiding(undefined);
                                toast.add({ title: `${id} voided` });
                            }}
                        >
                            Void invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}
