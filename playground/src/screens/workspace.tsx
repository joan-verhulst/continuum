import {
    AppPanel,
    AppShell,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    HeaderBar,
    NavItem,
    PageContent,
    SheetArea,
    Sidebar,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
} from 'continuum';
import {
    Boxes,
    ChartColumn,
    Inbox,
    LayoutDashboard,
    LifeBuoy,
    Receipt,
    Settings,
    Sparkles,
    Users,
} from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { AccountFooter, type ScreenId, useScreenNav, WorkspaceMark } from './shared';

/*
 * The generic app every screen belongs to: one workspace with one sidebar, a
 * header bar that shows where the page sits, and the page in a centred column.
 * Nothing in it is drawn by hand: every colour, corner and font is a token, so
 * a previewed theme changes all of it at once.
 */

const icon = { strokeWidth: 2 } as const;

export type Place =
    | 'overview'
    | 'customers'
    | 'invoices'
    | 'reports'
    | 'inbox'
    | 'agent'
    | 'settings';

export const places: { id: Place; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
    { id: 'inbox', label: 'Inbox', icon: <Inbox {...icon} />, count: 4 },
    { id: 'agent', label: 'Agent', icon: <Sparkles {...icon} /> },
];

/** The places that have a screen of their own; the rest are drawn but lead nowhere yet. */
const placeScreens: Partial<Record<Place, ScreenId>> = {
    overview: 'dashboard',
    customers: 'list',
    agent: 'agent',
    settings: 'settings',
};

/**
 * The sidebar every screen shares: the places, settings and the account. It holds no action of
 * its own: each page has its one primary action, and a second here would make two.
 */
export const WorkspaceSidebar = ({ place }: { place: Place }) => {
    const nav = useScreenNav();
    const go = (to: Place) => () => {
        const screen = placeScreens[to];
        if (screen) nav.open(screen);
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarLogo>
                    <Boxes {...icon} />
                </SidebarLogo>
                <SidebarToggle />
            </SidebarHeader>
            <SidebarGroup aria-label="Main">
                {places.map(item => (
                    <NavItem
                        active={place === item.id}
                        icon={item.icon}
                        key={item.id}
                        onClick={go(item.id)}
                        trailing={
                            item.count ? <Badge variant="count">{item.count}</Badge> : undefined
                        }
                    >
                        {item.label}
                    </NavItem>
                ))}
            </SidebarGroup>
            <SidebarGroup aria-label="Workspace" label="Workspace">
                <NavItem
                    active={place === 'settings'}
                    icon={<Settings {...icon} />}
                    onClick={go('settings')}
                >
                    Settings
                </NavItem>
                <NavItem icon={<LifeBuoy {...icon} />}>Help and support</NavItem>
            </SidebarGroup>
            <AccountFooter
                avatar={
                    <WorkspaceMark>
                        <Boxes {...icon} />
                    </WorkspaceMark>
                }
                name="Acme Inc."
                plan="Pro plan"
            />
        </Sidebar>
    );
};

/** A step of the trail: its label, and the screen it opens when there is one. */
export type Crumb = string | { label: string; to?: ScreenId };

const crumbLabel = (crumb: Crumb) => (typeof crumb === 'string' ? crumb : crumb.label);

