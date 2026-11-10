import {
    Button,
    DialogClose,
    DialogDescription,
    Field,
    FieldHelper,
    FieldLabel,
    Input,
    StatCard,
    ValueField,
} from 'continuum';
import { Plus } from 'lucide-react';
import {
    AppScene,
    type AppWindowProps,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    o,
    type PreviewProps,
    sizes,
} from '../kit';

// Both variants are drawn, the wells over a vital, so each knob has something to change.
const valueFieldKnobs: Knob[] = [
    { id: 'size', label: 'Size of the wells', options: sizes, default: 'md' },
    {
        id: 'tone',
        label: 'Status of the vital',
        options: [o('success', 'Success'), o('warning', 'Warning'), o('error', 'Error')],
        default: 'success',
    },
    { id: 'copyable', label: 'Copy button', switch: true, default: true },
    { id: 'empty', label: 'Second well empty', switch: true, default: true },
];

const vitals = {
    success: 'Delivered',
    warning: 'Retrying',
    error: 'Failing',
} as const;

const ValueFieldPreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone === 'warning' || knobs.tone === 'error' ? knobs.tone : 'success';
    const size = knobs.size === 'sm' ? 'sm' : 'md';

    return (
        <div className="flex w-full max-w-80 flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <ValueField
                    copyable={Boolean(knobs.copyable)}
                    label="Endpoint ID"
                    size={size}
                    value="we_3k29f81ab"
                />
                <ValueField
                    copyable={Boolean(knobs.copyable) && !knobs.empty}
                    label="Retries"
                    size={size}
                    value={knobs.empty ? null : '2'}
                />
            </div>
            <ValueField label="Last delivery" tone={tone} value={vitals[tone]} variant="vital" />
        </div>
    );
};

export const entry: Entry = {
    id: 'value-field',
    name: 'Value field',
    category: 'forms',
    description: 'A read-only value in a form, in a well with copy, or a reading with its status.',
    knobs: valueFieldKnobs,
    Preview: ValueFieldPreview,
};

// The webhooks the dialog adds to, behind it.
const webhooksPage: AppWindowProps = {
    actions: (
        <Button>
            <Plus {...icon} /> Add endpoint
        </Button>
    ),
    description: 'Where Acme sends events as they happen.',
    nav: 'sidebar',
    place: 'settings',
    title: 'Webhooks',
    trail: ['Settings', 'Webhooks'],
    children: (
        <div className="grid grid-cols-3 gap-4">
            <StatCard delta="+4.1%" label="Events this week" value="18,204" />
            <StatCard delta="−0.2%" label="Failed deliveries" trend="down" value="0.4%" />
            <StatCard delta="0 ms" label="Median response" trend="neutral" value="182 ms" />
        </div>
    ),
};

const EditEndpoint = () => (
    <OpenDialog
        footer={
            <>
                <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                <Button>Save endpoint</Button>
            </>
        }
        title="Edit endpoint"
        width={480}
    >
        <DialogDescription>
            Events for new and paid invoices are sent here, signed with the secret below.
        </DialogDescription>
        <Field>
            <FieldLabel>Endpoint URL</FieldLabel>
            <Input defaultValue="https://hooks.northwind.com/acme" />
            <FieldHelper>Must answer within 10 seconds.</FieldHelper>
        </Field>
        <ValueField copyable label="Endpoint ID" value="we_3k29f81ab" />
        <ValueField copyable label="Signing secret" value="whsec_9f2c…a71d" />
        <ValueField label="Last delivery" tone="success" value="200 OK" variant="vital" />
    </OpenDialog>
);

export const inUse: InUse = {
    title: 'Edit a webhook',
    note: 'In the endpoint’s form, what cannot be edited: its ID and secret to copy, and how its last delivery went.',
    bare: true,
    render: () => (
        <AppScene page={webhooksPage}>
            <EditEndpoint />
        </AppScene>
    ),
};
