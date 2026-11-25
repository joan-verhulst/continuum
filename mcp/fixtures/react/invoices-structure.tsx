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
    Card,
    CardTitle,
    CardValue,
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    EmptyState,
    HeaderBar,
    NavItem,
    PageContent,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
    Separator,
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
    Tabs,
    TabsList,
    TabsTrigger,
    Toolbar,
    ToolbarButton,
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
    FileDown,
    House,
    Plus,
    Receipt,
    SearchX,
    Send,
    Settings,
    Users,
    X,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';

const icon = { strokeWidth: 2 } as const;

/* ---------- The data ---------- */

type Status = 'Draft' | 'Sent' | 'Overdue' | 'Paid';

type Invoice = {
    number: string;
    customer: string;
    /** Unset while the invoice is a draft: it has not been issued. */
    issued?: Date;
    due?: Date;
    amount: number;
    status: Status;
};

/** Status colours mean status: a draft is nothing yet, sent is information, overdue waits on the customer, paid is done. */
const statusTone: Record<Status, 'neutral' | 'primary' | 'warning' | 'success'> = {
    Draft: 'neutral',
    Sent: 'primary',
    Overdue: 'warning',
    Paid: 'success',
};

const views: ('All' | Status)[] = ['All', 'Draft', 'Sent', 'Overdue', 'Paid'];

const day = (month: number, date: number) => new Date(2026, month - 1, date);

const addDays = (date: Date, days: number) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** The six customers the brief names, then the six more it allows for. */
const customers = [
    'Harbour & Co',
    'Northwind',
    'Lumen Labs',
    'Atlas Freight',
    'Orbit Coffee',
    'Fieldwork Studio',
    'Marlow Books',
    'Pinecrest Dental',
    'Saltmarsh Films',
    'Tidewater Hotels',
    'Vela Architects',
    'Quarry Bakery',
];

/** The first page, as given: newest first. */
const firstPage: Invoice[] = [
    { number: 'INV-0142', customer: 'Harbour & Co', issued: day(11, 16), due: day(11, 30), amount: 2420, status: 'Sent' },
    { number: 'INV-0141', customer: 'Northwind', issued: day(11, 13), due: day(11, 27), amount: 1860, status: 'Sent' },
    { number: 'INV-0140', customer: 'Lumen Labs', issued: day(10, 21), due: day(11, 4), amount: 1150, status: 'Overdue' },
    { number: 'INV-0139', customer: 'Atlas Freight', issued: day(10, 19), due: day(11, 2), amount: 3200, status: 'Paid' },
    { number: 'INV-0138', customer: 'Harbour & Co', issued: day(10, 15), due: day(10, 29), amount: 2980, status: 'Paid' },
    { number: 'INV-0137', customer: 'Orbit Coffee', issued: day(10, 14), due: day(10, 28), amount: 640, status: 'Overdue' },
    { number: 'INV-0136', customer: 'Northwind', issued: day(10, 9), due: day(10, 23), amount: 1860, status: 'Paid' },
    { number: 'INV-0135', customer: 'Fieldwork Studio', amount: 4100, status: 'Draft' },
    { number: 'INV-0134', customer: 'Atlas Freight', issued: day(10, 2), due: day(10, 16), amount: 3200, status: 'Paid' },
    { number: 'INV-0133', customer: 'Lumen Labs', issued: day(9, 30), due: day(10, 14), amount: 980, status: 'Paid' },
];

/*
 * The other 38, filler so the pages and the views hold what the counts say: 2 more drafts, 10 more
 * sent, 2 more overdue and 24 more paid (Draft 3 · Sent 12 · Overdue 4 · Paid 29 in all).
 */
const fillerStatuses = Array.from({ length: 38 }, (_, i): Status => {
    if ([0, 2, 5, 8, 11, 13, 17, 20, 25, 28].includes(i)) return 'Sent';
    if ([3, 22].includes(i)) return 'Draft';
    if ([6, 16].includes(i)) return 'Overdue';
    return 'Paid';
});
const fillerAmounts = [1240, 2860, 760, 3480, 1920, 540, 2150, 4300, 1380, 980, 2640, 1720];

