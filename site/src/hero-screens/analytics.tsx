import { ChartAnnotation } from '@screens/shared';
import {
    Badge,
    BarList,
    BarListItem,
    Button,
    Card,
    CardDelta,
    CardFigure,
    CardHeader,
    CardTitle,
    CardValue,
    LiveCount,
    SegmentedControl,
    SegmentedControlItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Area, AreaChart, Grid, XAxis, YAxis } from 'continuum/charts-legacy';
import { Download, GitBranch, Globe, Link2, Mail, Rocket, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Column, Frame, icon, PageHead } from './shell';

/*
 * Analytics: how Northwind's sites did over the last 30 days. The figure that leads is the
 * visitors chart against the period before; where they came from sits beside it; the stat
 * cards under it carry what the chart does not, each with its own small trend.
 */

/** A seeded wave, so the data looks lived-in and is the same on every render. */
const wave = (i: number, seed: number) =>
    Math.sin(i * 0.9 + seed) * 0.5 + Math.sin(i * 0.37 + seed * 2) * 0.8 + Math.cos(i * 2.1) * 0.3;

const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2026, 9, 1 + i);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const growth = 1 + i * 0.012;
    const base = weekend ? 1180 : 1720;
    // The launch post on the 21st, and the long tail after it.
    const launch = i === 20 ? 1900 : i === 21 ? 980 : i === 22 ? 420 : 0;
    return {
        date,
        current: Math.round(base * growth + wave(i, 1) * 140 + launch),
        previous: Math.round((weekend ? 1060 : 1490) + wave(i, 4) * 120),
    };
});

const shortDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const sparkOf = (seed: number, rise: number) =>
    Array.from({ length: 14 }, (_, i) => ({
        date: new Date(2026, 9, 17 + i),
        value: 40 + i * rise + wave(i, seed) * 6,
    }));

/** A small trend in the stat card's corner: the line and its fill, no axes. */
const Sparkline = ({ data, color }: { data: { date: Date; value: number }[]; color: string }) => (
    <div aria-hidden className="h-10 w-24 shrink-0">
        <AreaChart
            data={data}
            interactive={false}
            margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
            style={{ height: 40 }}
        >
            <Area dataKey="value" fill={color} fillOpacity={0.18} showHighlight={false} />
        </AreaChart>
    </div>
);

type Stat = {
    label: string;
    value: string;
    delta: string;
    /** Whether the change is good, which is not always up: a falling bounce rate is. */
    good: boolean;
    spark: { date: Date; value: number }[];
};

const stats: Stat[] = [
    { label: 'Page views', value: '182,904', delta: '+8.1%', good: true, spark: sparkOf(2, 1.6) },
    { label: 'Signups', value: '1,284', delta: '+21.6%', good: true, spark: sparkOf(5, 2.4) },
    { label: 'Bounce rate', value: '38.2%', delta: '−2.4%', good: true, spark: sparkOf(7, -1.2) },
    {
        label: 'Avg. session',
        value: '3m 12s',
        delta: '−0:06',
        good: false,
        spark: sparkOf(9, -0.4),
    },
];

const StatSpark = ({ stat }: { stat: Stat }) => (
    <Card className="flex-row items-end justify-between gap-3" data-slot="stat-card">
        <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-col gap-1">
                <CardTitle>{stat.label}</CardTitle>
                <CardValue>{stat.value}</CardValue>
            </div>
            <Badge className="self-start" tone={stat.good ? 'success' : 'error'} variant="pill">
                {stat.delta}
            </Badge>
        </div>
        <Sparkline color="var(--color-chart-1)" data={stat.spark} />
    </Card>
);

const sources: { label: string; value: number; icon: ReactNode }[] = [
    { label: 'Google', value: 18402, icon: <Search {...icon} /> },
    { label: 'Direct', value: 9880, icon: <Globe {...icon} /> },
    { label: 'news.ycombinator.com', value: 5214, icon: <Link2 {...icon} /> },
    { label: 'Newsletter', value: 3906, icon: <Mail {...icon} /> },
    { label: 'github.com', value: 2410, icon: <GitBranch {...icon} /> },
    { label: 'linkedin.com', value: 1872, icon: <Link2 {...icon} /> },
    { label: 'Bing', value: 1204, icon: <Search {...icon} /> },
];

