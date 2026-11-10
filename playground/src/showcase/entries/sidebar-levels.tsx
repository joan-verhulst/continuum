import {
    AppPanel,
    AppShell,
    Avatar,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    HeaderBar,
    Input,
    NavItem,
    Sidebar,
    SidebarAccount,
    SidebarBack,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLevel,
    SidebarLevelHead,
    SidebarLogo,
    SidebarToggle,
} from 'continuum';
import {
    BookOpen,
    Boxes,
    ChartColumn,
    ChevronRight,
    House,
    LayoutDashboard,
    LayoutGrid,
    LayoutTemplate,
    Palette,
    Receipt,
    Search,
    Users,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { PageHead } from '../../screens/workspace';
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

type IndexGroup = { label: string; items: { id: string; label: string }[] };

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

/** A group's label with how many it holds at its end, in the label's colour. */
const counted = (label: string, count: number, show: boolean) =>
    show ? (
        <span className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">{label}</span>
            <span className="shrink-0 tabular-nums">{count}</span>
        </span>
    ) : (
        label
    );

type DrilledProps = {
    name: string;
    groups: readonly IndexGroup[];
    active?: string;
    search?: string;
    counts: boolean;
    iconProps: { strokeWidth: number };
    onBack: () => void;
    onPick: (id: string) => void;
};

/** A place's index as a level of its own: the back row, a search if it has one, the groups. */
const DrilledLevel = ({
    name,
    groups,
    active,
    search,
    counts,
    iconProps,
    onBack,
    onPick,
}: DrilledProps) => {
    const [query, setQuery] = useState('');
    const shown = narrow(groups, search ? query : '');

    return (
        <SidebarLevel key={`index-${name}`}>
            {/* The back row and the search stay put while the list scrolls under them. */}
            <SidebarLevelHead>
                <SidebarBack backLabel="Back to the menu" onClick={onBack}>
                    {name}
                </SidebarBack>
                {/* 9 inside the hairline makes a nav row's 10, so its icon sits over the nav icons. */}
                {search && (
                    <Input
                        aria-label={search}
                        className="pr-2 pl-2.25"
                        leadingIcon={<Search {...iconProps} />}
                        onChange={event => setQuery(event.target.value)}
                        placeholder={search}
                        size="sm"
                        value={query}
                    />
                )}
            </SidebarLevelHead>
            {shown.length > 0 ? (
                shown.map(group => (
                    <SidebarGroup
                        aria-label={group.label}
                        key={group.label}
                        label={counted(group.label, group.items.length, counts)}
                    >
                        {group.items.map(item => (
                            <NavItem
                                active={item.id === active}
                                key={item.id}
                                onClick={() => onPick(item.id)}
                            >
                                {item.label}
                            </NavItem>
                        ))}
                    </SidebarGroup>
                ))
            ) : (
                <p className="px-4.5 py-2 text-neutral-600 text-xs">Nothing matches</p>
            )}
        </SidebarLevel>
    );
};

/* ---------- Preview ---------- */

const levelKnobs: Knob[] = [
    {
        id: 'level',
        label: 'Level',
        options: [o('top', 'Top'), o('drilled', 'Drilled')],
        default: 'drilled',
    },
    {
        id: 'search',
        label: 'Search',
        switch: true,
        default: true,
        when: values => values.level === 'drilled',
    },
    {
        id: 'counts',
        label: 'Counts',
        switch: true,
        default: true,
        when: values => values.level === 'drilled',
    },
];

const reportGroups: IndexGroup[] = [
    {
        label: 'Sales',
        items: [
            { id: 'revenue', label: 'Revenue' },
            { id: 'invoices', label: 'Invoices' },
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

const LevelsPreview = ({ knobs }: PreviewProps) => {
    const [drilled, setDrilled] = useState(knobs.level === 'drilled');
    const [active, setActive] = useState('revenue');
    // Turning the knob moves the sidebar to that level, even after it was clicked elsewhere.
    useEffect(() => setDrilled(knobs.level === 'drilled'), [knobs.level]);

    return (
        // On a piece of the canvas, as a sidebar sits on it, rather than loose on the surface.
        <Sidebar className="h-100 rounded-item bg-neutral-100">
            <SidebarHeader>
                <SidebarLogo>
                    <Boxes {...previewIcon} />
                </SidebarLogo>
                <SidebarToggle />
            </SidebarHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
                {drilled ? (
                    <DrilledLevel
                        active={active}
                        counts={Boolean(knobs.counts)}
                        groups={reportGroups}
                        iconProps={previewIcon}
                        name="Reports"
                        onBack={() => setDrilled(false)}
                        onPick={setActive}
                        search={knobs.search ? 'Search reports' : undefined}
                    />
                ) : (
                    <SidebarLevel from="start" key="top">
                        <SidebarGroup aria-label="Main">
                            <NavItem icon={<LayoutDashboard {...previewIcon} />}>Overview</NavItem>
                            <NavItem icon={<Users {...previewIcon} />}>Customers</NavItem>
                            <NavItem icon={<Receipt {...previewIcon} />}>Invoices</NavItem>
                            <NavItem
                                active
                                icon={<ChartColumn {...previewIcon} />}
                                onClick={() => setDrilled(true)}
                                trailing={
                                    <ChevronRight className="text-neutral-500" {...previewIcon} />
                                }
                            >
                                Reports
                            </NavItem>
                        </SidebarGroup>
                    </SidebarLevel>
                )}
            </div>
        </Sidebar>
    );
};

export const entry: Entry = {
    id: 'sidebar-levels',
    name: 'Sidebar levels',
    category: 'frame',
    description: 'A place with a long index drills into a level of its own, with a way back.',
    hero: 'min-h-115',
    knobs: levelKnobs,
    Preview: LevelsPreview,
};

/* ---------- In use ---------- */

const componentGroups: IndexGroup[] = [
    {
        label: 'Frame',
        items: [
            { id: 'sidebar', label: 'Sidebar' },
            { id: 'top-nav', label: 'Top nav' },
            { id: 'rail', label: 'Rail' },
            { id: 'header-bar', label: 'Header bar' },
        ],
    },
    {
        label: 'Actions',
        items: [
            { id: 'button', label: 'Button' },
            { id: 'toolbar', label: 'Toolbar' },
            { id: 'menu', label: 'Menu' },
        ],
    },
    {
        label: 'Inputs',
        items: [
            { id: 'input', label: 'Input' },
            { id: 'select', label: 'Select' },
            { id: 'combobox', label: 'Combobox' },
            { id: 'checkbox', label: 'Checkbox' },
            { id: 'switch', label: 'Switch' },
        ],
    },
];

const allComponents = componentGroups.flatMap(group => group.items);

const library: { id: string; label: string; icon: ReactNode; drills?: boolean }[] = [
    { id: 'foundations', label: 'Foundations', icon: <Palette {...icon} /> },
    { id: 'components', label: 'Components', icon: <LayoutGrid {...icon} />, drills: true },
    { id: 'patterns', label: 'Patterns', icon: <LayoutTemplate {...icon} /> },
];

const DocsSidebar = () => {
    const [drilled, setDrilled] = useState(true);
    const [active, setActive] = useState('button');
    const page = allComponents.find(item => item.id === active);

    return (
        <Scene className="p-0">
            <div className="absolute inset-0">
                <AppShell className="h-full min-h-0 w-full">
                    <Sidebar>
                        <SidebarHeader>
                            <SidebarLogo>
                                <BookOpen {...icon} />
                            </SidebarLogo>
                            <SidebarToggle />
                        </SidebarHeader>
                        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3">
                            {drilled ? (
                                <DrilledLevel
                                    active={active}
                                    counts
                                    groups={componentGroups}
                                    iconProps={icon}
                                    name="Components"
                                    onBack={() => setDrilled(false)}
                                    onPick={setActive}
                                    search="Search components"
                                />
                            ) : (
                                <SidebarLevel from="start" key="top">
                                    <SidebarGroup aria-label="Home">
                                        <NavItem icon={<House {...icon} />}>Home</NavItem>
                                    </SidebarGroup>
                                    <SidebarGroup aria-label="Library" label="Library">
                                        {library.map(place => (
                                            <NavItem
                                                active={place.drills}
                                                icon={place.icon}
                                                key={place.id}
                                                onClick={
                                                    place.drills
                                                        ? () => setDrilled(true)
                                                        : undefined
                                                }
                                                trailing={
                                                    <ChevronRight
                                                        className="text-neutral-500"
                                                        {...icon}
                                                    />
                                                }
                                            >
                                                {place.label}
                                            </NavItem>
                                        ))}
                                    </SidebarGroup>
                                </SidebarLevel>
                            )}
                        </div>
                        <SidebarFooter>
                            <SidebarAccount
                                avatar={<Avatar fallback="JC" />}
                                name="Jane Cooper"
                                plan="Free plan"
                            />
                        </SidebarFooter>
                    </Sidebar>
                    <AppPanel>
                        <HeaderBar>
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            href="#"
                                            onClick={event => {
                                                // The playground routes by the hash; this only opens the index.
                                                event.preventDefault();
                                                setDrilled(true);
                                            }}
                                        >
                                            Components
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{page?.label}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </HeaderBar>
                        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden px-10 pt-10">
                            <PageHead
                                description="What it is for, its knobs and one piece of a product it sits in."
                                title={page?.label ?? 'Components'}
                            />
                        </div>
                    </AppPanel>
                </AppShell>
            </div>
        </Scene>
    );
};

export const inUse: InUse = {
    title: 'Docs sidebar',
    note: 'Components drills into its index: the back row, a search, the groups with their counts.',
    bare: true,
    render: () => <DocsSidebar />,
};
