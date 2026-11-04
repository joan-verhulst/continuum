import { Card, CardTitle } from 'continuum';
import {
    defaultPieColors,
    PieCenter,
    PieChart,
    PieChart as PieChartRoot,
    PieSlice,
} from 'continuum/charts';
import type { Entry, InUse } from '../kit';

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

const devices = [
    { label: 'Desktop', value: 7688 },
    { label: 'Mobile', value: 3844 },
    { label: 'Tablet', value: 868 },
];

const DevicesCard = () => (
    <Card className="w-full max-w-md flex-row items-center gap-8 p-6">
        <div aria-label="Sessions by device: desktop 62%, mobile 31%, tablet 7%" role="img">
            <PieChart cornerRadius={2} data={devices} innerRadius={52} padAngle={0.02} size={160}>
                {devices.map((device, index) => (
                    <PieSlice index={index} key={device.label} showGlow={false} />
                ))}
                <PieCenter
                    defaultLabel="Sessions"
                    formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }}
                />
            </PieChart>
        </div>
        <div className="flex flex-1 flex-col gap-3">
            <CardTitle>By device</CardTitle>
            {devices.map((device, i) => (
                <span className="flex items-center gap-2 text-xs" key={device.label}>
                    {/* The slices' own colours, so the legend matches them in every theme. */}
                    <span
                        className="size-2 rounded-full"
                        style={{ background: defaultPieColors[i] }}
                    />
                    <span className="flex-1 text-neutral-700">{device.label}</span>
                    <span className="font-medium text-neutral-950 tabular-nums">
                        {Math.round((device.value / 12400) * 100)}%
                    </span>
                </span>
            ))}
        </div>
    </Card>
);

export const inUse: InUse = {
    title: 'Sessions by device',
    note: 'A donut with its total in the middle and the share of each slice beside it.',
    canvas: true,
    render: () => <DevicesCard />,
};
