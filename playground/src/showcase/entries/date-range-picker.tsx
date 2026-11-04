import { Card, CardDelta, CardTitle, DateRangePicker, Field, FieldLabel } from 'continuum';
import type { Entry, InUse } from '../kit';

const DateRangePickerPreview = () => (
    <DateRangePicker
        aria-label="Report period"
        className="w-64"
        defaultValue={{ from: new Date(2026, 9, 12), to: new Date(2026, 9, 26) }}
        icon="trailing"
    />
);

export const entry: Entry = {
    id: 'date-range-picker',
    name: 'Date range picker',
    category: 'inputs',
    description: 'Two months with presets, for report ranges.',
    Preview: DateRangePickerPreview,
};

const ComparePeriods = () => (
    <Card className="w-full max-w-md gap-5">
        <CardTitle>Compare periods</CardTitle>
        <Field>
            <FieldLabel>Period</FieldLabel>
            <DateRangePicker
                defaultValue={{ from: new Date(2025, 9, 1), to: new Date(2025, 9, 31) }}
                icon="trailing"
            />
        </Field>
        <Field>
            <FieldLabel>Compared to</FieldLabel>
            <DateRangePicker
                defaultValue={{ from: new Date(2025, 8, 1), to: new Date(2025, 8, 30) }}
                icon="trailing"
            />
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-item bg-neutral-950/3 px-3 py-2.5 text-xs">
            <span className="text-neutral-600">Sessions</span>
            <span className="flex items-center gap-2">
                <span className="font-medium text-neutral-950 tabular-nums">12,480</span>
                <CardDelta>+12.4%</CardDelta>
            </span>
        </div>
    </Card>
);

export const inUse: InUse = {
    title: 'Compare periods',
    note: 'A range and the one it is compared to.',
    canvas: true,
    render: () => <ComparePeriods />,
};
