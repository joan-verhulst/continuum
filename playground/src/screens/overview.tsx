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
import { Area, AreaChart, ChartTooltip, Grid, XAxis, YAxis } from 'continuum/charts-legacy';
import { CircleAlert, Sparkles, UserPlus, UserRoundX } from 'lucide-react';
import { useState } from 'react';
import { ChartCardHeader, chartMargin, seriesRows } from './shared';
import { allCustomers, formatEuro, PageHead, plans, Workspace } from './workspace';

const icon = { strokeWidth: 2 } as const;

// What the customers pay a month now: the sum the chart ends on and the plans split.
const total = allCustomers.reduce((sum, customer) => sum + customer.mrr, 0);

// Monthly recurring revenue, week by week over the last 26 weeks to Monday 19 October 2026, the
// last week the customers' own sum; the chart's colour is the theme's first data colour, its accent.
const weeks = [
    33.0, 33.4, 34.1, 34.5, 35.2, 35.6, 36.3, 36.9, 37.4, 38.2, 38.8, 39.5, 40.1, 40.7, 41.2, 41.9,
    42.3, 43.1, 43.0, 44.2, 44.9, 45.3, 46.4, 46.9, 47.6,
].map((k, i) => ({ date: new Date(2026, 3, 27 + i * 7), revenue: Math.round(k * 1000) }));
weeks.push({ date: new Date(2026, 9, 19), revenue: total });

/** The periods the page can read, and what each one's numbers are. */
const periods = {
    month: {
        label: 'Last 4 weeks',
        words: 'over the last four weeks',
        weeks: 4,
        newCustomers: 3,
        newDelta: '+1',
        churn: '0.6%',
        churnDelta: '−0.2 pt',
    },
    quarter: {
        label: 'Last 12 weeks',
        words: 'over the last twelve weeks',
        weeks: 12,
        newCustomers: 9,
        newDelta: '+2',
        churn: '1.9%',
        churnDelta: '−0.4 pt',
    },
    half: {
        label: 'Last 26 weeks',
        words: 'over the last 26 weeks',
        weeks: 26,
        newCustomers: 17,
        newDelta: '+5',
        churn: '3.8%',
        churnDelta: '+0.3 pt',
    },
};

type Period = keyof typeof periods;

const formatWeek = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const formatThousands = (value: number) => `€${Math.round(value / 1000)}k`;
const revenueColour = 'var(--color-chart-1)';

// Largest first: what each plan brings in a month, from the customers on it.
const byPlan = plans
    .map(plan => ({
        name: plan.id,
        revenue: allCustomers
            .filter(customer => customer.plan === plan.id)
            .reduce((sum, customer) => sum + customer.mrr, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);

const activeCustomers = allCustomers.filter(customer => customer.status === 'Active').length;

/**
 * A dashboard for one period, twelve weeks unless another is picked: revenue as the one figure
 * that leads, the numbers around it, then where the revenue comes from and what moved. It only
 * reads; it asks nothing.
 */
export const Overview = () => {
    const [period, setPeriod] = useState<Period>('quarter');
    const shown = periods[period];
    const range = weeks.slice(-shown.weeks);
    const start = range[0]?.revenue ?? total;
    const change = ((total - start) / start) * 100;

    return (
        <Workspace place="overview" trail={['Overview']}>
            <PageHead description={`How the workspace is doing ${shown.words}.`} title="Overview">
                <Select onValueChange={value => setPeriod(value as Period)} value={period}>
                    <SelectTrigger aria-label="Period" className="w-36" size="sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">{periods.month.label}</SelectItem>
                        <SelectItem value="quarter">{periods.quarter.label}</SelectItem>
                        <SelectItem value="half">{periods.half.label}</SelectItem>
                    </SelectContent>
                </Select>
            </PageHead>

            <Card layout="chart">
                <ChartCardHeader
                    delta={`${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(1)}% ${shown.words}`}
                    title="Monthly recurring revenue"
                    trend={change >= 0 ? 'up' : 'down'}
                    value={formatEuro(total)}
                />
                <div
                    aria-label={`Monthly recurring revenue, week by week ${shown.words}`}
                    role="img"
                >
                    <AreaChart
                        data={range}
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
                                [
                                    {
                                        key: 'revenue',
                                        label: 'Recurring revenue',
                                        color: revenueColour,
                                    },
                                ],
                                formatEuro,
                            )}
                        />
                    </AreaChart>
                </div>
            </Card>

            {/* Stacked rather than squeezed on a phone: two across, which costs height, not width. */}
            <div className="grid @max-shell-compact/shell:grid-cols-2 grid-cols-4 gap-4">
                <StatCard delta="+3" label="Active customers" value={String(activeCustomers)} />
                <StatCard
                    delta={shown.newDelta}
                    label="New customers"
                    value={String(shown.newCustomers)}
                />
                <StatCard
                    delta={shown.churnDelta}
                    label="Churn"
                    trend={shown.churnDelta.startsWith('+') ? 'down' : 'up'}
                    value={shown.churn}
                />
                <StatCard delta="+5" label="Open tickets" trend="down" value="23" />
            </div>

            <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
                <Card layout="list">
                    <BarList title="Recurring revenue by plan" valueLabel="A month">
                        {byPlan.map(plan => (
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
                            icon={<Sparkles {...icon} />}
                            time="2 hours ago"
                            title="Riverbend Media started a trial of Pro"
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
                            time="2 weeks ago"
                            title="Cyberdyne cancelled their plan"
                        />
                    </ActivityList>
                </Card>
            </div>
        </Workspace>
    );
};
