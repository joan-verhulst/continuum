import {
    Badge,
    Button,
    DatePicker,
    DialogDescription,
    Field,
    FieldHelper,
    FieldLabel,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { History, Plus } from 'lucide-react';
import {
    AppScene,
    DialogActions,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    opts,
    type PreviewProps,
    sizes,
} from '../kit';

const datePickerKnobs: Knob[] = [
    { id: 'size', label: 'Size', options: sizes, default: 'md' },
    { id: 'value', label: 'Value', options: opts('picked', 'empty'), default: 'picked' },
    { id: 'invalid', label: 'Invalid', switch: true, default: false },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const DatePickerPreview = ({ knobs }: PreviewProps) => (
    <Field
        className="w-56"
        disabled={Boolean(knobs.disabled)}
        invalid={Boolean(knobs.invalid)}
        // A new value for the knob is a new picker, so its own pick never outlives the knob.
        key={String(knobs.value)}
    >
        <FieldLabel>Start date</FieldLabel>
        <DatePicker
            defaultValue={knobs.value === 'picked' ? new Date(2026, 10, 2) : undefined}
            size={knobs.size as 'sm' | 'md'}
        />
        {knobs.invalid && <FieldHelper>Pick a date after the contract starts.</FieldHelper>}
    </Field>
);

export const entry: Entry = {
    id: 'date-picker',
    name: 'Date picker',
    category: 'inputs',
    description: 'An input-like trigger that opens a calendar.',
    knobs: datePickerKnobs,
    Preview: DatePickerPreview,
};

const reports = [
    {
        name: 'Q3 review',
        to: 'finance@acme.com',
        repeat: 'Not scheduled',
        next: '—',
        status: 'Draft',
        tone: 'neutral',
    },
    {
        name: 'Weekly revenue',
        to: 'leadership@acme.com',
        repeat: 'Every Monday',
        next: '10 Nov 2025',
        status: 'Scheduled',
        tone: 'primary',
    },
    {
        name: 'Churn by plan',
        to: 'success@acme.com',
        repeat: 'Every month',
        next: '1 Dec 2025',
        status: 'Scheduled',
        tone: 'primary',
    },
    {
        name: 'Overdue invoices',
        to: 'finance@acme.com',
        repeat: 'Every Friday',
        next: '7 Nov 2025',
        status: 'Scheduled',
        tone: 'primary',
    },
    {
        name: 'Pipeline by owner',
        to: 'sales@acme.com',
        repeat: 'Paused',
        next: '—',
        status: 'Paused',
        tone: 'warning',
    },
] as const;

const ReportList = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Sent to</TableHead>
                <TableHead>Repeats</TableHead>
                <TableHead>Next send</TableHead>
                <TableHead className="text-right">Status</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {reports.map(report => (
                <TableRow key={report.name}>
                    <TableCell className="text-neutral-950">{report.name}</TableCell>
                    <TableCell className="font-normal text-neutral-700">{report.to}</TableCell>
                    <TableCell className="font-normal text-neutral-700">{report.repeat}</TableCell>
                    <TableCell className="font-normal text-neutral-600 tabular-nums">
                        {report.next}
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge tone={report.tone}>{report.status}</Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const ScheduleReport = () => (
    <OpenDialog footer={<DialogActions action="Schedule" />} title="Schedule Q3 review">
        <DialogDescription>
            The report goes to finance@acme.com on every date between these two.
        </DialogDescription>
        <div className="grid grid-cols-2 gap-3">
            <Field>
                <FieldLabel>First send</FieldLabel>
                <DatePicker defaultValue={new Date(2025, 10, 3)} />
            </Field>
            <Field>
                <FieldLabel>Last send</FieldLabel>
                <DatePicker defaultValue={new Date(2026, 2, 30)} />
            </Field>
        </div>
        <Field>
            <FieldLabel>Repeat</FieldLabel>
            <Select defaultValue="month">
                <SelectTrigger leadingIcon={<History {...icon} />}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="week">Every week</SelectItem>
                    <SelectItem value="month">Every month</SelectItem>
                    <SelectItem value="quarter">Every quarter</SelectItem>
                </SelectContent>
            </Select>
            <FieldHelper>Five sends, the first on Monday 3 November.</FieldHelper>
        </Field>
    </OpenDialog>
);

const ReportsWithSchedule = () => (
    <AppScene
        page={{
            nav: 'top',
            place: 'reports',
            title: 'Reports',
            description: 'Sent by email on a schedule, as a PDF with the figures attached.',
            actions: (
                <Button>
                    <Plus {...icon} /> New report
                </Button>
            ),
            children: <ReportList />,
        }}
    >
        <ScheduleReport />
    </AppScene>
);

export const inUse: InUse = {
    title: 'Schedule a report',
    note: 'A first and a last date side by side, in a dialog over the reports list.',
    bare: true,
    render: () => <ReportsWithSchedule />,
};
