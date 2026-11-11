import {
    Button,
    Card,
    ColorField,
    ColorPicker,
    Field,
    FieldHelper,
    FieldLabel,
    Input,
    StatusDot,
} from 'continuum';
import { useState } from 'react';
import { AppWindow, type Entry, type InUse, type Knob, type PreviewProps } from '../kit';

const colorPickerKnobs: Knob[] = [
    { id: 'field', label: 'With its value', switch: true, default: true },
    { id: 'contrast', label: 'Contrast check', switch: true, default: true },
];

// The surfaces a fill is read against: the system's own, light and dark.
const surfaces = { light: '#fafafa', dark: '#0a0a0a' };

const ColorPickerPreview = ({ knobs }: PreviewProps) => {
    const [color, setColor] = useState('#3939e5');

    return (
        <div className="flex w-72 items-center gap-3">
            <ColorPicker
                contrast={knobs.contrast ? surfaces : undefined}
                label="Label colour"
                onChange={setColor}
                value={color}
            />
            {knobs.field && <ColorField label="Label colour" onChange={setColor} value={color} />}
        </div>
    );
};

export const entry: Entry = {
    id: 'color-picker',
    name: 'Color picker',
    category: 'inputs',
    description: 'A colour well that opens a plane, a hue and the value by hand.',
    knobs: colorPickerKnobs,
    Preview: ColorPickerPreview,
};

// A label being made: its name, and the colour its dot and chip take.
const NewLabel = () => {
    const [name, setName] = useState('Needs review');
    const [color, setColor] = useState('#d95926');

    return (
        <AppWindow className="items-center justify-center bg-neutral-100 px-10 pt-0" nav="none">
            <Card className="w-full max-w-100 gap-6 p-8">
                <div className="flex flex-col gap-1.5">
                    <h1 className="font-medium text-neutral-950 text-xl">New label</h1>
                    <p className="flex items-center gap-2 text-neutral-600 text-sm">
                        <StatusDot style={{ background: color }} />
                        {name || 'Untitled'}
                    </p>
                </div>
                <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input onChange={event => setName(event.target.value)} value={name} />
                </Field>
                <Field>
                    <FieldLabel>Colour</FieldLabel>
                    <div className="flex items-center gap-3">
                        <ColorPicker
                            contrast={surfaces}
                            label="Label colour"
                            onChange={setColor}
                            value={color}
                        />
                        <ColorField label="Label colour" onChange={setColor} value={color} />
                    </div>
                    <FieldHelper>Shown as a dot beside every issue with this label.</FieldHelper>
                </Field>
                <Button className="w-full" size="lg">
                    Create label
                </Button>
            </Card>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'New label',
    note: 'A label being made: the well opens the picker, and the value beside it takes a pasted hex, rgb, hsl or oklch.',
    app: true,
    render: () => <NewLabel />,
};
