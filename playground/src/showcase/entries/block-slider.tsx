import { BlockSlider, Button, Card } from 'continuum';
import { Boxes } from 'lucide-react';
import { useState } from 'react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';

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

const design = [
    { id: 'logo', label: 'Logo size', min: 20, max: 56, value: 32, unit: 'px' },
    { id: 'corner', label: 'Logo corners', min: 0, max: 16, value: 8, unit: 'px' },
    { id: 'margin', label: 'Margins', min: 16, max: 48, value: 32, unit: 'px' },
    { id: 'gap', label: 'Space between blocks', min: 12, max: 40, value: 24, unit: 'px' },
    { id: 'text', label: 'Text size', min: 11, max: 15, value: 12, unit: 'px' },
    { id: 'rows', label: 'Row spacing', min: 4, max: 16, value: 8, unit: 'px' },
] as const;

type DesignId = (typeof design)[number]['id'];

const lines = [
    { item: 'Enterprise plan, October', amount: '€3,200.00' },
    { item: 'Extra seats × 12', amount: '€480.00' },
    { item: 'Onboarding workshop', amount: '€440.00' },
];

/** The invoice the sliders shape, drawn as a customer receives it. */
const InvoiceSheet = ({ values }: { values: Record<DesignId, number> }) => (
    <Card
        className="min-w-0 flex-1 gap-0 overflow-hidden"
        style={{ padding: values.margin, fontSize: values.text }}
    >
        <div className="flex items-start justify-between gap-6">
            <span
                className="flex items-center justify-center bg-action text-on-action [background-image:var(--action-gradient)]"
                style={{ width: values.logo, height: values.logo, borderRadius: values.corner }}
            >
                <Boxes size={values.logo * 0.55} strokeWidth={2} />
            </span>
            <span className="flex flex-col items-end gap-0.5">
                <span className="font-medium text-neutral-950">Invoice INV-0142</span>
                <span className="text-neutral-600">Issued 1 November 2026</span>
            </span>
        </div>
        <div className="flex justify-between gap-6" style={{ marginTop: values.gap }}>
            <span className="flex flex-col gap-0.5">
                <span className="text-neutral-500">Billed to</span>
                <span className="text-neutral-950">Northwind Traders</span>
                <span className="text-neutral-600">accounts@northwind.com</span>
            </span>
            <span className="flex flex-col items-end gap-0.5">
                <span className="text-neutral-500">Due</span>
                <span className="text-neutral-950">1 December 2026</span>
            </span>
        </div>
        <div className="flex flex-col" style={{ marginTop: values.gap }}>
            {lines.map(line => (
                <div
                    className="flex justify-between gap-6 border-neutral-200 border-b"
                    key={line.item}
                    style={{ paddingBlock: values.rows }}
                >
                    <span className="text-neutral-900">{line.item}</span>
                    <span className="text-neutral-950 tabular-nums">{line.amount}</span>
                </div>
            ))}
            <div className="flex justify-between gap-6" style={{ paddingBlock: values.rows }}>
                <span className="font-medium text-neutral-950">Total</span>
                <span className="font-medium text-neutral-950 tabular-nums">€4,120.00</span>
            </div>
        </div>
    </Card>
);

const InvoiceDesign = () => {
    const [values, setValues] = useState(
        () =>
            Object.fromEntries(design.map(item => [item.id, item.value])) as Record<
                DesignId,
                number
            >,
    );

    return (
        <AppWindow
            actions={
                <>
                    <Button variant="secondary">Discard</Button>
                    <Button>Save design</Button>
                </>
            }
            description="How every invoice looks when it reaches a customer."
            nav="none"
            title="Invoice design"
        >
            <div className="flex items-start gap-6">
                <div className="flex w-72 shrink-0 flex-col gap-1.5">
                    {design.map(item => (
                        <BlockSlider
                            format={([value = 0]) => `${value}${item.unit}`}
                            key={item.id}
                            label={item.label}
                            max={item.max}
                            min={item.min}
                            onValueChange={([next = item.value]) =>
                                setValues(current => ({ ...current, [item.id]: next }))
                            }
                            value={[values[item.id]]}
                        />
                    ))}
                </div>
                <InvoiceSheet values={values} />
            </div>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Invoice design',
    note: 'An editor’s controls as block sliders, each with its name and value inside, shaping the invoice beside them.',
    app: true,
    render: () => <InvoiceDesign />,
};
