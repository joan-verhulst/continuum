import { Button, LiveCount, StatusDot } from 'continuum';
import { Bell } from 'lucide-react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
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
    {
        name: 'API',
        detail: 'api.acme.com',
        tone: 'success',
        label: 'Operational',
        uptime: '99.99%',
    },
    {
        name: 'Dashboard',
        detail: 'app.acme.com',
        tone: 'success',
        label: 'Operational',
        uptime: '99.98%',
    },
    {
        name: 'Invoice emails',
        detail: 'Sending and tracking',
        tone: 'success',
        label: 'Operational',
        uptime: '99.95%',
    },
    {
        name: 'Webhooks',
        detail: 'Delivery to your endpoints',
        tone: 'warning',
        label: 'Delayed',
        uptime: '99.71%',
    },
    {
        name: 'Payouts',
        detail: 'Transfers to your bank',
        tone: 'error',
        label: 'Down',
        uptime: '98.40%',
    },
    {
        name: 'Bank feeds',
        detail: 'Payment matching',
        tone: 'success',
        label: 'Operational',
        uptime: '99.96%',
    },
] as const;

const StatusPage = () => (
    <AppWindow
        actions={
            <>
                <LiveCount count={1284} label="Watching now" />
                <Button variant="secondary">
                    <Bell {...icon} /> Subscribe to updates
                </Button>
            </>
        }
        description="Live status of the Acme API, the dashboard and payouts."
        nav="none"
        title="Acme status"
    >
        <div className="overflow-hidden rounded-card border border-neutral-200">
            <ul className="flex flex-col divide-y divide-neutral-200">
                {systems.map(system => (
                    <li className="flex h-14 items-center gap-4 px-5 text-xs" key={system.name}>
                        <StatusDot pulse={system.tone !== 'success'} tone={system.tone} />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate font-medium text-neutral-950">
                                {system.name}
                            </span>
                            <span className="truncate text-neutral-600">{system.detail}</span>
                        </span>
                        <span className="w-28 text-neutral-600 tabular-nums">
                            {system.uptime} uptime
                        </span>
                        <span className="w-24 text-right text-neutral-950">{system.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Status page',
    note: 'A public status page: a dot for each system, pulsing while something is wrong, and a live count of who is watching.',
    app: true,
    render: () => <StatusPage />,
};
