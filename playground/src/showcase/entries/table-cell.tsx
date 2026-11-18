import {
    Badge,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Truncate,
} from 'continuum';
import type { ReactNode } from 'react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';
import { useStageWidth } from './table';

const knobs: Knob[] = [
    { id: 'copy', label: 'Copy on hover', switch: true, default: true },
    { id: 'numeric', label: 'Numeric', switch: true, default: true },
    {
        id: 'truncate',
        label: 'Truncation of the key',
        options: [o('none', 'None'), o('end', 'At the end'), o('middle', 'In the middle')],
        default: 'middle',
    },
];

const keys = [
    { name: 'Production', key: 'nw_live_7f3k2q9xt0bpz7mwcr4na3e8d', requests: 1_284_310 },
    { name: 'Staging', key: 'nw_test_7f3k2q9xt0bpzq2ul8sy6d1b', requests: 48_902 },
    { name: 'Local development', key: 'nw_test_7f3k2q9xt0bpzh7jn1ke0c4f', requests: 712 },
];

/** A cell's text, cut as the knob says. */
const cut = (text: string, at: string): ReactNode =>
    at === 'none' ? (
        text
    ) : (
        <Truncate at={at === 'middle' ? 'middle' : 'end'} className="max-w-52">
            {text}
        </Truncate>
    );

const CellPreview = ({ knobs }: PreviewProps) => {
    const truncate = String(knobs.truncate);
    const width = useStageWidth();

    return (
        <Table wrapperClassName={width}>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-44">Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead className="w-32" numeric={Boolean(knobs.numeric)}>
                        Requests
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {keys.map(key => (
                    <TableRow key={key.name}>
                        <TableCell>{key.name}</TableCell>
                        <TableCell
                            className="font-mono font-normal"
                            copy={knobs.copy ? key.key : undefined}
                            copyLabel={`Copy the ${key.name.toLowerCase()} key`}
                        >
                            {cut(key.key, truncate)}
                        </TableCell>
                        <TableCell numeric={Boolean(knobs.numeric)}>
                            {key.requests.toLocaleString('en-GB')}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const entry: Entry = {
    id: 'table-cell',
    name: 'Table cell',
    category: 'content',
    description:
        'A value in a row: figures tabular and right-aligned, a long ID cut in the middle, a copy button on the ones people paste.',
    span: 2,
    knobs,
    Preview: CellPreview,
};

const hooks = [
    {
        url: 'https://api.acme-corp.com/webhooks/continuum/invoices',
        secret: 'whsec_9f2c4e8a1b7d3f6e0a5c',
        deliveries: 18_204,
        ok: true,
    },
    {
        url: 'https://hooks.zapier.com/hooks/catch/4120884/3fq9x2/',
        secret: 'whsec_1d8b0c6e4a2f9b7d3e5a',
        deliveries: 2_311,
        ok: true,
    },
    {
        url: 'https://internal.globex.example/integrations/billing/v2/events',
        secret: 'whsec_7a3e5c1f9d0b2e8c4a6f',
        deliveries: 96,
        ok: false,
    },
];

const Webhooks = () => (
    <AppWindow
        description="Where Acme sends events as they happen."
        place="settings"
        title="Webhooks"
        trail={['Settings', 'Webhooks']}
        width="wide"
    >
        <Table wrapperClassName="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="w-48">Signing secret</TableHead>
                    <TableHead className="w-28" numeric>
                        Deliveries
                    </TableHead>
                    <TableHead className="w-24">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {hooks.map(hook => (
                    <TableRow key={hook.url}>
                        <TableCell copy={hook.url} copyLabel="Copy the endpoint">
                            <Truncate at="middle" className="max-w-56">
                                {hook.url}
                            </Truncate>
                        </TableCell>
                        <TableCell
                            className="font-mono font-normal"
                            copy={hook.secret}
                            copyLabel="Copy the signing secret"
                        >
                            <Truncate at="middle" className="max-w-36">
                                {hook.secret}
                            </Truncate>
                        </TableCell>
                        <TableCell numeric>{hook.deliveries.toLocaleString('en-GB')}</TableCell>
                        <TableCell>
                            <Badge tone={hook.ok ? 'success' : 'error'}>
                                {hook.ok ? 'Healthy' : 'Failing'}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Webhooks',
    note: 'Endpoints and secrets cut in the middle, where they differ, each with a copy on hover; deliveries counted in tabular figures.',
    app: true,
    render: () => <Webhooks />,
};
