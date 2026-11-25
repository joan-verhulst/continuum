/*
 * The plan (SKILL.md, Building something, step 3):
 * - Purpose: the docs team opens Lumen to see how docs.lumen.dev did over the last 30 days.
 * - Rank: lead, visitors over the 30 days (48,210, +12.4%, the daily line, the Billing v2 spike);
 *   supporting, page views, time on page, searches and searches with no result, then the top pages
 *   and top referrers; look-up, the searches that found nothing; live, 37 reading now (the
 *   visitors' card); action, Export as CSV, a secondary (the page has no primary).
 * - Kind: overview, 896. One fixed period, so no picker: the head's line says which days.
 * - Order: head (title, the period, Export) · the visitors chart card · four stat cards ·
 *   top pages beside top referrers · searches with no result.
 */
import {
    AppPanel,
    AppShell,
    Avatar,
    BarList,
    BarListItem,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Card,
    HeaderBar,
    LiveCount,
    NavItem,
    PageContent,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    StatCard,
} from '@contui/ui';
import { ChartCard } from '@contui/ui/charts';
import {
    Download,
    FileText,
    LayoutDashboard,
    MessageSquare,
    Search,
    Settings,
    Sun,
} from 'lucide-react';

const icon = { strokeWidth: 2 } as const;

/* ---------- The report's data: the last 30 days, 10 October to 8 November 2026 ---------- */

const dailyVisitors = [
    1420, 1385, 1510, 1602, 1488, 1190, 1102, 1530, 1611, 1655, 1590, 1544, 1210, 1150, 3880, 2410,
    1980, 1760, 1702, 1310, 1240, 1690, 1720, 1745, 1801, 1712, 1380, 1290, 1810, 1830,
];

const days = dailyVisitors.map((visitors, i) => ({ date: new Date(2026, 9, 10 + i), visitors }));

// The day the Billing v2 guide went out, and the spike it explains.
const launch = 14;

const topPages = [
    { name: '/guides/billing-v2', value: 14702 },
    { name: '/api/authentication', value: 11340 },
    { name: '/quickstart', value: 9880 },
    { name: '/api/webhooks', value: 7210 },
    { name: '/guides/migrations', value: 5904 },
];

const topReferrers = [
    { name: 'google.com', value: 21330 },
    { name: 'github.com', value: 8912 },
    { name: 'Direct', value: 7604 },
    { name: 'stackoverflow.com', value: 3120 },
    { name: 'news.ycombinator.com', value: 1840 },
];

const emptySearches = [
    { name: 'rate limit headers', value: 88 },
    { name: 'sso saml', value: 61 },
    { name: 'delete workspace', value: 47 },
];

const number = new Intl.NumberFormat('en-GB');
const format = (value: number) => number.format(value);
const formatDay = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const formatThousands = (value: number) =>
    value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : String(value);

/** The report as one CSV: the figures, the daily visitors, then each ranked list. */
const exportCsv = () => {
    const quote = (cell: string | number) =>
        typeof cell === 'number' ? String(cell) : `"${cell.replaceAll('"', '""')}"`;
    const lines: (string | number)[][] = [
        ['Lumen Docs, 10 Oct – 8 Nov 2026'],
        [],
        ['Measure', 'Value', 'Change on the 30 days before'],
        ['Visitors', 48210, '+12.4%'],
        ['Page views', 182904, '+8.1%'],
        ['Average time on page', '3m 12s', '−6s'],
        ['Searches', 9402, '+21%'],
        ['Searches with no result', 612, '+0.4 pts'],
        [],
        ['Date', 'Visitors'],
        ...days.map(day => [day.date.toISOString().slice(0, 10), day.visitors]),
        [],
        ['Top page', 'Views'],
        ...topPages.map(page => [page.name, page.value]),
        [],
        ['Top referrer', 'Visitors'],
        ...topReferrers.map(referrer => [referrer.name, referrer.value]),
        [],
        ['Search with no result', 'Searches'],
        ...emptySearches.map(search => [search.name, search.value]),
    ];
    const csv = lines.map(line => line.map(quote).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'lumen-docs-overview.csv';
    link.click();
    URL.revokeObjectURL(link.href);
};

/* ---------- The app around the page ---------- */

const places = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard {...icon} /> },
    { id: 'pages', label: 'Pages', icon: <FileText {...icon} /> },
    { id: 'search', label: 'Search', icon: <Search {...icon} /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare {...icon} /> },
    { id: 'settings', label: 'Settings', icon: <Settings {...icon} /> },
];

