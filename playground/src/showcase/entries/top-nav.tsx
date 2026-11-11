import {
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    Button,
    ContinuumMark,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TopNav,
    TopNavActions,
    TopNavBrand,
    TopNavLink,
    TopNavLinks,
} from 'continuum';
import { Bell, Inbox, LifeBuoy, Search, Users, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { type Entry, type InUse, icon, type Knob, type PreviewProps, previewIcon } from '../kit';

const topNavKnobs: Knob[] = [
    { id: 'name', label: 'Product name', switch: true, default: true },
    { id: 'icons', label: 'Icons', switch: true, default: false },
    { id: 'actions', label: 'Search, bell and account', switch: true, default: true },
];

const topNavSections = [
    { id: 'connections', label: 'Connections', icon: <Workflow {...previewIcon} /> },
    { id: 'browse', label: 'Browse', icon: <Search {...previewIcon} /> },
    { id: 'users', label: 'Users', icon: <Users {...previewIcon} /> },
    { id: 'tickets', label: 'Tickets', icon: <Inbox {...previewIcon} /> },
];

const TopNavPreview = ({ knobs }: PreviewProps) => {
    const [section, setSection] = useState('connections');
    const stage = useStageContainer();
    const current = topNavSections.find(item => item.id === section);

    return (
        // A whole app, small: the bar on the canvas, the page on its panel under it.
        <AppShell
            className="h-85 max-h-full min-h-0 w-170 max-w-full overflow-hidden rounded-panel border border-neutral-200"
            nav="top"
        >
            <TopNav>
                <TopNavBrand
                    href="#"
                    logo={<ContinuumMark size={22} />}
                    onClick={event => event.preventDefault()}
                >
                    {knobs.name ? 'Northwind' : undefined}
                </TopNavBrand>
                <TopNavLinks aria-label="Sections">
                    {topNavSections.map(item => (
                        <TopNavLink
                            active={item.id === section}
                            icon={knobs.icons ? item.icon : undefined}
                            key={item.id}
                            onClick={() => setSection(item.id)}
                        >
                            {item.label}
                        </TopNavLink>
                    ))}
                </TopNavLinks>
                {knobs.actions && (
                    <TopNavActions>
                        <Button aria-label="Search" size="icon" variant="ghost">
                            <Search {...previewIcon} />
                        </Button>
                        <Button aria-label="Notifications" size="icon" variant="ghost">
                            <Bell {...previewIcon} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                aria-label="Account"
                                className="cursor-pointer rounded-chip outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                            >
                                <Avatar fallback="JV" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48" container={stage}>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuItem>Billing</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Sign out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TopNavActions>
                )}
            </TopNav>
            <AppPanel className="gap-4 p-6">
                <h3 className="font-medium text-lg text-neutral-950">{current?.label}</h3>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/5" />
            </AppPanel>
        </AppShell>
    );
};

export const entry: Entry = {
    id: 'top-nav',
    name: 'Top navigation',
    category: 'frame',
    description: 'The sidebar on its side: the brand, a handful of sections, the account.',
    // Wide enough for every section, so it starts past the properties panel rather than under it.
    hero: '[&>div:last-child]:pl-70',
    span: 2,
    knobs: topNavKnobs,
    Preview: TopNavPreview,
};

const tickets = [
    { id: '#4821', subject: 'Invoice shows the wrong VAT rate', who: 'Acme Corp', status: 'Open' },
    { id: '#4819', subject: 'Can we pay by bank transfer?', who: 'Globex', status: 'Waiting' },
    { id: '#4816', subject: 'Export to CSV misses the due date', who: 'Initech', status: 'Open' },
    { id: '#4810', subject: 'Add a second billing contact', who: 'Northwind', status: 'Solved' },
    { id: '#4807', subject: 'Reminder emails go to spam', who: 'Umbrella', status: 'Open' },
] as const;

const ticketTone = { Open: 'warning', Waiting: 'neutral', Solved: 'success' } as const;

const SupportDesk = () => {
    const [section, setSection] = useState('tickets');
    const stage = useStageContainer() ?? undefined;

    return (
        // A handful of sections, so the navigation runs across the top and the page has the width.
        <AppShell className="h-full min-h-0 w-full" nav="top">
            <TopNav>
                <TopNavBrand
                    href="#"
                    logo={<LifeBuoy {...icon} />}
                    onClick={event => event.preventDefault()}
                >
                    Acme Support
                </TopNavBrand>
                <TopNavLinks aria-label="Sections">
                    {[
                        { id: 'tickets', label: 'Tickets' },
                        { id: 'customers', label: 'Customers' },
                        { id: 'articles', label: 'Help articles' },
                        { id: 'reports', label: 'Reports' },
                    ].map(item => (
                        <TopNavLink
                            active={item.id === section}
                            key={item.id}
                            onClick={() => setSection(item.id)}
                        >
                            {item.label}
                        </TopNavLink>
                    ))}
                </TopNavLinks>
                <TopNavActions>
                    <Button aria-label="Search" size="icon" variant="ghost">
                        <Search {...icon} />
                    </Button>
                    <Button aria-label="Notifications" size="icon" variant="ghost">
                        <Bell {...icon} />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            aria-label="Account"
                            className="cursor-pointer rounded-chip outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                        >
                            <Avatar fallback="MC" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" container={stage}>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Sign out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TopNavActions>
            </TopNav>
            <AppPanel className="gap-8 @max-shell-compact/shell:px-4 px-10 @max-shell-compact/shell:pt-10 pt-10">
                <div className="flex flex-col gap-1.5">
                    <h1 className="font-medium text-2xl text-neutral-950">Tickets</h1>
                    <p className="text-neutral-600 text-sm">
                        Three open this morning, one waiting on the customer.
                    </p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">Ticket</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell className="text-neutral-600 tabular-nums">
                                    {ticket.id}
                                </TableCell>
                                <TableCell className="text-neutral-950">{ticket.subject}</TableCell>
                                <TableCell className="text-neutral-700">{ticket.who}</TableCell>
                                <TableCell>
                                    <Badge tone={ticketTone[ticket.status]}>{ticket.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </AppPanel>
        </AppShell>
    );
};

export const inUse: InUse = {
    title: 'A support desk',
    note: 'An app of four sections: the brand, the sections across the top, search, the bell and the account at the end.',
    app: true,
    render: () => <SupportDesk />,
};
