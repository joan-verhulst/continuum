/*
 * The plan (SKILL.md, Building something, step 3):
 * - Purpose: someone at Kestrel Studio comes here to find the invoices that need attention, act on
 *   several at once, and open one.
 * - Rank: lead, the invoice table (number, customer, issued, due, status, amount); supporting, the
 *   status sets with their counts (All 48 · Draft 3 · Sent 12 · Overdue 4 · Paid 29) and the
 *   narrowing by customer and issue date; look-up, the page position ("1–10 of 48"); actions, the
 *   one primary New invoice, the secondary Export CSV, the bulk send reminder · mark as paid ·
 *   download PDF, and per row duplicate and the destructive void.
 * - Kind: an index, so the wide column (1080); the table, always.
 * - Order: the page head (title, line, Export CSV) → the table in its frame, its own bar holding the
 *   customer select and the issue-date picker → pagination → the dock: the status views beside the
 *   New invoice dock action, swapped for the bulk toolbar while rows are selected.
 */
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
    type DateRangePreset,
    type DateRangeValue,
    Dialog,
    DialogBody,
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
    HeaderBar,
    HeaderBarNotice,
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
    TableToolbar,
    Toolbar,
    ToolbarButton,
    useHeaderNotice,
    useToast,
} from '@contui/ui';
import {
    Ban,
    Bird,
    ChartColumn,
    CircleCheck,
    Copy,
    Download,
    EllipsisVertical,
    House,
    Mail,
    Plus,
    Receipt,
    SearchX,
    Settings,
    Users,
    X,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';

const icon = { strokeWidth: 2 } as const;

type Status = 'Draft' | 'Sent' | 'Overdue' | 'Paid';
type View = 'All' | Status;

type Invoice = {
    id: string;
    customer: string;
    /** Null while the invoice is a draft: it has not been issued, so it has no dates yet. */
    issued: Date | null;
    due: Date | null;
    amount: number;
    status: Status;
};

const day = (d: number, month: number) => new Date(2026, month - 1, d);

/** The first page of the list, newest first, as the content gives it. */
const firstPage: Invoice[] = [
    {
        id: 'INV-0142',
        customer: 'Harbour & Co',
        issued: day(16, 11),
        due: day(30, 11),
        amount: 2420,
        status: 'Sent',
    },
    {
        id: 'INV-0141',
        customer: 'Northwind',
        issued: day(13, 11),
        due: day(27, 11),
        amount: 1860,
        status: 'Sent',
    },
    {
        id: 'INV-0140',
        customer: 'Lumen Labs',
        issued: day(21, 10),
        due: day(4, 11),
        amount: 1150,
        status: 'Overdue',
    },
    {
        id: 'INV-0139',
        customer: 'Atlas Freight',
        issued: day(19, 10),
        due: day(2, 11),
        amount: 3200,
        status: 'Paid',
    },
    {
        id: 'INV-0138',
        customer: 'Harbour & Co',
        issued: day(15, 10),
        due: day(29, 10),
        amount: 2980,
        status: 'Paid',
    },
    {
        id: 'INV-0137',
        customer: 'Orbit Coffee',
        issued: day(14, 10),
        due: day(28, 10),
        amount: 640,
        status: 'Overdue',
    },
    {
        id: 'INV-0136',
        customer: 'Northwind',
        issued: day(9, 10),
        due: day(23, 10),
        amount: 1860,
        status: 'Paid',
    },
    {
        id: 'INV-0135',
        customer: 'Fieldwork Studio',
        issued: null,
        due: null,
        amount: 4100,
        status: 'Draft',
    },
    {
        id: 'INV-0134',
        customer: 'Atlas Freight',
        issued: day(2, 10),
        due: day(16, 10),
        amount: 3200,
        status: 'Paid',
    },
    {
        id: 'INV-0133',
        customer: 'Lumen Labs',
        issued: day(30, 9),
        due: day(14, 10),
        amount: 980,
        status: 'Paid',
    },
];

/** The whole list's counts by status; only the first ten invoices are written out above. */
const listCounts: Record<Status, number> = { Draft: 3, Sent: 12, Overdue: 4, Paid: 29 };

const statuses: Status[] = ['Draft', 'Sent', 'Overdue', 'Paid'];
const views: View[] = ['All', ...statuses];

const customers = [
    'Harbour & Co',
    'Northwind',
    'Lumen Labs',
    'Atlas Freight',
    'Orbit Coffee',
    'Fieldwork Studio',
];

/** A draft is nothing yet, sent waits on the customer as information, overdue wants attention, paid is done. */
const statusTone: Record<Status, 'neutral' | 'primary' | 'warning' | 'success'> = {
    Draft: 'neutral',
    Sent: 'primary',
    Overdue: 'warning',
    Paid: 'success',
};

const PAGE_SIZE = 10;
const LIST_TOTAL = 48;

/** Issue dates are read in months and quarters, not single days. */
const presets: DateRangePreset[] = defaultDateRangePresets.filter(preset =>
    ['Last 30 days', 'This month', 'Last month', 'Year to date'].includes(preset.label),
);

const euro = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "30 Sep", as the studio writes it; en-GB's own short month would say "Sept".
const shortDate = (date: Date) => `${date.getDate()} ${months[date.getMonth()]}`;

const sameOrAfter = (a: Date, b: Date) => a.getTime() >= b.getTime();

// The row opens on a click anywhere in it; the checkbox and the menu keep their clicks to themselves.
const keep = (event: MouseEvent) => event.stopPropagation();

const places = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
    { id: 'settings', label: 'Settings', icon: <Settings {...icon} /> },
];

