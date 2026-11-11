import { BarList, BarListItem, Button, Card, Meter } from 'continuum';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';

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
    // The label row's right holds one thing: a caption wins over the value, so they are one choice.
    {
        id: 'end',
        label: 'Beside the label',
        options: [o('caption', 'Caption'), o('value', 'Value'), o('none', 'Nothing')],
        default: 'caption',
    },
];

const MeterPreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as 'chart' | 'action' | 'warning' | 'error';
    const value = tone === 'error' ? 10000 : tone === 'warning' ? 9200 : 2450;

    return (
        <Meter
            caption={knobs.end === 'caption' ? 'Resets in 10 days' : undefined}
            className="w-full max-w-72"
            label="Credit usage"
            max={10000}
            showValue={knobs.end === 'value'}
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
    <AppWindow
        actions={
            <>
                <Button variant="secondary">Compare plans</Button>
                <Button>Upgrade plan</Button>
            </>
        }
        description="Business plan · this period runs to 1 November."
        nav="rail"
        place="settings"
        title="Usage"
    >
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
            <Card className="gap-5 p-5">
                <Meter caption="3 invites pending" label="Seats" max={20} showValue value={12} />
                <p className="text-neutral-600 text-xs">
                    Everyone who can sign in, guests included.
                </p>
            </Card>
            <Card className="gap-5 p-5">
                <Meter caption="9.2 of 10 GB" label="Storage" showValue tone="warning" value={92} />
                <p className="text-neutral-600 text-xs">
                    Attachments and exported reports. Old exports can be cleared.
                </p>
            </Card>
            <Card className="gap-5 p-5">
                <Meter
                    caption="Resets in 10 days"
                    label="AI credits"
                    max={10000}
                    showValue
                    tone="chart"
                    value={2450}
                />
                <p className="text-neutral-600 text-xs">
                    Summaries, drafted reminders and report narratives.
                </p>
            </Card>
            <Card className="gap-5 p-5">
                <Meter
                    caption="Limit reached · calls are queued"
                    label="API calls"
                    showValue
                    tone="error"
                    value={100}
                />
                <p className="text-neutral-600 text-xs">
                    100,000 a month; the Enterprise plan has no limit.
                </p>
            </Card>
        </div>
        <Card layout="list">
            <BarList title="AI credits by member" valueLabel="Credits">
                <BarListItem value={1120}>Maya Chen</BarListItem>
                <BarListItem value={640}>Liam Ortiz</BarListItem>
                <BarListItem value={410}>Sara Kim</BarListItem>
                <BarListItem value={280}>Noah Patel</BarListItem>
            </BarList>
        </Card>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Usage',
    note: 'A plan’s usage page: each limit a meter, in the tone of how close it is.',
    app: true,
    render: () => <Usage />,
};
