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
} from 'continuum';
import { ChartCard } from 'continuum/charts';
import {
    BookOpenText,
    Download,
    FileText,
    LayoutDashboard,
    MessageSquareText,
    Rocket,
    Search,
    Settings,
    Users,
} from 'lucide-react';

/*
 * Lumen's Overview: how the docs at docs.lumen.dev did over the last 30 days. The product only
 * ever reads that one period, so the page head states it in its line instead of offering a
 * period picker with a single choice in it.
 */

const icon = { strokeWidth: 2 } as const;

const number = new Intl.NumberFormat('en-GB');
const formatNumber = (value: number) => number.format(value);
const formatDay = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Visitors a day, 10 October to 8 November 2026. */
const dailyVisitors = [
    1420, 1385, 1510, 1602, 1488, 1190, 1102, 1530, 1611, 1655, 1590, 1544, 1210, 1150, 3880, 2410,
    1980, 1760, 1702, 1310, 1240, 1690, 1720, 1745, 1801, 1712, 1380, 1290, 1810, 1830,
];

const days = dailyVisitors.map((visitors, i) => ({
    date: new Date(2026, 9, 10 + i),
    visitors,
}));

// The spike on 24 October is the "Billing v2" guide going out: a note on the time axis says so,
// rather than leaving the reader to guess at it.
const launch = days.findIndex(day => day.visitors === 3880);

const topPages = [
    { path: '/guides/billing-v2', views: 14702 },
    { path: '/api/authentication', views: 11340 },
    { path: '/quickstart', views: 9880 },
    { path: '/api/webhooks', views: 7210 },
    { path: '/guides/migrations', views: 5904 },
];

const topReferrers = [
    { source: 'google.com', visitors: 21330 },
    { source: 'github.com', visitors: 8912 },
    { source: 'Direct', visitors: 7604 },
    { source: 'stackoverflow.com', visitors: 3120 },
    { source: 'news.ycombinator.com', visitors: 1840 },
];

const missedSearches = [
    { query: 'rate limit headers', searches: 88 },
    { query: 'sso saml', searches: 61 },
    { query: 'delete workspace', searches: 47 },
];

/** The report as one CSV: the headline figures, the days, then each ranked list. */
const reportCsv = () => {
    const quote = (cell: string | number) =>
        typeof cell === 'number' ? String(cell) : `"${cell.replaceAll('"', '""')}"`;
    const rows: (string | number)[][] = [
        ['Lumen Docs overview', '10 Oct 2026 to 8 Nov 2026'],
        [],
        ['Measure', 'Value', 'Change on the 30 days before'],
        ['Visitors', 48210, '+12.4%'],
        ['Page views', 182904, '+8.1%'],
        ['Average time on page', '3m 12s', '-6s'],
        ['Searches', 9402, '+21%'],
        ['Searches with no result', 612, '+0.4 pts'],
        [],
        ['Date', 'Visitors'],
        ...days.map(day => [day.date.toISOString().slice(0, 10), day.visitors]),
        [],
        ['Page', 'Views'],
        ...topPages.map(page => [page.path, page.views]),
        [],
        ['Referrer', 'Visitors'],
        ...topReferrers.map(referrer => [referrer.source, referrer.visitors]),
        [],
        ['Search with no result', 'Searches'],
        ...missedSearches.map(search => [search.query, search.searches]),
    ];
    return rows.map(row => row.map(quote).join(',')).join('\n');
};

const exportReport = () => {
    const url = URL.createObjectURL(new Blob([reportCsv()], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lumen-docs-overview.csv';
    link.click();
    URL.revokeObjectURL(url);
};

const places = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard {...icon} /> },
    { id: 'pages', label: 'Pages', icon: <FileText {...icon} /> },
    { id: 'search', label: 'Search', icon: <Search {...icon} /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquareText {...icon} /> },
];