/** Where the page sits: the home, then each step down to the page itself. */
export const Trail = ({ trail }: { trail: Crumb[] }) => {
    const nav = useScreenNav();

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="#" onClick={() => nav.open('dashboard')}>
                        <BreadcrumbHome />
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {trail.map((crumb, i) => {
                    const to = typeof crumb === 'string' ? undefined : crumb.to;
                    return (
                        <Fragment key={crumbLabel(crumb)}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {i === trail.length - 1 ? (
                                    <BreadcrumbPage>{crumbLabel(crumb)}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink
                                        href="#"
                                        onClick={to ? () => nav.open(to) : undefined}
                                    >
                                        {crumbLabel(crumb)}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

type WorkspaceProps = {
    place: Place;
    trail: Crumb[];
    /** A `Notice` for the save state, hung from the header bar's hairline. */
    notice?: ReactNode;
    /** The column's width, as dense as the page is: 896 unless a table needs the room. */
    width?: 'narrow' | 'default' | 'wide' | 'dense';
    /** A bar floating at the panel's foot, over the page as it scrolls: bulk actions, say. */
    bar?: ReactNode;
    children: ReactNode;
};

/** One screen of the app: the shared sidebar, the trail in the header bar, the page below it. */
export const Workspace = ({
    place,
    trail,
    notice,
    width = 'default',
    bar,
    children,
}: WorkspaceProps) => (
    <AppShell className="h-full min-h-0 min-w-7xl">
        <WorkspaceSidebar place={place} />
        <AppPanel>
            <HeaderBar>
                <Trail trail={trail} />
                {notice}
            </HeaderBar>
            {/* The area a sheet floats in, under the header bar: a detail's history opens here. */}
            <SheetArea className="min-h-0 flex-1 overflow-auto">
                <PageContent className="flex flex-col gap-10 pb-24" width={width}>
                    {children}
                </PageContent>
            </SheetArea>
            {bar}
        </AppPanel>
    </AppShell>
);

type PageHeadProps = {
    title: ReactNode;
    description?: ReactNode;
    /** The page's own actions, at the right of its title. */
    children?: ReactNode;
};

/** A page's title and the line under it, with its actions beside it. */
export const PageHead = ({ title, description, children }: PageHeadProps) => (
    <div className="flex items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-medium text-2xl text-neutral-950">{title}</h1>
            {description && <p className="text-neutral-600 text-sm">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
);

/** A section's title and the line under it, as every screen sets them. */
export const SectionHead = ({
    title,
    description,
}: {
    title: ReactNode;
    description?: ReactNode;
}) => (
    <div className="flex flex-col gap-1">
        <h2 className="font-medium text-base text-neutral-950">{title}</h2>
        {description && <p className="text-neutral-600 text-xs">{description}</p>}
    </div>
);

/* ---------- The workspace's data ---------- */

export type Status = 'Active' | 'Trial' | 'Past due' | 'Churned';

/** Status colours mean status: a trial is information, past due a warning, churned nothing more. */
export const statusTone: Record<Status, 'success' | 'primary' | 'warning' | 'neutral'> = {
    Active: 'success',
    Trial: 'primary',
    'Past due': 'warning',
    Churned: 'neutral',
};

export type Plan = 'Starter' | 'Pro' | 'Enterprise';

/**
 * What each plan costs, the one price list every screen reads: Starter is flat, the others are
 * paid per seat, so a customer's monthly revenue is its seats times the price.
 */
export const plans: { id: Plan; price: string; terms: string }[] = [
    { id: 'Starter', price: '€29 a month', terms: 'for a team of up to five' },
    { id: 'Pro', price: '€20 a seat a month', terms: 'with reports and an API' },
    { id: 'Enterprise', price: '€40 a seat a month', terms: 'with single sign-on and a contract' },
];

/** What a customer pays a month: nothing on a trial or after it has left. */
export const monthlyRevenue = (plan: Plan, seats: number, status: Status) => {
    if (status === 'Trial' || status === 'Churned') return 0;
    return plan === 'Starter' ? 29 : seats * (plan === 'Pro' ? 20 : 40);
};

export type Customer = {
    id: string;
    name: string;
    domain: string;
    initials: string;
    plan: Plan;
    status: Status;
    /** The seats the plan pays for; Starter's five are included. */
    seats: number;
    /** Monthly recurring revenue, in euros: the seats times the plan's price. */
    mrr: number;
    owner: string;
    ownerInitials: string;
    seen: string;
    /** Whole days since anyone from it was last seen, for the "Last seen" filter. */
    seenDays: number;
    /** The month it became a customer. */
    since: string;
};

/** The account managers who look after the customers. */
export const owners = [
    { name: 'Maya Chen', initials: 'MC' },
    { name: 'Liam Ortiz', initials: 'LO' },
    { name: 'Sara Kim', initials: 'SK' },
    { name: 'Noah Patel', initials: 'NP' },
];

/** The first page of customers, written out: the screens and the component pieces use these. */
export const customers: Customer[] = [
    {
        id: 'northwind',
        name: 'Northwind Traders',
        domain: 'northwind.com',
        initials: 'NT',
        plan: 'Enterprise',
        status: 'Active',
        seats: 120,
        mrr: 4800,
        owner: 'Maya Chen',
        ownerInitials: 'MC',
        seen: '2 min ago',
        seenDays: 0,
        since: 'March 2023',
    },
    {
        id: 'globex',
        name: 'Globex',
        domain: 'globex.io',
        initials: 'GX',
        plan: 'Pro',
        status: 'Active',
        seats: 62,
        mrr: 1240,
        owner: 'Liam Ortiz',
        ownerInitials: 'LO',
        seen: '18 min ago',
        seenDays: 0,
        since: 'June 2024',
    },
    {
        id: 'initech',
        name: 'Initech',
        domain: 'initech.co',
        initials: 'IN',
        plan: 'Pro',
        status: 'Past due',
        seats: 49,
        mrr: 980,
        owner: 'Sara Kim',
        ownerInitials: 'SK',
        seen: '1 hour ago',
        seenDays: 0,
        since: 'January 2025',
    },
    {
        id: 'umbrella',
        name: 'Umbrella Health',
        domain: 'umbrella.health',
        initials: 'UH',
        plan: 'Enterprise',
        status: 'Active',
        seats: 155,
        mrr: 6200,
        owner: 'Maya Chen',
        ownerInitials: 'MC',
        seen: '3 hours ago',
        seenDays: 0,
        since: 'September 2022',
    },
    {
        id: 'hooli',
        name: 'Hooli',
        domain: 'hooli.xyz',
        initials: 'HO',
        plan: 'Starter',
        status: 'Trial',
        seats: 5,
        mrr: 0,
        owner: 'Liam Ortiz',
        ownerInitials: 'LO',
        seen: 'Yesterday',
        seenDays: 1,
        since: 'October 2026',
    },
    {
        id: 'soylent',
        name: 'Soylent Labs',
        domain: 'soylent.dev',
        initials: 'SL',
        plan: 'Pro',
        status: 'Active',
        seats: 78,
        mrr: 1560,
        owner: 'Noah Patel',
        ownerInitials: 'NP',
        seen: 'Yesterday',
        seenDays: 1,
        since: 'April 2024',
    },
    {
        id: 'stark',
        name: 'Stark Logistics',
        domain: 'starklogistics.com',
        initials: 'SK',
        plan: 'Enterprise',
        status: 'Active',
        seats: 135,
        mrr: 5400,
        owner: 'Sara Kim',
        ownerInitials: 'SK',
        seen: '2 days ago',
        seenDays: 2,
        since: 'November 2023',
    },
    {
        id: 'wayne',
        name: 'Wayne Studio',
        domain: 'waynestudio.co',
        initials: 'WS',
        plan: 'Starter',
        status: 'Trial',
        seats: 5,
        mrr: 0,
        owner: 'Noah Patel',
        ownerInitials: 'NP',
        seen: '3 days ago',
        seenDays: 3,
        since: 'October 2026',
    },
    {
        id: 'cyberdyne',
        name: 'Cyberdyne',
        domain: 'cyberdyne.ai',
        initials: 'CY',
        plan: 'Pro',
        status: 'Churned',
        seats: 0,
        mrr: 0,
        owner: 'Liam Ortiz',
        ownerInitials: 'LO',
        seen: '2 weeks ago',
        seenDays: 14,
        since: 'February 2024',
    },
    {
        id: 'tyrell',
        name: 'Tyrell & Co',
        domain: 'tyrell.co',
        initials: 'TC',
        plan: 'Starter',
        status: 'Active',
        seats: 5,
        mrr: 29,
        owner: 'Maya Chen',
        ownerInitials: 'MC',
        seen: '5 min ago',
        seenDays: 0,
        since: 'October 2026',
    },
];

// The rest of the book, one line each: name, domain, plan, status, seats, owner, days since seen.
const more: [string, string, Plan, Status, number, number, number][] = [
    ['Acorn Analytics', 'acorn.io', 'Enterprise', 'Active', 110, 1, 0],
    ['Bluebird Freight', 'bluebird.co', 'Pro', 'Active', 120, 2, 1],
    ['Copperleaf', 'copperleaf.com', 'Starter', 'Active', 5, 3, 4],
    ['Driftwood Studio', 'driftwood.studio', 'Starter', 'Active', 3, 0, 9],
    ['Elm & Oak', 'elmandoak.com', 'Pro', 'Active', 95, 1, 2],
    ['Fernhill Foods', 'fernhill.eu', 'Starter', 'Past due', 4, 2, 21],
    ['Granite Labs', 'granitelabs.dev', 'Enterprise', 'Active', 95, 3, 0],
    ['Harbour Supply', 'harboursupply.com', 'Pro', 'Active', 88, 0, 1],
    ['Ironwood', 'ironwood.io', 'Starter', 'Active', 5, 1, 6],
    ['Juniper Health', 'juniper.health', 'Pro', 'Past due', 80, 2, 12],
    ['Kestrel Air', 'kestrel.aero', 'Starter', 'Active', 2, 3, 30],
    ['Lumen Energy', 'lumen.energy', 'Pro', 'Active', 74, 0, 0],
    ['Marlow & Finch', 'marlowfinch.com', 'Starter', 'Active', 5, 1, 3],
    ['Northgate Retail', 'northgate.shop', 'Enterprise', 'Active', 80, 2, 1],
    ['Oakridge Legal', 'oakridge.law', 'Starter', 'Active', 4, 3, 45],
    ['Pinecrest', 'pinecrest.co', 'Pro', 'Active', 70, 0, 5],
    ['Quarry Works', 'quarry.works', 'Starter', 'Active', 5, 1, 2],
    ['Riverbend Media', 'riverbend.media', 'Pro', 'Trial', 10, 2, 0],
    ['Saltmarsh', 'saltmarsh.io', 'Starter', 'Active', 3, 3, 15],
    ['Tidewater', 'tidewater.com', 'Pro', 'Active', 64, 0, 3],
    ['Upland Coffee', 'upland.coffee', 'Starter', 'Active', 5, 1, 60],
    ['Vantage Point', 'vantagepoint.io', 'Pro', 'Past due', 60, 2, 33],
    ['Willow Care', 'willowcare.nl', 'Starter', 'Active', 5, 3, 7],
    ['Yellowfin', 'yellowfin.app', 'Pro', 'Active', 52, 0, 1],
    ['Zephyr Cloud', 'zephyr.cloud', 'Starter', 'Past due', 5, 1, 90],
    ['Alder Bikes', 'alder.bike', 'Starter', 'Active', 2, 2, 11],
    ['Birchway', 'birchway.com', 'Pro', 'Active', 46, 3, 4],
    ['Cobalt Systems', 'cobalt.systems', 'Starter', 'Active', 5, 0, 0],
    ['Dune Travel', 'dune.travel', 'Starter', 'Trial', 5, 1, 2],
    ['Ember Games', 'ember.gg', 'Pro', 'Active', 30, 2, 8],
    ['Foxglove', 'foxglove.design', 'Starter', 'Active', 4, 3, 20],
    ['Gullwing', 'gullwing.io', 'Pro', 'Active', 26, 0, 2],
    ['Heron Books', 'heron.books', 'Starter', 'Active', 5, 1, 100],
    ['Indigo Print', 'indigo.print', 'Starter', 'Active', 3, 2, 5],
    ['Jasper & Lane', 'jasperlane.com', 'Pro', 'Trial', 12, 3, 1],
    ['Kite Robotics', 'kite.ai', 'Starter', 'Active', 5, 0, 14],
    ['Lark Music', 'lark.fm', 'Pro', 'Churned', 0, 1, 120],
    ['Moss Architects', 'moss.archi', 'Starter', 'Active', 5, 2, 25],
];

const months = ['January', 'March', 'May', 'July', 'September', 'November'];

const seenLabel = (days: number) =>
    days === 0
        ? 'Today'
        : days === 1
          ? 'Yesterday'
          : days < 14
            ? `${days} days ago`
            : `${Math.floor(days / 7)} weeks ago`;

/**
 * Every customer of the workspace: the first page above, then the rest. Their monthly revenue adds
 * up to the overview's €48,260, and their statuses to the list's views.
 */
export const allCustomers: Customer[] = [
    ...customers,
    ...more.map(([name, domain, plan, status, seats, owner, seenDays], i) => {
        const manager = owners[owner] ?? owners[0];
        const words = name.split(' ').filter(word => /^\w/.test(word));
        return {
            id: domain.split('.')[0] ?? name,
            name,
            domain,
            initials: words
                .slice(0, 2)
                .map(word => word[0])
                .join('')
                .toUpperCase(),
            plan,
            status,
            seats,
            mrr: monthlyRevenue(plan, seats, status),
            owner: manager?.name ?? '',
            ownerInitials: manager?.initials ?? '',
            seen: seenLabel(seenDays),
            seenDays,
            since: `${months[i % months.length]} ${2022 + (i % 4)}`,
        };
    }),
];

const euro = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

export const formatEuro = (value: number) => euro.format(value);
