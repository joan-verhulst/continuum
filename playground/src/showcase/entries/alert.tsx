import {
    Alert,
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    SettingGroup,
    SettingRow,
    Switch,
} from 'continuum';
import { useEffect, useState } from 'react';
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

const alertKnobs: Knob[] = [
    { id: 'tone', label: 'Tone', options: opts(...tones), default: 'warning' },
    { id: 'description', label: 'Description', switch: true, default: true },
    { id: 'action', label: 'Action', switch: true, default: true },
    { id: 'dismiss', label: 'Dismissible', switch: true, default: false },
    {
        id: 'width',
        label: 'Width',
        options: [o('wide', 'Wide · 480px'), o('narrow', 'Narrow · 320px')],
        default: 'wide',
    },
];

const alertText: Record<Tone, { title: string; description: string; action: string }> = {
    neutral: {
        title: 'Reports refresh every hour',
        description: 'The last refresh was 12 minutes ago.',
        action: 'Refresh now',
    },
    primary: {
        title: 'A board template is ready',
        description: 'It turns this report into one page for the board.',
        action: 'Try it',
    },
    success: {
        title: 'Your domain is verified',
        description: 'Emails now send from northwind.io.',
        action: 'Send a test',
    },
    warning: {
        title: 'Your card expires next month',
        description: 'Update it before 1 December to keep the Business plan.',
        action: 'Update card',
    },
    error: {
        title: 'The last import failed',
        description: 'Three rows have no email address.',
        action: 'Review rows',
    },
};

const AlertPreview = ({ knobs }: PreviewProps) => {
    const tone = (tones as readonly string[]).includes(String(knobs.tone))
        ? (knobs.tone as Tone)
        : 'warning';
    const [dismissed, setDismissed] = useState(false);
    const text = alertText[tone];

    // Turning the knob brings a dismissed alert back.
    // biome-ignore lint/correctness/useExhaustiveDependencies: reset on each change of the knob
    useEffect(() => setDismissed(false), [knobs.dismiss]);

    return dismissed ? (
        <Button onClick={() => setDismissed(false)} variant="secondary">
            Show it again
        </Button>
    ) : (
        <Alert
            action={knobs.action && <Button variant="secondary">{text.action}</Button>}
            className={knobs.width === 'narrow' ? 'w-80' : 'w-[480px]'}
            onDismiss={knobs.dismiss ? () => setDismissed(true) : undefined}
            title={text.title}
            tone={tone}
        >
            {knobs.description && text.description}
        </Alert>
    );
};

export const entry: Entry = {
    id: 'alert',
    name: 'Alert',
    category: 'messages',
    description: 'An inline notice on a page or form, its tone in the icon.',
    knobs: alertKnobs,
    Preview: AlertPreview,
};

const BillingNotice = () => (
    <Card className="w-full max-w-xl gap-5">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Billing</CardTitle>
            <Badge tone="success">Business plan</Badge>
        </CardHeader>
        <Alert
            action={<Button variant="secondary">Update card</Button>}
            title="Your card expires next month"
            tone="warning"
        >
            Update it before 1 December to keep the Business plan.
        </Alert>
        <SettingGroup>
            <SettingRow
                control={<Switch defaultChecked />}
                description="Send each invoice to finance@northwind.io as well"
                title="Copy invoices to finance"
            />
            <SettingRow
                control={<Button variant="secondary">Change</Button>}
                description="Visa ending 4242, expires 11/26"
                labelControl={false}
                title="Payment method"
            />
        </SettingGroup>
    </Card>
);

export const inUse: InUse = {
    title: 'Billing',
    note: 'A warning at the top of the settings it concerns, with the fix beside it.',
    canvas: true,
    render: () => <BillingNotice />,
};
