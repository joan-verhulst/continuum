import { Button, Card, CardHeader, CardTitle } from 'continuum';
import { AreaChartLoading } from 'continuum/charts';
import { Download } from 'lucide-react';
import { chartMargin } from '../../screens/shared';
import { type Entry, type InUse, icon } from '../kit';

const ChartLoadingPreview = () => (
    <AreaChartLoading className="h-[152px] w-full" label="Loading" margin={chartMargin} />
);

export const entry: Entry = {
    id: 'chart-loading',
    name: 'Chart loading',
    category: 'charts',
    description: 'A skeleton line with a shimmer while the data is on its way.',
    stageClassName: 'items-stretch',
    Preview: ChartLoadingPreview,
};

const LoadingChart = () => (
    <Card className="w-full gap-3" layout="chart">
        <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
                <CardTitle>Sessions over time</CardTitle>
                <span className="text-neutral-500 text-xs">Fetching 12 months of data…</span>
            </div>
            <Button disabled variant="secondary">
                <Download {...icon} /> Export
            </Button>
        </CardHeader>
        <AreaChartLoading
            className="h-[200px] w-full"
            label="Loading sessions"
            margin={chartMargin}
        />
    </Card>
);

export const inUse: InUse = {
    title: 'Loading a chart',
    note: 'The chart’s shape while its data is on the way.',
    canvas: true,
    render: () => <LoadingChart />,
};
