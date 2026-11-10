import {
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
    HeaderBar,
    HeaderBarActions,
    Input,
    Kbd,
    NavItem,
    PageContent,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarToggle,
    StatusDot,
    type StatusDotTone,
} from 'continuum';
import {
    Bell,
    ChartNoAxesCombined,
    ChevronsUpDown,
    CircleDot,
    Handshake,
    Inbox,
    LayoutDashboard,
    Search,
    Settings,
    Users,
} from 'lucide-react';
import { Fragment, type ReactNode } from 'react';

/*
 * The frame every hero screen shares, so the four read as one product suite: Northwind's
 * workspace, one sidebar with a workspace switcher and the places with their counts, a header
 * bar with the trail and a search. Nothing is drawn by hand in colour: every fill, line and
 * corner is a token, so the hero's Customize panel restyles all of it.
 */

export const icon = { strokeWidth: 2 } as const;

export type Place = 'home' | 'inbox' | 'analytics' | 'pipeline' | 'issues' | 'customers';

const places: { id: Place; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'home', label: 'Home', icon: <LayoutDashboard {...icon} /> },
    { id: 'inbox', label: 'Inbox', icon: <Inbox {...icon} />, count: 12 },
    { id: 'analytics', label: 'Analytics', icon: <ChartNoAxesCombined {...icon} /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Handshake {...icon} />, count: 28 },
    { id: 'issues', label: 'Issues', icon: <CircleDot {...icon} />, count: 24 },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
];

const views: { label: string; tone: StatusDotTone; count?: number }[] = [
    { label: 'Enterprise accounts', tone: 'primary', count: 18 },
    { label: 'Renewals this quarter', tone: 'warning', count: 7 },
    { label: 'Launch: Billing v2', tone: 'success' },
    { label: 'Churn risk', tone: 'error', count: 3 },
];

/** The workspace switcher at the top of the sidebar: the mark, the name, and the chevrons that switch it. */
const WorkspaceSwitcher = () => (
    <button
        className="flex h-control min-w-0 flex-1 items-center gap-2 rounded-item px-1.5 text-left transition-[background-color] duration-150 hover:bg-neutral-950/5"
        data-slot="workspace-switcher"
        type="button"
    >
        <span className="grid size-6 shrink-0 place-items-center rounded-chip bg-action font-medium text-on-action text-xxs">
            N
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-neutral-950 text-xs">
            Northwind
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-neutral-500" {...icon} />
    </button>
);

const HeroSidebar = ({ place }: { place: Place }) => (
    <Sidebar className="w-60">
        <SidebarHeader className="gap-2 pr-3">
            <WorkspaceSwitcher />
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Main">
            {places.map(item => (
                <NavItem
                    active={place === item.id}
                    icon={item.icon}
                    key={item.id}
                    trailing={
                        item.count ? (
                            <Badge className="min-w-0" variant="count">
                                {item.count}
                            </Badge>
                        ) : undefined
                    }
                >
                    {item.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Views" label="Views">
            {views.map(view => (
                <NavItem
                    icon={
                        <span className="grid size-4 place-items-center">
                            <StatusDot size="sm" tone={view.tone} />
                        </span>
                    }
                    key={view.label}
                    trailing={
                        view.count ? (
                            <span className="text-neutral-500 text-xxs tabular-nums">
                                {view.count}
                            </span>
                        ) : undefined
                    }
                >
                    {view.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace">
            <NavItem icon={<Settings {...icon} />}>Settings</NavItem>
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={<Avatar fallback="MC" shape="round" size={36} />}
                name="Maya Chen"
                plan="Business plan"
            />
            <Button aria-label="Notifications" size="icon" variant="ghost">
                <Bell className="size-4.5" {...icon} />
            </Button>
        </SidebarFooter>
    </Sidebar>
);

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

type FrameProps = {
    place: Place;
    trail: string[];
    /** Extra actions in the header bar, before the search. */
    actions?: ReactNode;
    /** Floats at the panel's foot: the dock of views and the page's primary action. */
    bar?: ReactNode;
    /** The page; it lays itself out (a column, or panes). */
    children: ReactNode;
};

/** One screen of the suite: the shared sidebar, the header bar, the page below it. */
export const Frame = ({ place, trail, actions, bar, children }: FrameProps) => (
    <AppShell className="h-full min-h-0 w-full min-w-[1280px]">
        <HeroSidebar place={place} />
        <AppPanel>
            <HeaderBar>
                <Trail trail={trail} />
                <HeaderBarActions>
                    {actions}
                    <Input
                        aria-label="Search"
                        className="w-56"
                        leadingIcon={<Search {...icon} />}
                        placeholder="Search"
                        size="sm"
                        trailing={<Kbd>⌘K</Kbd>}
                    />
                </HeaderBarActions>
            </HeaderBar>
            <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
            {bar}
        </AppPanel>
    </AppShell>
);

/** The column a page sits in; the hero's frame starts it 40 below the header bar and crops the rest. */
export const Column = ({
    width = 'default',
    className,
    children,
}: {
    width?: 'default' | 'wide' | 'dense' | 'full';
    className?: string;
    children: ReactNode;
}) => (
    <div className="min-h-0 flex-1 overflow-hidden">
        <PageContent className={cn('flex flex-col gap-10 pb-24', className)} width={width}>
            {children}
        </PageContent>
    </div>
);

/** A page's title and its line, with its own actions at the right. */
export const PageHead = ({
    title,
    badge,
    description,
    children,
}: {
    title: ReactNode;
    badge?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
}) => (
    <div className="flex items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <h1 className="truncate font-medium text-2xl text-neutral-950">{title}</h1>
                {badge}
            </div>
            {description && <p className="truncate text-neutral-600 text-sm">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
);

/** A person: the same initials always get the same tone. */
export const Person = ({ initials, size = 24 }: { initials: string; size?: 24 | 32 | 36 }) => (
    <Avatar fallback={initials} shape="round" size={size} />
);

const euro = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

export const formatEuro = (value: number) => euro.format(value);

/** €1.2M, €84k: a compact figure for totals. */
export const formatCompact = (value: number) =>
    value >= 1_000_000
        ? `€${(value / 1_000_000).toFixed(2)}M`
        : value >= 1000
          ? `€${Math.round(value / 1000)}k`
          : formatEuro(value);
