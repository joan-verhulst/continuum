import { Card, CardHeader, CardTitle, LiveCount, StatusDot } from 'continuum';
import {
    type Entry,
    type InUse,
    type Knob,
    o,
    opts,
    type PreviewProps,
    type Tone,
    tones,
} from '../kit';

const dotText: Record<Tone, string> = {
    neutral: 'Paused',
    success: 'All systems operational',
    warning: 'Webhooks delayed',
    error: 'Payouts down',
    primary: 'Syncing',
};

const statusDotKnobs: Knob[] = [
    { id: 'tone', label: 'Tone', options: opts(...tones), default: 'success' },
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 6px'), o('md', 'md · 8px')],
        default: 'md',
    },
    { id: 'pulse', label: 'Pulse', switch: true, default: false },
    { id: 'text', label: 'Beside text', switch: true, default: true },
    { id: 'count', label: 'As a live count', switch: true, default: false },
];

const StatusDotPreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as Tone;

    if (knobs.count) return <LiveCount count={129} />;

    const dot = (
        <StatusDot
            label={knobs.text ? undefined : dotText[tone]}
            pulse={Boolean(knobs.pulse)}
            size={knobs.size === 'sm' ? 'sm' : undefined}
            tone={tone}
        />
    );

    return knobs.text ? (
        <span className="inline-flex items-center gap-2 text-neutral-700 text-xs">
            {dot} {dotText[tone]}
        </span>
    ) : (
        dot
    );
};

export const entry: Entry = {
    id: 'status-dot',
    name: 'Status dot and live count',
    category: 'labels',
    description: 'A status in a dot; pulsing for something live.',
    knobs: statusDotKnobs,
    Preview: StatusDotPreview,
};

const systems = [
    { name: 'API', tone: 'success', label: 'Operational' },
    { name: 'Dashboard', tone: 'success', label: 'Operational' },
    { name: 'Webhooks', tone: 'warning', label: 'Delayed' },
    { name: 'Payouts', tone: 'error', label: 'Down' },
] as const;

const StatusPage = () => (
    <Card className="w-full max-w-md gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Systems</CardTitle>
            <LiveCount count={1284} />
        </CardHeader>
        <ul className="flex flex-col divide-y divide-neutral-200">
            {systems.map(system => (
                <li className="flex h-10 items-center gap-3" key={system.name}>
                    <StatusDot pulse={system.tone !== 'success'} tone={system.tone} />
                    <span className="flex-1 text-neutral-950 text-xs">{system.name}</span>
                    <span className="text-neutral-600 text-xs">{system.label}</span>
                </li>
            ))}
        </ul>
    </Card>
);

export const inUse: InUse = {
    title: 'Status page',
    note: 'A dot per system, pulsing while something is wrong, and a live count.',
    canvas: true,
    render: () => <StatusPage />,
};
