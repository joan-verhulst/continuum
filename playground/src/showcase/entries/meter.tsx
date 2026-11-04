import { Button, Card, CardHeader, CardTitle, Meter } from 'continuum';
import { type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';

const meterKnobs: Knob[] = [
    {
        id: 'tone',
        label: 'Tone',
        options: [
            o('chart', 'Chart'),
            o('action', 'Action'),
            o('warning', 'Warning'),
            o('error', 'Error'),
        ],
        default: 'chart',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 4px'), o('md', 'md · 8px')],
        default: 'sm',
    },
    { id: 'value', label: 'Show the value', switch: true, default: false },
    { id: 'caption', label: 'Caption', switch: true, default: true },
];

const MeterPreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as 'chart' | 'action' | 'warning' | 'error';
    const value = tone === 'error' ? 10000 : tone === 'warning' ? 9200 : 2450;

    return (
        <Meter
            caption={knobs.caption ? 'Resets in 10 days' : undefined}
            className="w-full max-w-72"
            label="Credit usage"
            max={10000}
            showValue={Boolean(knobs.value)}
            size={knobs.size === 'md' ? 'md' : 'sm'}
            tone={tone === 'action' ? undefined : tone}
            value={value}
        />
    );
};

export const entry: Entry = {
    id: 'meter',
    name: 'Meter',
    category: 'status',
    description: 'Usage against a limit: credits, seats, storage.',
    knobs: meterKnobs,
    Preview: MeterPreview,
};

const Usage = () => (
    <Card className="w-full max-w-md gap-5">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Usage · Business plan</CardTitle>
            <Button variant="ghost">Upgrade</Button>
        </CardHeader>
        <Meter label="Seats" showValue value={60} />
        <Meter caption="9.2 of 10 GB" label="Storage" size="md" tone="warning" value={92} />
        <Meter caption="Resets in 10 days" label="Credits" max={10000} tone="chart" value={2450} />
        <Meter caption="Limit reached" label="API calls" size="md" tone="error" value={100} />
    </Card>
);

export const inUse: InUse = {
    title: 'Usage',
    note: 'Usage against each limit, in the tone of how close it is.',
    canvas: true,
    render: () => <Usage />,
};
