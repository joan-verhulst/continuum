import {
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    PageContent,
    SidebarSwitcherMark,
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
    TopNavMenu,
    TopNavMenuGroup,
    TopNavMenuItem,
    TopNavSwitcher,
} from '@contui/ui';
import {
    Bell,
    Boxes,
    ChartColumn,
    Check,
    Inbox,
    LifeBuoy,
    Plus,
    Search,
    Users,
    Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { type Entry, type InUse, icon, type Knob, type PreviewProps, previewIcon } from '../kit';

const topNavKnobs: Knob[] = [
    { id: 'name', label: 'Product name', switch: true, default: true },
    { id: 'switcher', label: 'Workspace switcher', switch: true, default: false },
    { id: 'menu', label: 'A section with pages', switch: true, default: false },
    { id: 'counts', label: 'Counts', switch: true, default: false },
    { id: 'icons', label: 'Icons', switch: true, default: false },
    { id: 'actions', label: 'Search and bell', switch: true, default: false },
];

const topNavSections = [
    { id: 'connections', label: 'Connections', icon: <Workflow {...previewIcon} /> },
    { id: 'users', label: 'Users', icon: <Users {...previewIcon} /> },
    { id: 'tickets', label: 'Tickets', icon: <Inbox {...previewIcon} />, count: 3 },
];

// The section with pages of its own, in two groups, as a sidebar section would fold open to them.
const reportGroups = [
    {
        label: 'Sales',
        pages: [
            { id: 'revenue', label: 'Revenue' },
            { id: 'pipeline', label: 'Pipeline' },
        ],
    },
    {
        label: 'Support',
        pages: [
            { id: 'response', label: 'Response times' },
            { id: 'satisfaction', label: 'Satisfaction' },
        ],
    },
];

const reportPages = reportGroups.flatMap(group => group.pages);

const workspaces = [
    { id: 'acme', name: 'Acme Corp', plan: 'Pro plan', color: 'var(--color-chart-1)' },
    { id: 'globex', name: 'Globex', plan: 'Starter plan', color: 'var(--color-chart-2)' },
    { id: 'initech', name: 'Initech', plan: 'Enterprise', color: 'var(--color-chart-3)' },
];

const TopNavPreview = ({ knobs }: PreviewProps) => {
    const [section, setSection] = useState('connections');
    const [workspace, setWorkspace] = useState('acme');
    const stage = useStageContainer();
    const current =
        topNavSections.find(item => item.id === section) ??
        reportPages.find(page => page.id === section);
    const space = workspaces.find(item => item.id === workspace) ?? workspaces[0];

    return (
        // A whole app, small: the bar across the top, the page straight under it in the bar's column.
        <AppShell
            className="h-85 max-h-full min-h-0 w-170 max-w-full overflow-hidden rounded-panel border border-neutral-200"
            nav="top"
        >
            <TopNav>
                <TopNavBrand
                    href="#"
                    logo={<Boxes {...icon} />}
                    onClick={event => event.preventDefault()}
                >
                    {knobs.name ? 'Northwind' : undefined}
                </TopNavBrand>
                {knobs.switcher && space && (
                    <TopNavSwitcher
                        aria-label={`${space.name}. Switch workspace`}
                        container={stage}
                        detail={space.plan}
                        mark={
                            <SidebarSwitcherMark color={space.color}>
                                {space.name.slice(0, 1)}
                            </SidebarSwitcherMark>
                        }
                        name={space.name}
                    >
                        {workspaces.map(item => (
                            <DropdownMenuItem key={item.id} onClick={() => setWorkspace(item.id)}>
                                <SidebarSwitcherMark color={item.color} size={20}>
                                    {item.name.slice(0, 1)}
                                </SidebarSwitcherMark>
                                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                                {item.id === workspace && <Check {...previewIcon} />}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Plus {...previewIcon} />
                            New workspace
                        </DropdownMenuItem>
                    </TopNavSwitcher>
                )}
                <TopNavLinks aria-label="Sections">
                    {topNavSections.map(item => (
                        <TopNavLink
                            active={item.id === section}
                            count={knobs.counts ? item.count : undefined}
                            icon={knobs.icons ? item.icon : undefined}
                            key={item.id}
                            onClick={() => setSection(item.id)}
                        >
                            {item.label}
                        </TopNavLink>
                    ))}
                    {knobs.menu && (
                        <TopNavMenu
                            container={stage}
                            icon={knobs.icons ? <ChartColumn {...previewIcon} /> : undefined}
                            label="Reports"
                        >
                            {reportGroups.map(group => (
                                <TopNavMenuGroup key={group.label} label={group.label}>
                                    {group.pages.map(page => (
                                        <TopNavMenuItem
                                            active={page.id === section}
                                            key={page.id}
                                            onClick={() => setSection(page.id)}
                                        >
                                            {page.label}
                                        </TopNavMenuItem>
                                    ))}
                                </TopNavMenuGroup>
                            ))}
                        </TopNavMenu>
                    )}
                </TopNavLinks>
                <TopNavActions>
                    {knobs.actions && (
                        <>
                            <Button aria-label="Search" size="icon" variant="ghost">
                                <Search {...previewIcon} />
                            </Button>
                            <Button aria-label="Notifications" size="icon" variant="ghost">
                                <Bell {...previewIcon} />
                            </Button>
                        </>
                    )}
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
            </TopNav>
            <AppPanel>
                <div>
                    <PageContent className="flex flex-col gap-4 pt-10">
                        <h3 className="font-medium text-lg text-neutral-950">{current?.label}</h3>
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-3/5" />
                    </PageContent>
                </div>
            </AppPanel>
        </AppShell>
    );
};

export const entry: Entry = {
    id: 'top-nav',
    name: 'Top navigation',
    category: 'frame',
    description:
        'The sidebar on its side: the brand, a switcher, the sections and their pages, the account.',
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
            <TopNav width="wide">
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
            <AppPanel>
                <div>
                    <PageContent className="flex flex-col gap-8 pt-10 pb-10" width="wide">
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
                                        <TableCell className="text-neutral-950">
                                            {ticket.subject}
                                        </TableCell>
                                        <TableCell className="text-neutral-700">
                                            {ticket.who}
                                        </TableCell>
                                        <TableCell>
                                            <Badge tone={ticketTone[ticket.status]}>
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </PageContent>
                </div>
            </AppPanel>
        </AppShell>
    );
};

export const inUse: InUse = {
    title: 'A support desk',
    note: 'An app of four sections: the brand, the sections across the top and the account at the end, all in the column of the page under it.',
    app: true,
    render: () => <SupportDesk />,
};
