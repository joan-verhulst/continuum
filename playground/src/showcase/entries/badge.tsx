import { Badge, Card, CardHeader, CardTitle } from 'continuum';
import { TrendingDown, TrendingUp } from 'lucide-react';
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

const badgeKnobs: Knob[] = [
    {
        id: 'variant',
        label: 'Variant',
        options: opts('soft', 'pill', 'dot', 'count'),
        default: 'soft',
    },
    { id: 'tone', label: 'Tone', options: opts(...tones), default: 'success' },
    { id: 'icon', label: 'Icon', switch: true, default: true },
];

const badgeText: Record<Tone, string> = {
    neutral: 'Draft',
    success: 'Paid',
    warning: 'Due soon',
    error: 'Overdue',
    primary: 'Scheduled',
};

const BadgePreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as Tone;
    const variant = knobs.variant as 'soft' | 'pill' | 'dot' | 'count';
    const glyph =
        tone === 'error' ? <TrendingDown {...previewIcon} /> : <TrendingUp {...previewIcon} />;

    return (
        <Badge
            icon={variant === 'pill' && knobs.icon ? glyph : undefined}
            tone={tone}
            variant={variant}
        >
            {variant === 'pill'
                ? tone === 'error'
                    ? '−4.2%'
                    : '+12.5%'
                : variant === 'count'
                  ? '24'
                  : badgeText[tone]}
        </Badge>
    );
};

export const entry: Entry = {
    id: 'badge',
    name: 'Badge',
    category: 'labels',
    description: 'Soft statuses, delta pills, workflow dots and nav counts.',
    knobs: badgeKnobs,
    Preview: BadgePreview,
};

const statusRows = [
    {
        client: 'Acme Corp',
        number: 'INV-0142',
        amount: '€4,120.00',
        status: 'Due soon',
        tone: 'warning',
    },
    {
        client: 'Northwind',
        number: 'INV-0141',
        amount: '€1,980.00',
        status: 'Paid',
        tone: 'success',
    },
    {
        client: 'Lumen Labs',
        number: 'INV-0139',
        amount: '€760.00',
        status: 'Overdue',
        tone: 'error',
    },
    {
        client: 'Harbour Street',
        number: 'INV-0138',
        amount: '€2,310.00',
        status: 'Scheduled',
        tone: 'primary',
    },
    {
        client: 'Tideline Travel',
        number: 'INV-0137',
        amount: '€540.00',
        status: 'Draft',
        tone: 'neutral',
    },
] as const;

const InvoiceStatuses = () => (
    <Card className="w-full max-w-lg gap-3">
        <CardHeader className="flex-row items-center justify-between">
            <span className="flex items-center gap-2">
                <CardTitle>Invoices this month</CardTitle>
                <Badge variant="count">{statusRows.length}</Badge>
            </span>
            <Badge icon={<TrendingUp {...icon} />} tone="success" variant="pill">
                +12.5%
            </Badge>
        </CardHeader>
        <ul className="flex flex-col divide-y divide-neutral-200">
            {statusRows.map(row => (
                <li className="flex h-11 items-center gap-3 text-xs" key={row.number}>
                    <span className="flex-1 truncate font-medium text-neutral-950">
                        {row.client}
                    </span>
                    <span className="text-neutral-500">{row.number}</span>
                    <span className="w-20 text-right text-neutral-950 tabular-nums">
                        {row.amount}
                    </span>
                    <span className="flex w-24 justify-end">
                        <Badge tone={row.tone} variant={row.tone === 'primary' ? 'dot' : undefined}>
                            {row.status}
                        </Badge>
                    </span>
                </li>
            ))}
        </ul>
    </Card>
);

export const inUse: InUse = {
    title: 'Invoice statuses',
    note: 'A soft badge per status, a count by the title and a delta pill beside it.',
    canvas: true,
    render: () => <InvoiceStatuses />,
};
