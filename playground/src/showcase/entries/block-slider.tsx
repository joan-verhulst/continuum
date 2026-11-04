import { BlockSlider, Card, CardTitle } from 'continuum';
import { useState } from 'react';
import { type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';

const blockSliderKnobs: Knob[] = [
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 34px'), o('md', 'md · 38px'), o('lg', 'lg · 48px')],
        default: 'lg',
    },
    { id: 'info', label: 'Label inside', switch: true, default: true },
    { id: 'range', label: 'Range', switch: true, default: false },
    { id: 'marks', label: 'Dividers', switch: true, default: false },
    { id: 'snap', label: 'Snap to dividers', switch: true, default: false },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const BlockSliderPreview = ({ knobs }: PreviewProps) => {
    const [value, setValue] = useState([64]);
    const [range, setRange] = useState([40, 96]);
    const isRange = Boolean(knobs.range);

    return (
        <BlockSlider
            aria-label={knobs.info ? undefined : isRange ? 'Column width' : 'Narrowest column'}
            className="w-64"
            disabled={Boolean(knobs.disabled)}
            format={values => `${values.join(' – ')}px`}
            size={knobs.size as 'sm' | 'md' | 'lg'}
            label={knobs.info ? (isRange ? 'Column width' : 'Narrowest column') : undefined}
            marks={knobs.marks || knobs.snap ? 8 : undefined}
            snap={Boolean(knobs.snap)}
            max={120}
            min={32}
            onValueChange={isRange ? setRange : setValue}
            value={isRange ? range : value}
        />
    );
};

export const entry: Entry = {
    id: 'block-slider',
    name: 'Block slider',
    category: 'inputs',
    description: 'A box the value fills, with its label and value inside.',
    knobs: blockSliderKnobs,
    Preview: BlockSliderPreview,
};

const adjustments = [
    { id: 'exposure', label: 'Exposure', min: -100, max: 100, value: 12 },
    { id: 'contrast', label: 'Contrast', min: -100, max: 100, value: -8 },
    { id: 'saturation', label: 'Saturation', min: -100, max: 100, value: 24 },
    { id: 'grain', label: 'Grain', min: 0, max: 100, value: 0 },
];

const Adjustments = () => {
    const [values, setValues] = useState(() =>
        Object.fromEntries(adjustments.map(item => [item.id, [item.value]])),
    );
    const signed = ([value = 0]: number[]) => (value > 0 ? `+${value}` : `${value}`);

    return (
        <Card className="w-full max-w-xs gap-3">
            <CardTitle>Adjust</CardTitle>
            <div className="flex flex-col gap-1.5">
                {adjustments.map(item => (
                    <BlockSlider
                        format={item.min < 0 ? signed : undefined}
                        key={item.id}
                        label={item.label}
                        max={item.max}
                        min={item.min}
                        onValueChange={next =>
                            setValues(current => ({ ...current, [item.id]: next }))
                        }
                        value={values[item.id]}
                    />
                ))}
            </div>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Adjust',
    note: 'An inspector of image adjustments, each a box with its name and value inside.',
    canvas: true,
    render: () => <Adjustments />,
};
