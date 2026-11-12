import { SegmentedControl, SegmentedControlItem, StatCard } from 'continuum';
import { ChartCard, type ChartSeries } from 'continuum/charts';
import { Wallet } from 'lucide-react';
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
        // A tint marks one series out, so the knob tints the last: on all of them it says nothing.
        id: 'tint',
        label: 'Tint',
        options: [o('none', 'None'), o('one', 'One series')],
        default: 'none',
    },
    {
        id: 'texture',
        label: 'Texture',
        options: [o('none', 'None'), o('stripes', 'Stripes'), o('dots', 'Dots')],
        default: 'stripes',
        when: values => values.tint === 'one',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading'), o('empty', 'No data')],
        default: 'ready',
    },
];

/** The series with the last one drawn as a tint, in the texture asked for. */
const tintLast = (series: readonly ChartSeries[], texture: string): ChartSeries[] =>
    series.map((line, i) =>
        i === series.length - 1
            ? { ...line, fill: 'tint', texture: texture as ChartSeries['texture'] }
            : line,
    );

const BarChartPreview = ({ knobs }: PreviewProps) => {
    const series =
        knobs.layout === 'one' ? total : knobs.layout === 'grouped' ? plans.slice(0, 3) : plans;

    const ready = knobs.state === 'ready';

    return (
        <ChartCard
            className="w-full max-w-3xl"
            comparison="on the six months before"
            data={knobs.state === 'empty' ? [] : revenue}
            delta={ready ? '+8.4%' : undefined}
            formatY={formatEuro}
            height={200}
            icon={<Wallet />}
            kind="bar"
            loading={knobs.state === 'loading'}
            series={knobs.tint === 'one' ? tintLast(series, String(knobs.texture)) : series}
            stacked={knobs.layout === 'stacked'}
            title="Revenue by plan"
            value={ready ? '€48,260' : '—'}
            x="month"
        />
    );
};

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

// Enterprise is still in its first months, so it alone is drawn as a tint.
const RevenueCard = () => (
    <ChartCard
        actions={
            <SegmentedControl aria-label="Range" defaultValue="6m">
                <SegmentedControlItem value="6m">6 months</SegmentedControlItem>
                <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
            </SegmentedControl>
        }
        data={revenue}
        comparison="on the six months before"
        delta="+8.4%"
        formatY={formatEuro}
        icon={<Wallet />}
        kind="bar"
        series={tintLast(plans, 'stripes')}
        stacked
        title="Revenue by plan"
        value="€48,260"
        x="month"
    />
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