/** The places of the product, settings apart under the workspace, and who is signed in. */
const LumenSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <BookOpenText {...icon} />
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
        <SidebarGroup aria-label="Workspace" label="Workspace">
            <NavItem icon={<Settings {...icon} />}>Settings</NavItem>
        </SidebarGroup>
        <SidebarFooter>
            <SidebarAccount
                avatar={<Avatar alt="Ana Ruiz" fallback="AR" shape="round" size={36} />}
                name="Ana Ruiz"
                detail="Lumen Docs"
            />
        </SidebarFooter>
    </Sidebar>
);

export default function OldOverview() {
    return (
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
                    <PageContent className="flex flex-col gap-10 pb-12">
                        {/* The page head: what it reads and over when, then who is reading now and the export. */}
                        <div className="flex @max-shell-compact/shell:flex-col @max-shell-compact/shell:items-start items-end justify-between @max-shell-compact/shell:gap-4 gap-6">
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <h1 className="font-medium text-2xl text-neutral-950">Overview</h1>
                                <p className="text-neutral-600 text-sm">
                                    How the docs did over the last 30 days, 10 Oct – 8 Nov 2026
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-4">
                                <LiveCount count={37} label="reading now" />
                                <Button onClick={exportReport} variant="secondary">
                                    Export CSV
                                    <Download {...icon} />
                                </Button>
                            </div>
                        </div>

                        <ChartCard
                            comparison="on the 30 days before"
                            data={days}
                            delta="+12.4%"
                            figures={false}
                            formatValue={formatNumber}
                            formatX={formatDay}
                            height={260}
                            icon={<Users />}
                            markers={[
                                {
                                    index: launch,
                                    label: 'The "Billing v2" guide went out',
                                    icon: <Rocket {...icon} />,
                                },
                            ]}
                            series={[{ key: 'visitors', name: 'Visitors' }]}
                            title="Visitors"
                            trend="up"
                            value="48,210"
                            x="date"
                            xTicks={5}
                        />

                        {/* One card carries a line under its value; the others push their pill to
                            the foot, so the four pills still stand on one line. */}
                        <div className="grid @max-shell-compact/shell:grid-cols-2 grid-cols-4 gap-4">
                            <StatCard
                                className="justify-between"
                                delta="+8.1%"
                                label="Page views"
                                value="182,904"
                            />
                            <StatCard
                                className="justify-between"
                                delta="−6s"
                                label="Average time on page"
                                trend="down"
                                value="3m 12s"
                            />
                            <StatCard
                                className="justify-between"
                                delta="+21%"
                                label="Searches"
                                value="9,402"
                            />
                            {/* More searches finding nothing is worse, so the rise reads as down. */}
                            <StatCard
                                delta="+0.4 pts"
                                label="Searches with no result"
                                trend="down"
                                value={
                                    <>
                                        612
                                        <span className="block font-normal text-neutral-600 text-xs">
                                            6.5% of searches
                                        </span>
                                    </>
                                }
                            />
                        </div>

                        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
                            <Card layout="list">
                                <BarList title="Top pages" valueLabel="Views">
                                    {topPages.map(page => (
                                        <BarListItem
                                            displayValue={formatNumber(page.views)}
                                            key={page.path}
                                            value={page.views}
                                        >
                                            {page.path}
                                        </BarListItem>
                                    ))}
                                </BarList>
                            </Card>
                            <Card layout="list">
                                <BarList title="Top referrers" valueLabel="Visitors">
                                    {topReferrers.map(referrer => (
                                        <BarListItem
                                            displayValue={formatNumber(referrer.visitors)}
                                            key={referrer.source}
                                            value={referrer.visitors}
                                        >
                                            {referrer.source}
                                        </BarListItem>
                                    ))}
                                </BarList>
                            </Card>
                        </div>

                        <Card layout="list">
                            <BarList title="Top searches with no result" valueLabel="Searches">
                                {missedSearches.map(search => (
                                    <BarListItem
                                        displayValue={formatNumber(search.searches)}
                                        key={search.query}
                                        value={search.searches}
                                    >
                                        “{search.query}”
                                    </BarListItem>
                                ))}
                            </BarList>
                        </Card>
                    </PageContent>
                </div>
            </AppPanel>
        </AppShell>
    );
}
