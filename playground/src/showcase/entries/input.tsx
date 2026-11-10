import { Button, Card, Field, FieldHelper, FieldLabel, Input, Kbd } from 'continuum';
import { AtSign, Globe, Hash, Search } from 'lucide-react';
import { useState } from 'react';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
    sizes,
} from '../kit';

const inputKnobs: Knob[] = [
    { id: 'size', label: 'Size', options: sizes, default: 'md' },
    {
        id: 'variant',
        label: 'Variant',
        options: [o('outline', 'Outline'), o('plain', 'Plain · no box')],
        default: 'outline',
    },
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
        variant={knobs.variant === 'plain' ? 'plain' : 'outline'}
    />
);

export const entry: Entry = {
    id: 'input',
    name: 'Input',
    category: 'inputs',
    description:
        'Two heights, with icons and a trailing slot inside the box; plain inside a container.',
    knobs: inputKnobs,
    Preview: InputPreview,
};

const addressPattern = /^[a-z0-9-]+$/;

// Settings, General: the plain values are fields stacked in their card, as in a form.
const WorkspaceSettings = () => {
    const [address, setAddress] = useState('acme inc');
    const invalid = !addressPattern.test(address);

    return (
        <AppWindow
            description="How the workspace shows up for the team and for customers."
            nav="rail"
            place="settings"
            title="Workspace"
            width="narrow"
        >
            <Card className="gap-5" layout="list">
                <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input defaultValue="Acme Inc." />
                    <FieldHelper>Shown on invoices and in every email to customers.</FieldHelper>
                </Field>
                <Field invalid={invalid}>
                    <FieldLabel>Address</FieldLabel>
                    <Input
                        leadingIcon={<Globe {...icon} />}
                        onChange={event => setAddress(event.target.value)}
                        trailing={<span className="text-neutral-600 text-xs">.acme.app</span>}
                        value={address}
                    />
                    <FieldHelper>
                        {invalid
                            ? 'Letters, numbers and dashes only, such as acme-inc.'
                            : 'The address the team signs in at.'}
                    </FieldHelper>
                </Field>
                <Field>
                    <FieldLabel>Billing email</FieldLabel>
                    <Input leadingIcon={<AtSign {...icon} />} placeholder="finance@company.com" />
                    <FieldHelper>
                        Where invoices and receipts go; the owner’s email when empty.
                    </FieldHelper>
                </Field>
                <Field>
                    <FieldLabel>VAT number</FieldLabel>
                    <Input defaultValue="NL859623145B01" leadingIcon={<Hash {...icon} />} />
                </Field>
                <Button className="self-end" disabled={invalid}>
                    Save changes
                </Button>
            </Card>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Workspace settings',
    note: 'The workspace’s plain values as fields in their card: one with an icon and a suffix that is invalid until it is fixed, an empty one.',
    app: true,
    render: () => <WorkspaceSettings />,
};
