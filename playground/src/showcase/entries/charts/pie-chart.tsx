import {
    BarList,
    BarListItem,
    Card,
    CardTitle,
    SegmentedControl,
    SegmentedControlItem,
    StatCard,
} from 'continuum';
import {
    defaultPieColors,
    PieCenter,
    PieChart,
    PieChart as PieChartRoot,
    PieSlice,
} from 'continuum/charts-legacy';
import { AppWindow, type Entry, type InUse } from '../../kit';

const deviceSessions = [
    { label: 'Desktop', value: 7688 },
    { label: 'Mobile', value: 3844 },
    { label: 'Tablet', value: 868 },
];

const PiePreview = () => (
    <div aria-label="Sessions by device: desktop 62%, mobile 31%, tablet 7%" role="img">
        <PieChartRoot
            cornerRadius={2}
            data={deviceSessions}
            innerRadius={50}
            padAngle={0.02}
            size={152}
        >
            {deviceSessions.map((device, index) => (
                <PieSlice index={index} key={device.label} showGlow={false} />
            ))}
            <PieCenter
                defaultLabel="Sessions"
                formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }}
            />
        </PieChartRoot>
    </div>
);

export const entry: Entry = {
    id: 'pie-chart',
    name: 'Pie chart',
    category: 'charts',
    description: 'Shares as slices, the total in the centre; hover a slice for its value.',
    Preview: PiePreview,
};

const total = deviceSessions.reduce((sum, device) => sum + device.value, 0);

const countries = [
    { name: 'Netherlands', sessions: 4210 },
    { name: 'Germany', sessions: 2960 },
    { name: 'United Kingdom', sessions: 2180 },
    { name: 'Belgium', sessions: 1340 },
    { name: 'France', sessions: 910 },
];

const DevicesCard = () => (
    <Card className="gap-6" layout="list">
        <CardTitle>Sessions by device</CardTitle>
        <div className="flex items-center gap-8">
            <div aria-label="Sessions by device: desktop 62%, mobile 31%, tablet 7%" role="img">
                <PieChart
                    cornerRadius={2}
                    data={deviceSessions}
                    innerRadius={56}
                    padAngle={0.02}
                    size={172}
                >
                    {deviceSessions.map((device, index) => (
                        <PieSlice index={index} key={device.label} showGlow={false} />
                    ))}
                    <PieCenter
                        defaultLabel="Sessions"
                        formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }}
                    />
                </PieChart>
            </div>
            <div className="flex flex-1 flex-col gap-3">
                {deviceSessions.map((device, i) => (
                    <span className="flex items-center gap-2 text-xs" key={device.label}>
                        {/* The slices' own colours, so the legend matches them in every theme. */}
                        <span
                            className="size-2 rounded-full"
                            style={{ background: defaultPieColors[i] }}
                        />
                        <span className="flex-1 text-neutral-700">{device.label}</span>
                        <span className="font-medium text-neutral-950 tabular-nums">
                            {Math.round((device.value / total) * 100)}%
                        </span>
                    </span>
                ))}
            </div>
        </div>
    </Card>
);

const AudiencePage = () => (
    <AppWindow
        actions={
            <SegmentedControl aria-label="Range" defaultValue="30d">
                <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
                <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
                <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
            </SegmentedControl>
        }
        description="Who visited acme.com in the last 30 days, and on what."
        place="reports"
        title="Audience"
        trail={['Reports', 'Audience']}
    >
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
            <DevicesCard />
            <Card layout="list">
                <BarList title="Top countries" valueLabel="Sessions">
                    {countries.map(country => (
                        <BarListItem
                            displayValue={country.sessions.toLocaleString('en-GB')}
                            key={country.name}
                            value={country.sessions}
                        >
                            {country.name}
                        </BarListItem>
                    ))}
                </BarList>
            </Card>
        </div>
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
            <StatCard delta="+4.0%" label="Visitors" value="9,315" />
            <StatCard delta="+2.1 pt" label="Returning" value="38%" />
            <StatCard delta="+0.8 pt" label="On mobile" value="31%" />
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Audience',
    note: 'Sessions split by device as a donut, its total in the middle and each share beside it.',
    app: true,
    render: () => <AudiencePage />,
};
