import {
    BarList,
    BarListItem,
    Card,
    SegmentedControl,
    SegmentedControlItem,
    StatCard,
} from 'continuum';
import { AppWindow, type Entry, type InUse } from '../kit';

const StatCardPreview = () => (
    <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <StatCard delta="+12.4%" label="Sessions" value="12,480" />
        <StatCard delta="−3.1%" label="Bounce rate" trend="down" value="41.2%" />
    </div>
);

export const entry: Entry = {
    id: 'stat-card',
    name: 'Stat card',
    category: 'content',
    description: 'A KPI with its delta on one baseline.',
    Preview: StatCardPreview,
};

const WeekStats = () => (
    <AppWindow
        actions={
            <SegmentedControl aria-label="Range" defaultValue="7d">
                <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
                <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
                <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
            </SegmentedControl>
        }
        description="Week of 19 October, against the week before."
        nav="rail"
        place="overview"
        title="Overview"
    >
        <div className="grid grid-cols-4 gap-4">
            <StatCard delta="+12.4%" label="Sessions" value="12,480" />
            <StatCard delta="−3.1%" label="Bounce rate" trend="down" value="41.2%" />
            <StatCard delta="0.0%" label="Avg. duration" trend="neutral" value="2m 14s" />
            <StatCard delta="+8.9%" label="Conversions" value="1,204" />
        </div>
        <Card>
            <BarList title="Top pages" valueLabel="Sessions">
                <BarListItem value={4120}>/pricing</BarListItem>
                <BarListItem value={3312}>/</BarListItem>
                <BarListItem value={2840}>/blog/q3-review</BarListItem>
                <BarListItem value={1204}>/contact</BarListItem>
            </BarList>
        </Card>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Overview',
    note: 'The week in four numbers at the top of the overview, each with its change: up, down and flat.',
    app: true,
    render: () => <WeekStats />,
};
