import {
    ActivityItem,
    ActivityList,
    Avatar,
    Badge,
    Button,
    Card,
    CardTitle,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    EmptyState,
    Progress,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetSection,
    SheetTitle,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from 'continuum';
import {
    ArrowLeftRight,
    CircleAlert,
    Download,
    EllipsisVertical,
    FileText,
    History,
    KeyRound,
    Mail,
    MessageSquare,
    Rocket,
    UserPlus,
    UserRoundX,
    Users,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useScreenNav } from './shared';
import { allCustomers, type Customer, formatEuro, statusTone, Workspace } from './workspace';

const icon = { strokeWidth: 2 } as const;

type Entry = {
    icon: ReactNode;
    title: string;
    time: string;
    tone?: 'primary' | 'success' | 'warning';
    action?: ReactNode;
};

// The last months a customer was invoiced for, newest first; invoices go out on the first.
const invoiceMonths = ['1 October', '1 September', '1 August'];

const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

/** Whole months from "March 2023" to October 2026, the month the screens are set in. */
const monthsSince = (since: string) => {
    const [month = '', year = ''] = since.split(' ');
    return Math.max(0, (2026 - Number(year)) * 12 + 9 - monthNames.indexOf(month));
};

/** The invoices a customer has had: one on the first of every month after the one it started in. */
const invoicesSent = (customer: Customer) =>
    customer.status === 'Trial' ? 0 : monthsSince(customer.since);

/** What happened to a customer, newest first, as far as its status tells. */
const historyOf = (customer: Customer): Entry[] => {
    const invoice = (time: string, paid = true): Entry => ({
        icon: <FileText {...icon} />,
        title: `Invoice for ${formatEuro(customer.mrr)}`,
        time,
        action: paid ? <Badge tone="success">Paid</Badge> : <Badge tone="warning">Unpaid</Badge>,
    });
    const started: Entry = {
        icon: <Rocket {...icon} />,
        title: `Started on the ${customer.plan} plan`,
        time: customer.since,
    };

    const invoices = invoiceMonths
        .slice(0, invoicesSent(customer))
        .map((month, i) => invoice(month, !(customer.status === 'Past due' && i === 0)));

    if (customer.id === 'northwind') {
        return [
            {
                icon: <KeyRound {...icon} />,
                title: 'Single sign-on turned on',
                time: '1 hour ago',
                tone: 'primary',
            },
            {
                icon: <UserPlus {...icon} />,
                title: 'Eight teammates invited by Ana Ruiz',
                time: 'Yesterday',
            },
            invoice('1 October'),
            {
                icon: <MessageSquare {...icon} />,
                title: 'Asked about single sign-on',
                time: '28 September',
            },
            invoice('1 September'),
            invoice('1 August'),
            started,
        ];
    }
    if (customer.status === 'Trial') {
        return [
            {
                icon: <UserPlus {...icon} />,
                title: 'Invited two teammates',
                time: 'Yesterday',
            },
            { ...started, title: `Started a trial of ${customer.plan}`, tone: 'primary' },
        ];
    }
    if (customer.status === 'Churned') {
        return [
            {
                icon: <UserRoundX {...icon} />,
                title: `Cancelled the ${customer.plan} plan`,
                time: customer.seen,
            },
            started,
        ];
    }
    if (customer.status === 'Past due') {
        return [
            {
                icon: <CircleAlert {...icon} />,
                title: 'A card payment failed',
                time: '3 hours ago',
                tone: 'warning',
            },
            ...invoices,
            started,
        ];
    }
    return [...invoices, started];
};

const Events = ({ events }: { events: Entry[] }) => (
    <ActivityList>
        {events.map(event => (
            <ActivityItem
                action={event.action}
                icon={event.icon}
                key={`${event.title} ${event.time}`}
                time={event.time}
                title={event.title}
                tone={event.tone}
            />
        ))}
    </ActivityList>
);

/**
 * A detail: who it is and what to do with it, then its facets in tabs. The overview holds its
 * numbers, facts, usage and recent history, in one column; the full history opens in a sheet.
 */
export const CustomerDetail = () => {
    const nav = useScreenNav();
    const [history, setHistory] = useState(false);
    const customer =
        allCustomers.find(item => item.id === nav.customer) ?? (allCustomers[0] as Customer);
    const index = allCustomers.indexOf(customer);
    const paying = customer.mrr > 0;
    const events = historyOf(customer);
    const sent = invoicesSent(customer);
    const invoices = paying ? invoiceMonths.slice(0, sent) : [];
    // Every month on a plan was invoiced; a payment that failed is still open.
    const paid = Math.max(0, sent - (customer.status === 'Past due' ? 1 : 0));
    // Seats in use, of those paid for: Starter's five are included.
    const used = Math.round(customer.seats * 0.72);

    const facts = [
        {
            term: 'Plan',
            value:
                customer.status === 'Churned'
                    ? `${customer.plan}, cancelled`
                    : customer.plan === 'Starter'
                      ? 'Starter, up to five seats'
                      : `${customer.plan}, ${customer.seats} seats`,
        },
        {
            term: 'Billing',
            value:
                customer.status === 'Trial'
                    ? 'None during the trial'
                    : customer.status === 'Churned'
                      ? 'Ended'
                      : customer.plan === 'Enterprise'
                        ? 'Monthly, by invoice'
                        : 'Monthly, by card',
        },
        {
            term: 'Owner',
            value: (
                <>
                    <Avatar
                        alt={customer.owner}
                        fallback={customer.ownerInitials}
                        shape="round"
                        size={24}
                    />
                    {customer.owner}
                </>
            ),
        },
        { term: 'Domain', value: customer.domain },
        { term: 'Last seen', value: customer.seen },
        { term: 'Customer since', value: customer.since },
    ];

    return (
        <Workspace place="customers" trail={[{ label: 'Customers', to: 'list' }, customer.name]}>
            <div className="flex items-start justify-between gap-6">
                <div className="flex min-w-0 items-center gap-4">
                    <Avatar alt={customer.name} fallback={customer.initials} size={36} />
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate font-medium text-2xl text-neutral-950">
                                {customer.name}
                            </h1>
                            <Badge tone={statusTone[customer.status]}>{customer.status}</Badge>
                        </div>
                        <p className="text-neutral-600 text-sm">
                            {customer.domain} · A customer since {customer.since}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button variant="secondary">
                        <UserPlus {...icon} />
                        Add contact
                    </Button>
                    <Button>
                        <Mail {...icon} />
                        Message customer
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
                            <DropdownMenuItem>
                                <ArrowLeftRight {...icon} />
                                Change plan
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Users {...icon} />
                                Add seats
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Download {...icon} />
                                Export data
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* The facets of one object, with nothing to commit: tabs, not the dock. The history is the sheet's. */}
            <Tabs className="gap-10" defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>

                {/* One column, as every detail is: the numbers, the facts, then what it uses and what happened. */}
                <TabsContent className="flex flex-col gap-10" value="overview">
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard
                            delta={paying ? '+12%' : undefined}
                            label="Monthly revenue"
                            value={paying ? formatEuro(customer.mrr) : '—'}
                        />
                        <StatCard label="Invoices paid" value={String(paid)} />
                        <StatCard
                            delta="−1"
                            label="Open tickets"
                            trend="up"
                            value={String((index % 3) + 1)}
                        />
                    </div>

                    {/* Each fact's label over its value, so the two read together at this width. */}
                    <Card layout="list">
                        <CardTitle>Details</CardTitle>
                        <dl className="grid grid-cols-3 gap-x-6 gap-y-5">
                            {facts.map(fact => (
                                <div className="flex min-w-0 flex-col gap-1.5" key={fact.term}>
                                    <dt className="text-neutral-600 text-xs">{fact.term}</dt>
                                    <dd className="flex min-h-6 min-w-0 items-center gap-2 font-medium text-neutral-950 text-xs">
                                        {fact.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Card>

                    <Card layout="list">
                        <CardTitle>Usage this month</CardTitle>
                        <div className="flex flex-col gap-5">
                            <Progress caption="72,000 of 100,000" label="API calls" value={72} />
                            {customer.seats > 0 && (
                                <Progress
                                    caption={`${used} of ${customer.seats}`}
                                    label="Seats"
                                    value={(used / customer.seats) * 100}
                                />
                            )}
                            <Progress caption="41 of 100 GB" label="Storage" value={41} />
                        </div>
                    </Card>

                    <Card layout="list">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle>Recent activity</CardTitle>
                            <Button onClick={() => setHistory(true)} variant="ghost">
                                Full history
                            </Button>
                        </div>
                        <Events events={events.slice(0, 4)} />
                    </Card>
                </TabsContent>

                <TabsContent value="invoices">
                    {invoices.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="w-32 text-right">Amount</TableHead>
                                    <TableHead className="w-32">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((date, i) => (
                                    <TableRow key={date}>
                                        <TableCell>INV-{2041 - i * 40 - index}</TableCell>
                                        <TableCell className="font-normal text-neutral-700">
                                            {date} 2026
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {formatEuro(customer.mrr)}
                                        </TableCell>
                                        <TableCell>
                                            {customer.status === 'Past due' && i === 0 ? (
                                                <Badge tone="warning">Unpaid</Badge>
                                            ) : (
                                                <Badge tone="success">Paid</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <EmptyState
                            description={
                                customer.status === 'Trial'
                                    ? 'The first invoice goes out when the trial turns into a plan.'
                                    : customer.status === 'Churned'
                                      ? 'Nothing has been invoiced since it left.'
                                      : 'The first invoice goes out on 1 November.'
                            }
                            icon={<FileText {...icon} />}
                            title="No invoices yet"
                        />
                    )}
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
                            {[
                                { name: 'Ana Ruiz', role: 'Admin', email: 'ana' },
                                { name: 'Tom Becker', role: 'Billing', email: 'finance' },
                            ].map(contact => (
                                <TableRow key={contact.name}>
                                    <TableCell>{contact.name}</TableCell>
                                    <TableCell className="font-normal text-neutral-700">
                                        {contact.role}
                                    </TableCell>
                                    <TableCell className="font-normal text-neutral-700">
                                        {contact.email}@{customer.domain}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>

            {/* Read beside the page, so it is a sheet, not a pane or a page of its own. */}
            <Sheet onOpenChange={setHistory} open={history}>
                <SheetContent initialFocus={false}>
                    <SheetHeader icon={<History {...icon} />}>
                        <SheetTitle>History</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                        <SheetSection>
                            <Events events={events} />
                        </SheetSection>
                    </SheetBody>
                </SheetContent>
            </Sheet>
        </Workspace>
    );
};
