import {
    AppPanel,
    AppShell,
    Avatar,
    Button,
    createThemeVariables,
    DropdownMenuItem,
    DropdownMenuSeparator,
    HeaderBar,
    Input,
    Kbd,
    Sidebar,
    SidebarAccount,
    SidebarBack,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarItem,
    SidebarLevel,
    SidebarLevelHead,
    SidebarLogo,
    SidebarSection,
    SidebarSwitcher,
    SidebarSwitcherMark,
    SidebarToggle,
    StatCard,
    type ThemeOptions,
    useTheme,
} from 'continuum';
import {
    Bell,
    Boxes,
    ChartColumn,
    Check,
    ChevronRight,
    FileText,
    Folder,
    Inbox,
    LayoutDashboard,
    LayoutGrid,
    LifeBuoy,
    Megaphone,
    Plus,
    Search,
    Settings,
    Star,
    Timer,
    Users,
    Workflow,
} from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useStageContainer } from '../../layout';
import { PageHead, Trail } from '../../screens/workspace';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
    Scene,
} from '../kit';

type IconProps = { strokeWidth: number };

/* ---------- The workspace switcher ---------- */

type Workspace = { id: string; name: string; plan: string; color: string };

const workspaces: Workspace[] = [
    { id: 'northwind', name: 'Northwind', plan: 'Pro plan', color: 'var(--color-chart-1)' },
    { id: 'acme', name: 'Acme Corp', plan: 'Starter plan', color: 'var(--color-chart-2)' },
    { id: 'globex', name: 'Globex', plan: 'Enterprise', color: 'var(--color-chart-3)' },
];

const Mark = ({ workspace, size }: { workspace: Workspace; size: 20 | 28 }) => (
    <SidebarSwitcherMark color={workspace.color} size={size}>
        {workspace.name.slice(0, 1)}
    </SidebarSwitcherMark>
);

