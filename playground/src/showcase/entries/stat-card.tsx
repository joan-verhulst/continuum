import { StatCard } from 'continuum';
import type { Entry, InUse } from '../kit';

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
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard delta="+12.4%" label="Sessions" value="12,480" />
        <StatCard delta="−3.1%" label="Bounce rate" trend="down" value="41.2%" />
        <StatCard delta="0.0%" label="Avg. duration" trend="neutral" value="2m 14s" />
        <StatCard delta="+8.9%" label="Conversions" value="1,204" />
    </div>
);

export const inUse: InUse = {
    title: 'This week',
    note: 'Four numbers with their change, up, down and flat.',
    canvas: true,
    render: () => <WeekStats />,
};
