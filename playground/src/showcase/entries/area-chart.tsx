import {
    Card,
    CardDelta,
    CardFigure,
    CardHeader,
    CardTitle,
    CardValue,
    SegmentedControl,
    SegmentedControlItem,
} from 'continuum';
import { Area, AreaChart, ChartTooltip, Grid, XAxis, YAxis } from 'continuum/charts';
import { chartMargin, formatWeekday, reportWeek, seriesRows } from '../../screens/shared';
import type { Entry, InUse } from '../kit';

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

const trafficInUse = reportWeek.map((date, i) => ({
    date,
    visitors: [4200, 5100, 4800, 6300, 5900, 3600, 4100][i] ?? 0,
    returning: [1800, 2300, 2100, 2900, 2600, 1500, 1700][i] ?? 0,
}));

const trafficSeriesInUse = [
    { key: 'visitors', label: 'Visitors', color: 'var(--color-chart-line-primary)' },
    { key: 'returning', label: 'Returning', color: 'var(--color-chart-line-secondary)' },
];

const VisitorsChart = () => (
    <Card className="w-full gap-3" layout="chart">
        <CardHeader className="flex-row items-start justify-between">
            <div className="flex flex-col gap-1">
                <CardTitle>Visitors this week</CardTitle>
                <CardFigure>
                    <CardValue size="lg">33,900</CardValue>
                    <CardDelta>+10.7% last week</CardDelta>
                </CardFigure>
            </div>
            <SegmentedControl aria-label="Range" defaultValue="7d">
                <SegmentedControlItem value="7d">7d</SegmentedControlItem>
                <SegmentedControlItem value="30d">30d</SegmentedControlItem>
                <SegmentedControlItem value="12m">12m</SegmentedControlItem>
            </SegmentedControl>
        </CardHeader>
        <div aria-label="Visitors and returning visitors per day" className="w-full" role="img">
            <AreaChart
                data={trafficInUse}
                formatXLabel={formatWeekday}
                margin={chartMargin}
                style={{ height: 200 }}
            >
                <Grid />
                {trafficSeriesInUse.map(series => (
                    <Area dataKey={series.key} fill={series.color} key={series.key} />
                ))}
                <XAxis numTicks={trafficInUse.length} />
                <YAxis formatValue={value => (value === 0 ? '0' : `${value / 1000}k`)} />
                <ChartTooltip
                    rows={seriesRows(trafficSeriesInUse, value => value.toLocaleString('en-GB'))}
                />
            </AreaChart>
        </div>
    </Card>
);

export const inUse: InUse = {
    title: 'Visitors this week',
    note: 'Two series with a tooltip, under the figure they add up to.',
    canvas: true,
    render: () => <VisitorsChart />,
};
