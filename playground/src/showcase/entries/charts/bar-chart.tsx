import { Card, CardTitle, StatCard } from 'continuum';
import { BarChart, ChartLegend } from 'continuum/charts';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

/** Revenue per plan in €K, oldest first: the figures the theme preview reports. */
const revenue = [
    { month: 'Jun', starter: 6, team: 11, business: 9, enterprise: 8 },
    { month: 'Jul', starter: 6, team: 12, business: 9, enterprise: 8 },
    { month: 'Aug', starter: 6, team: 12, business: 10, enterprise: 9 },
    { month: 'Sep', starter: 7, team: 13, business: 11, enterprise: 9 },
    { month: 'Oct', starter: 7, team: 14, business: 12, enterprise: 10 },
    { month: 'Nov', starter: 8, team: 16, business: 13, enterprise: 11 },
];

const plans = [
    { key: 'starter', name: 'Starter' },
    { key: 'team', name: 'Team' },
    { key: 'business', name: 'Business' },
    { key: 'enterprise', name: 'Enterprise' },
];
const total = [{ key: 'team', name: 'Revenue' }];

const formatEuro = (value: number) => `€${value}K`;

const barKnobs: Knob[] = [
    {
        id: 'layout',
        label: 'Series',
        options: [o('one', 'One'), o('stacked', 'Stacked'), o('grouped', 'Side by side')],
        default: 'stacked',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading'), o('empty', 'No data')],
        default: 'ready',
    },
];

const BarChartPreview = ({ knobs }: PreviewProps) => (
    <BarChart
        aria-label="Revenue by plan, June to November"
        data={knobs.state === 'empty' ? [] : revenue}
        formatY={formatEuro}
        height={176}
        loading={knobs.state === 'loading'}
        series={
            knobs.layout === 'one' ? total : knobs.layout === 'grouped' ? plans.slice(0, 3) : plans
        }
        stacked={knobs.layout === 'stacked'}
        x="month"
    />
);

export const entry: Entry = {
    id: 'bar-chart',
    name: 'Bar chart',
    category: 'charts',
    description: 'A comparison across categories or whole periods, stacked or side by side.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs: barKnobs,
    Preview: BarChartPreview,
};

const RevenueCard = () => (
    <Card layout="chart">
        <div className="flex items-center justify-between gap-4">
            <CardTitle>Revenue by plan</CardTitle>
            <ChartLegend items={plans.map(plan => ({ name: plan.name }))} />
        </div>
        <BarChart
            aria-label="Revenue by plan, June to November"
            data={revenue}
            formatY={formatEuro}
            height={240}
            series={plans}
            stacked
            x="month"
        />
    </Card>
);

const RevenuePage = () => (
    <AppWindow
        description="What each plan brought in over the last six months."
        place="reports"
        title="Revenue"
        trail={['Reports', 'Revenue']}
    >
        <RevenueCard />
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
            <StatCard delta="+8.4%" label="Recurring revenue" value="€48,260" />
            <StatCard delta="+2.1%" label="Average per account" value="€412" />
            <StatCard delta="−0.4%" label="Churn" trend="down" value="1.8%" />
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Revenue',
    note: 'The six months of revenue split by plan, as the chart that leads the revenue page.',
    app: true,
    render: () => <RevenuePage />,
};
