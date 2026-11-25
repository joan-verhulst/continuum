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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    HeaderBar,
    PageContent,
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
    TopNav,
    TopNavActions,
    TopNavBrand,
    TopNavLink,
    TopNavLinks,
    useToast,
} from '@contui/ui';
import {
    Archive,
    Bird,
    CircleCheck,
    EllipsisVertical,
    FileText,
    Pencil,
    Plus,
    Send,
    UserPlus,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

/*
 * Kestrel, invoicing for a design studio: one customer, reached from Customers. A detail page, so
 * one column of 896: who it is and what can be done with it, then its facets in line tabs (the page
 * is short enough to keep them in sight, and nothing is committed here, so not the dock).
 */

const icon = { strokeWidth: 2 } as const;

/* Five places, no groups and no depth: a handful of sections, so a top nav rather than a sidebar. */
const places = ['Home', 'Invoices', 'Customers', 'Reports', 'Settings'] as const;

type Invoice = {
    number: string;
    amount: string;
    status: 'Sent' | 'Paid';
    date: string;
};

const invoices: Invoice[] = [
    { number: 'INV-0142', amount: '€2,420.00', status: 'Sent', date: 'Sent 16 Nov, due 30 Nov' },
    { number: 'INV-0131', amount: '€3,100.00', status: 'Paid', date: 'Paid 2 Nov' },
    { number: 'INV-0118', amount: '€2,980.00', status: 'Paid', date: 'Paid 4 Oct' },
    { number: 'INV-0104', amount: '€3,250.00', status: 'Paid', date: 'Paid 6 Sep' },
    { number: 'INV-0093', amount: '€2,600.00', status: 'Paid', date: 'Paid 5 Aug' },
    { number: 'INV-0081', amount: '€4,250.00', status: 'Paid', date: 'Paid 8 Jul' },
];

const contacts = [
    { name: 'Elena Varga', initials: 'EV', role: 'Finance lead', email: 'elena@harbour.co' },
    { name: 'Tom de Wit', initials: 'TW', role: 'Studio manager', email: 'tom@harbour.co' },
    { name: 'Priya Shah', initials: 'PS', role: 'Accounts payable', email: 'ap@harbour.co' },
];

const notes = [
    {
        text: 'Prefers invoices on the 15th; PO number required since October.',
        author: 'Maya Chen',
        date: '3 Oct',
    },
    {
        text: 'Asked about a yearly retainer — follow up in January.',
        author: 'Joan Verhulst',
        date: '12 Nov',
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

/* Sent and not yet paid waits on the customer: warning. Paid is done: success. */
const invoiceTone = { Sent: 'warning', Paid: 'success' } as const;

/** One fact of the Details grid: the label over its value. */
const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex min-w-0 flex-col gap-1.5">
        <dt className="text-neutral-600 text-xs">{label}</dt>
        <dd className="flex min-h-6 min-w-0 items-center gap-2 font-medium text-neutral-950 text-xs">
            {children}
        </dd>
    </div>
);

const Shell = ({ children }: { children: ReactNode }) => (
    <AppShell className="h-dvh min-h-0" nav="top">
        <TopNav>
            <TopNavBrand href="#" logo={<Bird {...icon} className="size-5" />}>
                Kestrel
            </TopNavBrand>
            <TopNavLinks aria-label="Main">
                {places.map(place => (
                    <TopNavLink active={place === 'Customers'} key={place}>
                        {place}
                    </TopNavLink>
                ))}
            </TopNavLinks>
            <TopNavActions>
                <Avatar alt="Joan Verhulst, Kestrel Studio" fallback="JV" shape="round" />
            </TopNavActions>
        </TopNav>
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
            <div className="min-h-0 flex-1 overflow-auto">
                <PageContent className="flex flex-col gap-10 pb-24" width="default">
                    {children}
                </PageContent>
            </div>
        </AppPanel>
    </AppShell>
);

/** Harbour & Co, one customer of Kestrel Studio. */
const CustomerDetail = () => {
    const toast = useToast();
    const [archived, setArchived] = useState(false);

    const sendStatement = () =>
        toast.add({
            title: 'Statement sent',
            description: 'To accounts@harbour.co, with every invoice since March 2023.',
        });

    // Archiving can be taken back, so it asks nothing first and offers Undo after.
    const archive = () => {
        setArchived(true);
        toast.add({
            title: 'Harbour & Co archived',
            description: 'It no longer shows under Customers.',
            actionProps: { children: 'Undo', onClick: () => setArchived(false) },
        });
    };

    return (
        <Shell>
            {/* The title row: who it is, its state, and the actions the customer has. */}
            <div className="flex items-start justify-between gap-6">
                <div className="flex min-w-0 items-center gap-4">
                    <Avatar alt="Harbour & Co" fallback="H" size={36} />
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
                        <p className="text-neutral-600 text-sm">
                            harbour.co · A customer since March 2023
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button variant="secondary">
                        <Pencil {...icon} />
                        Edit
                    </Button>
                    <Button>
                        <Plus {...icon} />
                        New invoice
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button aria-label="More actions" size="icon" variant="ghost" />
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
                            <DropdownMenuItem disabled={archived} onClick={archive}>
                                <Archive {...icon} />
                                Archive customer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

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

                {/* One column: the figures the customer is opened for, its facts, notes, then what happened. */}
                <TabsContent className="flex flex-col gap-10" value="overview">
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard label="Invoiced this year" value="€18,600" />
                        <StatCard label="Outstanding · 1 invoice, due 30 Nov" value="€2,420" />
                        <StatCard label="Average days to pay" value="11" />
                    </div>

                    <Card layout="list">
                        <CardTitle>Details</CardTitle>
                        <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
                            <Fact label="Account owner">
                                <Avatar alt="" fallback="MC" shape="round" size={24} />
                                Maya Chen
                            </Fact>
                            <Fact label="Billing email">accounts@harbour.co</Fact>
                            <Fact label="Payment terms">Net 14</Fact>
                            <Fact label="Currency">EUR</Fact>
                            <Fact label="VAT number">NL 8231.44.019.B01</Fact>
                            <Fact label="Address">Keizersgracht 221, 1016 DV Amsterdam</Fact>
                        </dl>
                    </Card>

                    <Card layout="list">
                        <CardTitle>Notes</CardTitle>
                        <ul className="flex flex-col gap-4">
                            {notes.map(note => (
                                // The author is named in the meta line, so no avatar repeats them.
                                <li className="flex flex-col gap-0.5 text-xs" key={note.text}>
                                    <p className="text-neutral-950">{note.text}</p>
                                    <p className="text-neutral-600">
                                        {note.author} · {note.date}
                                    </p>
                                </li>
                            ))}
                        </ul>
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
                                <TableHead className="w-32">Status</TableHead>
                                <TableHead className="w-36" numeric>
                                    Amount
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map(invoice => (
                                <TableRow key={invoice.number}>
                                    <TableCell>{invoice.number}</TableCell>
                                    <TableCell className="font-normal text-neutral-700">
                                        {invoice.date}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={invoiceTone[invoice.status]}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell numeric>{invoice.amount}</TableCell>
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
                                <TableRow key={contact.email}>
                                    <TableCell>
                                        <span className="flex items-center gap-2">
                                            <Avatar
                                                alt=""
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
        </Shell>
    );
};

export default CustomerDetail;
