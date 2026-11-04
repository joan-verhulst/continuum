import { Badge, Button, Card, CardTitle, IconTile } from 'continuum';
import {
    CircleAlert,
    CircleCheck,
    Clock,
    Database,
    FileText,
    Hash,
    Mail,
    Send,
    Webhook,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
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
        description: 'Alerts in a channel',
        connected: true,
    },
    {
        icon: <Mail {...icon} />,
        name: 'Email',
        description: 'Reports on a schedule',
        connected: true,
    },
    {
        icon: <Webhook {...icon} />,
        name: 'Webhooks',
        description: 'Every event, as JSON',
        connected: false,
    },
    {
        icon: <Database {...icon} />,
        name: 'Warehouse',
        description: 'A nightly export',
        connected: false,
    },
];

const Integrations = () => (
    <Card className="w-full max-w-md gap-4">
        <CardTitle>Integrations</CardTitle>
        <ul className="flex flex-col gap-3">
            {integrations.map(item => (
                <li className="flex items-center gap-3" key={item.name}>
                    <IconTile
                        tone={item.connected ? 'success' : 'neutral'}
                        variant={item.connected ? 'outline' : 'filled'}
                    >
                        {item.icon}
                    </IconTile>
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium text-neutral-950 text-xs">{item.name}</span>
                        <span className="text-neutral-500 text-xxs">{item.description}</span>
                    </span>
                    {item.connected ? (
                        <Badge tone="success" variant="dot">
                            Connected
                        </Badge>
                    ) : (
                        <Button variant="secondary">Connect</Button>
                    )}
                </li>
            ))}
        </ul>
    </Card>
);

export const inUse: InUse = {
    title: 'Integrations',
    note: 'A tile per integration, outlined in a tone once it is connected.',
    canvas: true,
    render: () => <Integrations />,
};