/** Lumen's sidebar: its five places and the workspace, with who is signed in under it. */
const LumenSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Sun {...icon} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Main">
            {places.map(place => (
                <NavItem
                    active={place.id === 'overview'}
                    aria-current={place.id === 'overview' ? 'page' : undefined}
                    icon={place.icon}
                    key={place.id}
                >
                    {place.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={<Avatar fallback="LD" shape="square" size={36} />}
                name="Lumen Docs"
                detail="Ana Ruiz"
            />
        </SidebarFooter>
    </Sidebar>
);

/** A ranked list of names in its card, the bars neutral since they only show the rank. */
const Breakdown = ({
    title,
    valueLabel,
    rows,
}: {
    title: string;
    valueLabel: string;
    rows: { name: string; value: number }[];
}) => (
    <Card layout="list">
        <BarList title={title} valueLabel={valueLabel}>
            {rows.map(row => (
                <BarListItem displayValue={format(row.value)} key={row.name} value={row.value}>
                    {row.name}
                </BarListItem>
            ))}
        </BarList>
    </Card>
);

/** Lumen's overview: how the docs did over the only period the product shows, the last 30 days. */
const LumenOverview = () => (
    <AppShell className="h-dvh min-h-0">
        <LumenSidebar />
        <AppPanel>
            <HeaderBar>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">
                                <BreadcrumbHome />
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Overview</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </HeaderBar>
            <div className="min-h-0 flex-1 overflow-auto">
                <PageContent className="flex flex-col gap-10 pb-24">
                    {/* The head stacks on a phone, and the export, a secondary, hides there. */}
                    <div className="flex @max-shell-compact/shell:flex-col @max-shell-compact/shell:items-start items-end justify-between gap-6">
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <h1 className="font-medium text-2xl text-neutral-950">Overview</h1>
                            <p className="text-neutral-600 text-sm">
                                How the docs did over the last 30 days, 10 Oct – 8 Nov 2026.
                            </p>
                        </div>
                        <Button
                            className="@max-shell-compact/shell:hidden"
                            onClick={exportCsv}
                            variant="secondary"
                        >
                            Export CSV
                            <Download {...icon} />
                        </Button>
                    </div>

                    <ChartCard
                        actions={<LiveCount count={37} label="reading now" />}
                        comparison="on the 30 days before"
                        data={days}
                        delta="+12.4%"
                        figures={false}
                        formatValue={format}
                        formatX={formatDay}
                        formatY={formatThousands}
                        markers={[{ index: launch, label: 'Billing v2 guide launched' }]}
                        series={[{ key: 'visitors', name: 'Visitors' }]}
                        title="Visitors"
                        value={format(48210)}
                        x="date"
                        xTicks={5}
                    />

                    <div className="grid @max-shell-compact/shell:grid-cols-2 grid-cols-4 gap-4">
                        <StatCard delta="+8.1%" label="Page views" value={format(182904)} />
                        <StatCard
                            delta="−6s"
                            label="Average time on page"
                            trend="neutral"
                            value="3m 12s"
                        />
                        <StatCard delta="+21%" label="Searches" value={format(9402)} />
                        <StatCard
                            delta="+0.4 pts"
                            label="Searches with no result"
                            note="6.5% of searches"
                            trend="down"
                            value={format(612)}
                        />
                    </div>

                    <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
                        <Breakdown rows={topPages} title="Top pages" valueLabel="Views" />
                        <Breakdown
                            rows={topReferrers}
                            title="Top referrers"
                            valueLabel="Visitors"
                        />
                    </div>

                    <Breakdown
                        rows={emptySearches}
                        title="Top searches with no result"
                        valueLabel="Searches"
                    />
                </PageContent>
            </div>
        </AppPanel>
    </AppShell>
);

export default LumenOverview;
