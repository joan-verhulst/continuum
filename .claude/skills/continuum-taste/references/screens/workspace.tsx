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
    Users,
} from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { AccountFooter, WorkspaceMark } from './shared';

/*
 * The generic app every screen belongs to: one workspace with one sidebar, a
 * header bar that shows where the page sits, and the page in a centred column.
 * Nothing in it is drawn by hand: every colour, corner and font is a token, so
 * a previewed theme changes all of it at once.
 */

const icon = { strokeWidth: 2 } as const;

export type Place = 'overview' | 'customers' | 'invoices' | 'reports' | 'inbox' | 'settings';

const places: { id: Place; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt {...icon} /> },
    { id: 'reports', label: 'Reports', icon: <ChartColumn {...icon} /> },
    { id: 'inbox', label: 'Inbox', icon: <Inbox {...icon} />, count: 4 },
];

/**
 * The sidebar every screen shares: the places, settings and the account. It holds no action of
 * its own: each page has its one primary action, and a second here would make two.
 */
const WorkspaceSidebar = ({ place }: { place: Place }) => (
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
                    trailing={item.count ? <Badge variant="count">{item.count}</Badge> : undefined}
                >
                    {item.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace" label="Workspace">
            <NavItem active={place === 'settings'} icon={<Settings {...icon} />}>
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

/** Where the page sits: the home, then each step down to the page itself. */
const Trail = ({ trail }: { trail: string[] }) => (
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink href="#">
                    <BreadcrumbHome />
                </BreadcrumbLink>
            </BreadcrumbItem>
            {trail.map((crumb, i) => (
                <Fragment key={crumb}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        {i === trail.length - 1 ? (
                            <BreadcrumbPage>{crumb}</BreadcrumbPage>
                        ) : (
                            <BreadcrumbLink href="#">{crumb}</BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                </Fragment>
            ))}
        </BreadcrumbList>
    </Breadcrumb>
);

type WorkspaceProps = {
    place: Place;
    trail: string[];
    /** The column's width, as dense as the page is: 896 unless a table needs the room. */
    width?: 'narrow' | 'default' | 'wide' | 'dense';
    /** A bar floating at the panel's foot, over the page as it scrolls: bulk actions, say. */
    bar?: ReactNode;
    children: ReactNode;
};

/** One screen of the app: the shared sidebar, the trail in the header bar, the page below it. */
export const Workspace = ({ place, trail, width = 'default', bar, children }: WorkspaceProps) => (
    <AppShell className="h-full min-h-0 min-w-[1280px]">
        <WorkspaceSidebar place={place} />
        <AppPanel>
            <HeaderBar>
                <Trail trail={trail} />
            </HeaderBar>
            <div className="min-h-0 flex-1 overflow-auto">
                <PageContent className="flex flex-col gap-10 pb-24" width={width}>
                    {children}
                </PageContent>
            </div>
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

export type Customer = {
    id: string;
    name: string;
    domain: string;
    initials: string;
    plan: 'Starter' | 'Pro' | 'Enterprise';
    status: Status;
    /** Monthly recurring revenue, in euros. */
    mrr: number;
    owner: string;
    ownerInitials: string;
    seen: string;
};

export const customers: Customer[] = [
    {
        id: 'northwind',
        name: 'Northwind Traders',
        domain: 'northwind.com',
        initials: 'NT',
        plan: 'Enterprise',
        status: 'Active',
        mrr: 4800,
        owner: 'Maya Chen',
        ownerInitials: 'MC',
        seen: '2 min ago',
    },
    {
        id: 'globex',
        name: 'Globex',
        domain: 'globex.io',
        initials: 'GX',
        plan: 'Pro',
        status: 'Active',
        mrr: 1240,
        owner: 'Liam Ortiz',
        ownerInitials: 'LO',
        seen: '18 min ago',
    },
    {
        id: 'initech',
        name: 'Initech',
        domain: 'initech.co',
        initials: 'IN',
        plan: 'Pro',
        status: 'Past due',
        mrr: 980,
        owner: 'Sara Kim',
        ownerInitials: 'SK',
        seen: '1 hour ago',
    },
    {
        id: 'umbrella',
        name: 'Umbrella Health',
        domain: 'umbrella.health',
        initials: 'UH',
        plan: 'Enterprise',
        status: 'Active',
        mrr: 6200,
        owner: 'Maya Chen',
        ownerInitials: 'MC',
        seen: '3 hours ago',
    },
    {
        id: 'hooli',
        name: 'Hooli',
        domain: 'hooli.xyz',
        initials: 'HO',
        plan: 'Starter',
        status: 'Trial',
        mrr: 0,
        owner: 'Liam Ortiz',
        ownerInitials: 'LO',
        seen: 'Yesterday',
    },
    {
        id: 'soylent',
        name: 'Soylent Labs',
        domain: 'soylent.dev',
        initials: 'SL',
        plan: 'Pro',
        status: 'Active',
        mrr: 1560,
        owner: 'Noah Patel',
        ownerInitials: 'NP',
        seen: 'Yesterday',
    },
    {
        id: 'stark',
        name: 'Stark Logistics',
        domain: 'starklogistics.com',
        initials: 'SK',
        plan: 'Enterprise',
        status: 'Active',
        mrr: 5400,
        owner: 'Sara Kim',
        ownerInitials: 'SK',
        seen: '2 days ago',
    },
    {
        id: 'wayne',
        name: 'Wayne Studio',
        domain: 'waynestudio.co',
        initials: 'WS',
        plan: 'Starter',
        status: 'Trial',
        mrr: 0,
        owner: 'Noah Patel',
        ownerInitials: 'NP',
        seen: '3 days ago',
    },
    {
        id: 'cyberdyne',
        name: 'Cyberdyne',
        domain: 'cyberdyne.ai',
        initials: 'CY',
        plan: 'Pro',
        status: 'Churned',
        mrr: 0,
        owner: 'Liam Ortiz',
        ownerInitials: 'LO',
        seen: '2 weeks ago',
    },
    {
        id: 'tyrell',
        name: 'Tyrell & Co',
        domain: 'tyrell.co',
        initials: 'TC',
        plan: 'Starter',
        status: 'Active',
        mrr: 290,
        owner: 'Maya Chen',
        ownerInitials: 'MC',
        seen: '5 min ago',
    },
];

const euro = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

export const formatEuro = (value: number) => euro.format(value);
