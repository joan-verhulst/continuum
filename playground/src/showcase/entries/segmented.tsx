import { Card, CardTitle, SegmentedControl, SegmentedControlItem } from 'continuum';
import { CalendarDays, Clock, Timer } from 'lucide-react';
import { type Entry, type InUse, type Knob, type PreviewProps, previewIcon } from '../kit';

const segmentedKnobs: Knob[] = [
    { id: 'icons', label: 'Icons', switch: true, default: false },
    { id: 'fill', label: 'Fill the width', switch: true, default: false },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const SegmentedPreview = ({ knobs }: PreviewProps) => (
    <div className={knobs.fill ? 'w-80' : undefined}>
        <SegmentedControl aria-label="Range" defaultValue="30d" fill={Boolean(knobs.fill)}>
            <SegmentedControlItem value="7d">
                {knobs.icons && <Clock {...previewIcon} />}7d
            </SegmentedControlItem>
            <SegmentedControlItem value="30d">
                {knobs.icons && <CalendarDays {...previewIcon} />}30d
            </SegmentedControlItem>
            <SegmentedControlItem value="12m">
                {knobs.icons && <Timer {...previewIcon} />}12m
            </SegmentedControlItem>
            <SegmentedControlItem disabled={Boolean(knobs.disabled)} value="all">
                All time
            </SegmentedControlItem>
        </SegmentedControl>
    </div>
);

export const entry: Entry = {
    id: 'segmented',
    name: 'Segmented control',
    category: 'inputs',
    description: 'Filters in place; always holds one value.',
    knobs: segmentedKnobs,
    Preview: SegmentedPreview,
};

const appearance = [
    { id: 'theme', label: 'Theme', options: ['Light', 'Dark', 'System'], value: 'System' },
    { id: 'density', label: 'Density', options: ['Compact', 'Comfortable'], value: 'Compact' },
    { id: 'week', label: 'Week starts on', options: ['Monday', 'Sunday'], value: 'Monday' },
    { id: 'chart', label: 'Charts as', options: ['Lines', 'Areas', 'Bars'], value: 'Areas' },
];

const Appearance = () => (
    <Card className="w-full max-w-md gap-5">
        <CardTitle>Appearance</CardTitle>
        {appearance.map(row => (
            <div className="flex items-center justify-between gap-4" key={row.id}>
                <span className="font-medium text-neutral-950 text-xs">{row.label}</span>
                <SegmentedControl aria-label={row.label} defaultValue={row.value}>
                    {row.options.map(option => (
                        <SegmentedControlItem key={option} value={option}>
                            {option}
                        </SegmentedControlItem>
                    ))}
                </SegmentedControl>
            </div>
        ))}
    </Card>
);

export const inUse: InUse = {
    title: 'Appearance',
    note: 'A segmented control per setting, each holding one value.',
    canvas: true,
    render: () => <Appearance />,
};
