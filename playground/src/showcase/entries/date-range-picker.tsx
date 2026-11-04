import {
    BarList,
    BarListItem,
    Button,
    Card,
    DateRangePicker,
    Field,
    FieldLabel,
    StatCard,
} from 'continuum';
import { ArrowLeftRight, Download } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon } from '../kit';

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
    <AppWindow
        actions={
            <Button variant="secondary">
                <Download {...icon} /> Export
            </Button>
        }
        className="gap-6"
        description="October against September, for every customer on a paid plan."
        place="reports"
        title="Compare periods"
        trail={['Reports', 'Compare periods']}
    >
        <div className="flex items-end gap-3">
            <Field className="w-64">
                <FieldLabel>Period</FieldLabel>
                <DateRangePicker
                    defaultValue={{ from: new Date(2025, 9, 1), to: new Date(2025, 9, 31) }}
                    icon="trailing"
                />
            </Field>
            <Button aria-label="Swap the periods" size="icon" variant="ghost" className="mb-0.5">
                <ArrowLeftRight {...icon} />
            </Button>
            <Field className="w-64">
                <FieldLabel>Compared to</FieldLabel>
                <DateRangePicker
                    defaultValue={{ from: new Date(2025, 8, 1), to: new Date(2025, 8, 30) }}
                    icon="trailing"
                />
            </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
            <StatCard delta="+12.4%" label="Sessions" value="12,480" />
            <StatCard delta="+6.1%" label="Revenue" value="€48,920" />
            <StatCard delta="+8.9%" label="Conversions" value="1,204" />
        </div>
        <Card>
            <BarList title="Revenue by plan, October" valueLabel="Revenue">
                <BarListItem displayValue="€26,400" value={26400}>
                    Enterprise
                </BarListItem>
                <BarListItem displayValue="€15,840" value={15840}>
                    Pro
                </BarListItem>
                <BarListItem displayValue="€6,680" value={6680}>
                    Starter
                </BarListItem>
            </BarList>
        </Card>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Compare periods',
    note: 'A period and the one it is compared to, at the top of a report, the figures following them.',
    app: true,
    render: () => <ComparePeriods />,
};
