import {
    ActivityItem,
    ActivityList,
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    cn,
    DescriptionItem,
    DescriptionList,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    focusRing,
    HeaderBar,
    Kbd,
    NavGroup,
    NavItem,
    Notice,
    PageContent,
    Sheet,
    SheetArea,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetSection,
    SheetTitle,
    Sidebar,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
    useNotice,
} from 'continuum';
import {
    ArrowLeft,
    ArrowRight,
    CircleX,
    Eye,
    FilePlus,
    FileText,
    Folder,
    GripHorizontal,
    History,
    House,
    List,
    PenLine,
    Plus,
    Send,
    Settings,
    SquarePen,
    Trash2,
    Users,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { AccountFooter, SectionTitle } from './shared';

type Line = { id: number; item: string; description: string; qty: number; price: number };

const initialLines: Line[] = [
    {
        id: 1,
        item: 'WEB-001',
        description:
            'Website design and front-end development, including responsive layouts and a component library',
        qty: 1,
        price: 4500,
    },
    {
        id: 2,
        item: 'BRD-002',
        description: 'Brand identity package with logo design, colour palette and typography guide',
        qty: 2,
        price: 1250,
    },
];

const TAX = 0.21;
const DISCOUNT = 0.1;
const EUR_PER_USD = 0.92;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

const history = [
    {
        tone: 'error',
        icon: <CircleX strokeWidth={2} />,
        title: 'Acme Corp rejected the invoice',
        time: '11/03/2025 16:08',
        status: 'Rejected',
    },
    {
        tone: 'neutral',
        icon: <Eye strokeWidth={2} />,
        title: 'Acme Corp viewed the invoice',
        time: '11/03/2025 15:51',
        status: 'Viewed',
    },
    {
        tone: 'neutral',
        icon: <Send strokeWidth={2} />,
        title: 'Invoice sent to Acme Corp',
        time: '10/03/2025 09:12',
        status: 'Sent',
    },
    {
        tone: 'warning',
        icon: <FileText strokeWidth={2} />,
        title: 'Status set to Open',
        time: '10/03/2025 09:10',
        status: 'Open',
    },
    {
        tone: 'primary',
        icon: <PenLine strokeWidth={2} />,
        title: 'Invoice saved as draft',
        time: '09/03/2025 17:34',
        status: 'Draft',
    },
    {
        tone: 'neutral',
        icon: <FilePlus strokeWidth={2} />,
        title: 'Invoice created by Jane Cooper',
        time: '09/03/2025 17:02',
        status: 'Draft',
    },
] as const;

const clients = [
    { id: 'orchard', icon: '🍏', label: 'Orchard & Co' },
    { id: 'lumen', icon: '💡', label: 'Lumen Labs' },
    { id: 'tide', icon: '🌊', label: 'Tideline Travel' },
];

const InvoiceSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Wallet strokeWidth={2} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Payments">
            <NavItem icon={<House strokeWidth={2} />} trailing={<Kbd>H</Kbd>}>
                Home
            </NavItem>
            <NavItem active icon={<FileText strokeWidth={2} />}>
                Invoices
            </NavItem>
            <NavItem icon={<Users strokeWidth={2} />}>Payees</NavItem>
            <NavItem icon={<History strokeWidth={2} />}>Payment history</NavItem>
            <NavItem icon={<Settings strokeWidth={2} />} trailing={<Kbd>S</Kbd>}>
                Settings
            </NavItem>
        </SidebarGroup>
        <SidebarGroup aria-label="Clients" label="Clients">
            <NavGroup defaultOpen icon="🏛️" label="Harbour Street Studio">
                <NavItem icon={<FileText strokeWidth={2} />} variant="inset">
                    Invoices
                </NavItem>
                <NavItem icon={<FilePlus strokeWidth={2} />} variant="inset">
                    Quotes
                </NavItem>
                <NavItem icon={<History strokeWidth={2} />} variant="inset">
                    Payments
                </NavItem>
            </NavGroup>
            {clients.map(client => (
                <NavGroup icon={client.icon} key={client.id} label={client.label}>
                    <NavItem icon={<FileText strokeWidth={2} />} variant="inset">
                        Invoices
                    </NavItem>
                    <NavItem icon={<History strokeWidth={2} />} variant="inset">
                        Payments
                    </NavItem>
                </NavGroup>
            ))}
            <NavItem variant="project" icon={<Folder strokeWidth={2} />}>
                All clients
            </NavItem>
        </SidebarGroup>
        <AccountFooter
            avatar={<Avatar alt="" size={36} fallback="JC" />}
            name="Jane Cooper"
            plan="jane@northwind.studio"
        />
    </Sidebar>
);

