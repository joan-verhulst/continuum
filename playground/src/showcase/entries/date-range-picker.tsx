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
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
    sizes,
} from '../kit';

const dateRangeKnobs: Knob[] = [
    { id: 'size', label: 'Size', options: sizes, default: 'md' },
    { id: 'icon', label: 'Icon', options: opts('leading', 'trailing'), default: 'trailing' },
    { id: 'presets', label: 'Presets', switch: true, default: true },
    { id: 'invalid', label: 'Invalid', switch: true, default: false },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

// Opened, the presets show at the panel's left; the knob takes them away.
const DateRangePickerPreview = ({ knobs }: PreviewProps) => (
    <DateRangePicker
        aria-invalid={knobs.invalid ? true : undefined}
        aria-label="Report period"
        className="w-64 max-w-full"
        defaultValue={{ from: new Date(2026, 9, 12), to: new Date(2026, 9, 26) }}
        disabled={Boolean(knobs.disabled)}
        icon={knobs.icon as 'leading' | 'trailing'}
        presets={knobs.presets ? undefined : false}
        size={knobs.size as 'sm' | 'md'}
    />
);

export const entry: Entry = {
    id: 'date-range-picker',
    name: 'Date range picker',
    category: 'inputs',
    description: 'Two months with presets, for report ranges.',
    knobs: dateRangeKnobs,
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
            <Field className="w-64 min-w-0">
                <FieldLabel>Period</FieldLabel>
                <DateRangePicker
                    defaultValue={{ from: new Date(2025, 9, 1), to: new Date(2025, 9, 31) }}
                    icon="trailing"
                />
            </Field>
            <Button aria-label="Swap the periods" size="icon" variant="ghost" className="mb-0.5">
                <ArrowLeftRight {...icon} />
            </Button>
            <Field className="w-64 min-w-0">
                <FieldLabel>Compared to</FieldLabel>
                <DateRangePicker
                    defaultValue={{ from: new Date(2025, 8, 1), to: new Date(2025, 8, 30) }}
                    icon="trailing"
                />
            </Field>
        </div>
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
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
