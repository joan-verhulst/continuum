import {
    Avatar,
    Badge,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Download, Plus, TrendingDown, TrendingUp } from 'lucide-react';
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

const initials = (name: string) =>
    name
        .split(' ')
        .map(word => word[0])
        .join('')
        .slice(0, 2);

const InvoiceStatuses = () => (
    <AppWindow
        actions={
            <>
                <Button variant="secondary">
                    <Download {...icon} /> Export
                </Button>
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            </>
        }
        description={
            <span className="inline-flex items-center gap-2">
                38 sent this month
                <Badge icon={<TrendingUp {...icon} />} tone="success" variant="pill">
                    +12.5%
                </Badge>
            </span>
        }
        place="invoices"
        title="Invoices"
        trail={['Invoices']}
    >
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {statusRows.map(row => (
                    <TableRow key={row.number}>
                        <TableCell>
                            <span className="flex items-center gap-2.5 font-medium text-neutral-950">
                                <Avatar fallback={initials(row.client)} size={24} />
                                {row.client}
                            </span>
                        </TableCell>
                        <TableCell className="text-neutral-600">{row.number}</TableCell>
                        <TableCell className="text-right text-neutral-950 tabular-nums">
                            {row.amount}
                        </TableCell>
                        <TableCell className="text-right">
                            <Badge
                                tone={row.tone}
                                variant={row.tone === 'primary' ? 'dot' : undefined}
                            >
                                {row.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Invoices',
    note: 'A soft badge for each invoice’s status, and a delta pill beside the month’s count.',
    app: true,
    render: () => <InvoiceStatuses />,
};
