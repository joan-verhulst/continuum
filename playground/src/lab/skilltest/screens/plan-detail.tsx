/*
 * The plan (SKILL.md, Building something, step 3):
 * - Purpose: someone at Kestrel Studio opens Harbour & Co to see where the account stands (what is owed,
 *   what has been invoiced) and to invoice them or send them their statement.
 * - Rank: lead the money standing (outstanding €2,420, 1 invoice due 30 Nov); supporting invoiced this
 *   year, average days to pay, the notes (they change how the next invoice is made), the invoices;
 *   look-up the billing facts, the contacts, the recent activity. Actions: primary New invoice; secondary
 *   Send statement; rare Edit customer and Archive customer, behind the ellipsis.
 * - Kind: detail (default, 896): one column, the facets Overview · Invoices · Contacts as line tabs,
 *   since there is nothing to commit and each tab is short enough to keep them in sight.
 * - Order: title row (name, status, meta; actions) › tabs › Overview: the three figures, notes, details,
 *   recent activity · Invoices: the six in a ruled table · Contacts: the three in a ruled table.
 */

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
    Card,
    CardTitle,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    HeaderBar,
    HeaderBarNotice,
    NavItem,
    PageContent,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsContent,
    TabsCount,
    TabsList,
    TabsTrigger,
    useNotice,
    useToast,
} from '@contui/ui';
import {
    Archive,
    Bird,
    ChartColumn,
    CircleCheck,
    EllipsisVertical,
    House,
    Pencil,
    Receipt,
    Send,
    Settings,
    UserPlus,
    Users,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

const icon = { strokeWidth: 2 } as const;

/* ---------- The content, as given ---------- */

const places = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
    { id: 'settings', label: 'Settings', icon: <Settings {...icon} /> },
];

type Invoice = {
    number: string;
    amount: string;
    date: string;
    status: 'Sent' | 'Paid';
};

const invoices: Invoice[] = [
    { number: 'INV-0142', amount: '€2,420.00', date: 'Sent 16 Nov, due 30 Nov', status: 'Sent' },
    { number: 'INV-0131', amount: '€3,100.00', date: 'Paid 2 Nov', status: 'Paid' },
    { number: 'INV-0118', amount: '€2,980.00', date: 'Paid 4 Oct', status: 'Paid' },
    { number: 'INV-0104', amount: '€3,250.00', date: 'Paid 6 Sep', status: 'Paid' },
    { number: 'INV-0093', amount: '€2,600.00', date: 'Paid 5 Aug', status: 'Paid' },
    { number: 'INV-0081', amount: '€4,250.00', date: 'Paid 8 Jul', status: 'Paid' },
];

const contacts = [
    { name: 'Elena Varga', initials: 'EV', role: 'Finance lead', email: 'elena@harbour.co' },
    { name: 'Tom de Wit', initials: 'TW', role: 'Studio manager', email: 'tom@harbour.co' },
    { name: 'Priya Shah', initials: 'PS', role: 'Accounts payable', email: 'ap@harbour.co' },
];

const notes = [
    {
        text: 'Prefers invoices on the 15th; PO number required since October.',
        by: 'Maya Chen',
        date: '3 Oct',
    },
    {
        text: 'Asked about a yearly retainer — follow up in January.',
        by: 'Joan Verhulst',
        date: '12 Nov',
    },
];

const facts: { term: string; value: ReactNode }[] = [
    { term: 'Billing email', value: 'accounts@harbour.co' },
    { term: 'Payment terms', value: 'Net 14' },
    { term: 'Currency', value: 'EUR' },
    { term: 'VAT number', value: 'NL 8231.44.019.B01' },
    { term: 'Address', value: 'Keizersgracht 221, 1016 DV Amsterdam' },
    {
        term: 'Account owner',
        value: (
            <>
                <Avatar alt="Maya Chen" fallback="MC" shape="round" size={24} />
                Maya Chen
            </>
        ),
    },
];

