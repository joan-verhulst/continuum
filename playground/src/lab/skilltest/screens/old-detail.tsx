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
    CardValue,
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    HeaderBar,
    NavItem,
    PageContent,
    SheetArea,
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
    Tabs,
    TabsContent,
    TabsCount,
    TabsList,
    TabsTrigger,
    useToast,
} from '@contui/ui';
import {
    Archive,
    Bird,
    ChartColumn,
    CircleCheck,
    EllipsisVertical,
    FileText,
    House,
    MessageSquareText,
    Plus,
    Receipt,
    Send,
    Settings,
    UserPlus,
    Users,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

const icon = { strokeWidth: 2 } as const;

/* ---------- The product's frame: Kestrel's sidebar and the trail ---------- */

const places: { id: string; label: string; icon: ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
    { id: 'settings', label: 'Settings', icon: <Settings {...icon} /> },
];

/** The studio's mark in the footer account: a dark square with the glyph in the surface colour. */
const StudioMark = () => (
    <span className="grid size-full place-items-center bg-neutral-950 text-neutral-50 [&_svg]:size-4">
        <Bird {...icon} />
    </span>
);

/** Places only: the page that creates owns its create action, so the sidebar holds none. */
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
                <NavItem active={place.id === 'customers'} icon={place.icon} key={place.id}>
                    {place.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount avatar={<StudioMark />} name="Kestrel Studio" detail="Joan Verhulst" />
        </SidebarFooter>
    </Sidebar>
);

/* ---------- The customer ---------- */

const facts: { term: string; value: ReactNode }[] = [
    {
        term: 'Account owner',
        value: (
            <>
                <Avatar alt="Maya Chen" fallback="MC" shape="round" size={24} />
                Maya Chen
            </>
        ),
    },
    { term: 'Billing email', value: 'accounts@harbour.co' },
    { term: 'Payment terms', value: 'Net 14' },
    { term: 'Currency', value: 'EUR' },
    { term: 'VAT number', value: 'NL 8231.44.019.B01' },
    { term: 'Address', value: 'Keizersgracht 221, 1016 DV Amsterdam' },
];

type Invoice = { number: string; amount: string; date: string; status: 'Sent' | 'Paid' };

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
        by: 'Maya Chen · 3 Oct',
    },
    {
        text: 'Asked about a yearly retainer — follow up in January.',
        by: 'Joan Verhulst · 12 Nov',
    },
];

const activity: {
    icon: ReactNode;
    title: string;
    time: string;
    tone?: 'primary' | 'success';
}[] = [
    { icon: <Send {...icon} />, title: 'INV-0142 sent', time: 'Today, 10:24', tone: 'primary' },
    { icon: <CircleCheck {...icon} />, title: 'INV-0131 paid', time: '2 Nov', tone: 'success' },
    { icon: <UserPlus {...icon} />, title: 'Contact Priya Shah added', time: '20 Oct' },
];

/**
 * A key figure: the label, the value under it, and, where the figure needs it, a quiet line
 * under the value rather than anything inline after it.
 */
const Figure = ({ label, value, line }: { label: string; value: string; line?: string }) => (
    <Card className="gap-3">
        <div className="flex flex-col gap-1">
            <CardTitle>{label}</CardTitle>
            <CardValue className="tabular-nums">{value}</CardValue>
        </div>
        {line && <p className="text-neutral-600 text-xs">{line}</p>}
    </Card>
);

/* ---------- The page ---------- */

/**
 * One customer, on its own page: who it is and what to do with it, then its facets in tabs.
 * One column at 896; the numbers, the facts, the notes and what happened lately on the overview.
 */
const HarbourDetail = () => {
    const toast = useToast();
    const [archiving, setArchiving] = useState(false);

    const sendStatement = () =>
        toast.add({
            title: 'Statement of account sent',
            description: 'To accounts@harbour.co',
            type: 'success',
        });

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
                </HeaderBar>

                <SheetArea className="min-h-0 flex-1 overflow-auto">
                    <PageContent className="flex flex-col gap-10 pb-24" width="default">
                        {/* Title row: who it is at the left, the object's actions top-aligned at the right. */}
                        <div className="flex @max-shell-compact/shell:flex-col items-start justify-between @max-shell-compact/shell:gap-4 gap-6">
                            <div className="flex min-w-0 max-w-full items-center gap-4">
                                <Avatar alt="Harbour & Co" fallback="HC" size={36} />
                                <div className="flex min-w-0 flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <h1 className="truncate font-medium text-2xl text-neutral-950">
                                            Harbour &amp; Co
                                        </h1>
                                        <Badge tone="success">Active</Badge>
                                    </div>
                                    <p className="text-neutral-600 text-sm">
                                        harbour.co · A customer since March 2023
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Button
                                    className="@max-shell-sidebar/shell:hidden"
                                    variant="secondary"
                                >
                                    Edit customer
                                </Button>
                                <Button>
                                    New invoice
                                    <Plus {...icon} />
                                </Button>
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
                                        <DropdownMenuItem onClick={sendStatement}>
                                            <FileText {...icon} />
                                            Send statement of account
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setArchiving(true)}
                                            variant="danger"
                                        >
                                            <Archive {...icon} />
                                            Archive customer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* The facets of one object, with nothing to commit: line tabs, not the dock. */}
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

                            <TabsContent className="flex flex-col gap-10" value="overview">
                                <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
                                    <Figure label="Invoiced this year" value="€18,600" />
                                    <Figure
                                        label="Outstanding"
                                        line="1 invoice, due 30 Nov"
                                        value="€2,420"
                                    />
                                    <Figure label="Average days to pay" value="11" />
                                </div>

                                {/* Each fact's label over its value, three across, so the pair reads together. */}
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
                                                <dd className="flex min-h-6 min-w-0 items-center gap-2 font-medium text-neutral-950 text-xs">
                                                    {fact.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </Card>

                                <Card layout="list">
                                    <CardTitle>Notes</CardTitle>
                                    <ActivityList>
                                        {notes.map(note => (
                                            <ActivityItem
                                                icon={<MessageSquareText {...icon} />}
                                                key={note.text}
                                                time={note.by}
                                                title={note.text}
                                            />
                                        ))}
                                    </ActivityList>
                                </Card>

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
                                            <TableHead>Role</TableHead>
                                            <TableHead>Email</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contacts.map(contact => (
                                            <TableRow key={contact.name}>
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
                                                <TableCell className="font-normal text-neutral-700">
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
                </SheetArea>
            </AppPanel>

            {/* Archiving takes the customer out of the lists, so it is confirmed, by its verb. */}
            <Dialog onOpenChange={setArchiving} open={archiving}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Archive Harbour &amp; Co</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            Harbour &amp; Co leaves the customer list.
                        </DialogDescription>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button onClick={() => setArchiving(false)}>Archive customer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    );
};

export default HarbourDetail;
