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
import { Area, AreaChart, ChartTooltip, Grid, XAxis, YAxis } from 'continuum/charts';
import { chartMargin, formatWeekday, reportWeek, seriesRows } from '../../screens/shared';
import { AppWindow, type Entry, type InUse } from '../kit';

// The library page's two series, shortened to the tile.
const traffic = reportWeek.map((date, i) => ({
    date,
    visitors: [4200, 5100, 4800, 6300, 5900, 3600, 4100][i] ?? 0,
    returning: [1800, 2300, 2100, 2900, 2600, 1500, 1700][i] ?? 0,
}));

const trafficSeries = [
    { key: 'visitors', label: 'Visitors', color: 'var(--color-chart-line-primary)' },
    { key: 'returning', label: 'Returning', color: 'var(--color-chart-line-secondary)' },
];

const AreaChartPreview = () => (
    <div aria-label="Visitors and returning visitors per day" className="w-full" role="img">
        <AreaChart
            data={traffic}
            formatXLabel={formatWeekday}
            margin={chartMargin}
            style={{ height: 176 }}
        >
            <Grid />
            {trafficSeries.map(series => (
                <Area dataKey={series.key} fill={series.color} key={series.key} />
            ))}
            <XAxis numTicks={traffic.length} />
            <YAxis formatValue={value => (value === 0 ? '0' : `${value / 1000}k`)} />
            <ChartTooltip
                rows={seriesRows(trafficSeries, value => value.toLocaleString('en-GB'))}
            />
        </AreaChart>
    </div>
);

export const entry: Entry = {
    id: 'area-chart',
    name: 'Area chart',
    category: 'charts',
    description: 'Monotone lines over fading fills, with a tooltip that follows the pointer.',
    span: 2,
    stageClassName: 'items-stretch',
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
            <div className="flex items-center gap-4 pt-1 text-neutral-600 text-xs">
                {trafficSeries.map(series => (
                    <span className="flex items-center gap-1.5" key={series.key}>
                        {/* The series' own colour, so the key matches the line in every theme. */}
                        <span
                            className="size-2 rounded-full"
                            style={{ background: series.color }}
                        />
                        {series.label}
                    </span>
                ))}
            </div>
        </CardHeader>
        <div aria-label="Visitors and returning visitors per day" className="w-full" role="img">
            <AreaChart
                data={traffic}
                formatXLabel={formatWeekday}
                margin={chartMargin}
                style={{ height: 240 }}
            >
                <Grid />
                {trafficSeries.map(series => (
                    <Area dataKey={series.key} fill={series.color} key={series.key} />
                ))}
                <XAxis numTicks={traffic.length} />
                <YAxis formatValue={value => (value === 0 ? '0' : `${value / 1000}k`)} />
                <ChartTooltip
                    rows={seriesRows(trafficSeries, value => value.toLocaleString('en-GB'))}
                />
            </AreaChart>
        </div>
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
        <div className="grid grid-cols-3 gap-4">
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
