import {
    BarList,
    BarListItem,
    Button,
    Card,
    DialogDescription,
    Field,
    FieldLabel,
    Slider,
    StatCard,
} from 'continuum';
import { BellRing } from 'lucide-react';
import { useState } from 'react';
import {
    AppScene,
    DialogActions,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    type PreviewProps,
} from '../kit';

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
        <OpenDialog footer={<DialogActions action="Save alerts" />} title="Alert thresholds">
            <DialogDescription>
                Email the team when a number on the overview crosses its line.
            </DialogDescription>
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
        </OpenDialog>
    );
};

export const inUse: InUse = {
    title: 'Alert thresholds',
    note: 'A dialog over the overview: two sliders and a range, each with its value beside the label.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                nav: 'rail',
                place: 'overview',
                title: 'Overview',
                description: 'Week of 19 October, against the week before.',
                actions: (
                    <Button variant="secondary">
                        <BellRing {...icon} /> Alerts
                    </Button>
                ),
                children: (
                    <>
                        <div className="grid grid-cols-4 gap-4">
                            <StatCard delta="+12.4%" label="Sessions" value="12,480" />
                            <StatCard
                                delta="−3.1%"
                                label="Bounce rate"
                                trend="down"
                                value="41.2%"
                            />
                            <StatCard
                                delta="0.0%"
                                label="Error rate"
                                trend="neutral"
                                value="1.6%"
                            />
                            <StatCard delta="+8.9%" label="Conversions" value="1,204" />
                        </div>
                        <Card>
                            <BarList title="Top pages" valueLabel="Sessions">
                                <BarListItem value={4120}>/pricing</BarListItem>
                                <BarListItem value={3312}>/</BarListItem>
                                <BarListItem value={2840}>/blog/q3-review</BarListItem>
                                <BarListItem value={1204}>/contact</BarListItem>
                            </BarList>
                        </Card>
                    </>
                ),
            }}
        >
            <Thresholds />
        </AppScene>
    ),
};
