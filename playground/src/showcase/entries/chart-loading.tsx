import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    SegmentedControl,
    SegmentedControlItem,
    StatCard,
} from 'continuum';
import { AreaChartLoading } from 'continuum/charts';
import { Download } from 'lucide-react';
import { chartMargin } from '../../screens/shared';
import { AppWindow, type Entry, type InUse, icon } from '../kit';

const ChartLoadingPreview = () => (
    <AreaChartLoading className="h-38 w-full" label="Loading" margin={chartMargin} />
);

export const entry: Entry = {
    id: 'chart-loading',
    name: 'Area chart loading',
    category: 'charts',
    description: 'A skeleton line with a shimmer while the data is on its way.',
    stageClassName: 'items-stretch',
    Preview: ChartLoadingPreview,
};

const SessionsLoading = () => (
    <AppWindow
        actions={
            <>
                <SegmentedControl aria-label="Range" defaultValue="12m">
                    <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
                    <SegmentedControlItem value="90d">90 days</SegmentedControlItem>
                    <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
                </SegmentedControl>
                <Button disabled variant="secondary">
                    <Download {...icon} /> Export
                </Button>
            </>
        }
        description="Every visit to acme.com, week by week."
        nav="rail"
        place="reports"
        title="Sessions"
    >
        <Card layout="chart">
            <CardHeader>
                <CardTitle>Sessions over time</CardTitle>
                <span className="text-neutral-600 text-xs">Fetching 12 months of data…</span>
            </CardHeader>
            <AreaChartLoading
                className="h-60 w-full"
                label="Loading sessions"
                margin={chartMargin}
            />
        </Card>
        <div className="grid grid-cols-3 gap-4">
            <StatCard delta="+12.4%" label="Sessions this week" value="12,480" />
            <StatCard delta="+4.0%" label="Unique visitors" value="9,315" />
            <StatCard delta="−3.1%" label="Bounce rate" trend="down" value="41.2%" />
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Sessions, loading',
    note: 'The chart’s shape while a year of sessions is on its way.',
    app: true,
    render: () => <SessionsLoading />,
};
