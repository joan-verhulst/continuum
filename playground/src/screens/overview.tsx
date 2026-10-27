import {
    ActivityItem,
    ActivityList,
    BarList,
    BarListItem,
    Card,
    CardTitle,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    StatCard,
} from 'continuum';
import { Area, AreaChart, ChartTooltip, Grid, XAxis, YAxis } from 'continuum/charts';
import { CircleAlert, CreditCard, UserPlus, UserRoundX } from 'lucide-react';
import { ChartCardHeader, chartMargin, seriesRows } from './shared';
import { formatEuro, PageHead, Workspace } from './workspace';

const icon = { strokeWidth: 2 } as const;

// Monthly recurring revenue, week by week through the quarter the page shows; the chart's
// colour is the theme's first data colour, its accent.
const weeks = [41.2, 41.9, 42.3, 43.1, 43.0, 44.2, 44.9, 45.3, 46.4, 46.9, 47.6, 48.26].map(
    (k, i) => ({ date: new Date(2026, 7, 3 + i * 7), revenue: Math.round(k * 1000) }),
);

const formatWeek = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const formatThousands = (value: number) => `€${Math.round(value / 1000)}k`;
const revenueColour = 'var(--color-chart-1)';

const plans = [
    { name: 'Enterprise', revenue: 28400 },
    { name: 'Pro', revenue: 15900 },
    { name: 'Starter', revenue: 3960 },
];

/**
 * A dashboard for one period, the quarter: revenue as the one figure that leads, the numbers
 * around it, then where the revenue comes from and what moved. It only reads; it asks nothing.
 */
export const Overview = () => (
    <Workspace place="overview" trail={['Overview']}>
        <PageHead description="How the workspace is doing this quarter." title="Overview">
            <Select defaultValue="quarter">
                <SelectTrigger aria-label="Period" className="w-36" size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="quarter">This quarter</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                </SelectContent>
            </Select>
        </PageHead>

        <Card layout="chart">
            <ChartCardHeader
                delta="+17.1% this quarter"
                title="Monthly recurring revenue"
                value="€48,260"
            />
            <div aria-label="Monthly recurring revenue, week by week this quarter" role="img">
                <AreaChart
                    data={weeks}
                    formatXLabel={formatWeek}
                    margin={chartMargin}
                    style={{ height: 260 }}
                >
                    <Grid />
                    <Area dataKey="revenue" fill={revenueColour} />
                    <XAxis numTicks={4} />
                    <YAxis formatValue={formatThousands} />
                    <ChartTooltip
                        rows={seriesRows(
                            [{ key: 'revenue', label: 'Recurring revenue', color: revenueColour }],
                            formatEuro,
                        )}
                    />
                </AreaChart>
            </div>
        </Card>

        <div className="grid grid-cols-4 gap-4">
            <StatCard delta="+3.2%" label="Active customers" value="1,284" />
            <StatCard delta="+12" label="New customers" value="86" />
            <StatCard delta="−0.4 pt" label="Churn" value="1.9%" />
            <StatCard delta="+5" label="Open tickets" trend="down" value="23" />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Card layout="list">
                <BarList title="Recurring revenue by plan" valueLabel="A month">
                    {plans.map(plan => (
                        <BarListItem
                            displayValue={formatEuro(plan.revenue)}
                            key={plan.name}
                            value={plan.revenue}
                        >
                            {plan.name}
                        </BarListItem>
                    ))}
                </BarList>
            </Card>
            <Card layout="list">
                <CardTitle>What moved</CardTitle>
                <ActivityList>
                    <ActivityItem
                        icon={<UserPlus {...icon} />}
                        time="12 minutes ago"
                        title="Tyrell & Co started on the Starter plan"
                        tone="success"
                    />
                    <ActivityItem
                        icon={<CreditCard {...icon} />}
                        time="1 hour ago"
                        title="Northwind Traders upgraded to Enterprise"
                        tone="primary"
                    />
                    <ActivityItem
                        icon={<CircleAlert {...icon} />}
                        time="3 hours ago"
                        title="A payment from Initech failed"
                        tone="warning"
                    />
                    <ActivityItem
                        icon={<UserRoundX {...icon} />}
                        time="Yesterday"
                        title="Cyberdyne cancelled their plan"
                    />
                </ActivityList>
            </Card>
        </div>
    </Workspace>
);