/** The current workspace under the logo; its menu lists the others, then all of them and a new one. */
const Switcher = ({ iconProps }: { iconProps: IconProps }) => {
    const stage = useStageContainer();
    const [currentId, setCurrentId] = useState('northwind');
    const current = workspaces.find(w => w.id === currentId) ?? (workspaces[0] as Workspace);

    return (
        <SidebarSwitcher
            aria-label={`${current.name}. Switch workspace`}
            container={stage}
            detail={current.plan}
            mark={<Mark size={28} workspace={current} />}
            modal={stage ? false : undefined}
            name={current.name}
        >
            {workspaces.map(workspace => (
                <DropdownMenuItem key={workspace.id} onClick={() => setCurrentId(workspace.id)}>
                    <Mark size={20} workspace={workspace} />
                    <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                    {workspace.id === current.id && (
                        <Check className="size-4 text-neutral-950" {...iconProps} />
                    )}
                </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <LayoutGrid {...iconProps} /> All workspaces
            </DropdownMenuItem>
            <DropdownMenuItem>
                <Plus {...iconProps} /> New workspace
            </DropdownMenuItem>
        </SidebarSwitcher>
    );
};

/* ---------- The drill-in level ---------- */

type IndexGroup = { label: string; items: { id: string; label: string }[] };

const reportGroups: IndexGroup[] = [
    {
        label: 'Sales',
        items: [
            { id: 'revenue', label: 'Revenue' },
            { id: 'invoices-report', label: 'Invoices' },
            { id: 'refunds', label: 'Refunds' },
        ],
    },
    {
        label: 'Customers',
        items: [
            { id: 'churn', label: 'Churn' },
            { id: 'cohorts', label: 'Cohorts' },
        ],
    },
];

/** The groups whose items match the query, each with only those items; empty groups leave. */
const narrow = (groups: readonly IndexGroup[], query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
        .map(group => ({
            ...group,
            items: group.items.filter(item => item.label.toLowerCase().includes(q)),
        }))
        .filter(group => group.items.length > 0);
};

/** Reports' index as a level of its own: the back row, a search, the groups. */
const ReportsLevel = ({
    active,
    groupCounts,
    iconProps,
    onBack,
    onPick,
}: {
    active: string;
    groupCounts: boolean;
    iconProps: IconProps;
    onBack: () => void;
    onPick: (id: string) => void;
}) => {
    const [query, setQuery] = useState('');
    const shown = narrow(reportGroups, query);

    return (
        <SidebarLevel>
            <SidebarLevelHead>
                <SidebarBack backLabel="Back to the menu" onClick={onBack}>
                    Reports
                </SidebarBack>
                {/* 9 inside the hairline makes a nav row's 10, so its icon sits over the nav icons. */}
                <Input
                    aria-label="Search reports"
                    className="pr-2 pl-2.25"
                    leadingIcon={<Search {...iconProps} />}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Search reports"
                    size="sm"
                    value={query}
                />
            </SidebarLevelHead>
            {shown.length > 0 ? (
                shown.map(group => (
                    <SidebarGroup
                        aria-label={group.label}
                        count={groupCounts ? group.items.length : undefined}
                        key={group.label}
                        label={group.label}
                    >
                        {group.items.map(item => (
                            <SidebarItem
                                active={item.id === active}
                                key={item.id}
                                onClick={() => onPick(item.id)}
                            >
                                {item.label}
                            </SidebarItem>
                        ))}
                    </SidebarGroup>
                ))
            ) : (
                <p className="px-4.5 py-2 text-neutral-600 text-xs">Nothing matches</p>
            )}
        </SidebarLevel>
    );
};

/* ---------- Foldouts inside foldouts ---------- */

type Page = { id: string; label: string; icon?: ReactNode; pages?: Page[] };

const pageIcons = [FileText, Users, Megaphone, Workflow, Star, Timer, Folder, Inbox];

/**
 * A tree of sections to try the foldout on: `lots` gives each section more pages and more sections
 * beside it, `depth` how many foldouts sit inside each other.
 */
const tree = (lots: boolean, depth: number, withIcons: boolean, iconProps: IconProps): Page[] => {
    const names = [
        [
            'Q1 growth campaign',
            'Retention push',
            'Partner launch',
            'Spring sale',
            'Onboarding revamp',
        ],
        ['Campaigns', 'Automations', 'Templates', 'Audiences', 'Reports', 'Settings'],
        ['Drafts', 'Scheduled', 'Sent', 'Archived'],
        ['This week', 'Last week', 'Earlier'],
    ];
    const build = (level: number, prefix: string): Page[] => {
        const list = names[Math.min(level, names.length - 1)] ?? [];
        const count = level === 0 ? (lots ? 5 : 2) : lots ? list.length : 2;
        return list.slice(0, count).map((label, i) => {
            const id = `${prefix}${i}`;
            const Icon = pageIcons[(level + i) % pageIcons.length] ?? FileText;
            // Every second row at a level opens to the next, while there are levels left.
            const opens = level < depth - 1 && (level === 0 || i % 2 === 0);
            return {
                id,
                label,
                icon: level === 0 || withIcons ? <Icon {...iconProps} /> : undefined,
                pages: opens ? build(level + 1, `${id}-`) : undefined,
            };
        });
    };
    return build(0, 's');
};

/** The id of the first page at a depth, following the first foldout at each level. */
const firstAt = (pages: Page[], depth: number): string | undefined => {
    let level = pages;
    for (let i = 0; i < depth; i++) {
        const open = level.find(page => page.pages);
        if (!open?.pages) return level[0]?.id;
        level = open.pages;
    }
    return level.find(page => !page.pages)?.id ?? level[0]?.id;
};

const SectionTree = ({
    pages,
    active,
    onPick,
    level,
    counts,
}: {
    pages: Page[];
    active: string;
    onPick: (id: string) => void;
    level: number;
    counts: boolean;
}): ReactNode =>
    pages.map(page =>
        page.pages ? (
            // All open to start, so every level is in view; close one to see a closed section that holds the page.
            <SidebarSection
                count={counts ? page.pages.length : undefined}
                defaultOpen
                icon={page.icon}
                key={page.id}
                label={page.label}
            >
                <SectionTree
                    active={active}
                    counts={counts}
                    level={level + 1}
                    onPick={onPick}
                    pages={page.pages}
                />
            </SidebarSection>
        ) : (
            <SidebarItem
                active={page.id === active}
                icon={page.icon}
                key={page.id}
                onClick={() => onPick(page.id)}
                variant={level === 0 ? 'default' : 'inset'}
            >
                {page.label}
            </SidebarItem>
        ),
    );

/* ---------- The whole sidebar ---------- */

type Groups = 'flat' | 'labelled' | 'folding';

type SidebarOptions = {
    switcher: boolean;
    groups: Groups;
    drilled: boolean;
    /** How Reports opens: into a level of its own, or folding its pages out under it. */
    reports: 'drill' | 'fold';
    /** The foldouts: how deep they go, how many pages, whether pages carry icons, where the reader is. */
    foldouts: { depth: number; lots: boolean; icons: boolean; at: number };
    itemCounts: boolean;
    groupCounts: boolean;
    shortcuts: boolean;
    footer: boolean;
    /** A hairline round it: the sidebar as a panel of its own. */
    bordered?: boolean;
};

/** Reports' pages when it folds out: a few, so they fit under it. */
const reportPages = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'invoices-report', label: 'Invoices' },
    { id: 'refunds', label: 'Refunds' },
];

const FullSidebar = ({
    options,
    iconProps,
    className,
    style,
    onDrill,
}: {
    options: SidebarOptions;
    iconProps: IconProps;
    className?: string;
    style?: CSSProperties;
    /** Told when the sidebar drills in or comes back, so a knob or the page can follow. */
    onDrill?: (drilled: boolean) => void;
}) => {
    const { depth, lots, icons: pageIconsOn, at } = options.foldouts;
    const sections = useMemo(
        () => tree(lots, depth, pageIconsOn, iconProps),
        [lots, depth, pageIconsOn, iconProps],
    );
    const start = options.drilled
        ? 'revenue'
        : options.groups === 'folding' && at > 0
          ? (firstAt(sections, at) ?? 'overview')
          : 'overview';
    const [drilled, setDrilled] = useState(options.drilled);
    const [active, setActive] = useState(start);
    // A change of knob moves the sidebar to that level and page, even after it was clicked elsewhere.
    useEffect(() => {
        setDrilled(options.drilled);
        setActive(start);
    }, [options.drilled, start]);
    const drill = (next: boolean) => {
        setDrilled(next);
        onDrill?.(next);
    };

    const { groups, itemCounts, groupCounts, shortcuts } = options;
    const row = (
        id: string,
        label: string,
        Icon: typeof Inbox,
        more: { count?: number; trailing?: ReactNode; onClick?: () => void } = {},
    ) => (
        <SidebarItem
            active={active === id}
            count={more.count}
            icon={<Icon {...iconProps} />}
            key={id}
            onClick={more.onClick ?? (() => setActive(id))}
            trailing={more.trailing}
        >
            {label}
        </SidebarItem>
    );

    const places = [
        row('overview', 'Overview', LayoutDashboard, {
            trailing: shortcuts ? <Kbd>O</Kbd> : undefined,
        }),
        row('customers', 'Customers', Users, { trailing: shortcuts ? <Kbd>C</Kbd> : undefined }),
        // Counts only where things wait for the reader.
        row('inbox', 'Inbox', Inbox, { count: itemCounts ? 4 : undefined }),
        row('invoices', 'Invoices', FileText, { count: itemCounts ? 12 : undefined }),
        // Reports either drills into a level of its own (a long index, with its own search) or
        // folds its few pages out under it, in place.
        options.reports === 'fold' ? (
            <SidebarSection
                count={groupCounts ? reportPages.length : undefined}
                defaultOpen
                icon={<ChartColumn {...iconProps} />}
                key="reports"
                label="Reports"
            >
                {reportPages.map(page => (
                    <SidebarItem
                        active={active === page.id}
                        key={page.id}
                        onClick={() => setActive(page.id)}
                        variant="inset"
                    >
                        {page.label}
                    </SidebarItem>
                ))}
            </SidebarSection>
        ) : (
            row('reports', 'Reports', ChartColumn, {
                trailing: <ChevronRight className="text-neutral-500" {...iconProps} />,
                onClick: () => drill(true),
            })
        ),
    ];
    const workspaceRows = [
        row('settings', 'Settings', Settings),
        row('help', 'Help and support', LifeBuoy),
    ];

    const top = (
        <SidebarLevel from="start">
            {groups === 'flat' ? (
                <SidebarGroup aria-label="Main">
                    {places}
                    {workspaceRows}
                </SidebarGroup>
            ) : (
                <>
                    <SidebarGroup aria-label="Main">{places}</SidebarGroup>
                    {groups === 'folding' ? (
                        <SidebarGroup
                            aria-label="Campaigns"
                            count={groupCounts ? sections.length : undefined}
                            label="Campaigns"
                        >
                            <SectionTree
                                active={active}
                                counts={groupCounts}
                                level={0}
                                onPick={setActive}
                                pages={sections}
                            />
                        </SidebarGroup>
                    ) : (
                        <SidebarGroup
                            aria-label="Workspace"
                            count={groupCounts ? workspaceRows.length : undefined}
                            label="Workspace"
                        >
                            {workspaceRows}
                        </SidebarGroup>
                    )}
                </>
            )}
        </SidebarLevel>
    );

    return (
        <Sidebar bordered={options.bordered} className={className} style={style}>
            <SidebarHeader>
                <SidebarLogo>
                    <Boxes {...iconProps} />
                </SidebarLogo>
                <SidebarToggle />
            </SidebarHeader>
            {options.switcher && <Switcher iconProps={iconProps} />}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
                {drilled ? (
                    <ReportsLevel
                        active={active}
                        groupCounts={groupCounts}
                        iconProps={iconProps}
                        key="reports"
                        onBack={() => drill(false)}
                        onPick={setActive}
                    />
                ) : (
                    <div className="contents" key="top">
                        {top}
                    </div>
                )}
            </div>
            {options.footer && (
                <SidebarFooter>
                    <SidebarAccount
                        avatar={<Avatar fallback="JC" />}
                        detail="Business"
                        name="Jane Cooper"
                    />
                    <Button aria-label="Notifications" size="icon-sm" variant="ghost">
                        <Bell {...iconProps} />
                    </Button>
                </SidebarFooter>
            )}
        </Sidebar>
    );
};

/* ---------- Preview ---------- */

const sidebarKnobs: Knob[] = [
    { id: 'switcher', label: 'Switcher', switch: true, default: true },
    {
        id: 'reports',
        label: 'Reports',
        options: [o('drill', 'Drills in'), o('fold', 'Folds out')],
        default: 'drill',
    },
    {
        id: 'level',
        label: 'Level',
        options: [o('top', 'Top'), o('drilled', 'Drilled in')],
        default: 'top',
        when: values => values.reports === 'drill',
    },
    {
        id: 'groups',
        label: 'Groups',
        options: [o('flat', 'Flat'), o('labelled', 'Labelled'), o('folding', 'Folding')],
        default: 'folding',
        when: values => values.reports === 'fold' || values.level === 'top',
    },
    {
        id: 'depth',
        label: 'Foldouts',
        options: [o('1', 'None'), o('2', 'One deep'), o('3', 'Two deep'), o('4', 'Three deep')],
        default: '3',
        when: values =>
            values.groups === 'folding' && (values.reports === 'fold' || values.level === 'top'),
    },
    {
        id: 'data',
        label: 'Data',
        options: [o('few', 'A few'), o('lots', 'Lots')],
        default: 'few',
        when: values =>
            values.groups === 'folding' && (values.reports === 'fold' || values.level === 'top'),
    },
    {
        id: 'at',
        label: 'Active page',
        options: [o('0', 'Top level'), o('1', 'In a foldout'), o('3', 'Deepest')],
        default: '1',
        when: values =>
            values.groups === 'folding' && (values.reports === 'fold' || values.level === 'top'),
    },
    {
        id: 'icons',
        label: 'Icons on pages',
        switch: true,
        default: false,
        when: values =>
            values.groups === 'folding' && (values.reports === 'fold' || values.level === 'top'),
    },
    {
        id: 'itemCounts',
        label: 'Item counts',
        switch: true,
        default: true,
        when: values => values.reports === 'fold' || values.level === 'top',
    },
    {
        id: 'groupCounts',
        label: 'Group counts',
        switch: true,
        default: false,
        when: values =>
            values.reports === 'fold' || values.level === 'drilled' || values.groups !== 'flat',
    },
    {
        id: 'shortcuts',
        label: 'Shortcuts',
        switch: true,
        default: true,
        when: values => values.reports === 'fold' || values.level === 'top',
    },
    { id: 'footer', label: 'Footer', switch: true, default: true },
    { id: 'border', label: 'Border', switch: true, default: false },
    {
        id: 'look',
        label: 'Look',
        options: [o('quiet', 'Quiet'), o('tinted', 'Tinted'), o('raised', 'Raised')],
        default: 'quiet',
    },
];

const SidebarPreview = ({ knobs }: PreviewProps) => {
    const { mode } = useTheme();
    // The look as a theme writes it: only its sidebar tokens, on this piece of the canvas.
    const look = String(knobs.look) as NonNullable<ThemeOptions['nav']>;
    const style = useMemo(() => {
        const { light, dark } = createThemeVariables({ nav: look });
        return (mode === 'dark' ? { ...light, ...dark } : light) as CSSProperties;
    }, [look, mode]);

    return (
        // On a piece of the canvas, as a sidebar sits on it, rather than loose on the surface.
        <FullSidebar
            // A piece of canvas on item corners; bordered, the sidebar draws its own panel corners.
            className={knobs.border ? 'h-190 bg-neutral-100' : 'h-190 rounded-item bg-neutral-100'}
            iconProps={previewIcon}
            options={{
                switcher: Boolean(knobs.switcher),
                groups: String(knobs.groups) as Groups,
                drilled: knobs.reports === 'drill' && knobs.level === 'drilled',
                reports: knobs.reports === 'fold' ? 'fold' : 'drill',
                foldouts: {
                    depth: Number(knobs.depth ?? 3),
                    lots: knobs.data === 'lots',
                    icons: Boolean(knobs.icons),
                    at: Number(knobs.at ?? 1),
                },
                itemCounts: Boolean(knobs.itemCounts),
                groupCounts: Boolean(knobs.groupCounts),
                shortcuts: Boolean(knobs.shortcuts),
                footer: Boolean(knobs.footer),
                bordered: Boolean(knobs.border),
            }}
            style={style}
        />
    );
};

export const entry: Entry = {
    id: 'sidebar',
    name: 'Sidebar',
    category: 'frame',
    description:
        'The app’s sidebar: a header with the logo and a workspace switcher, labelled groups of sidebar items (each a row with an icon, a count or a shortcut), sections that fold open to their pages, places that drill into a level of their own, and the account at the foot.',
    hero: 'min-h-205',
    knobs: sidebarKnobs,
    Preview: SidebarPreview,
};

/* ---------- In use ---------- */

const InApp = () => {
    const [drilled, setDrilled] = useState(false);

    return (
        <Scene className="p-0">
            <div className="absolute inset-0">
                <AppShell className="h-full min-h-0 w-full">
                    <FullSidebar
                        iconProps={icon}
                        onDrill={setDrilled}
                        options={{
                            switcher: true,
                            groups: 'folding',
                            drilled: false,
                            reports: 'drill',
                            foldouts: { depth: 3, lots: false, icons: false, at: 0 },
                            itemCounts: true,
                            groupCounts: false,
                            shortcuts: false,
                            footer: true,
                        }}
                    />
                    <AppPanel>
                        <HeaderBar>
                            <Trail trail={[drilled ? 'Reports' : 'Overview']} />
                        </HeaderBar>
                        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden @max-shell-compact/shell:px-4 px-10 @max-shell-compact/shell:pt-10 pt-10">
                            <PageHead
                                description="Northwind, week of 19 October."
                                title={drilled ? 'Reports' : 'Overview'}
                            />
                            <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
                                <StatCard delta="+12.4%" label="Revenue" value="€48,210" />
                                <StatCard delta="+3" label="New customers" value="27" />
                                <StatCard delta="−1.2%" label="Churn" trend="down" value="2.4%" />
                            </div>
                        </div>
                    </AppPanel>
                </AppShell>
            </div>
        </Scene>
    );
};

export const inUse: InUse = {
    title: 'In an app',
    note: 'The workspace under the logo, the places with their counts, projects that fold open, Reports drilling into its index, the account.',
    bare: true,
    render: () => <InApp />,
};
