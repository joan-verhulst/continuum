import { Button, Input, Kbd, SettingGroup, SettingRow } from 'continuum';
import { AtSign, Globe, Hash, Search } from 'lucide-react';
import { SectionHead } from '../../screens/workspace';
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

// Settings, General: a row per setting, its input at the end.
const WorkspaceSettings = () => (
    <AppWindow
        actions={<Button>Save changes</Button>}
        className="gap-10"
        description="How the workspace shows up for the team and for customers."
        nav="rail"
        place="settings"
        title="Settings"
        width="default"
    >
        <section className="flex flex-col gap-5">
            <SectionHead title="Workspace" />
            <SettingGroup aria-label="Workspace">
                <SettingRow
                    control={<Input className="w-72" defaultValue="Acme Inc." size="sm" />}
                    description="Shown on invoices and in every email to customers."
                    title="Name"
                />
                <SettingRow
                    control={
                        <Input
                            aria-invalid
                            className="w-72"
                            defaultValue="acme inc"
                            leadingIcon={<Globe {...icon} />}
                            size="sm"
                            trailing={<span className="text-neutral-500 text-xs">.acme.app</span>}
                        />
                    }
                    description={
                        <span className="text-error-600">
                            Letters, numbers and dashes only, such as acme-inc.
                        </span>
                    }
                    title="Address"
                />
                <SettingRow
                    control={
                        <Input
                            className="w-72"
                            leadingIcon={<AtSign {...icon} />}
                            placeholder="finance@company.com"
                            size="sm"
                        />
                    }
                    description="Where invoices and receipts go; the owner’s email when empty."
                    title="Billing email"
                />
                <SettingRow
                    control={
                        <Input
                            className="w-72"
                            defaultValue="NL859623145B01"
                            leadingIcon={<Hash {...icon} />}
                            size="sm"
                        />
                    }
                    description="Printed on every invoice, for customers in the EU."
                    title="VAT number"
                />
            </SettingGroup>
        </section>
        <section className="flex flex-col gap-5">
            <SectionHead title="Invoices" />
            <SettingGroup aria-label="Invoices">
                <SettingRow
                    control={<Input className="w-72" defaultValue="INV-2025-" size="sm" />}
                    description="Put before each invoice’s number; the count carries on."
                    title="Number prefix"
                />
                <SettingRow
                    control={
                        <Input
                            className="w-72"
                            defaultValue="30"
                            inputMode="numeric"
                            size="sm"
                            trailing={<span className="text-neutral-500 text-xs">days</span>}
                        />
                    }
                    description="How long a customer has to pay, from the day it is sent."
                    title="Payment terms"
                />
            </SettingGroup>
        </section>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Workspace settings',
    note: 'Inputs at the end of setting rows: a plain one, one with an icon and a suffix that is invalid, an empty one.',
    app: true,
    render: () => <WorkspaceSettings />,
};
