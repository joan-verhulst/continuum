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
    BookOpen,
    Download,
    FileText,
    LayoutDashboard,
    MessageSquare,
    Search,
    Settings,
} from 'lucide-react';
import type { ReactNode } from 'react';

/*
 * Lumen's overview: how the docs at docs.lumen.dev did over the last 30 days. The product only
 * ever reads that one period, so the page says it in its line and offers no picker; the one thing
 * the reader can do here is take the report away as a CSV.
 */

const icon = { strokeWidth: 2 } as const;

const places: { id: string; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard {...icon} /> },
    { id: 'pages', label: 'Pages', icon: <FileText {...icon} /> },
    { id: 'search', label: 'Search', icon: <Search {...icon} /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare {...icon} /> },
    { id: 'settings', label: 'Settings', icon: <Settings {...icon} /> },
];

/* ---------- The period's data ---------- */

// Visitors a day, 10 October to 8 November 2026; the 24 October peak is the Billing v2 guide's launch.
const daily = [
    1420, 1385, 1510, 1602, 1488, 1190, 1102, 1530, 1611, 1655, 1590, 1544, 1210, 1150, 3880, 2410,
    1980, 1760, 1702, 1310, 1240, 1690, 1720, 1745, 1801, 1712, 1380, 1290, 1810, 1830,
];
const visitors = daily.map((count, i) => ({ date: new Date(2026, 9, 10 + i), visitors: count }));
const launchDay = 14;

const stats = [
    { label: 'Page views', value: '182,904', delta: '+8.1%' },
    { label: 'Average time on page', value: '3m 12s', delta: '−6s' },
    { label: 'Searches', value: '9,402', delta: '+21%' },
    // The rate rides in the label, since the change is in its points; and a rising share of
    // searches that find nothing is the worse way, so the pill reads as a fall.
    { label: 'No-result searches · 6.5%', value: '612', delta: '+0.4 pts', trend: 'down' as const },
];

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

const failedSearches = [
    { name: 'rate limit headers', value: 88 },
    { name: 'sso saml', value: 61 },
    { name: 'delete workspace', value: 47 },
];

const number = new Intl.NumberFormat('en-GB');
const formatDay = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/* ---------- The export ---------- */

const csvCell = (cell: string | number) => {
    const text = String(cell);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** The whole report as one CSV: the figures, the visitors by day, then each breakdown. */
const reportCsv = () => {
    const rows: (string | number)[][] = [
        ['Lumen Docs overview', '10 Oct 2026 – 8 Nov 2026'],
        [],
        ['Measure', 'Value', 'Change on the 30 days before'],
        ['Visitors', 48210, '+12.4%'],
        ['Page views', 182904, '+8.1%'],
        ['Average time on page', '3m 12s', '−6s'],
        ['Searches', 9402, '+21%'],
        ['Searches with no result', 612, '+0.4 pts'],
        [],
        ['Date', 'Visitors'],
        ...visitors.map(day => [day.date.toISOString().slice(0, 10), day.visitors]),
        [],
        ['Top page', 'Views'],
        ...topPages.map(page => [page.name, page.value]),
        [],
        ['Referrer', 'Visitors'],
        ...topReferrers.map(referrer => [referrer.name, referrer.value]),
        [],
        ['Search with no result', 'Searches'],
        ...failedSearches.map(search => [search.name, search.value]),
    ];
    return rows.map(row => row.map(csvCell).join(',')).join('\n');
};

const exportReport = () => {
    const url = URL.createObjectURL(new Blob([reportCsv()], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lumen-docs-overview-2026-10-10-to-2026-11-08.csv';
    link.click();
    URL.revokeObjectURL(url);
};

/* ---------- The shell ---------- */

const LumenSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <BookOpen {...icon} />
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
                avatar={<Avatar fallback="LD" size={36} />}
                name="Lumen Docs"
                detail="Ana Ruiz"
            />
        </SidebarFooter>
    </Sidebar>
);

const Trail = () => (
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
);

/** A ranked breakdown in its list card. */
const Breakdown = ({
    title,
    valueLabel,
    items,
}: {
    title: string;
    valueLabel: string;
    items: { name: string; value: number }[];
}) => (
    <Card layout="list">
        <BarList title={title} valueLabel={valueLabel}>
            {items.map(item => (
                <BarListItem
                    displayValue={number.format(item.value)}
                    key={item.name}
                    value={item.value}
                >
                    {item.name}
                </BarListItem>
            ))}
        </BarList>
    </Card>
);

/* ---------- The page ---------- */

const NewOverview = () => (
    <AppShell className="h-dvh min-h-0">
        <LumenSidebar />
        <AppPanel>
            <HeaderBar>
                <Trail />
            </HeaderBar>
            <div className="min-h-0 flex-1 overflow-auto">
                <PageContent className="flex flex-col gap-10 pb-24" width="default">
                    <div className="flex @max-shell-compact/shell:flex-col @max-shell-compact/shell:items-start items-end justify-between @max-shell-compact/shell:gap-4 gap-6">
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <h1 className="font-medium text-2xl text-neutral-950">Overview</h1>
                            <p className="text-neutral-600 text-sm">
                                How the docs did over the last 30 days, 10 October to 8 November
                                2026.
                            </p>
                        </div>
                        <Button onClick={exportReport} variant="secondary">
                            Export CSV
                            <Download {...icon} />
                        </Button>
                    </div>

                    <ChartCard
                        actions={<LiveCount count={37} label="reading now" />}
                        aria-label="Visitors a day, 10 October to 8 November 2026"
                        comparison="on the 30 days before"
                        data={visitors}
                        delta="+12.4%"
                        figures={false}
                        formatValue={value => number.format(value)}
                        formatX={formatDay}
                        markers={[{ index: launchDay, label: 'Billing v2 guide launched' }]}
                        series={[{ key: 'visitors', name: 'Visitors' }]}
                        title="Visitors"
                        trend="up"
                        value="48,210"
                        x="date"
                        xTicks={5}
                    />

                    <div className="grid @max-shell-compact/shell:grid-cols-2 grid-cols-4 gap-4">
                        {stats.map(stat => (
                            <StatCard
                                delta={stat.delta}
                                key={stat.label}
                                label={stat.label}
                                trend={stat.trend}
                                value={stat.value}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
                            <Breakdown items={topPages} title="Top pages" valueLabel="Views" />
                            <Breakdown
                                items={topReferrers}
                                title="Top referrers"
                                valueLabel="Visitors"
                            />
                        </div>
                        <Breakdown
                            items={failedSearches}
                            title="Top searches with no result"
                            valueLabel="Searches"
                        />
                    </div>
                </PageContent>
            </div>
        </AppPanel>
    </AppShell>
);

export default NewOverview;
