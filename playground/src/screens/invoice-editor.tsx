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
    focusRing,
    HeaderBar,
    Kbd,
    MetaRow,
    NavGroup,
    NavItem,
    Separator,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
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
} from 'personal-design-system';
import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { AccountFooter, SectionTitle } from './shared';

const HEADER_BAR = 54;
const SHEET_GAP = 12;

/**
 * The sheet is fixed to the viewport, but the screen is drawn with it inside
 * the panel, below the header bar. When the screen sits in a scrolling frame
 * rather than filling the window, pin the sheet to the visible part of the panel.
 */
const usePanelInset = () => {
    const ref = useRef<HTMLElement>(null);
    const [inset, setInset] = useState<CSSProperties>();

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;

        const update = () => {
            const { clientWidth, clientHeight } = document.documentElement;
            const panel = node.getBoundingClientRect();
            const frame = node.closest('[data-screen-frame]')?.getBoundingClientRect();
            const top = Math.max(panel.top + HEADER_BAR, frame?.top ?? 0, 0) + SHEET_GAP;
            const right = Math.min(panel.right, frame?.right ?? clientWidth, clientWidth);
            const bottom = Math.min(panel.bottom, frame?.bottom ?? clientHeight, clientHeight);
            setInset({
                top,
                right: clientWidth - right + SHEET_GAP,
                bottom: clientHeight - bottom + SHEET_GAP,
                visibility: bottom - top < 160 ? 'hidden' : undefined,
            });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);
        window.addEventListener('scroll', update, { capture: true, passive: true });
        window.addEventListener('resize', update);
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', update, { capture: true });
            window.removeEventListener('resize', update);
        };
    }, []);

    return [ref, inset] as const;
};

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
        icon: <CircleX strokeWidth={1.5} />,
        title: 'Acme Corp rejected the invoice',
        time: '11/03/2025 16:08',
        status: 'Rejected',
    },
    {
        tone: 'neutral',
        icon: <Eye strokeWidth={1.5} />,
        title: 'Acme Corp viewed the invoice',
        time: '11/03/2025 15:51',
        status: 'Viewed',
    },
    {
        tone: 'neutral',
        icon: <Send strokeWidth={1.5} />,
        title: 'Invoice sent to Acme Corp',
        time: '10/03/2025 09:12',
        status: 'Sent',
    },
    {
        tone: 'warning',
        icon: <FileText strokeWidth={1.5} />,
        title: 'Status set to Open',
        time: '10/03/2025 09:10',
        status: 'Open',
    },
    {
        tone: 'primary',
        icon: <PenLine strokeWidth={1.5} />,
        title: 'Invoice saved as draft',
        time: '09/03/2025 17:34',
        status: 'Draft',
    },
    {
        tone: 'neutral',
        icon: <FilePlus strokeWidth={1.5} />,
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
        <SidebarGroup aria-label="Payments" divided>
            <NavItem icon={<Plus strokeWidth={1.5} />} variant="primary">
                New invoice
            </NavItem>
            <NavItem icon={<House strokeWidth={1.5} />} trailing={<Kbd>H</Kbd>}>
                Home
            </NavItem>
            <NavItem active icon={<FileText strokeWidth={1.5} />}>
                Invoices
            </NavItem>
            <NavItem icon={<Users strokeWidth={1.5} />}>Payees</NavItem>
            <NavItem icon={<History strokeWidth={1.5} />}>Payment history</NavItem>
            <NavItem icon={<Settings strokeWidth={1.5} />} trailing={<Kbd>S</Kbd>}>
                Settings
            </NavItem>
        </SidebarGroup>
        <SidebarGroup aria-label="Clients" label="Clients">
            <NavGroup defaultOpen icon="🏛️" label="Harbour Street Studio">
                <NavItem icon={<FileText strokeWidth={1.5} />} variant="inset">
                    Invoices
                </NavItem>
                <NavItem icon={<FilePlus strokeWidth={1.5} />} variant="inset">
                    Quotes
                </NavItem>
                <NavItem icon={<History strokeWidth={1.5} />} variant="inset">
                    Payments
                </NavItem>
            </NavGroup>
            {clients.map(client => (
                <NavGroup icon={client.icon} key={client.id} label={client.label}>
                    <NavItem icon={<FileText strokeWidth={1.5} />} variant="inset">
                        Invoices
                    </NavItem>
                    <NavItem icon={<History strokeWidth={1.5} />} variant="inset">
                        Payments
                    </NavItem>
                </NavGroup>
            ))}
            <NavItem variant="project" icon={<Folder strokeWidth={1.5} />}>
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
export const InvoiceEditor = () => {
    const [historyOpen, setHistoryOpen] = useState(true);
    const [lines, setLines] = useState(initialLines);
    const [panelRef, sheetInset] = usePanelInset();

    const subtotal = lines.reduce((sum, line) => sum + line.qty * line.price, 0);
    const total = subtotal * (1 + TAX) * (1 - DISCOUNT);

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
        <AppShell className="h-full min-h-0 min-w-[1280px]">
            <InvoiceSidebar />
            <AppPanel ref={panelRef}>
                <HeaderBar className="pl-0">
                    <div className="flex h-full items-center">
                        <div className="flex items-center gap-1.5 px-3">
                            <Button aria-label="Back" size="icon-sm" variant="ghost">
                                <ArrowLeft strokeWidth={1.5} />
                            </Button>
                            <Button aria-label="Forward" size="icon-sm" variant="ghost">
                                <ArrowRight strokeWidth={1.5} />
                            </Button>
                        </div>
                        <Separator className="-my-2 h-[54px]" orientation="vertical" />
                        <Breadcrumb className="pl-4">
                            <BreadcrumbList className="text-sm">
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#">
                                        <BreadcrumbHome />
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="#">Payments</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Batch #12345</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <Button
                        aria-pressed={historyOpen}
                        onClick={() => setHistoryOpen(open => !open)}
                        variant="ghost"
                    >
                        <History strokeWidth={1.5} />
                        Status history
                    </Button>
                </HeaderBar>

                <div className="min-h-0 flex-1 overflow-auto">
                    <div className="flex flex-col gap-8 px-32 pt-16 pb-16">
                        <div className="flex max-w-[560px] flex-col gap-2">
                            <h1 className="font-medium text-lg text-neutral-950">
                                Edit invoice INV-0412
                            </h1>
                            <p className="text-neutral-600 text-xs">
                                Follow the invoice from draft to payment. Every change to its
                                details or lines is logged in the status history.
                            </p>
                        </div>

                        <MetaRow label="Invoice created" value="09/03/2025" />

                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4">
                                <SectionTitle size="sm" title="Invoice details" />
                                <Button variant="secondary">
                                    Edit invoice details
                                    <SquarePen strokeWidth={1.5} />
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
                                <DescriptionItem className="min-h-[90px]" term="Rejection message">
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
                                    <Badge>EUR</Badge>
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
                                        <TableHead className="w-28">Item</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-16">Qty</TableHead>
                                        <TableHead className="w-32">Unit price</TableHead>
                                        <TableHead className="w-20">Tax</TableHead>
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
                                            <span className="sr-only">Actions</span>
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
                                                        strokeWidth={1.5}
                                                    />
                                                </TableCell>
                                                <TableCell>{line.item}</TableCell>
                                                <TableCell className="truncate">
                                                    {line.description}
                                                </TableCell>
                                                <TableCell numeric align="left">
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
                                                        onClick={() =>
                                                            setLines(current =>
                                                                current.filter(
                                                                    l => l.id !== line.id,
                                                                ),
                                                            )
                                                        }
                                                        size="icon-sm"
                                                        variant="ghost"
                                                    >
                                                        <Trash2 strokeWidth={1.5} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    <TableRow>
                                        <TableCell className="py-1" colSpan={9}>
                                            <Button
                                                className="-ml-2 px-2 text-neutral-950"
                                                onClick={addLine}
                                                variant="ghost"
                                            >
                                                <Plus strokeWidth={1.5} />
                                                Add invoice line
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="text-neutral-600" colSpan={5}>
                                            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                                        </TableCell>
                                        <TableCell numeric align="left">
                                            −{DISCOUNT * 100}%
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
                    </div>
                </div>
            </AppPanel>

            <Sheet onOpenChange={setHistoryOpen} open={historyOpen}>
                <SheetContent
                    aria-describedby={undefined}
                    onOpenAutoFocus={event => event.preventDefault()}
                    style={sheetInset}
                >
                    <SheetHeader icon={<List strokeWidth={1.5} />}>
                        <SheetTitle>Status history</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                        <div className="flex items-center justify-between gap-4 border-neutral-200 border-b px-5 py-4 text-xs">
                            <span className="text-neutral-600">Current status</span>
                            <Badge tone="error">Rejected</Badge>
                        </div>
                        <ActivityList className="p-5">
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
                    </SheetBody>
                </SheetContent>
            </Sheet>
        </AppShell>
    );
};
