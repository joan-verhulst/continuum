import {
    Badge,
    Button,
    DialogDescription,
    Field,
    FieldLabel,
    RadioGroup,
    RadioGroupItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Download, Plus } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import {
    AppScene,
    DialogActions,
    type Entry,
    type InUse,
    icon,
    type Knob,
    Labelled,
    OpenDialog,
    type PreviewProps,
} from '../kit';

const radioKnobs: Knob[] = [
    { id: 'labels', label: 'Labels', switch: true, default: true },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const RadioPreview = ({ knobs }: PreviewProps) => (
    <RadioGroup
        aria-label="Frequency"
        className={knobs.labels ? undefined : 'flex-row gap-3'}
        defaultValue="weekly"
    >
        {[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
        ].map(option =>
            knobs.labels ? (
                <Labelled key={option.value} label={option.label}>
                    <RadioGroupItem
                        disabled={Boolean(knobs.disabled) && option.value === 'monthly'}
                        value={option.value}
                    />
                </Labelled>
            ) : (
                <RadioGroupItem
                    aria-label={option.label}
                    disabled={Boolean(knobs.disabled) && option.value === 'monthly'}
                    key={option.value}
                    value={option.value}
                />
            ),
        )}
    </RadioGroup>
);

export const entry: Entry = {
    id: 'radio',
    name: 'Radio group',
    category: 'inputs',
    description: 'One choice from a short list.',
    knobs: radioKnobs,
    Preview: RadioPreview,
};

/** A control with its label beside it and what it means under the label. */
const LabelledInUse = ({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: ReactNode;
}) => (
    <Field className="flex-row items-start gap-2.5">
        <span className="flex h-5 items-center">{children}</span>
        <span className="flex flex-col gap-0.5">
            <FieldLabel className="cursor-pointer">{label}</FieldLabel>
            {description && <span className="text-neutral-600 text-xs">{description}</span>}
        </span>
    </Field>
);

const ExportFormat = () => {
    const [format, setFormat] = useState('xlsx');

    return (
        <OpenDialog
            footer={
                <DialogActions
                    action={
                        <>
                            <Download {...icon} /> Export
                        </>
                    }
                />
            }
            title="Export invoices"
        >
            <DialogDescription>38 invoices sent from 1 to 31 October.</DialogDescription>
            <RadioGroup
                aria-label="Format"
                className="gap-4"
                onValueChange={value => setFormat(String(value))}
                value={format}
            >
                <LabelledInUse
                    description="Plain values, for any spreadsheet or script"
                    label="CSV"
                >
                    <RadioGroupItem value="csv" />
                </LabelledInUse>
                <LabelledInUse description="One sheet per client, with totals" label="Excel">
                    <RadioGroupItem value="xlsx" />
                </LabelledInUse>
                <LabelledInUse description="Every invoice as sent, in one file" label="PDF">
                    <RadioGroupItem value="pdf" />
                </LabelledInUse>
            </RadioGroup>
        </OpenDialog>
    );
};

const invoices = [
    { client: 'Acme Corp', number: 'INV-0142', amount: '€4,120.00', status: 'Due soon' },
    { client: 'Northwind', number: 'INV-0141', amount: '€1,980.00', status: 'Paid' },
    { client: 'Lumen Labs', number: 'INV-0139', amount: '€760.00', status: 'Overdue' },
    { client: 'Harbour Street', number: 'INV-0138', amount: '€2,310.00', status: 'Paid' },
    { client: 'Tideline Travel', number: 'INV-0137', amount: '€540.00', status: 'Paid' },
    { client: 'Globex', number: 'INV-0136', amount: '€1,240.00', status: 'Paid' },
] as const;

const invoiceTone = { Paid: 'success', 'Due soon': 'warning', Overdue: 'error' } as const;

/** The invoices list the export is made from, behind the dialog. */
const InvoiceList = () => (
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
            {invoices.map(row => (
                <TableRow key={row.number}>
                    <TableCell className="font-medium text-neutral-950">{row.client}</TableCell>
                    <TableCell className="text-neutral-600">{row.number}</TableCell>
                    <TableCell className="text-right text-neutral-950 tabular-nums">
                        {row.amount}
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge tone={invoiceTone[row.status]}>{row.status}</Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

export const inUse: InUse = {
    title: 'Export invoices',
    note: 'The export dialog over the invoices list: one format of three, each with what it means.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                place: 'invoices',
                trail: ['Invoices'],
                title: 'Invoices',
                description: '38 sent in October, €61,240 in total.',
                actions: (
                    <>
                        <Button variant="secondary">
                            <Download {...icon} /> Export
                        </Button>
                        <Button>
                            <Plus {...icon} /> New invoice
                        </Button>
                    </>
                ),
                children: <InvoiceList />,
            }}
        >
            <ExportFormat />
        </AppScene>
    ),
};
