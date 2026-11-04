import { DialogDescription, Field, FieldHelper, FieldLabel, Input, Textarea } from 'continuum';
import {
    DialogActions,
    type Entry,
    type InUse,
    type Knob,
    OpenDialog,
    opts,
    type PreviewProps,
    scene,
} from '../kit';

const fieldKnobs: Knob[] = [
    { id: 'control', label: 'Control', options: opts('input', 'textarea'), default: 'input' },
    { id: 'helper', label: 'Helper', switch: true, default: true },
    { id: 'invalid', label: 'Invalid', switch: true, default: false },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const FieldPreview = ({ knobs }: PreviewProps) => (
    <Field className="w-64" disabled={Boolean(knobs.disabled)} invalid={Boolean(knobs.invalid)}>
        <FieldLabel>{knobs.control === 'textarea' ? 'Notes' : 'Invoice number'}</FieldLabel>
        {knobs.control === 'textarea' ? (
            <Textarea className="min-h-16" placeholder="Add a note for the client" />
        ) : (
            <Input defaultValue="INV-2025-0142" size="sm" />
        )}
        {knobs.helper && (
            <FieldHelper>
                {knobs.invalid
                    ? 'This number is already in use.'
                    : 'Shown on every page of the invoice.'}
            </FieldHelper>
        )}
    </Field>
);

export const entry: Entry = {
    id: 'field',
    name: 'Field and textarea',
    category: 'inputs',
    description: 'Label, control and helper wired together, invalid included.',
    knobs: fieldKnobs,
    Preview: FieldPreview,
};

const InviteTeammate = () => (
    <OpenDialog footer={<DialogActions action="Send invite" />} title="Invite a teammate">
        <DialogDescription>
            They join Northwind as a member and can see every report.
        </DialogDescription>
        <Field>
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Bram Jansen" />
        </Field>
        <Field invalid>
            <FieldLabel>Email</FieldLabel>
            <Input defaultValue="bram@northwind" />
            <FieldHelper>Add the domain, such as northwind.com.</FieldHelper>
        </Field>
        <Field>
            <FieldLabel>Message</FieldLabel>
            <Textarea className="min-h-16" placeholder="Optional; shown in the invite" />
            <FieldHelper>Up to 280 characters.</FieldHelper>
        </Field>
    </OpenDialog>
);

export const inUse: InUse = {
    title: 'Invite a teammate',
    note: 'Every field labelled, one invalid with its message, a textarea with a hint.',
    bare: true,
    render: scene(<InviteTeammate />),
};
