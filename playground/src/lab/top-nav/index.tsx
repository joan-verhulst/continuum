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
    SegmentedControl,
    SegmentedControlItem,
    SidebarSwitcherMark,
    StatCard,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Theme,
    TopNav,
    TopNavActions,
    TopNavBrand,
    TopNavLink,
    TopNavLinks,
    TopNavMenu,
    TopNavMenuGroup,
    TopNavMenuItem,
    TopNavSwitcher,
} from 'continuum';
import { Bell, Boxes, Check, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    allCustomers,
    formatEuro,
    PageHead,
    SectionHead,
    statusTone,
} from '../../screens/workspace';
import { type Section, SubItems, sectionOf, TwoRowHeader } from './two-row';

/*
 * The top nav on a whole page at the browser's size: every part of it in use, more sections than
 * the bar has room for, and a long page under it, so the bar can be judged as an app uses it.
 * Lab code, outside the skill: opened as `/app?topnav`, with `&mode=dark` and
 * `&width=narrow|default|wide|dense|inset|full` (the page's column, which the bar follows) and
 * `&layout=one-row|two-row` (the TopNav as it is, or the two-row header sketch beside it),
 * `&sub=header|page` (where a section's pages go) and `&page=<id>` (the page it opens on).
 */

export const isTopNavStandalone = () => new URLSearchParams(window.location.search).has('topnav');

type Width = 'narrow' | 'default' | 'wide' | 'dense' | 'inset' | 'full';
const widths: Width[] = ['narrow', 'default', 'wide', 'dense', 'inset', 'full'];

const icon = { strokeWidth: 2 };

const workspaces = [
    { id: 'acme', name: 'Acme Corp', plan: 'Pro plan', color: 'var(--color-chart-1)' },
    { id: 'globex', name: 'Globex', plan: 'Starter plan', color: 'var(--color-chart-2)' },
    { id: 'initech', name: 'Initech', plan: 'Enterprise', color: 'var(--color-chart-3)' },
];

const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'customers', label: 'Customers' },
    { id: 'invoices', label: 'Invoices', count: 12 },
    { id: 'inbox', label: 'Inbox', count: 3 },
    { id: 'sequences', label: 'Sequences' },
];

const reports = [
    {
        label: 'Sales',
        pages: [
            { id: 'revenue', label: 'Revenue' },
            { id: 'pipeline', label: 'Pipeline' },
            { id: 'forecast', label: 'Forecast' },
        ],
    },
    {
        label: 'Support',
        pages: [
            { id: 'response', label: 'Response times', count: 2 },
            { id: 'satisfaction', label: 'Satisfaction' },
        ],
    },
];

const settings = [
    { id: 'team', label: 'Team' },
    { id: 'billing', label: 'Billing' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'api', label: 'API keys' },
];

// After the menus, so the bar has more than it can hold on a laptop and scrolls.
const more = [
    { id: 'automations', label: 'Automations' },
    { id: 'templates', label: 'Templates' },
    { id: 'help', label: 'Help center' },
];

const params = () => new URLSearchParams(window.location.search);

type Layout = 'one-row' | 'two-row';
type Sub = 'header' | 'page';

// The same navigation for the two-row header: every section a tab, a section's pages its own row.
const allSections: Section[] = [
    ...sections,
    { id: 'reports', label: 'Reports', groups: reports },
    { id: 'settings', label: 'Settings', groups: [{ pages: settings }] },
    ...more,
];

// The column's cap and side padding, as PageContent draws them, for the header's rows.
const columns: Record<Width, string> = {
    narrow: 'max-w-content-narrow px-4 sm:px-6',
    default: 'max-w-content px-4 sm:px-6',
    wide: 'max-w-content-wide px-4 sm:px-6',
    dense: 'max-w-content-dense px-4 sm:px-6',
    inset: 'px-4 sm:px-6 lg:px-16 2xl:px-content-inset',
    full: 'px-4',
};

/** The page's name: a section's, or its page's. */
const labelOf = (page: string) => {
    const section = sectionOf(allSections, page);
    const inner = section?.groups?.flatMap(group => group.pages).find(item => item.id === page);
    return inner?.label ?? section?.label ?? 'Customers';
};

const Mark = ({ index, size }: { index: number; size?: 20 | 28 }) => {
    const space = workspaces[index] ?? workspaces[0];
    if (!space) return null;
    return (
        <SidebarSwitcherMark color={space.color} size={size}>
            {space.name.slice(0, 1)}
        </SidebarSwitcherMark>
    );
};