/** Invoice editor (Stone, 2025, dark): invoice details, lines, and the status-history sheet. */
/** `sheet` opens the status history at once, as the screen was drawn; a still frame leaves it closed. */
export const InvoiceEditor = ({ sheet = true }: { sheet?: boolean }) => {
    const [historyOpen, setHistoryOpen] = useState(sheet);
    const [lines, setLines] = useState(initialLines);
    // The line waiting on its delete confirmation, if any.
    const [deleting, setDeleting] = useState<Line>();
    const { notice, show } = useNotice();

    const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price * (1 + TAX), 0);
    const discount = subtotal * DISCOUNT;
    const total = subtotal - discount;
    // The sums under the lines: what the lines come to, the fees, the discount. The total follows.
    const summary = [
        { label: 'Subtotal', rate: null, usd: subtotal },
        { label: 'Fees', rate: null, usd: 0 },
        { label: 'Discount', rate: `${DISCOUNT * 100}%`, usd: -discount },
    ];

    const addLine = () =>
        setLines(current => [
            ...current,
            {
                id: Math.max(0, ...current.map(line => line.id)) + 1,
                item: `SUP-00${current.length + 1}`,
                description: 'Monthly support and maintenance retainer',
                qty: 1,
                price: 800,
            },
        ]);

    return (
        <AppShell className="h-full min-h-0 min-w-7xl">
            <InvoiceSidebar />
            <AppPanel>
                <HeaderBar className="pl-0">
                    <div className="flex h-full items-center">
                        <div className="flex items-center gap-1.5 px-3">
                            <Button aria-label="Back" size="icon-sm" variant="ghost">
                                <ArrowLeft strokeWidth={2} />
                            </Button>
                            <Button aria-label="Forward" size="icon-sm" variant="ghost">
                                <ArrowRight strokeWidth={2} />
                            </Button>
                        </div>
                        <Breadcrumb className="pl-4">
                            <BreadcrumbList className="text-sm">
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#">
                                        <BreadcrumbHome />
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#">Invoices</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>INV-0412</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <Button
                        aria-pressed={historyOpen}
                        onClick={() => setHistoryOpen(open => !open)}
                        variant="ghost"
                    >
                        <History strokeWidth={2} />
                        Status history
                    </Button>
                    <Notice {...notice} />
                </HeaderBar>

                <SheetArea className="min-h-0 flex-1 overflow-auto">
                    <PageContent className="flex flex-col gap-8 pb-16" width="wide">
                        {/* An object being edited keeps its actions in the title row; a save shows as a notice. */}
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex max-w-140 flex-col gap-2">
                                <h1 className="font-medium text-lg text-neutral-950">
                                    Edit invoice INV-0412
                                </h1>
                                <p className="text-neutral-600 text-xs">
                                    Follow the invoice from draft to payment. Every change to its
                                    details or lines is logged in the status history.
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button onClick={() => setLines(initialLines)} variant="secondary">
                                    Discard changes
                                </Button>
                                <Button onClick={() => show('Saved')}>Save invoice</Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-panel border border-neutral-200 p-4 font-normal text-xs">
                            <span className="text-neutral-600">Invoice created</span>
                            <span className="text-neutral-950">09/03/2025</span>
                        </div>

                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4">
                                <SectionTitle size="sm" title="Invoice details" />
                                <Button variant="secondary">
                                    Edit invoice details
                                    <SquarePen strokeWidth={2} />
                                </Button>
                            </div>
                            <DescriptionList>
                                <DescriptionItem term="Status">
                                    <Badge tone="error">Rejected</Badge>
                                    <button
                                        className={cn(
                                            'ml-auto cursor-pointer rounded-xs text-neutral-600 underline underline-offset-2 hover:text-neutral-950',
                                            focusRing,
                                        )}
                                        onClick={() => setHistoryOpen(true)}
                                        type="button"
                                    >
                                        View status history
                                    </button>
                                </DescriptionItem>
                                <DescriptionItem className="min-h-22.5" term="Rejection message">
                                    The breakdown of the development work is not detailed enough.
                                    Please list each service separately with its hours, and adjust
                                    the due date to the end of the month.
                                </DescriptionItem>
                            </DescriptionList>
                            <DescriptionList>
                                <DescriptionItem term="Receiver">Acme Corp</DescriptionItem>
                                <DescriptionItem term="Subject">
                                    Website development services
                                </DescriptionItem>
                                <DescriptionItem term="Due date">11/03/2025</DescriptionItem>
                                <DescriptionItem term="Currency">
                                    <Badge>USD</Badge>
                                </DescriptionItem>
                                <DescriptionItem term="Discount">10%</DescriptionItem>
                            </DescriptionList>
                        </section>

                        <section className="flex flex-col gap-4">
                            <SectionTitle size="sm" title="Invoice lines" />
                            <Table className="table-fixed">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <span className="sr-only">Reorder</span>
                                        </TableHead>
                                        <TableHead className="w-64">Item</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-16 text-center">Qty</TableHead>
                                        <TableHead className="w-32">Unit price</TableHead>
                                        <TableHead className="w-32">Tax</TableHead>
                                        <TableHead className="w-32">
                                            <span className="flex items-center gap-2">
                                                Total <Badge>USD</Badge>
                                            </span>
                                        </TableHead>
                                        <TableHead className="w-32">
                                            <span className="flex items-center gap-2">
                                                Total <Badge>EUR</Badge>
                                            </span>
                                        </TableHead>
                                        <TableHead className="w-14">
                                            <span className="sr-only">Delete</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.map(line => {
                                        const lineTotal = line.qty * line.price * (1 + TAX);
                                        return (
                                            <TableRow key={line.id}>
                                                <TableCell className="cursor-grab text-neutral-600">
                                                    <GripHorizontal
                                                        aria-hidden
                                                        className="size-4"
                                                        strokeWidth={2}
                                                    />
                                                </TableCell>
                                                <TableCell>{line.item}</TableCell>
                                                <TableCell className="truncate">
                                                    {line.description}
                                                </TableCell>
                                                <TableCell className="text-center" numeric>
                                                    {line.qty}
                                                </TableCell>
                                                <TableCell numeric align="left">
                                                    {usd.format(line.price)}
                                                </TableCell>
                                                <TableCell numeric align="left">
                                                    {TAX * 100}%
                                                </TableCell>
                                                <TableCell numeric align="left">
                                                    {usd.format(lineTotal)}
                                                </TableCell>
                                                <TableCell numeric align="left">
                                                    {eur.format(lineTotal * EUR_PER_USD)}
                                                </TableCell>
                                                <TableCell className="py-0" align="right">
                                                    <Button
                                                        aria-label={`Delete ${line.item}`}
                                                        className="text-error-500 hover:text-error-600"
                                                        onClick={() => setDeleting(line)}
                                                        size="icon-sm"
                                                        variant="ghost"
                                                    >
                                                        <Trash2 strokeWidth={2} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    <TableRow>
                                        <TableCell className="py-2" colSpan={9}>
                                            <Button
                                                className="-ml-2 gap-3 px-2 text-neutral-950"
                                                onClick={addLine}
                                                variant="ghost"
                                            >
                                                <Plus strokeWidth={2} />
                                                Add invoice line
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableHead colSpan={5}>
                                            <span className="sr-only">Summary</span>
                                        </TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>
                                            <span className="flex items-center gap-2">
                                                Total <Badge>USD</Badge>
                                            </span>
                                        </TableHead>
                                        <TableHead>
                                            <span className="flex items-center gap-2">
                                                Total <Badge>EUR</Badge>
                                            </span>
                                        </TableHead>
                                        <TableHead />
                                    </TableRow>
                                    {summary.map(row => (
                                        <TableRow key={row.label}>
                                            <TableCell className="pl-4" colSpan={5}>
                                                {row.label}
                                            </TableCell>
                                            <TableCell numeric align="left">
                                                {row.rate}
                                            </TableCell>
                                            <TableCell numeric align="left">
                                                {usd.format(row.usd)}
                                            </TableCell>
                                            <TableCell numeric align="left">
                                                {eur.format(row.usd * EUR_PER_USD)}
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    ))}
                                    {/* The total, set off from the sums above by a hairline. */}
                                    <TableRow className="[&>td]:border-neutral-200 [&>td]:border-t [&>td]:pt-3 [&>td]:pb-4">
                                        <TableCell className="pl-4" colSpan={6}>
                                            Total
                                        </TableCell>
                                        <TableCell numeric align="left">
                                            {usd.format(total)}
                                        </TableCell>
                                        <TableCell numeric align="left">
                                            {eur.format(total * EUR_PER_USD)}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </section>
                    </PageContent>
                    <Sheet onOpenChange={setHistoryOpen} open={historyOpen}>
                        <SheetContent initialFocus={false}>
                            <SheetHeader icon={<List strokeWidth={2} />}>
                                <SheetTitle>Status history</SheetTitle>
                            </SheetHeader>
                            <SheetBody>
                                <SheetSection className="flex items-center justify-between gap-4 text-xs">
                                    <span className="text-neutral-600">Current status</span>
                                    <Badge tone="error">Rejected</Badge>
                                </SheetSection>
                                <SheetSection>
                                    <ActivityList>
                                        {history.map(entry => (
                                            <ActivityItem
                                                action={<Badge>{entry.status}</Badge>}
                                                icon={entry.icon}
                                                key={entry.title}
                                                time={entry.time}
                                                title={entry.title}
                                                tone={entry.tone}
                                            />
                                        ))}
                                    </ActivityList>
                                </SheetSection>
                            </SheetBody>
                        </SheetContent>
                    </Sheet>
                </SheetArea>
                <Dialog
                    onOpenChange={open => {
                        if (!open) setDeleting(undefined);
                    }}
                    open={Boolean(deleting)}
                >
                    <DialogContent className="w-[min(420px,calc(100vw-32px))]">
                        <DialogHeader>
                            <DialogTitle>Delete line {deleting?.item}?</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <DialogDescription>
                                The line and its amount come off the invoice once it is saved.
                            </DialogDescription>
                        </DialogBody>
                        <DialogFooter>
                            <DialogClose render={<Button variant="secondary" />}>
                                Cancel
                            </DialogClose>
                            <Button
                                onClick={() => {
                                    setLines(current =>
                                        current.filter(line => line.id !== deleting?.id),
                                    );
                                    setDeleting(undefined);
                                }}
                            >
                                Delete line
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppPanel>
        </AppShell>
    );
};
