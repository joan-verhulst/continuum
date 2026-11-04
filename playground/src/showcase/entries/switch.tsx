import {
    Badge,
    BarList,
    BarListItem,
    Button,
    Card,
    DialogClose,
    DialogDescription,
    Field,
    FieldLabel,
    StatCard,
    Switch,
} from 'continuum';
import { Copy, Download, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    Labelled,
    OpenDialog,
    type PreviewProps,
} from '../kit';

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
    <OpenDialog
        footer={
            <>
                <Button variant="secondary">
                    <Copy {...icon} /> Copy link
                </Button>
                <DialogClose render={<Button />}>Done</DialogClose>
            </>
        }
        title="Share Q3 review"
        width={480}
    >
        <div className="flex items-center justify-between gap-4">
            <DialogDescription>Changes apply as soon as you make them.</DialogDescription>
            <Badge tone="success" variant="dot">
                Public
            </Badge>
        </div>
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
    </OpenDialog>
);

export const inUse: InUse = {
    title: 'Share a report',
    note: 'The share dialog over the Q3 review: switches that take effect at once, each with what it does.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                place: 'reports',
                trail: ['Reports', 'Q3 review'],
                title: 'Q3 review',
                description: 'Revenue, churn and pipeline from July to September.',
                actions: (
                    <>
                        <Button variant="secondary">
                            <Download {...icon} /> Download
                        </Button>
                        <Button>
                            <Share2 {...icon} /> Share
                        </Button>
                    </>
                ),
                children: (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            <StatCard delta="+9.2%" label="Revenue" value="€184,300" />
                            <StatCard delta="−0.6%" label="Churn" value="2.1%" />
                            <StatCard delta="+14.0%" label="Pipeline" value="€412,000" />
                        </div>
                        <Card>
                            <BarList title="Revenue by plan" valueLabel="Revenue">
                                <BarListItem value={98400}>Enterprise</BarListItem>
                                <BarListItem value={61200}>Pro</BarListItem>
                                <BarListItem value={24700}>Starter</BarListItem>
                            </BarList>
                        </Card>
                    </>
                ),
            }}
        >
            <ShareReport />
        </AppScene>
    ),
};
