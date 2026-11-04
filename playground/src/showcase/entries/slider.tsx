import { Card, CardTitle, Field, FieldLabel, Slider } from 'continuum';
import { useState } from 'react';
import type { Entry, InUse, Knob, PreviewProps } from '../kit';

const sliderKnobs: Knob[] = [
    { id: 'range', label: 'Range', switch: true, default: false },
    { id: 'field', label: 'In a field', switch: true, default: true },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const SliderPreview = ({ knobs }: PreviewProps) => {
    const [value, setValue] = useState([64]);
    const [range, setRange] = useState([40, 96]);
    const slider = knobs.range ? (
        <Slider
            aria-label="Column width"
            disabled={Boolean(knobs.disabled)}
            max={120}
            min={32}
            onValueChange={setRange}
            value={range}
        />
    ) : (
        <Slider
            aria-label="Narrowest column"
            disabled={Boolean(knobs.disabled)}
            max={120}
            min={32}
            onValueChange={setValue}
            value={value}
        />
    );

    if (!knobs.field) return <div className="w-64">{slider}</div>;

    return (
        <Field className="w-64" disabled={Boolean(knobs.disabled)}>
            <div className="flex justify-between">
                <FieldLabel>{knobs.range ? 'Column width' : 'Narrowest column'}</FieldLabel>
                <span className="text-neutral-950 text-xs tabular-nums">
                    {knobs.range ? `${range[0]} – ${range[1]}px` : `${value[0]}px`}
                </span>
            </div>
            {slider}
        </Field>
    );
};

export const entry: Entry = {
    id: 'slider',
    name: 'Slider',
    category: 'inputs',
    description: 'A hairline track filled with the action colour.',
    knobs: sliderKnobs,
    Preview: SliderPreview,
};

const Thresholds = () => {
    const [bounce, setBounce] = useState([60]);
    const [errors, setErrors] = useState([2]);
    const [hours, setHours] = useState([22, 31]);
    const clock = (value: number) => `${String(value % 24).padStart(2, '0')}:00`;

    return (
        <Card className="w-full max-w-md gap-6">
            <CardTitle>Alert thresholds</CardTitle>
            <Field>
                <div className="flex justify-between">
                    <FieldLabel>Bounce rate above</FieldLabel>
                    <span className="text-neutral-950 text-xs tabular-nums">{bounce[0]}%</span>
                </div>
                <Slider max={100} min={0} onValueChange={setBounce} value={bounce} />
            </Field>
            <Field>
                <div className="flex justify-between">
                    <FieldLabel>Error rate above</FieldLabel>
                    <span className="text-neutral-950 text-xs tabular-nums">{errors[0]}%</span>
                </div>
                <Slider max={10} min={0} onValueChange={setErrors} step={0.5} value={errors} />
            </Field>
            <Field>
                <div className="flex justify-between">
                    <FieldLabel>Quiet hours</FieldLabel>
                    <span className="text-neutral-950 text-xs tabular-nums">
                        {clock(hours[0] ?? 22)} – {clock(hours[1] ?? 31)}
                    </span>
                </div>
                <Slider max={36} min={12} onValueChange={setHours} value={hours} />
            </Field>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Alert thresholds',
    note: 'Two sliders and a range, each with its value beside the label.',
    canvas: true,
    render: () => <Thresholds />,
};