/** Kestrel's places; the sidebar holds no create button, the page owns it. */
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
                <NavItem
                    active={place.id === 'invoices'}
                    aria-current={place.id === 'invoices' ? 'page' : undefined}
                    icon={place.icon}
                    key={place.id}
                >
                    {place.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={<Avatar alt="Kestrel Studio" fallback="KS" size={36} />}
                name="Kestrel Studio"
                detail="Joan Verhulst"
            />
        </SidebarFooter>
    </Sidebar>
);

const PlanIndex = () => {
    const toast = useToast();
    const { notice, show } = useHeaderNotice();
    const [invoices, setInvoices] = useState(firstPage);
    // What the reader has done to the list here, so the dock's counts follow: duplicates add drafts,
    // voids take invoices away, marking paid moves them between sets.
    const [view, setView] = useState<View>('All');
    const [customer, setCustomer] = useState('any');
    const [issued, setIssued] = useState<DateRangeValue | undefined>();
    const [selected, setSelected] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [voiding, setVoiding] = useState<Invoice | null>(null);

    const filtered = customer !== 'any' || issued !== undefined;

    const matching = invoices.filter(
        invoice =>
            (customer === 'any' || invoice.customer === customer) &&
            (!issued ||
                (invoice.issued !== null &&
                    sameOrAfter(invoice.issued, issued.from) &&
                    sameOrAfter(issued.to, invoice.issued))),
    );
    const rows = matching.filter(invoice => view === 'All' || invoice.status === view);

    // Unfiltered, the counts are the whole list's, moved by what was changed on this page; once a
    // customer or a date narrows the list, they count what is left, so each view says what it shows.
    const changed = (status: Status) =>
        invoices.filter(i => i.status === status).length -
        firstPage.filter(i => i.status === status).length;
    const counts: Record<View, number> = filtered
        ? {
              All: matching.length,
              ...(Object.fromEntries(
                  statuses.map(s => [s, matching.filter(i => i.status === s).length]),
              ) as Record<Status, number>),
          }
        : {
              All: LIST_TOTAL + invoices.length - firstPage.length,
              ...(Object.fromEntries(statuses.map(s => [s, listCounts[s] + changed(s)])) as Record<
                  Status,
                  number
              >),
          };

    // Only the first page's ten invoices are written out, so the pager runs over the whole list
    // while nothing narrows it, and a narrowed list shows what of those ten is left.
    const paged = !filtered && view === 'All';
    const pageCount = paged ? Math.ceil(counts.All / PAGE_SIZE) : 1;
    const shown = rows.slice(0, PAGE_SIZE);

    const chosen = selected.filter(id => shown.some(row => row.id === id));
    const all = shown.length > 0 && chosen.length === shown.length;
    const some = chosen.length > 0 && !all;

    const toggle = (id: string, on: boolean) =>
        setSelected(on ? [...chosen, id] : chosen.filter(item => item !== id));

    const clearFilters = () => {
        setCustomer('any');
        setIssued(undefined);
    };

    const plural = (n: number) => (n === 1 ? '1 invoice' : `${n} invoices`);

    // Sending cannot be taken back and needs nothing more, so it is said in a notice.
    const remind = () => {
        show(`Reminder sent for ${plural(chosen.length)}`);
        setSelected([]);
    };

    const download = () => {
        show(`Downloading ${chosen.length === 1 ? '1 PDF' : `${chosen.length} PDFs`}`, {
            icon: <Download {...icon} />,
        });
    };

    // Marking paid can be undone, so it asks nothing first and offers the undo after.
    const markPaid = () => {
        const before = invoices;
        const ids = chosen;
        setInvoices(current =>
            current.map(i => (ids.includes(i.id) ? { ...i, status: 'Paid' } : i)),
        );
        setSelected([]);
        toast.add({
            title: `${plural(ids.length)} marked as paid`,
            actionProps: { children: 'Undo', onClick: () => setInvoices(before) },
        });
    };

    const duplicate = (invoice: Invoice) => {
        const highest = Math.max(...invoices.map(i => Number(i.id.slice(4))));
        const id = `INV-${String(highest + 1).padStart(4, '0')}`;
        setInvoices(current => [
            { ...invoice, id, issued: null, due: null, status: 'Draft' },
            ...current,
        ]);
        toast.add({
            title: `${id} drafted`,
            description: `A copy of ${invoice.id} for ${invoice.customer}.`,
            actionProps: {
                children: 'Undo',
                onClick: () => setInvoices(current => current.filter(i => i.id !== id)),
            },
        });
    };

    // Voiding cannot be undone, so it was confirmed first and the toast only reports it.
    const confirmVoid = () => {
        if (!voiding) return;
        const gone = voiding;
        setInvoices(current => current.filter(i => i.id !== gone.id));
        setSelected(current => current.filter(id => id !== gone.id));
        setVoiding(null);
        toast.add({ title: `${gone.id} voided` });
    };

    const dock = (
        <BottomBar floating>
            <Dock
                aria-label="Views"
                onValueChange={value => {
                    setView(value as View);
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

    const bulk = (
        <BottomBar floating>
            <Toolbar aria-label="Selected invoices" variant="floating">
                <span className="flex items-center px-3 font-medium text-neutral-950 text-xs tabular-nums">
                    {chosen.length} selected
                </span>
                <ToolbarButton onClick={remind}>
                    <Mail {...icon} />
                    Send reminder
                </ToolbarButton>
                <ToolbarButton onClick={markPaid}>
                    <CircleCheck {...icon} />
                    Mark as paid
                </ToolbarButton>
                <ToolbarButton onClick={download}>
                    <Download {...icon} />
                    Download PDF
                </ToolbarButton>
                <ToolbarButton aria-label="Clear the selection" onClick={() => setSelected([])}>
                    <X {...icon} />
                </ToolbarButton>
            </Toolbar>
        </BottomBar>
    );

    // The table's own bar: the two things the reader narrows by besides the status, which is the dock's.
    const toolbar = (
        <TableToolbar className={rows.length === 0 ? 'border-b-0' : undefined}>
            <Select
                onValueChange={value => {
                    setCustomer(value as string);
                    setPage(1);
                }}
                value={customer}
            >
                <SelectTrigger aria-label="Customer" size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="any">All customers</SelectItem>
                    {customers.map(name => (
                        <SelectItem key={name} value={name}>
                            {name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <DateRangePicker
                aria-label="Issue date"
                className="w-auto"
                onValueChange={value => {
                    setIssued(value);
                    setPage(1);
                }}
                placeholder="Any issue date"
                presets={presets}
                size="sm"
                value={issued}
            />
        </TableToolbar>
    );

    return (
        <div className="h-dvh">
            <AppShell className="h-full min-h-0">
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
                        <HeaderBarNotice {...notice} />
                    </HeaderBar>
                    <div className="min-h-0 flex-1 overflow-auto">
                        <PageContent className="flex flex-col gap-4 pb-24" width="wide">
                            {/* The counts are the dock's; the line says what the list holds. */}
                            <div className="flex @max-shell-compact/shell:flex-col @max-shell-compact/shell:items-start items-end justify-between gap-6">
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <h1 className="font-medium text-2xl text-neutral-950">
                                        Invoices
                                    </h1>
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

                            <Table toolbar={toolbar}>
                                {rows.length > 0 && (
                                    <>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-11 py-0">
                                                    <Checkbox
                                                        aria-label="Select every invoice on this page"
                                                        checked={all}
                                                        indeterminate={some}
                                                        onCheckedChange={() =>
                                                            setSelected(
                                                                all ? [] : shown.map(row => row.id),
                                                            )
                                                        }
                                                    />
                                                </TableHead>
                                                <TableHead className="w-32">Invoice</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead className="w-32" optional>
                                                    Issued
                                                </TableHead>
                                                <TableHead className="w-32">Due</TableHead>
                                                <TableHead className="w-32">Status</TableHead>
                                                <TableHead className="w-36 text-right">
                                                    Amount
                                                </TableHead>
                                                <TableHead className="w-11">
                                                    <span className="sr-only">Actions</span>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {shown.map(invoice => (
                                                <TableRow
                                                    className="cursor-pointer"
                                                    data-selected={
                                                        chosen.includes(invoice.id) || undefined
                                                    }
                                                    key={invoice.id}
                                                    onClick={() => {
                                                        window.location.hash = invoice.id;
                                                    }}
                                                >
                                                    <TableCell className="py-0" onClick={keep}>
                                                        <Checkbox
                                                            aria-label={`Select ${invoice.id}`}
                                                            checked={chosen.includes(invoice.id)}
                                                            onCheckedChange={on =>
                                                                toggle(invoice.id, on === true)
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {/* The number is the row's link to the invoice's own page. */}
                                                        <a
                                                            className="text-neutral-950 tabular-nums hover:underline"
                                                            href={`#${invoice.id}`}
                                                            onClick={keep}
                                                        >
                                                            {invoice.id}
                                                        </a>
                                                    </TableCell>
                                                    <TableCell className="font-normal text-neutral-700">
                                                        {invoice.customer}
                                                    </TableCell>
                                                    <TableCell
                                                        className="font-normal text-neutral-700 tabular-nums"
                                                        optional
                                                    >
                                                        {invoice.issued ? (
                                                            shortDate(invoice.issued)
                                                        ) : (
                                                            <span className="text-neutral-600">
                                                                Not issued
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-normal text-neutral-700 tabular-nums">
                                                        {invoice.due ? (
                                                            shortDate(invoice.due)
                                                        ) : (
                                                            <span className="text-neutral-600">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-0">
                                                        <Badge tone={statusTone[invoice.status]}>
                                                            {invoice.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {euro.format(invoice.amount)}
                                                    </TableCell>
                                                    <TableCell className="py-0" onClick={keep}>
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
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        duplicate(invoice)
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
                                pageCount > 1 && (
                                    <Pagination
                                        onPageChange={setPage}
                                        page={page}
                                        pageCount={pageCount}
                                        results={`Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, counts.All)} of ${counts.All}`}
                                    />
                                )
                            ) : filtered ? (
                                <EmptyState
                                    action={
                                        <Button onClick={clearFilters} variant="secondary">
                                            Clear the filters
                                        </Button>
                                    }
                                    description={`No ${view === 'All' ? '' : `${view.toLowerCase()} `}invoice matches this customer and issue date.`}
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
                                    icon={<Receipt {...icon} />}
                                    title={`No ${view.toLowerCase()} invoices`}
                                />
                            )}
                        </PageContent>
                    </div>
                    {chosen.length > 0 ? bulk : dock}
                </AppPanel>
            </AppShell>

            {/* Voiding cannot be undone, so it is confirmed, the primary named by its verb. */}
            <Dialog onOpenChange={open => !open && setVoiding(null)} open={voiding !== null}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Void {voiding?.id}?</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            {voiding
                                ? `${voiding.customer} will no longer be asked to pay ${euro.format(voiding.amount)}. A voided invoice cannot be brought back.`
                                : null}
                        </DialogDescription>
                    </DialogBody>
                    <DialogFooter>
                        <Button onClick={() => setVoiding(null)} variant="secondary">
                            Cancel
                        </Button>
                        <Button onClick={confirmVoid}>Void invoice</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PlanIndex;
