import {
    Button,
    EditableCell,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Eye, Plus, Send } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';
import { useStageWidth } from './table';

const euro = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

const vatRates = [
    { value: '21', label: '21%' },
    { value: '9', label: '9%' },
    { value: '0', label: '0%' },
];

/** A typed number, read the Dutch way too ("12,5"); NaN when it is not one. */
const numberOf = (text: string) => Number(text.trim().replace(',', '.'));

const knobs: Knob[] = [
    {
        id: 'kind',
        label: 'Kind',
        options: [o('text', 'Text'), o('number', 'Number'), o('pick', 'Pick from a set')],
        default: 'text',
    },
    { id: 'editable', label: 'Editable', switch: true, default: true },
];

type StageLine = { id: number; item: string; hours: string; vat: string };

/** Three lines of an invoice; the knob picks which column is the editable one. */
const EditCellPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer() ?? undefined;
    const width = useStageWidth();
    const [lines, setLines] = useState<StageLine[]>([
        { id: 1, item: 'Design review', hours: '8', vat: '21' },
        { id: 2, item: 'Build sprint', hours: '20', vat: '21' },
        { id: 3, item: 'Workshop materials', hours: '1', vat: '9' },
    ]);
    const kind = String(knobs.kind);
    const editable = Boolean(knobs.editable);
    const set = (id: number, field: keyof Omit<StageLine, 'id'>, value: string) =>
        setLines(current =>
            current.map(line => (line.id === id ? { ...line, [field]: value } : line)),
        );
    const on = (which: string) => editable && kind === which;

    return (
        <Table wrapperClassName={width}>
            <TableHeader>
                <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-24" numeric>
                        Hours
                    </TableHead>
                    <TableHead className="w-24">VAT</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {lines.map(line => (
                    <TableRow key={line.id}>
                        {on('text') ? (
                            <EditableCell
                                label={`Item of line ${line.id}`}
                                onValueChange={value => set(line.id, 'item', value)}
                                placeholder="What was done"
                                value={line.item}
                            />
                        ) : (
                            <TableCell>{line.item}</TableCell>
                        )}
                        {on('number') ? (
                            <EditableCell
                                inputMode="decimal"
                                label={`Hours of ${line.item}`}
                                numeric
                                onValueChange={value => {
                                    if (Number.isFinite(numberOf(value)) && value.trim() !== '')
                                        set(line.id, 'hours', value.trim());
                                }}
                                value={line.hours}
                            />
                        ) : (
                            <TableCell numeric>{line.hours}</TableCell>
                        )}
                        {on('pick') ? (
                            <EditableCell
                                container={stage}
                                label={`VAT of ${line.item}`}
                                onValueChange={value => set(line.id, 'vat', value)}
                                options={vatRates}
                                value={line.vat}
                            />
                        ) : (
                            <TableCell>{line.vat}%</TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export const entry: Entry = {
    id: 'editable-cell',
    name: 'Editable cell',
    category: 'tables',
    description:
        'A table cell that reads as its value and is edited where it sits: typed over, or picked from a set.',
    span: 2,
    knobs,
    Preview: EditCellPreview,
};

/* ---------- In use: an invoice's lines, edited where they sit ---------- */

type Line = { id: number; item: string; quantity: string; rate: string; vat: string };

const totalOf = (line: Line) => numberOf(line.quantity) * numberOf(line.rate);

const InvoiceLines = () => {
    const [lines, setLines] = useState<Line[]>([
        { id: 1, item: 'Design review', quantity: '8', rate: '140', vat: '21' },
        { id: 2, item: 'Build sprint', quantity: '20', rate: '150', vat: '21' },
        { id: 3, item: 'Workshop materials', quantity: '1', rate: '85', vat: '9' },
    ]);
    const change = (id: number, field: keyof Omit<Line, 'id'>, value: string) =>
        setLines(current =>
            current.map(line => (line.id === id ? { ...line, [field]: value } : line)),
        );
    // A figure is only taken when it reads as one; otherwise the old value stays.
    const changeNumber = (id: number, field: 'quantity' | 'rate', value: string) => {
        if (value.trim() !== '' && Number.isFinite(numberOf(value)))
            change(id, field, value.trim());
    };
    const subtotal = lines.reduce((sum, line) => sum + totalOf(line), 0);
    const vat = lines.reduce((sum, line) => sum + (totalOf(line) * Number(line.vat)) / 100, 0);

    return (
        <AppWindow
            actions={
                <>
                    <Button variant="secondary">
                        <Eye {...icon} /> Preview
                    </Button>
                    <Button>
                        <Send {...icon} /> Send invoice
                    </Button>
                </>
            }
            description="Acme Corp, due 30 November. Click a value to change it."
            place="invoices"
            title="INV-0142"
            trail={['Invoices', 'INV-0142']}
        >
            <Table wrapperClassName="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-20" numeric>
                            Qty
                        </TableHead>
                        <TableHead className="w-28" numeric>
                            Rate
                        </TableHead>
                        <TableHead className="w-24">VAT</TableHead>
                        <TableHead className="w-32" numeric>
                            Amount
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lines.map(line => (
                        <TableRow key={line.id}>
                            <EditableCell
                                label={`Item of line ${line.id}`}
                                onValueChange={value => change(line.id, 'item', value)}
                                placeholder="What was done"
                                value={line.item}
                            />
                            <EditableCell
                                inputMode="decimal"
                                label={`Quantity of ${line.item}`}
                                numeric
                                onValueChange={value => changeNumber(line.id, 'quantity', value)}
                                value={line.quantity}
                            />
                            <EditableCell
                                inputMode="decimal"
                                label={`Rate of ${line.item}`}
                                numeric
                                onValueChange={value => changeNumber(line.id, 'rate', value)}
                                value={line.rate}
                            >
                                {euro.format(numberOf(line.rate))}
                            </EditableCell>
                            <EditableCell
                                label={`VAT of ${line.item}`}
                                onValueChange={value => change(line.id, 'vat', value)}
                                options={vatRates}
                                value={line.vat}
                            />
                            <TableCell numeric>{euro.format(totalOf(line))}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="hover:bg-transparent">
                        <TableCell className="py-0" colSpan={5}>
                            <Button
                                className="-ml-3"
                                onClick={() =>
                                    setLines(current => [
                                        ...current,
                                        {
                                            id: Math.max(0, ...current.map(l => l.id)) + 1,
                                            item: '',
                                            quantity: '1',
                                            rate: '0',
                                            vat: '21',
                                        },
                                    ])
                                }
                                variant="ghost"
                            >
                                <Plus {...icon} /> Add line
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4}>Subtotal</TableCell>
                        <TableCell numeric>{euro.format(subtotal)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={4}>VAT</TableCell>
                        <TableCell numeric>{euro.format(vat)}</TableCell>
                    </TableRow>
                    <TableRow className="[&>td]:border-neutral-200 [&>td]:border-t [&>td]:pt-3 [&>td]:pb-4">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell numeric>{euro.format(subtotal + vat)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Invoice lines',
    note: 'An invoice’s lines, edited where they sit: a click turns a value into a field, the VAT a pick; the sums follow.',
    app: true,
    render: () => <InvoiceLines />,
};