const activity = [
    { icon: <Send {...icon} />, title: 'INV-0142 sent', time: 'Today, 10:24' },
    {
        icon: <CircleCheck {...icon} />,
        title: 'INV-0131 paid',
        time: '2 Nov',
        tone: 'success' as const,
    },
    { icon: <UserPlus {...icon} />, title: 'Contact Priya Shah added', time: '20 Oct' },
];

/* ---------- The shell ---------- */

/** The places of Kestrel; the sidebar holds no create action, the page that creates owns it. */
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
                    active={place.id === 'customers'}
                    aria-current={place.id === 'customers' ? 'page' : undefined}
                    icon={place.icon}
                    key={place.id}
                >
                    {place.label}
                </NavItem>
            ))}
        </SidebarGroup>
        {/* One workspace, so the footer account names it, with who is signed in under it. */}
        <SidebarFooter>
            <SidebarAccount
                avatar={<Avatar alt="Kestrel Studio" fallback="KS" size={36} />}
                name="Kestrel Studio"
                detail="Joan Verhulst"
            />
        </SidebarFooter>
    </Sidebar>
);

/* ---------- The page ---------- */

export default function PlanDetail() {
    const toast = useToast();
    const { notice, show } = useNotice();
    const [archived, setArchived] = useState(false);
    const [statementOpen, setStatementOpen] = useState(false);

    // Archiving can be taken back, so it happens at once and the toast offers Undo; no dialog first.
    const archive = () => {
        setArchived(true);
        toast.add({
            title: 'Harbour & Co archived',
            description: 'It no longer shows under Customers.',
            actionProps: { children: 'Undo', onClick: () => setArchived(false) },
        });
    };

    // A statement is an email: once sent it cannot be called back, so it is confirmed first, and
    // having nothing to undo, it is told by a notice rather than a toast.
    const sendStatement = () => {
        setStatementOpen(false);
        show('Statement sent');
    };

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
                                <BreadcrumbLink href="#">Customers</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Harbour &amp; Co</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <HeaderBarNotice {...notice} />
                </HeaderBar>

                <div className="min-h-0 flex-1 overflow-auto">
                    <PageContent className="flex flex-col gap-10 pb-24" width="default">
                        {/* The title row: who it is, then what can be done with it. On a phone it
                            stacks and the secondary hides; the menu stays, as it holds what has no button. */}
                        <div className="flex @max-shell-compact/shell:flex-col items-start justify-between @max-shell-compact/shell:gap-4 gap-6">
                            <div className="flex min-w-0 max-w-full items-center gap-4">
                                <Avatar alt="Harbour & Co" fallback="HC" size={36} />
                                <div className="flex min-w-0 flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <h1 className="truncate font-medium text-2xl text-neutral-950">
                                            Harbour &amp; Co
                                        </h1>
                                        {archived ? (
                                            <Badge tone="neutral">Archived</Badge>
                                        ) : (
                                            <Badge tone="success">Active</Badge>
                                        )}
                                    </div>
                                    <p className="truncate text-neutral-600 text-sm">
                                        harbour.co · A customer since March 2023
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    className="@max-shell-compact/shell:hidden"
                                    onClick={() => setStatementOpen(true)}
                                    variant="secondary"
                                >
                                    Send statement
                                </Button>
                                <Button>New invoice</Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <Button
                                                aria-label="More actions"
                                                size="icon"
                                                variant="ghost"
                                            />
                                        }
                                    >
                                        <EllipsisVertical {...icon} />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Pencil {...icon} />
                                            Edit customer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled={archived} onClick={archive}>
                                            <Archive {...icon} />
                                            Archive customer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Three facets, each with content of its own and nothing to commit: line
                            tabs, not the dock. */}
                        <Tabs className="gap-10" defaultValue="overview">
                            <TabsList>
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="invoices">
                                    Invoices
                                    <TabsCount>{invoices.length}</TabsCount>
                                </TabsTrigger>
                                <TabsTrigger value="contacts">
                                    Contacts
                                    <TabsCount>{contacts.length}</TabsCount>
                                </TabsTrigger>
                            </TabsList>

                            {/* One column: the figures, then the notes that shape the next invoice,
                                the facts to look up, and what happened last. */}
                            <TabsContent className="flex flex-col gap-10" value="overview">
                                <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
                                    <StatCard
                                        label="Outstanding"
                                        note="1 invoice, due 30 Nov"
                                        value="€2,420"
                                    />
                                    <StatCard label="Invoiced this year" value="€18,600" />
                                    <StatCard label="Average days to pay" value="11" />
                                </div>

                                <Card layout="list">
                                    <CardTitle>Notes</CardTitle>
                                    <ul className="flex flex-col gap-4">
                                        {notes.map(note => (
                                            <li className="flex flex-col gap-1" key={note.text}>
                                                <p className="text-neutral-950 text-xs">
                                                    {note.text}
                                                </p>
                                                <p className="text-neutral-600 text-xs">
                                                    {note.by} · {note.date}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>

                                {/* Each label over its value, so the pair reads together at this width. */}
                                <Card layout="list">
                                    <CardTitle>Details</CardTitle>
                                    <dl className="grid @max-shell-compact/shell:grid-cols-2 grid-cols-3 gap-x-6 gap-y-5">
                                        {facts.map(fact => (
                                            <div
                                                className="flex min-w-0 flex-col gap-1.5"
                                                key={fact.term}
                                            >
                                                <dt className="text-neutral-600 text-xs">
                                                    {fact.term}
                                                </dt>
                                                <dd className="flex min-h-6 min-w-0 items-center gap-2 break-words font-medium text-neutral-950 text-xs">
                                                    {fact.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </Card>

                                {/* Three events in all, so no "Full history" sheet: it would hold the same three. */}
                                <Card layout="list">
                                    <CardTitle>Recent activity</CardTitle>
                                    <ActivityList>
                                        {activity.map(event => (
                                            <ActivityItem
                                                icon={event.icon}
                                                key={event.title}
                                                time={event.time}
                                                title={event.title}
                                                tone={event.tone}
                                            />
                                        ))}
                                    </ActivityList>
                                </Card>
                            </TabsContent>

                            <TabsContent value="invoices">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="w-32 text-right">
                                                Amount
                                            </TableHead>
                                            <TableHead className="w-32">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoices.map(invoice => (
                                            <TableRow key={invoice.number}>
                                                <TableCell>{invoice.number}</TableCell>
                                                <TableCell className="font-normal text-neutral-700">
                                                    {invoice.date}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {invoice.amount}
                                                </TableCell>
                                                <TableCell>
                                                    {/* Sent is waiting on the customer; paid is done. */}
                                                    <Badge
                                                        tone={
                                                            invoice.status === 'Paid'
                                                                ? 'success'
                                                                : 'warning'
                                                        }
                                                    >
                                                        {invoice.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent value="contacts">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead optional>Role</TableHead>
                                            <TableHead>Email</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contacts.map(contact => (
                                            <TableRow key={contact.email}>
                                                <TableCell>
                                                    <span className="flex items-center gap-2">
                                                        <Avatar
                                                            alt={contact.name}
                                                            fallback={contact.initials}
                                                            shape="round"
                                                            size={24}
                                                        />
                                                        {contact.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell
                                                    className="font-normal text-neutral-700"
                                                    optional
                                                >
                                                    {contact.role}
                                                </TableCell>
                                                <TableCell className="font-normal text-neutral-700">
                                                    {contact.email}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
                    </PageContent>
                </div>
            </AppPanel>

            <Dialog onOpenChange={setStatementOpen} open={statementOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send statement</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            Harbour &amp; Co gets a statement of their account at
                            accounts@harbour.co: one open invoice, €2,420.00, due 30 Nov.
                        </DialogDescription>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button onClick={sendStatement}>Send statement</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}