const number = new Intl.NumberFormat('en-GB');

const pages = [
    { path: '/', visitors: 21840, views: 38912, bounce: '34.1%', time: '1m 48s' },
    { path: '/pricing', visitors: 9214, views: 14388, bounce: '29.7%', time: '2m 31s' },
    { path: '/blog/billing-v2', visitors: 7702, views: 9031, bounce: '51.2%', time: '4m 05s' },
    {
        path: '/docs/getting-started',
        visitors: 5386,
        views: 12215,
        bounce: '22.8%',
        time: '6m 12s',
    },
    { path: '/changelog', visitors: 3142, views: 4811, bounce: '40.3%', time: '1m 22s' },
];

const Legend = () => (
    <div className="flex items-center gap-4 text-neutral-600 text-xxs">
        <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-1" />
            This period
        </span>
        <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-(--color-chart-series-5)" />
            Previous period
        </span>
    </div>
);

export const AnalyticsScreen = () => (
    <Frame place="analytics" trail={['Analytics', 'Traffic']}>
        <Column width="wide">
            <PageHead
                description="northwind.com and 2 more sites · 1 – 30 October 2026"
                title="Traffic"
            >
                <LiveCount className="mr-3" count={129} />
                <SegmentedControl aria-label="Period" defaultValue="30d">
                    <SegmentedControlItem value="24h">24h</SegmentedControlItem>
                    <SegmentedControlItem value="7d">7d</SegmentedControlItem>
                    <SegmentedControlItem value="30d">30d</SegmentedControlItem>
                    <SegmentedControlItem value="12m">12m</SegmentedControlItem>
                </SegmentedControl>
                <Button variant="secondary">
                    Export
                    <Download {...icon} />
                </Button>
            </PageHead>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                    <Card className="col-span-2" layout="chart">
                        <div className="flex items-start justify-between gap-4">
                            <CardHeader>
                                <CardTitle>Unique visitors</CardTitle>
                                <CardFigure>
                                    <CardValue size="lg">48,210</CardValue>
                                    <CardDelta>+12.4% on the 30 days before</CardDelta>
                                </CardFigure>
                            </CardHeader>
                            <Legend />
                        </div>
                        <div aria-label="Unique visitors per day" role="img">
                            <AreaChart
                                data={days}
                                formatXLabel={shortDate}
                                interactive={false}
                                margin={{ top: 8, right: 8, bottom: 28, left: 40 }}
                                style={{ height: 228 }}
                            >
                                <Grid />
                                <Area
                                    dataKey="previous"
                                    fill="var(--color-chart-series-5)"
                                    fillOpacity={0}
                                    showHighlight={false}
                                    strokeWidth={1.5}
                                />
                                <Area dataKey="current" fill="var(--color-chart-1)" />
                                <ChartAnnotation icon={Rocket} index={20} />
                                <XAxis numTicks={6} />
                                <YAxis numTicks={4} />
                            </AreaChart>
                        </div>
                    </Card>
                    <Card layout="list">
                        <BarList title="Top sources" tone="chart" valueLabel="Visitors">
                            {sources.map(source => (
                                <BarListItem
                                    displayValue={number.format(source.value)}
                                    icon={source.icon}
                                    key={source.label}
                                    value={source.value}
                                >
                                    {source.label}
                                </BarListItem>
                            ))}
                        </BarList>
                    </Card>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {stats.map(stat => (
                        <StatSpark key={stat.label} stat={stat} />
                    ))}
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Page</TableHead>
                            <TableHead numeric>Visitors</TableHead>
                            <TableHead numeric>Views</TableHead>
                            <TableHead numeric>Bounce</TableHead>
                            <TableHead numeric>Time on page</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pages.map(page => (
                            <TableRow key={page.path}>
                                <TableCell className="font-mono">{page.path}</TableCell>
                                <TableCell numeric>{number.format(page.visitors)}</TableCell>
                                <TableCell className="text-neutral-700" numeric>
                                    {number.format(page.views)}
                                </TableCell>
                                <TableCell className="text-neutral-700" numeric>
                                    {page.bounce}
                                </TableCell>
                                <TableCell className="text-neutral-700" numeric>
                                    {page.time}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Column>
    </Frame>
);
