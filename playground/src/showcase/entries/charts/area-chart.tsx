import {
    Card,
    CardDelta,
    CardFigure,
    CardHeader,
    CardTitle,
    CardValue,
    SegmentedControl,
    SegmentedControlItem,
    StatCard,
} from 'continuum';
import { AreaChart, ChartLegend } from 'continuum/charts';
import { Rocket } from 'lucide-react';
import { formatWeekday, reportWeek } from '../../../screens/shared';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

// The week the analytics screens report on, with the Friday release the marker points at.
const traffic = reportWeek.map((date, i) => ({
    date,
    visitors: [4200, 5100, 4800, 6300, 5900, 3600, 4100][i] ?? 0,
    returning: [1800, 2300, 2100, 2900, 2600, 1500, 1700][i] ?? 0,
}));

/*
 * A year of the same measure, a reading a day, so the kit can be judged at the density a real
 * report runs at: a slow climb, a summer dip, a weekly rhythm and one bad week in November.
 * Made here rather than drawn at random, so the chart is the same every time it is looked at.
 */
const wave = (i: number, period: number, size: number) =>
    Math.sin((i / period) * Math.PI * 2) * size;

const year = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(2025, 10, 12);
    date.setDate(date.getDate() - (364 - i));
    const trend = 2600 + i * 7;
    const season = wave(i, 365, 900);
    const week = wave(i, 7, 420);
    const slump = i > 196 && i < 232 ? -700 : 0;
    const outage = i > 300 && i < 309 ? -1500 : 0;
    const visitors = Math.max(400, Math.round(trend + season + week + slump + outage));
    return { date, visitors, returning: Math.round(visitors * 0.42 + wave(i, 7, 120)) };
});

const both = [
    { key: 'visitors', name: 'Visitors' },
    { key: 'returning', name: 'Returning' },
];
const one = [{ key: 'visitors', name: 'Visitors' }];

const formatMonth = (date: Date) => date.toLocaleDateString('en-GB', { month: 'short' });

const areaKnobs: Knob[] = [
    {
        id: 'range',
        label: 'Range',
        options: [o('week', 'A week · 7'), o('year', 'A year · 365')],
        default: 'week',
    },
    {
        id: 'series',
        label: 'Series',
        options: [o('one', 'One'), o('two', 'Two')],
        default: 'two',
    },
    {
        id: 'curve',
        label: 'Joined by',
        options: [o('smooth', 'Curve'), o('linear', 'Straight'), o('step', 'Step')],
        default: 'smooth',
    },
    {
        id: 'points',
        label: 'A tick at each reading',
        switch: true,
        default: false,
        when: values => values.range === 'week',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading'), o('empty', 'No data')],
        default: 'ready',
    },
    {
        id: 'marker',
        label: 'Marker',
        switch: true,
        default: false,
        when: values => values.state === 'ready',
    },
    {
        // The week is not over, so its last stretch is drawn as not yet measured.
        id: 'incomplete',
        label: 'Period unfinished',
        switch: true,
        default: false,
        when: values => values.state === 'ready',
    },
];

const AreaChartPreview = ({ knobs }: PreviewProps) => {
    const long = knobs.range === 'year';
    const rows = long ? year : traffic;

    return (
        <AreaChart
            aria-label={`Visitors and returning visitors per day, ${long ? 'over a year' : 'this week'}`}
            data={knobs.state === 'empty' ? [] : rows}
            formatX={long ? formatMonth : formatWeekday}
            height={176}
            incompleteFrom={knobs.incomplete ? rows.length - 2 : undefined}
            curve={knobs.curve as 'smooth' | 'linear' | 'step'}
            loading={knobs.state === 'loading'}
            points={Boolean(knobs.points)}
            markers={
                knobs.marker
                    ? [
                          {
                              index: long ? 304 : 4,
                              label: long ? 'Outage, 9 September' : 'Release 2.4',
                              icon: long ? undefined : <Rocket />,
                              tone: long ? ('error' as const) : undefined,
                          },
                      ]
                    : undefined
            }
            series={knobs.series === 'one' ? one : both}
            x="date"
            xTicks={long ? 6 : rows.length}
        />
    );
};

export const entry: Entry = {
    id: 'area-chart',
    name: 'Area chart',
    category: 'charts',
    description: 'A measure over time: monotone lines over a wash, read out at the nearest point.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs: areaKnobs,
    Preview: AreaChartPreview,
};

const VisitorsChart = () => (
    <Card layout="chart">
        <CardHeader className="flex-row items-start justify-between">
            <div className="flex flex-col gap-1">
                <CardTitle>Visitors</CardTitle>
                <CardFigure>
                    <CardValue size="xl">33,900</CardValue>
                    <CardDelta>+10.7% on last week</CardDelta>
                </CardFigure>
            </div>
            {/* Two series, so the key names them; it sits in the header, never over the plot. */}
            <ChartLegend className="pt-1" items={both.map(series => ({ name: series.name }))} />
        </CardHeader>
        <AreaChart
            aria-label="Visitors and returning visitors per day, this week"
            data={traffic}
            formatX={formatWeekday}
            height={240}
            series={both}
            x="date"
            xTicks={traffic.length}
        />
    </Card>
);

const TrafficPage = () => (
    <AppWindow
        actions={
            <SegmentedControl aria-label="Range" defaultValue="7d">
                <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
                <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
                <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
            </SegmentedControl>
        }
        description="Week of 19 October, against the week before."
        place="reports"
        title="Traffic"
        trail={['Reports', 'Traffic']}
    >
        <VisitorsChart />
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
            <StatCard delta="+6.2%" label="Sign-ups" value="412" />
            <StatCard delta="−3.1%" label="Bounce rate" trend="down" value="41.2%" />
            <StatCard delta="0.0%" label="Avg. duration" trend="neutral" value="2m 14s" />
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Traffic',
    note: 'The week’s visitors and returning visitors as the chart that leads the traffic page.',
    app: true,
    render: () => <TrafficPage />,
};
