import { DialogDescription, Field, FieldLabel, RadioGroup, RadioGroupItem } from 'continuum';
import { Download } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import {
    DialogActions,
    type Entry,
    type InUse,
    icon,
    type Knob,
    Labelled,
    OpenDialog,
    type PreviewProps,
    scene,
} from '../kit';

const radioKnobs: Knob[] = [
    { id: 'labels', label: 'Labels', switch: true, default: true },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const RadioPreview = ({ knobs }: PreviewProps) => (
    <RadioGroup
        aria-label="Frequency"
        className={knobs.labels ? undefined : 'flex-row gap-3'}
        defaultValue="weekly"
    >
        {[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
        ].map(option =>
            knobs.labels ? (
                <Labelled key={option.value} label={option.label}>
                    <RadioGroupItem
                        disabled={Boolean(knobs.disabled) && option.value === 'monthly'}
                        value={option.value}
                    />
                </Labelled>
            ) : (
                <RadioGroupItem
                    aria-label={option.label}
                    disabled={Boolean(knobs.disabled) && option.value === 'monthly'}
                    key={option.value}
                    value={option.value}
                />
            ),
        )}
    </RadioGroup>
);

export const entry: Entry = {
    id: 'radio',
    name: 'Radio group',
    category: 'inputs',
    description: 'One choice from a short list.',
    knobs: radioKnobs,
    Preview: RadioPreview,
};

/** A control with its label beside it and what it means under the label. */
const LabelledInUse = ({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: ReactNode;
}) => (
    <Field className="flex-row items-start gap-2.5">
        <span className="flex h-5 items-center">{children}</span>
        <span className="flex flex-col gap-0.5">
            <FieldLabel className="cursor-pointer">{label}</FieldLabel>
            {description && <span className="text-neutral-600 text-xs">{description}</span>}
        </span>
    </Field>
);

const ExportFormat = () => {
    const [format, setFormat] = useState('xlsx');

    return (
        <OpenDialog
            footer={
                <DialogActions
                    action={
                        <>
                            <Download {...icon} /> Export
                        </>
                    }
                />
            }
            title="Export sessions"
        >
            <DialogDescription>12,480 sessions from 1 to 31 October.</DialogDescription>
            <RadioGroup
                aria-label="Format"
                className="gap-4"
                onValueChange={value => setFormat(String(value))}
                value={format}
            >
                <LabelledInUse
                    description="Plain values, for any spreadsheet or script"
                    label="CSV"
                >
                    <RadioGroupItem value="csv" />
                </LabelledInUse>
                <LabelledInUse description="One sheet per week, with totals" label="Excel">
                    <RadioGroupItem value="xlsx" />
                </LabelledInUse>
                <LabelledInUse description="The charts and the summary, ready to send" label="PDF">
                    <RadioGroupItem value="pdf" />
                </LabelledInUse>
            </RadioGroup>
        </OpenDialog>
    );
};

export const inUse: InUse = {
    title: 'Export format',
    note: 'One choice of three, each with what it means.',
    bare: true,
    render: scene(<ExportFormat />),
};
