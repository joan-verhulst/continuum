import { Badge, Button, Card, IconTile } from 'continuum';
import {
    Calculator,
    CircleAlert,
    CircleCheck,
    Clock,
    Database,
    FileText,
    Hash,
    Landmark,
    Mail,
    Send,
    Webhook,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
    previewIcon,
    type Tone,
    tones,
} from '../kit';

const tileGlyphs: Record<Tone, ReactNode> = {
    neutral: <FileText {...previewIcon} />,
    success: <CircleCheck {...previewIcon} />,
    warning: <Clock {...previewIcon} />,
    error: <CircleAlert {...previewIcon} />,
    primary: <Send {...previewIcon} />,
};

const iconTileKnobs: Knob[] = [
    { id: 'tone', label: 'Tone', options: opts(...tones), default: 'success' },
    { id: 'variant', label: 'Variant', options: opts('outline', 'filled'), default: 'outline' },
];

const IconTilePreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as Tone;

    return (
        <IconTile tone={tone} variant={knobs.variant === 'filled' ? 'filled' : 'outline'}>
            {tileGlyphs[tone]}
        </IconTile>
    );
};

export const entry: Entry = {
    id: 'icon-tile',
    name: 'Icon tile',
    category: 'labels',
    description: 'A 32px well that gives an icon a status.',
    knobs: iconTileKnobs,
    Preview: IconTilePreview,
};

const integrations = [
    {
        icon: <Hash {...icon} />,
        name: 'Slack',
        description: 'Overdue invoices and new customers, posted to #finance.',
        connected: true,
    },
    {
        icon: <Mail {...icon} />,
        name: 'Email reports',
        description: 'The week’s numbers to your inbox every Monday at nine.',
        connected: true,
    },
    {
        icon: <Landmark {...icon} />,
        name: 'Bank feed',
        description: 'Marks invoices paid as the money lands in your account.',
        connected: true,
    },
    {
        icon: <Webhook {...icon} />,
        name: 'Webhooks',
        description: 'Every invoice and payment event, as JSON to your endpoint.',
        connected: false,
    },
    {
        icon: <Database {...icon} />,
        name: 'Warehouse',
        description: 'A nightly export of every table to BigQuery or Snowflake.',
        connected: false,
    },
    {
        icon: <Calculator {...icon} />,
        name: 'Accounting',
        description: 'Invoices and payments booked in Exact or Xero.',
        connected: false,
    },
];

const Integrations = () => (
    <AppWindow
        description="Send what happens in Acme to the tools your team already uses."
        nav="rail"
        place="settings"
        title="Integrations"
    >
        <div className="grid grid-cols-3 gap-4">
            {integrations.map(item => (
                <Card className="gap-4 p-5" key={item.name}>
                    <div className="flex items-center justify-between gap-3">
                        <IconTile
                            tone={item.connected ? 'success' : 'neutral'}
                            variant={item.connected ? 'outline' : 'filled'}
                        >
                            {item.icon}
                        </IconTile>
                        {item.connected ? (
                            <Badge tone="success" variant="dot">
                                Connected
                            </Badge>
                        ) : (
                            <Button variant="secondary">Connect</Button>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="font-medium text-neutral-950 text-xs">{item.name}</p>
                        <p className="text-neutral-600 text-xs">{item.description}</p>
                    </div>
                </Card>
            ))}
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Integrations',
    note: 'A tile for each integration, outlined in green once it is connected and a quiet well until then.',
    app: true,
    render: () => <Integrations />,
};
