import {
    Avatar,
    Badge,
    BottomBar,
    Button,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Toolbar,
    ToolbarButton,
} from 'continuum';
import { Archive, Download, Mail, Plus, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { customers, formatEuro, statusTone } from '../../screens/workspace';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    Labelled,
    o,
    type PreviewProps,
} from '../kit';

const checkboxKnobs: Knob[] = [
    {
        id: 'state',
        label: 'State',
        options: [o('checked', 'Checked'), o('unchecked', 'Unchecked'), o('mixed', 'Mixed')],
        default: 'checked',
    },
    { id: 'label', label: 'Label', switch: true, default: true },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const CheckboxPreview = ({ knobs }: PreviewProps) => {
    const [checked, setChecked] = useState<boolean | 'indeterminate'>(
        knobs.state === 'mixed' ? 'indeterminate' : knobs.state === 'checked',
    );

    // The knob sets the state; a click still toggles it, as it would in a form.
    useEffect(() => {
        setChecked(knobs.state === 'mixed' ? 'indeterminate' : knobs.state === 'checked');
    }, [knobs.state]);

    const box = (
        <Checkbox
            aria-label={knobs.label ? undefined : 'Include PDF'}
            checked={checked}
            disabled={Boolean(knobs.disabled)}
            onCheckedChange={next => setChecked(next === true)}
        />
    );

    return knobs.label ? <Labelled label="Include PDF">{box}</Labelled> : box;
};

export const entry: Entry = {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'inputs',
    description: 'Checked, indeterminate and a parent that follows its children.',
    knobs: checkboxKnobs,
    Preview: CheckboxPreview,
};

const rows = customers.slice(0, 7);

const SelectCustomers = () => {
    const [picked, setPicked] = useState<string[]>(['globex', 'initech', 'hooli']);
    const all = picked.length === rows.length;

    const toggle = (id: string, on: boolean) =>
        setPicked(current => (on ? [...current, id] : current.filter(item => item !== id)));

    return (
        <AppWindow
            actions={
                <>
                    <Button variant="secondary">
                        <Upload {...icon} /> Import
                    </Button>
                    <Button>
                        <Plus {...icon} /> New customer
                    </Button>
                </>
            }
            description="The companies on a plan or a trial, and the ones that have left."
            overlay={
                picked.length > 0 && (
                    <BottomBar floating>
                        <Toolbar aria-label="Selected customers" variant="floating">
                            <span className="flex items-center px-3 font-medium text-neutral-950 text-xs tabular-nums">
                                {picked.length} selected
                            </span>
                            <ToolbarButton>
                                <Mail {...icon} /> Message
                            </ToolbarButton>
                            <ToolbarButton>
                                <Download {...icon} /> Export
                            </ToolbarButton>
                            <ToolbarButton>
                                <Archive {...icon} /> Archive
                            </ToolbarButton>
                            <ToolbarButton
                                aria-label="Clear the selection"
                                onClick={() => setPicked([])}
                            >
                                <X {...icon} />
                            </ToolbarButton>
                        </Toolbar>
                    </BottomBar>
                )
            }
            place="customers"
            title="Customers"
            trail={['Customers']}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-11">
                            <Checkbox
                                aria-label="Select every customer"
                                checked={all ? true : picked.length > 0 ? 'indeterminate' : false}
                                onCheckedChange={on =>
                                    setPicked(on === true ? rows.map(row => row.id) : [])
                                }
                            />
                        </TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Monthly revenue</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map(customer => (
                        <TableRow
                            data-selected={picked.includes(customer.id) || undefined}
                            key={customer.id}
                        >
                            <TableCell>
                                <Checkbox
                                    aria-label={`Select ${customer.name}`}
                                    checked={picked.includes(customer.id)}
                                    onCheckedChange={on => toggle(customer.id, on === true)}
                                />
                            </TableCell>
                            <TableCell>
                                <span className="flex min-w-0 items-center gap-2.5">
                                    <Avatar
                                        alt={customer.name}
                                        fallback={customer.initials}
                                        size={24}
                                    />
                                    <span className="truncate text-neutral-950">
                                        {customer.name}
                                    </span>
                                </span>
                            </TableCell>
                            <TableCell className="font-normal text-neutral-700">
                                {customer.plan}
                            </TableCell>
                            <TableCell>
                                <Badge tone={statusTone[customer.status]}>{customer.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {customer.mrr ? formatEuro(customer.mrr) : '—'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Customers, three picked',
    note: 'A checkbox on each row and a mixed one in the head, with the bar for the picked rows floating below.',
    app: true,
    render: () => <SelectCustomers />,
};
