import {
    BottomBar,
    Card,
    Dock,
    DockAction,
    DockItem,
    SegmentedControl,
    SegmentedControlItem,
    StatCard,
} from 'continuum';
import {
    Area,
    AreaChart,
    ChartTooltip,
    FunnelChart,
    type FunnelStage,
    Grid,
    XAxis,
    YAxis,
} from 'continuum/charts';
import { ListFilter, UserCheck, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import {
    AnalyticsPage,
    AnalyticsTopBar,
    ChartCardHeader,
    chartMargin,
    PageTitle,
    seriesRows,
} from './shared';

const segments: Record<string, FunnelStage[]> = {
    all: [
        { label: '/pricing', value: 1840 },
        { label: '/checkout', value: 1426 },
        { label: '/checkout/step-2', value: 557 },
        { label: '/checkout/complete', value: 483 },
    ],
    new: [
        { label: '/pricing', value: 1212 },
        { label: '/checkout', value: 874 },
        { label: '/checkout/step-2', value: 301 },
        { label: '/checkout/complete', value: 254 },
    ],
    returning: [
        { label: '/pricing', value: 628 },
        { label: '/checkout', value: 552 },
        { label: '/checkout/step-2', value: 256 },
        { label: '/checkout/complete', value: 229 },
    ],
};

// Eight weeks starting Monday 31 August 2026; the axis names them W1 to W8.
const firstWeek = new Date(2026, 7, 31);
const WEEK = 7 * 24 * 60 * 60 * 1000;
const entered = [310, 342, 298, 365, 380, 352, 401, 388];
const completed = [118, 136, 121, 150, 162, 149, 171, 159];
const weeks = entered.map((value, i) => ({
    date: new Date(firstWeek.getTime() + i * WEEK),
    entered: value,
    completed: completed[i] ?? 0,
}));
const formatWeek = (date: Date) =>
    `W${Math.round((date.getTime() - firstWeek.getTime()) / WEEK) + 1}`;
const weekSeries = [
    { key: 'entered', label: 'Entered', color: 'var(--color-chart-5)' },
    { key: 'completed', label: 'Completed', color: 'var(--color-chart-2)' },
];

/** Checkout funnel (Eyes, 2026): KPI cards, the funnel, and completion over time. */
export const CheckoutFunnel = () => {
    const [segment, setSegment] = useState('all');
    const [range, setRange] = useState('8w');

    return (
        <AnalyticsPage
            bottomBar={
                <BottomBar floating>
                    <Dock aria-label="Visitor segment" onValueChange={setSegment} value={segment}>
                        <DockItem value="all">
                            <Users strokeWidth={2} />
                            All visitors
                        </DockItem>
                        <DockItem value="new">
                            <UserPlus strokeWidth={2} />
                            New
                        </DockItem>
                        <DockItem value="returning">
                            <UserCheck strokeWidth={2} />
                            Returning
                        </DockItem>
                    </Dock>
                    <DockAction aria-label="Filters, 2 applied">
                        <ListFilter strokeWidth={2} />
                        (2)
                    </DockAction>
                </BottomBar>
            }
            rail="dashboards"
        >
            <AnalyticsTopBar trail={['Analytics', 'Funnels', 'Checkout funnel']} />

            <div className="mt-20 mb-6">
                <PageTitle>Funnels / Checkout funnel</PageTitle>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-4 gap-4">
                    <StatCard delta="+12%" label="Total entered" value="2,980" />
                    <StatCard delta="+12%" label="Completed" value="41%" />
                    <StatCard delta="+12%" label="Completion rate" value="51%" />
                    <StatCard
                        delta="-4%"
                        label="Avg time to complete"
                        trend="down"
                        value="1m 48s"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        delta="+18%"
                        label="Biggest drop-off"
                        trend="down"
                        value="/checkout/step-2"
                    />
                    <StatCard
                        delta="-6%"
                        label="vs previous period"
                        trend="down"
                        value="−5.1% overall completion"
                    />
                </div>
            </div>

            <FunnelChart className="mt-8" data={segments[segment] ?? []} style={{ height: 384 }} />

            <Card className="mt-8 gap-8 p-5 pb-8">
                <div className="flex items-start justify-between gap-4">
                    <ChartCardHeader
                        delta="+10.7% last mo"
                        size="lg"
                        title="Completion rate over time"
                        value="2.9k"
                    />
                    <SegmentedControl aria-label="Range" onValueChange={setRange} value={range}>
                        <SegmentedControlItem value="4w">4 weeks</SegmentedControlItem>
                        <SegmentedControlItem value="8w">8 weeks</SegmentedControlItem>
                        <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
                    </SegmentedControl>
                </div>
                <div aria-label="Funnel entries and completions per week" role="img">
                    <AreaChart
                        data={weeks}
                        formatXLabel={formatWeek}
                        margin={chartMargin}
                        style={{ height: 260 }}
                    >
                        <Grid />
                        {weekSeries.map(series => (
                            <Area dataKey={series.key} fill={series.color} key={series.key} />
                        ))}
                        <XAxis numTicks={weeks.length} />
                        <YAxis />
                        <ChartTooltip rows={seriesRows(weekSeries)} />
                    </AreaChart>
                </div>
            </Card>
        </AnalyticsPage>
    );
};
