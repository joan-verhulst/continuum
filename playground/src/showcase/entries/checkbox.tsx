import {
    Avatar,
    Badge,
    Button,
    Checkbox,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Ellipsis, Pencil, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type Entry, type InUse, icon, type Knob, Labelled, o, type PreviewProps } from '../kit';

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
    const [checked, setChecked] = useState<boolean | 'indeterminate'>(true);

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

const invoices = [
    {
        id: 'i1',
        client: 'Acme Corp',
        initials: 'AC',
        number: 'INV-0142',
        status: 'Due soon',
        tone: 'warning',
        amount: '€4,120.00',
        due: '26 Oct 2025',
    },
    {
        id: 'i2',
        client: 'Northwind',
        initials: 'NW',
        number: 'INV-0141',
        status: 'Paid',
        tone: 'success',
        amount: '€1,980.00',
        due: '14 Oct 2025',
    },
    {
        id: 'i3',
        client: 'Lumen Labs',
        initials: 'LL',
        number: 'INV-0139',
        status: 'Overdue',
        tone: 'error',
        amount: '€760.00',
        due: '2 Oct 2025',
    },
    {
        id: 'i4',
        client: 'Tideline Travel',
        initials: 'TT',
        number: 'INV-0138',
        status: 'Draft',
        tone: 'neutral',
        amount: '€2,310.00',
        due: '—',
    },
] as const;

const InvoiceTable = () => {
    const [picked, setPicked] = useState<string[]>(['i3']);
    const [page, setPage] = useState(1);
    const all = picked.length === invoices.length;

    return (
        <div className="flex w-full flex-col gap-3">
            <Table wrapperClassName="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                aria-label="Select all"
                                checked={all ? true : picked.length > 0 ? 'indeterminate' : false}
                                onCheckedChange={checked =>
                                    setPicked(checked === true ? invoices.map(row => row.id) : [])
                                }
                            />
                        </TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead numeric>Amount</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="w-12">
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map(row => (
                        <TableRow key={row.id}>
                            <TableCell>
                                <Checkbox
                                    aria-label={`Select ${row.number}`}
                                    checked={picked.includes(row.id)}
                                    onCheckedChange={checked =>
                                        setPicked(current =>
                                            checked === true
                                                ? [...current, row.id]
                                                : current.filter(id => id !== row.id),
                                        )
                                    }
                                />
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center gap-2.5">
                                    <Avatar fallback={row.initials} size={24} />
                                    {row.client}
                                </span>
                            </TableCell>
                            <TableCell className="font-normal text-neutral-600">
                                {row.number}
                            </TableCell>
                            <TableCell>
                                <Badge tone={row.tone}>{row.status}</Badge>
                            </TableCell>
                            <TableCell numeric>{row.amount}</TableCell>
                            <TableCell className="font-normal text-neutral-600">
                                {row.due}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <Button
                                                aria-label="Actions"
                                                size="icon-sm"
                                                variant="ghost"
                                            />
                                        }
                                    >
                                        <Ellipsis {...icon} />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Pencil {...icon} /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Send {...icon} /> Send reminder
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem variant="danger">
                                            <Trash2 {...icon} /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Pagination
                end={
                    <Select defaultValue="4">
                        <SelectTrigger aria-label="Rows per page" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="4">4 rows</SelectItem>
                            <SelectItem value="10">10 rows</SelectItem>
                            <SelectItem value="25">25 rows</SelectItem>
                        </SelectContent>
                    </Select>
                }
                onPageChange={setPage}
                page={page}
                pageCount={9}
                results={`${(page - 1) * 4 + 1} – ${page * 4} of 36`}
            />
        </div>
    );
};

export const inUse: InUse = {
    title: 'Invoice table',
    note: 'Selection, a client with an avatar, status badges, numeric columns, row actions and pagination.',
    render: () => <InvoiceTable />,
};