const filler: Invoice[] = fillerStatuses.map((status, i) => {
    const issued = addDays(day(9, 26), -i * 5);
    return {
        number: `INV-${String(132 - i).padStart(4, '0')}`,
        customer: customers[(i * 5 + 3) % customers.length] ?? 'Northwind',
        issued: status === 'Draft' ? undefined : issued,
        due: status === 'Draft' ? undefined : addDays(issued, 14),
        amount: fillerAmounts[i % fillerAmounts.length] ?? 1000,
        status,
    };
});

const allInvoices = [...firstPage, ...filler];

const PAGE_SIZE = 10;

const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

const numberOf = (invoice: Invoice) => Number(invoice.number.replace(/\D/g, ''));

/* ---------- The shell ---------- */

const places = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
    { id: 'settings', label: 'Settings', icon: <Settings {...icon} /> },
];

/** Kestrel's sidebar: its places and, at the foot, the studio with who is signed in. No create button. */
const KestrelSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo aria-label="Kestrel">
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

// The row opens on a click anywhere in it; the checkbox and the menu keep their clicks to themselves.
const keep = (event: MouseEvent) => event.stopPropagation();

/** The list as a CSV file, the columns the table shows. */
const downloadCsv = (rows: Invoice[]) => {
    const lines = [
        ['Invoice', 'Customer', 'Status', 'Issued', 'Due', 'Amount'],
        ...rows.map(row => [
            row.number,
            row.customer,
            row.status,
            row.issued ? row.issued.toISOString().slice(0, 10) : '',
            row.due ? row.due.toISOString().slice(0, 10) : '',
            row.amount.toFixed(2),
        ]),
    ];
    const csv = lines.map(line => line.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'invoices.csv';
    link.click();
    URL.revokeObjectURL(link.href);
};

/* ---------- The page ---------- */

/**
 * Invoices, an index: the status views in the dock beside "New invoice", the table's own bar
 * narrowing by customer and issue date, ten to a page. Selecting rows swaps the dock for the bar
 * of what can be done to them all; a row's menu duplicates or voids it.
 */
const InvoicesIndex = () => {
    const toast = useToast();
    const [invoices, setInvoices] = useState<Invoice[]>(allInvoices);
    const [view, setView] = useState<'All' | Status>('All');
    const [customer, setCustomer] = useState('any');
    const [issued, setIssued] = useState<DateRangeValue | undefined>();
    const [selected, setSelected] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [voiding, setVoiding] = useState<Invoice>();

    // The filters narrow the dock's counts too, so each view says what it would show.
    const matching = invoices.filter(
        invoice =>
            (customer === 'any' || invoice.customer === customer) &&
            (!issued ||
                (invoice.issued !== undefined &&
                    invoice.issued >= issued.from &&
                    invoice.issued <= issued.to)),
    );
    const rows = matching.filter(invoice => view === 'All' || invoice.status === view);
    const counts = Object.fromEntries(
        views.map(item => [
            item,
            matching.filter(invoice => item === 'All' || invoice.status === item).length,
        ]),
    );

    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const current = Math.min(page, pageCount);
    const first = (current - 1) * PAGE_SIZE;
    const shown = rows.slice(first, first + PAGE_SIZE);

    // A selection only holds what is on the page now: a row filtered or paged away leaves it.
    const chosen = selected.filter(number => shown.some(row => row.number === number));
    const chosenRows = shown.filter(row => chosen.includes(row.number));
    const unpaid = chosenRows.filter(row => row.status === 'Sent' || row.status === 'Overdue');
    const all = shown.length > 0 && chosen.length === shown.length;
    const some = chosen.length > 0 && !all;
    const filtered = customer !== 'any' || issued !== undefined;

    const toggle = (number: string, on: boolean) =>
        setSelected(on ? [...chosen, number] : chosen.filter(item => item !== number));
    const clearFilters = () => {
        setCustomer('any');
        setIssued(undefined);
        setPage(1);
    };
    const plural = (count: number) => (count === 1 ? '1 invoice' : `${count} invoices`);

    const sendReminders = () => {
        toast.add({ title: `Reminder sent for ${plural(unpaid.length)}` });
        setSelected([]);
    };

    // Marking paid can be undone, so it asks nothing first and offers the undo after.
    const markPaid = () => {
        const before = new Map(unpaid.map(row => [row.number, row.status]));
        setInvoices(list =>
            list.map(row => (before.has(row.number) ? { ...row, status: 'Paid' } : row)),
        );
        setSelected([]);
        toast.add({
            title: `${plural(before.size)} marked as paid`,
            actionProps: {
                children: 'Undo',
                onClick: () =>
                    setInvoices(list =>
                        list.map(row => {
                            const status = before.get(row.number);
                            return status ? { ...row, status } : row;
                        }),
                    ),
            },
        });
    };

    const downloadPdfs = () => {
        toast.add({ title: `Downloading ${plural(chosenRows.length)} as PDF` });
        setSelected([]);
    };

    // A copy starts as a draft at the top of the list, and can be taken back.
    const duplicate = (invoice: Invoice) => {
        const next = Math.max(...invoices.map(numberOf)) + 1;
        const number = `INV-${String(next).padStart(4, '0')}`;
        setInvoices(list => [
            { number, customer: invoice.customer, amount: invoice.amount, status: 'Draft' },
            ...list,
        ]);
        toast.add({
            title: `${invoice.number} duplicated as ${number}`,
            description: 'The copy is a draft, not yet sent.',
            actionProps: {
                children: 'Undo',
                onClick: () => setInvoices(list => list.filter(row => row.number !== number)),
            },
        });
    };

    // Voiding cannot be taken back, so it is confirmed first.
    const voidInvoice = (invoice: Invoice) => {
        setInvoices(list => list.filter(row => row.number !== invoice.number));
        setSelected(list => list.filter(number => number !== invoice.number));
        setVoiding(undefined);
        toast.add({ title: `${invoice.number} voided` });
    };

    // The list's views and its one primary action, at the panel's foot.
    const dock = (
        <BottomBar floating>
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
                <ToolbarButton disabled={unpaid.length === 0} onClick={sendReminders}>
                    <Send {...icon} />
                    Send reminder
                </ToolbarButton>
                <ToolbarButton disabled={unpaid.length === 0} onClick={markPaid}>
                    <CircleCheck {...icon} />
                    Mark as paid
                </ToolbarButton>
                <ToolbarButton onClick={downloadPdfs}>
                    <FileDown {...icon} />
                    Download PDF
                </ToolbarButton>
                <ToolbarButton aria-label="Clear the selection" onClick={() => setSelected([])}>
                    <X {...icon} />
                </ToolbarButton>
            </Toolbar>
        </BottomBar>
    );

    // What the reader narrows by besides status: the customer and the issue date.
    const toolbar = (
        <TableToolbar className={rows.length === 0 ? 'border-b-0' : undefined}>
            <Select
                onValueChange={value => {
                    setCustomer(String(value));
                    setPage(1);
                }}
                value={customer}
            >
                <SelectTrigger aria-label="Customer" size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                    <SelectItem value="any">All customers</SelectItem>
                    <SelectSeparator />
                    {[...customers].sort().map(name => (
                        <SelectItem key={name} value={name}>
                            {name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <DateRangePicker
                aria-label="Issue date"
                onValueChange={value => {
                    setIssued(value);
                    setPage(1);
                }}
                className="w-auto"
                placeholder="Any issue date"
                size="sm"
                value={issued}
            />
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
                                <BreadcrumbLink aria-label="Home" href="#">
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
                    <PageContent className="flex flex-col gap-10 pb-24" width="narrow">
                        {/* The counts are the dock's; the line says what the list holds. */}
                        <div className="flex @max-shell-compact/shell:flex-col @max-shell-compact/shell:items-start items-end justify-between gap-6">
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <h1 className="font-medium text-2xl text-neutral-950">Invoices</h1>
                                <p className="text-neutral-600 text-sm">
                                    Every invoice the studio has drafted or sent, newest first.
                                </p>
                            </div>
                            <div className="flex @max-shell-compact/shell:hidden shrink-0 items-center gap-2">
                                <Button onClick={() => downloadCsv(rows)} variant="secondary">
                                    <Download {...icon} />
                                    Export CSV
                                </Button>
                                <Button>
                                    <Plus {...icon} />
                                    New invoice
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardTitle>Overdue</CardTitle>
                                <CardValue>{counts.Overdue}</CardValue>
                            </Card>
                            <Card>
                                <CardTitle>Sent</CardTitle>
                                <CardValue>{counts.Sent}</CardValue>
                            </Card>
                            <Card>
                                <CardTitle>Paid</CardTitle>
                                <CardValue>{counts.Paid}</CardValue>
                            </Card>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Tabs
                                onValueChange={value => {
                                    setView(value as 'All' | Status);
                                    setPage(1);
                                }}
                                value={view}
                            >
                                <TabsList>
                                    {views.map(item => (
                                        <TabsTrigger key={item} value={item}>
                                            {item}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                            <Card className="p-4">
                            <Table toolbar={toolbar}>
                                {rows.length > 0 && (
                                    <>
                                        {/* On a narrow table the issue date hides: the number, the
                                            customer, the status, when it is due and how much are what
                                            a row is told apart and acted on by. */}
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-11 py-0">
                                                    <Checkbox
                                                        aria-label="Select every invoice on this page"
                                                        checked={all}
                                                        indeterminate={some}
                                                        onCheckedChange={() =>
                                                            setSelected(
                                                                all ? [] : shown.map(row => row.number),
                                                            )
                                                        }
                                                    />
                                                </TableHead>
                                                <TableHead className="w-32">Invoice</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead className="w-32">Status</TableHead>
                                                <TableHead className="w-32" optional>
                                                    Issued
                                                </TableHead>
                                                <TableHead className="w-32">Due</TableHead>
                                                <TableHead className="w-36 text-right">Amount</TableHead>
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
                                                        chosen.includes(invoice.number) || undefined
                                                    }
                                                    key={invoice.number}
                                                >
                                                    {/* The box, the badge and the menu button sit in no vertical padding, so the row keeps its 41. */}
                                                    <TableCell className="py-0" onClick={keep}>
                                                        <Checkbox
                                                            aria-label={`Select ${invoice.number}`}
                                                            checked={chosen.includes(invoice.number)}
                                                            onCheckedChange={on =>
                                                                toggle(invoice.number, on === true)
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {/* The number is the row's link to the invoice's own page. */}
                                                        <button
                                                            className="cursor-pointer text-neutral-950 tabular-nums hover:underline"
                                                            onClick={keep}
                                                            type="button"
                                                        >
                                                            {invoice.number}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="font-normal text-neutral-700">
                                                        {invoice.customer}
                                                    </TableCell>
                                                    <TableCell className="py-0">
                                                        <Badge tone={statusTone[invoice.status]}>
                                                            {invoice.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell
                                                        className="font-normal text-neutral-700 tabular-nums"
                                                        optional
                                                    >
                                                        {invoice.issued ? (
                                                            shortDate.format(invoice.issued)
                                                        ) : (
                                                            <span className="text-neutral-600">
                                                                Not issued
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-normal text-neutral-700 tabular-nums">
                                                        {invoice.due ? (
                                                            shortDate.format(invoice.due)
                                                        ) : (
                                                            <span className="text-neutral-600">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {money.format(invoice.amount)}
                                                    </TableCell>
                                                    <TableCell className="py-0" onClick={keep}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                render={
                                                                    <Button
                                                                        aria-label={`Actions for ${invoice.number}`}
                                                                        size="icon-sm"
                                                                        variant="ghost"
                                                                    />
                                                                }
                                                            >
                                                                <EllipsisVertical {...icon} />
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => duplicate(invoice)}
                                                                >
                                                                    <Copy {...icon} />
                                                                    Duplicate
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => setVoiding(invoice)}
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
                            </Card>

                            {rows.length > 0 ? (
                                rows.length > PAGE_SIZE && (
                                    <Pagination
                                        onPageChange={setPage}
                                        page={current}
                                        pageCount={pageCount}
                                        results={`Showing ${first + 1}–${first + shown.length} of ${rows.length}`}
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
                                    title={
                                        view === 'All'
                                            ? 'No invoices'
                                            : `No ${view.toLowerCase()} invoices`
                                    }
                                />
                            )}
                        </div>
                    </PageContent>
                </div>

                {chosen.length > 0 ? bulk : dock}

                <Dialog
                    onOpenChange={open => {
                        if (!open) setVoiding(undefined);
                    }}
                    open={Boolean(voiding)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Void {voiding?.number}?</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <DialogDescription>
                                The invoice to {voiding?.customer} for{' '}
                                {voiding ? money.format(voiding.amount) : ''} is cancelled for good and
                                leaves the list. This cannot be undone.
                            </DialogDescription>
                        </DialogBody>
                        <DialogFooter>
                            <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                            <Button onClick={() => voiding && voidInvoice(voiding)}>Void invoice</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppPanel>
        </AppShell>
    );
};

export default InvoicesIndex;
