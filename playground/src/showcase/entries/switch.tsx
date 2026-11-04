import { Badge, Button, Card, CardHeader, CardTitle, Field, FieldLabel, Switch } from 'continuum';
import { Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type Entry, type InUse, icon, type Knob, Labelled, type PreviewProps } from '../kit';

const switchKnobs: Knob[] = [
    { id: 'on', label: 'On', switch: true, default: true },
    { id: 'label', label: 'Label', switch: true, default: true },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const SwitchPreview = ({ knobs }: PreviewProps) => {
    const [on, setOn] = useState(true);

    useEffect(() => setOn(Boolean(knobs.on)), [knobs.on]);

    const control = (
        <Switch
            aria-label={knobs.label ? undefined : 'Email me when a report is ready'}
            checked={on}
            disabled={Boolean(knobs.disabled)}
            onCheckedChange={setOn}
        />
    );

    return knobs.label ? (
        <Labelled label="Email me when a report is ready">{control}</Labelled>
    ) : (
        control
    );
};

export const entry: Entry = {
    id: 'switch',
    name: 'Switch',
    category: 'inputs',
    description: 'Settings that take effect at once.',
    knobs: switchKnobs,
    Preview: SwitchPreview,
};

const sharing = [
    {
        id: 'link',
        label: 'Anyone with the link can view',
        description: 'No account needed',
        on: true,
    },
    {
        id: 'comments',
        label: 'Allow comments',
        description: 'Viewers can comment on charts',
        on: true,
    },
    { id: 'downloads', label: 'Allow downloads', description: 'As PDF and CSV', on: false },
    {
        id: 'expire',
        label: 'Expire the link after 30 days',
        description: 'You can renew it at any time',
        on: false,
    },
];

const ShareReport = () => (
    <Card className="w-full max-w-md gap-5">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Share Q3 review</CardTitle>
            <Badge tone="success" variant="dot">
                Public
            </Badge>
        </CardHeader>
        <div className="flex flex-col gap-4">
            {sharing.map(item => (
                <Field className="flex-row items-center justify-between gap-4" key={item.id}>
                    <span className="flex flex-col gap-0.5">
                        <FieldLabel className="cursor-pointer">{item.label}</FieldLabel>
                        <span className="text-neutral-600 text-xs">{item.description}</span>
                    </span>
                    <Switch defaultChecked={item.on} />
                </Field>
            ))}
        </div>
        <Button className="self-end" variant="secondary">
            <Copy {...icon} /> Copy link
        </Button>
    </Card>
);

export const inUse: InUse = {
    title: 'Share settings',
    note: 'Switches that take effect at once, each with what it does.',
    canvas: true,
    render: () => <ShareReport />,
};
