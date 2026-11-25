'use client';

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
    PageContent,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarItem,
    SidebarLogo,
    SidebarToggle,
} from '@contui/ui';
import {
    Bell,
    Boxes,
    ChartNoAxesCombined,
    CircleDot,
    Handshake,
    House,
    Inbox,
    LifeBuoy,
    Settings,
    Users,
} from 'lucide-react';
import {
    createContext,
    Fragment,
    type ReactNode,
    useContext,
    useLayoutEffect,
    useState,
} from 'react';

/*
 * The frame the four hero screens share, so they read as one product: Northwind's workspace, one
 * sidebar with its places, a header bar with the trail, the page under it. Each screen is drawn at
 * its real size, never scaled: composed to fill the smallest window it is drawn at (DRAWN in the
 * hero, 1408 × 792), and on a larger one the shell fills it as the app would, the parts that can
 * use the room (useRoom) taking it. Nothing is drawn by hand in colour: every fill, line and corner
 * is a token, so the hero's Customize panel restyles all of it.
 */

export const icon = { strokeWidth: 2 } as const;

export type Place =
    | 'home'
    | 'inbox'
    | 'analytics'
    | 'pipeline'
    | 'issues'
    | 'customers'
    | 'settings';

const places: { id: Place; label: string; icon: ReactNode; count?: number }[] = [
    { id: 'home', label: 'Home', icon: <House {...icon} /> },
    { id: 'inbox', label: 'Inbox', icon: <Inbox {...icon} />, count: 4 },
    { id: 'analytics', label: 'Analytics', icon: <ChartNoAxesCombined {...icon} /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Handshake {...icon} /> },
    { id: 'issues', label: 'Issues', icon: <CircleDot {...icon} /> },
    { id: 'customers', label: 'Customers', icon: <Users {...icon} /> },
];

/** The workspace's mark in the footer account: its initial on the action colour. */
const WorkspaceMark = () => (
    <span className="grid size-full place-items-center bg-action font-medium text-on-action text-xs">
        N
    </span>
);