const App = ({ width, layout, sub }: { width: Width; layout: Layout; sub: Sub }) => {
    const [page, setPage] = useState(params().get('page') ?? 'revenue');
    const section = sectionOf(allSections, page);
    const inPage = layout === 'two-row' && sub === 'page' && section?.groups;
    const [workspace, setWorkspace] = useState(0);
    const space = workspaces[workspace] ?? workspaces[0];
    const go = (id: string) => () => setPage(id);
    const active = allCustomers.filter(customer => customer.status === 'Active');
    const mrr = active.reduce((sum, customer) => sum + customer.mrr, 0);

    return (
        <AppShell nav="top">
            {layout === 'two-row' ? (
                <TwoRowHeader
                    column={columns[width]}
                    onPage={setPage}
                    onWorkspace={setWorkspace}
                    page={page}
                    sections={allSections}
                    subItems={sub}
                    workspace={workspace}
                    workspaces={workspaces}
                />
            ) : (
                <TopNav width={width}>
                    <TopNavBrand
                        href="#"
                        logo={<Boxes {...icon} />}
                        onClick={e => e.preventDefault()}
                    >
                        Acme
                    </TopNavBrand>
                    {space && (
                        <TopNavSwitcher
                            aria-label={`${space.name}. Switch workspace`}
                            detail={space.plan}
                            mark={<Mark index={workspace} />}
                            name={space.name}
                        >
                            {workspaces.map((item, index) => (
                                <DropdownMenuItem key={item.id} onClick={() => setWorkspace(index)}>
                                    <Mark index={index} size={20} />
                                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                                    {index === workspace && <Check {...icon} />}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Plus {...icon} />
                                New workspace
                            </DropdownMenuItem>
                        </TopNavSwitcher>
                    )}
                    <TopNavLinks aria-label="Sections">
                        {sections.map(item => (
                            <TopNavLink
                                active={page === item.id}
                                count={item.count}
                                key={item.id}
                                onClick={go(item.id)}
                            >
                                {item.label}
                            </TopNavLink>
                        ))}
                        <TopNavMenu label="Reports">
                            {reports.map(group => (
                                <TopNavMenuGroup key={group.label} label={group.label}>
                                    {group.pages.map(item => (
                                        <TopNavMenuItem
                                            active={page === item.id}
                                            count={'count' in item ? item.count : undefined}
                                            key={item.id}
                                            onClick={go(item.id)}
                                        >
                                            {item.label}
                                        </TopNavMenuItem>
                                    ))}
                                </TopNavMenuGroup>
                            ))}
                        </TopNavMenu>
                        <TopNavMenu label="Settings">
                            {settings.map(item => (
                                <TopNavMenuItem
                                    active={page === item.id}
                                    key={item.id}
                                    onClick={go(item.id)}
                                >
                                    {item.label}
                                </TopNavMenuItem>
                            ))}
                        </TopNavMenu>
                        {more.map(item => (
                            <TopNavLink
                                active={page === item.id}
                                key={item.id}
                                onClick={go(item.id)}
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
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Sign out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TopNavActions>
                </TopNav>
            )}
            <AppPanel>
                <div>
                    <PageContent className="flex flex-col gap-11 pb-24" width={width}>
                        {inPage && section?.groups && (
                            // The section's pages at the top of the page: the page's own navigation,
                            // 24 over its title, scrolling with it.
                            <div className="scrollbar-none -mb-5 -ml-3 flex overflow-x-auto pl-3">
                                <SubItems
                                    groups={section.groups}
                                    label={section.label}
                                    onPage={setPage}
                                    page={page}
                                />
                            </div>
                        )}
                        <PageHead
                            description={`${allCustomers.length} companies, ${active.length} of them paying.`}
                            title={labelOf(page)}
                        >
                            <Button>New customer</Button>
                        </PageHead>
                        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4 lg:grid-cols-4">
                            <StatCard
                                comparison="on last month"
                                delta="+4"
                                label="Customers"
                                value={allCustomers.length}
                            />
                            <StatCard
                                comparison="on last month"
                                delta="+6.2%"
                                label="Monthly revenue"
                                value={formatEuro(mrr)}
                            />
                            <StatCard
                                comparison="on last month"
                                delta="-1"
                                label="Past due"
                                value={
                                    allCustomers.filter(customer => customer.status === 'Past due')
                                        .length
                                }
                            />
                            <StatCard
                                comparison="on last month"
                                delta="+2"
                                label="On trial"
                                value={
                                    allCustomers.filter(customer => customer.status === 'Trial')
                                        .length
                                }
                            />
                        </div>
                        <section className="flex flex-col gap-5">
                            <SectionHead
                                description="Every company with an account, the newest first."
                                title="All customers"
                            />
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead align="right">MRR</TableHead>
                                        <TableHead>Last seen</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allCustomers.map(customer => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="text-neutral-950">
                                                {customer.name}
                                            </TableCell>
                                            <TableCell className="text-neutral-700">
                                                {customer.plan}
                                            </TableCell>
                                            <TableCell>
                                                <Badge tone={statusTone[customer.status]}>
                                                    {customer.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-neutral-700">
                                                {customer.owner}
                                            </TableCell>
                                            <TableCell align="right" className="tabular-nums">
                                                {formatEuro(customer.mrr)}
                                            </TableCell>
                                            <TableCell className="text-neutral-600">
                                                {customer.seen}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </section>
                    </PageContent>
                </div>
            </AppPanel>
        </AppShell>
    );
};

export const TopNavStandalone = () => {
    const mode = params().get('mode') === 'dark' ? 'dark' : 'light';
    const asked = params().get('width') as Width | null;
    const width: Width = asked && widths.includes(asked) ? asked : 'wide';
    const [layout, setLayout] = useState<Layout>(
        params().get('layout') === 'one-row' ? 'one-row' : 'two-row',
    );
    const [sub, setSub] = useState<Sub>('header');
    const remember = (key: string, value: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set(key, value);
        window.history.replaceState(null, '', url);
    };
    const choose = (next: Layout) => {
        setLayout(next);
        remember('layout', next);
    };
    const _place = (next: Sub) => {
        setSub(next);
        remember('sub', next);
    };

    useEffect(() => {
        document.title = 'Top nav · full page';
    }, []);

    return (
        <Theme className="min-h-screen bg-neutral-50" mode={mode}>
            <App layout={layout} sub={sub} width={width} />
            {/* The lab's own switch, not part of the page: the bar as it is, or the sketch. */}
            <div className="fixed right-4 bottom-4 z-50 flex items-center gap-1 rounded-card border border-neutral-200 bg-neutral-50 p-1 shadow-float">
                <SegmentedControl onValueChange={value => choose(value as Layout)} value={layout}>
                    <SegmentedControlItem value="one-row">One row</SegmentedControlItem>
                    <SegmentedControlItem value="two-row">Two rows</SegmentedControlItem>
                </SegmentedControl>
            </div>
        </Theme>
    );
};
