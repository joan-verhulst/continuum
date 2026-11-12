import {
    BottomBar,
    Card,
    Dock,
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
} from 'continuum/charts-legacy';
import { UserCheck, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import {
    AnalyticsPage,
    AnalyticsTopBar,
    ChartCardHeader,
    chartMargin,
    PageTitle,
    seriesRows,
} from './shared';

type Segment = 'all' | 'new' | 'returning';

// Eight weeks starting Monday 31 August 2026; the axis names them W1 to W8.
const firstWeek = new Date(2026, 7, 31);
const WEEK = 7 * 24 * 60 * 60 * 1000;

// Visitors who reached /pricing and who reached /checkout/complete, per week. All visitors are the
// new and the returning together, so every figure on the page is worked out from these.
const weekly = {
    new: {
        entered: [188, 205, 180, 220, 229, 212, 242, 236],
        completed: [62, 71, 64, 79, 85, 78, 90, 83],
    },
    returning: {
        entered: [122, 137, 118, 145, 151, 140, 159, 152],
        completed: [56, 65, 57, 71, 77, 71, 81, 76],
    },
};

const series = (segment: Segment, key: 'entered' | 'completed') =>
    segment === 'all'
        ? weekly.new[key].map((value, i) => value + (weekly.returning[key][i] ?? 0))
        : weekly[segment][key];

// Where the two middle steps fall between those who entered and those who completed, the same for
// either segment, so the steps of all visitors are the two segments' together.
const CHECKOUT = 0.62;
const STEP_2 = 0.07;

// The median time from /pricing to /checkout/complete; all visitors sit between the two segments.
const timeToComplete: Record<Segment, string> = {
    all: '1m 44s',
    new: '2m 06s',
    returning: '1m 21s',
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const count = new Intl.NumberFormat('en-GB');
const percent = (value: number) => `${value.toFixed(1)}%`;

/** The funnel, its figures and the weekly rate for one segment over the last `weeks` weeks. */
const funnelFor = (segment: Segment, weeks: number) => {
    const entered = series(segment, 'entered').slice(-weeks);
    const completed = series(segment, 'completed').slice(-weeks);
    const total = sum(entered);
    const done = sum(completed);
    const stages: FunnelStage[] = [
        { label: '/pricing', value: total },
        { label: '/checkout', value: Math.round(done + (total - done) * CHECKOUT) },
        { label: '/checkout/step-2', value: Math.round(done + (total - done) * STEP_2) },
        { label: '/checkout/complete', value: done },
    ];
    // The step that loses the largest share of the visitors who reached the one before it.
    const drops = stages.slice(1).map((stage, i) => ({
        label: stage.label,
        share: 1 - stage.value / (stages[i]?.value ?? 1),
    }));
    const biggest = drops.reduce((a, b) => (b.share > a.share ? b : a));
    const rows = entered.map((value, i) => ({
        date: new Date(firstWeek.getTime() + (8 - weeks + i) * WEEK),
        rate: Math.round(((completed[i] ?? 0) / value) * 1000) / 10,
    }));
    return { total, done, stages, biggest, rows };
};

const formatWeek = (date: Date) =>
    `W${Math.round((date.getTime() - firstWeek.getTime()) / WEEK) + 1}`;
const rateSeries = [{ key: 'rate', label: 'Completion rate', color: 'var(--color-chart-2)' }];

/** Checkout funnel (Eyes, 2026): KPI cards, the funnel, and completion over time. */
export const CheckoutFunnel = () => {
    const [segment, setSegment] = useState<Segment>('all');
    const [range, setRange] = useState('8w');

    // The range picks the weeks the whole page covers: the cards, the funnel and the chart.
    const weeks = range === '4w' ? 4 : 8;
    const { total, done, stages, biggest, rows } = funnelFor(segment, weeks);
    const latest = rows.at(-1)?.rate ?? 0;
    const change = latest - (rows.at(-2)?.rate ?? latest);

    return (
        <AnalyticsPage
            bottomBar={
                <BottomBar floating>
                    <Dock
                        aria-label="Visitor segment"
                        onValueChange={next => {
                            if (next) setSegment(next as Segment);
                        }}
                        value={segment}
                    >
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
                </BottomBar>
            }
            rail="analytics"
        >
            <AnalyticsTopBar trail={['Analytics', 'Funnels', 'Checkout funnel']} />

            <div className="mt-20 mb-6 flex items-end justify-between gap-4">
                <PageTitle>Checkout funnel</PageTitle>
                <SegmentedControl
                    aria-label="Range"
                    onValueChange={next => {
                        if (next) setRange(next);
                    }}
                    value={range}
                >
                    <SegmentedControlItem value="4w">4 weeks</SegmentedControlItem>
                    <SegmentedControlItem value="8w">8 weeks</SegmentedControlItem>
                </SegmentedControl>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Entered" value={count.format(total)} />
                    <StatCard label="Completed" value={count.format(done)} />
                    <StatCard label="Completion rate" value={percent((done / total) * 100)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        delta={`${Math.round(biggest.share * 100)}% leave`}
                        label="Biggest drop-off"
                        trend="down"
                        value={biggest.label}
                    />
                    <StatCard label="Median time to complete" value={timeToComplete[segment]} />
                </div>
            </div>

            <FunnelChart className="mt-8" data={stages} style={{ height: 384 }} />

            <Card className="mt-8 gap-8 p-5 pb-8">
                <ChartCardHeader
                    delta={`${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(1)} pts on the week before`}
                    size="lg"
                    title="Completion rate, last week"
                    trend={change >= 0 ? 'up' : 'down'}
                    value={percent(latest)}
                />
                <div aria-label="Completion rate per week" role="img">
                    <AreaChart
                        data={rows}
                        formatXLabel={formatWeek}
                        margin={chartMargin}
                        style={{ height: 260 }}
                    >
                        <Grid />
                        <Area dataKey="rate" fill="var(--color-chart-2)" />
                        <XAxis numTicks={rows.length} />
                        <YAxis formatValue={value => `${value}%`} />
                        <ChartTooltip rows={seriesRows(rateSeries, percent)} />
                    </AreaChart>
                </div>
            </Card>
        </AnalyticsPage>
    );
};