const HeroSidebar = ({ place }: { place: Place }) => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Boxes {...icon} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Main">
            {places.map(item => (
                <SidebarItem
                    active={place === item.id}
                    icon={item.icon}
                    key={item.id}
                    trailing={item.count ? <Badge variant="count">{item.count}</Badge> : undefined}
                >
                    {item.label}
                </SidebarItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Workspace" label="Workspace">
            <SidebarItem active={place === 'settings'} icon={<Settings {...icon} />}>
                Settings
            </SidebarItem>
            <SidebarItem icon={<LifeBuoy {...icon} />}>Help and support</SidebarItem>
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount avatar={<WorkspaceMark />} name="Northwind" detail="Business plan" />
            <Button aria-label="Notifications" size="icon" variant="ghost">
                <Bell {...icon} />
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
    /** At most two actions for the page as a whole, at the header bar's right. */
    actions?: ReactNode;
    /** Floats at the panel's foot: the dock of views and the page's primary action. */
    bar?: ReactNode;
    /** The page; it lays itself out (a column, or a column beside a sheet). */
    children: ReactNode;
};

/**
 * The height of the page under the header bar, at the smallest size the screens are drawn at (the
 * hero's DRAWN, 1408 × 792: the panel's 776 less the bar's 54). Each screen is composed to fill it.
 */
export const LEAST_ROOM = 722;

const RoomContext = createContext(LEAST_ROOM);

/**
 * How tall the page is. The screens are drawn at their real size and the shell fills a larger
 * window as the app would, so a part that can use the room (a chart's height, a table's rows, a
 * folded group) reads it here rather than leaving it empty.
 */
export const useRoom = () => useContext(RoomContext);

/** One screen of the suite: the shared sidebar, the header bar, the page below it. */
export const Frame = ({ place, trail, actions, bar, children }: FrameProps) => {
    const [page, setPage] = useState<HTMLDivElement | null>(null);
    const [room, setRoom] = useState(LEAST_ROOM);

    useLayoutEffect(() => {
        if (!page) return;
        const measure = () => setRoom(Math.max(LEAST_ROOM, page.clientHeight));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(page);
        return () => observer.disconnect();
    }, [page]);

    return (
        <AppShell className="size-full min-h-0">
            <HeroSidebar place={place} />
            <AppPanel>
                <HeaderBar>
                    <Trail trail={trail} />
                    {actions && <HeaderBarActions>{actions}</HeaderBarActions>}
                </HeaderBar>
                <div
                    className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
                    ref={setPage}
                >
                    <RoomContext.Provider value={room}>{children}</RoomContext.Provider>
                </div>
                {bar}
            </AppPanel>
        </AppShell>
    );
};

/**
 * How far below the header bar a page starts. The system's own 96 (128 on a large screen) once the
 * page is tall enough to spare it; in the least room (a 1440 screen) 40, the compact shell's start,
 * so the picture holds the page rather than the room above it.
 */
export const usePageTop = () => {
    const room = useRoom();
    return room >= 1200 ? 128 : room >= 950 ? 96 : 40;
};

/** The column a page sits in, at its kind's width, starting usePageTop() below the header bar. */
export const Column = ({
    width = 'default',
    className,
    children,
}: {
    width?: 'default' | 'wide';
    className?: string;
    children: ReactNode;
}) => {
    const top = usePageTop();
    return (
        <PageContent
            className={cn('flex w-full flex-col px-6', className)}
            // Inline, over the hero's Shot, which starts every page 40 down.
            style={{ paddingTop: top }}
            width={width}
        >
            {children}
        </PageContent>
    );
};

/**
 * Classes for a part that changes in a compact shell (a phone), where the page is one narrow
 * column. The shell is the container, so the screens follow its width, not the site's.
 */
export const compact = {
    /** A head row that stacks: the words, then the actions under them. */
    stack: '@max-shell-compact/shell:flex-col @max-shell-compact/shell:items-stretch @max-shell-compact/shell:gap-4',
    /** A line that truncates on a wide screen and wraps on a phone, so nothing is cut. */
    wrap: '@max-shell-compact/shell:whitespace-normal @max-shell-compact/shell:text-pretty',
    hidden: '@max-shell-compact/shell:hidden',
} as const;

/**
 * A page's title and its line, with its own actions at the right, bottom-aligned with the line;
 * in a compact shell the actions go under the words, and the title wraps rather than truncates.
 */
export const PageHead = ({
    title,
    description,
    children,
}: {
    title: ReactNode;
    description: ReactNode;
    children?: ReactNode;
}) => (
    <div className={cn('flex items-end justify-between gap-6', compact.stack)}>
        <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className={cn('truncate font-medium text-2xl text-neutral-950', compact.wrap)}>
                {title}
            </h1>
            <p className={cn('truncate text-neutral-600 text-sm', compact.wrap)}>{description}</p>
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
);

/** The people of the workspace, by their initials; the same initials always get the same tone. */
export const people = {
    MC: 'Maya Chen',
    LO: 'Liam Ortiz',
    SK: 'Sara Kim',
    NP: 'Noah Park',
    AR: 'Ana Ruiz',
    TB: 'Tom Becker',
    EB: 'Elena Brandt',
} as const;

export type Initials = keyof typeof people;

export const Person = ({ initials, size = 24 }: { initials: Initials; size?: 24 | 32 | 36 }) => (
    <Avatar alt={people[initials]} fallback={initials} shape="round" size={size} />
);

/** A person as a table shows one: the 24 avatar and the name. */
export const PersonName = ({ initials }: { initials: Initials }) => (
    <span className="flex min-w-0 items-center gap-2 font-normal text-neutral-700">
        <Person initials={initials} />
        <span className="truncate">{people[initials]}</span>
    </span>
);

const euro = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

export const formatEuro = (value: number) => euro.format(value);
