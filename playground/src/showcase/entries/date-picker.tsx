import {
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
} from 'continuum';
import { History } from 'lucide-react';
import { DialogActions, type Entry, type InUse, icon, OpenDialog, scene } from '../kit';

const DatePickerPreview = () => (
    <Field className="w-56">
        <FieldLabel>Start date</FieldLabel>
        <DatePicker defaultValue={new Date(2026, 10, 2)} />
    </Field>
);

export const entry: Entry = {
    id: 'date-picker',
    name: 'Date picker',
    category: 'inputs',
    description: 'An input-like trigger that opens a calendar.',
    Preview: DatePickerPreview,
};

const ScheduleReport = () => (
    <OpenDialog footer={<DialogActions action="Schedule" />} title="Schedule report">
        <DialogDescription>
            Q3 review goes to finance@acme.com on every date between these two.
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

export const inUse: InUse = {
    title: 'Schedule a report',
    note: 'Two dates side by side in a dialog.',
    bare: true,
    render: scene(<ScheduleReport />),
};
