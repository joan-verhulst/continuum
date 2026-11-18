import { Button, Card, CardTitle, cn, Truncate } from 'continuum';
import { Download, FileText, Upload } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const samples = {
    file: 'invoice-2026-11-03-northwind-traders-final.pdf',
    path: 'src/components/charts/horizontal-bar-chart/legend.tsx',
    hash: '0x3f2a8c41d9e07b5a6f13c2e8d4b90a7f1e5c9c1b',
    id: 'cus_N8x2Kq7ZpL4mWv3RtY9b',
} as const;

const truncateKnobs: Knob[] = [
    {
        id: 'at',
        label: 'Cut at',
        options: [o('middle', 'Middle'), o('end', 'End')],
        default: 'middle',
    },
    {
        id: 'kind',
        label: 'Text',
        options: [o('file', 'File name'), o('path', 'Path'), o('hash', 'Hash'), o('id', 'ID')],
        default: 'file',
    },
    {
        id: 'width',
        label: 'Width',
        options: [o('160', '160px'), o('240', '240px'), o('360', '360px'), o('480', '480px')],
        default: '240',
    },
];

const TruncatePreview = ({ knobs }: PreviewProps) => {
    const kind = knobs.kind as keyof typeof samples;
    const mono = kind === 'hash' || kind === 'id';

    return (
        // The box shows the width the text is given; hover the text for the whole of it.
        <div
            className="flex h-control items-center rounded-item border border-neutral-200 border-dashed px-3 text-neutral-950 text-xs"
            style={{ width: Number(knobs.width) }}
        >
            <Truncate at={knobs.at as 'middle' | 'end'} className={cn(mono && 'font-mono')}>
                {samples[kind]}
            </Truncate>
        </div>
    );
};

export const entry: Entry = {
    id: 'truncate',
    name: 'Truncate',
    category: 'content',
    description: 'One line cut to its width, at the end or in the middle, whole on hover.',
    knobs: truncateKnobs,
    Preview: TruncatePreview,
};

// A month of invoices tells apart only by its number, at the end: cut at the end, every row
// would read the same.
const files = [
    { name: 'invoice-2026-11-northwind-traders-INV-0142.pdf', size: '182 KB' },
    { name: 'invoice-2026-11-northwind-traders-INV-0141.pdf', size: '176 KB' },
    { name: 'invoice-2026-10-northwind-traders-INV-0139.pdf', size: '181 KB' },
    { name: 'master-services-agreement-northwind-2026-signed.pdf', size: '1.4 MB' },
    { name: 'master-services-agreement-northwind-2026-draft-v3.docx', size: '96 KB' },
    { name: 'purchase-order-PO-88213-northwind-warehouse.xlsx', size: '48 KB' },
];

const details = [
    { label: 'Customer ID', value: 'cus_N8x2Kq7ZpL4mWv3RtY9b', mono: true },
    { label: 'VAT number', value: 'GB 293 8812 40', mono: false },
    { label: 'Billing email', value: 'accounts-payable@northwindtraders.co.uk', mono: false },
    { label: 'Payment terms', value: '30 days', mono: false },
];

const CustomerFiles = () => (
    <AppWindow
        actions={
            <Button variant="secondary">
                <Upload {...icon} /> Upload file
            </Button>
        }
        description="Customer since March 2024, on Enterprise."
        nav="sidebar"
        place="customers"
        title="Northwind Traders"
        trail={['Customers', 'Northwind Traders']}
    >
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-4">
            <Card className="gap-2" layout="list">
                <CardTitle>Files</CardTitle>
                <ul className="flex flex-col divide-y divide-neutral-200">
                    {files.map(file => (
                        <li className="flex h-10.25 items-center gap-3 text-xs" key={file.name}>
                            <FileText {...icon} className="size-4 shrink-0 text-neutral-500" />
                            <Truncate at="middle" className="flex-1 text-neutral-950">
                                {file.name}
                            </Truncate>
                            <span className="shrink-0 text-neutral-600 tabular-nums">
                                {file.size}
                            </span>
                            <Button
                                aria-label={`Download ${file.name}`}
                                size="icon-sm"
                                variant="ghost"
                            >
                                <Download {...icon} />
                            </Button>
                        </li>
                    ))}
                </ul>
            </Card>
            <Card className="gap-2" layout="list">
                <CardTitle>Details</CardTitle>
                <dl className="flex flex-col divide-y divide-neutral-200 text-xs">
                    {details.map(row => (
                        <div className="flex h-10.25 items-center gap-4" key={row.label}>
                            <dt className="w-28 shrink-0 text-neutral-600">{row.label}</dt>
                            <dd className="flex min-w-0 flex-1">
                                <Truncate
                                    at={row.mono ? 'middle' : 'end'}
                                    className={cn('text-neutral-950', row.mono && 'font-mono')}
                                >
                                    {row.value}
                                </Truncate>
                            </dd>
                        </div>
                    ))}
                </dl>
            </Card>
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'A customer’s files',
    note: 'A month of invoices that differ only at the end, cut in the middle so each number shows.',
    app: true,
    render: () => <CustomerFiles />,
};
