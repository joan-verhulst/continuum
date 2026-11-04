import { Field, FieldHelper, FieldLabel, Input, Kbd } from 'continuum';
import { AtSign, Globe, Search } from 'lucide-react';
import {
    DialogActions,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    o,
    type PreviewProps,
    previewIcon,
    scene,
    sizes,
} from '../kit';

const inputKnobs: Knob[] = [
    { id: 'size', label: 'Size', options: sizes, default: 'md' },
    {
        id: 'state',
        label: 'State',
        options: [
            o('empty', 'Empty'),
            o('filled', 'Filled'),
            o('invalid', 'Invalid'),
            o('disabled', 'Disabled'),
        ],
        default: 'filled',
    },
    { id: 'leading', label: 'Leading icon', switch: true, default: true },
    { id: 'trailing', label: 'Trailing kbd', switch: true, default: false },
];

const InputPreview = ({ knobs }: PreviewProps) => (
    <Input
        aria-invalid={knobs.state === 'invalid' || undefined}
        className="w-64"
        defaultValue={knobs.state === 'empty' ? undefined : 'Northwind quarterly review'}
        disabled={knobs.state === 'disabled'}
        key={String(knobs.state)}
        leadingIcon={knobs.leading ? <Search {...previewIcon} /> : undefined}
        placeholder="Search reports"
        size={knobs.size === 'sm' ? 'sm' : 'md'}
        trailing={knobs.trailing ? <Kbd>⌘K</Kbd> : undefined}
    />
);

export const entry: Entry = {
    id: 'input',
    name: 'Input',
    category: 'inputs',
    description: 'Two heights, with icons and a trailing slot inside the box.',
    knobs: inputKnobs,
    Preview: InputPreview,
};

const NewProject = () => (
    <OpenDialog footer={<DialogActions action="Create project" />} title="New project">
        <Field>
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Northwind Q4 launch" />
        </Field>
        <Field invalid>
            <FieldLabel>Address</FieldLabel>
            <Input
                defaultValue="northwind q4"
                leadingIcon={<Globe {...icon} />}
                trailing={<span className="text-neutral-500 text-xs">.continuum.app</span>}
            />
            <FieldHelper>Letters, numbers and dashes only.</FieldHelper>
        </Field>
        <Field>
            <FieldLabel>Owner email</FieldLabel>
            <Input leadingIcon={<AtSign {...icon} />} placeholder="name@company.com" />
        </Field>
    </OpenDialog>
);

export const inUse: InUse = {
    title: 'New project',
    note: 'Inputs in a dialog: a plain one, one with an icon and a suffix that is invalid, an empty one.',
    bare: true,
    render: scene(<NewProject />),
};
