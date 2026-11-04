import { Button, Card, CardHeader, CardTitle, ValueField } from 'continuum';
import type { Entry, InUse } from '../kit';

const ValueFieldPreview = () => (
    <div className="grid w-full max-w-72 grid-cols-2 gap-3">
        <ValueField copyable label="Entry page" value="/home" />
        <ValueField label="Source" value={null} />
    </div>
);

export const entry: Entry = {
    id: 'value-field',
    name: 'Value field',
    category: 'forms',
    description: 'A read-only value in a well, with copy.',
    Preview: ValueFieldPreview,
};

const Credentials = () => (
    <Card className="w-full max-w-lg gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>API credentials</CardTitle>
            <Button variant="ghost">Rotate secret</Button>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3">
            <ValueField copyable label="Client ID" value="cnt_live_4f9a2c" />
            <ValueField
                copyable
                copyValue="sk_live_8Hd2kQm"
                label="Secret"
                value="sk_live_••••••••"
            />
            <ValueField
                className="col-span-2"
                copyable
                label="Webhook URL"
                value="https://api.northwind.studio/hooks/continuum"
            />
            <ValueField label="Status" tone="success" value="Active" variant="vital" />
            <ValueField label="Last call" value="2 minutes ago" variant="vital" />
        </div>
    </Card>
);

export const inUse: InUse = {
    title: 'API credentials',
    note: 'Values to read and copy, and two vitals under them.',
    canvas: true,
    render: () => <Credentials />,
};
