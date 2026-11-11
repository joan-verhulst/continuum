import {
    Avatar,
    Badge,
    Button,
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
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { customers, formatEuro } from '../../screens/workspace';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const paginationKnobs: Knob[] = [
    {
        id: 'pages',
        label: 'Pages',
        options: [o('5', '5'), o('12', '12'), o('100', '100')],
        default: '12',
    },
    {
        id: 'siblings',
        label: 'Pages beside the current',
        options: [o('1', 'One'), o('2', 'Two')],
        default: '1',
        // Five pages all show, so there is nothing for it to change.
        when: values => values.pages !== '5',
    },
    { id: 'results', label: 'Results', switch: true, default: true },
    { id: 'end', label: 'Rows per page', switch: true, default: false },
];

const perPage = 10;

const PaginationDemo = ({ knobs }: PreviewProps) => {
    const pageCount = Number(knobs.pages);
    const [page, setPage] = useState(Math.min(4, pageCount));
    const total = pageCount * perPage - 4;
    const first = (page - 1) * perPage + 1;

    return (
        <div className="w-full overflow-x-auto">
            <Pagination
                end={
                    knobs.end ? (
                        <Select defaultValue="10">
                            <SelectTrigger aria-label="Rows per page" size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="10">10 rows</SelectItem>
                                <SelectItem value="25">25 rows</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : undefined
                }
                onPageChange={setPage}
                page={page}
                pageCount={pageCount}
                results={
                    knobs.results
                        ? `${first}–${Math.min(first + perPage - 1, total)} of ${total}`
                        : undefined
                }
                siblings={Number(knobs.siblings)}
            />
        </div>
    );
};

// A change of the page count starts again from page 4, or the last page when there are fewer.
const PaginationPreview = ({ knobs }: PreviewProps) => (
    <PaginationDemo key={String(knobs.pages)} knobs={knobs} />
);

export const entry: Entry = {
    id: 'pagination',
    name: 'Pagination',
    category: 'navigation',
    description: 'The same number of slots on every page.',
    span: 2,
    knobs: paginationKnobs,
    Preview: PaginationPreview,
};

const invoiceCount = 248;
const statuses = [
    { label: 'Paid', tone: 'success' },
    { label: 'Paid', tone: 'success' },
    { label: 'Due soon', tone: 'warning' },
    { label: 'Paid', tone: 'success' },
    { label: 'Overdue', tone: 'error' },
    { label: 'Paid', tone: 'success' },
    { label: 'Draft', tone: 'neutral' },
] as const;

/** The item at i, counting round the list. */
const pick = <T,>(list: readonly T[], i: number) => list[i % list.length] as T;

// One page of the year's invoices, newest first, so paging brings real rows in.
const invoicePage = (page: number, perPage: number) =>
    Array.from({ length: perPage }, (_, i) => {
        const index = (page - 1) * perPage + i;
        const number = invoiceCount - index;
        const customer = pick(customers, index * 7);
        const status = pick(statuses, index);
        const day = 28 - (index % 27);
        const month = ['October', 'September', 'August', 'July'][Math.floor(index / 30) % 4];

        return {
            number: `INV-${String(number).padStart(4, '0')}`,
            customer,
            issued: `${day} ${month}`,
            amount: 240 + ((number * 379) % 5800),
            status,
        };
    }).filter(row => Number(row.number.slice(4)) > 0);

const InvoicePages = () => {
    const [page, setPage] = useState(3);
    const [perPage, setPerPage] = useState('5');
    const rows = Number(perPage);
    const pageCount = Math.ceil(invoiceCount / rows);
    const first = (page - 1) * rows + 1;

    return (
        <AppWindow
            actions={
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            }
            description={`${invoiceCount} invoices this year, newest first.`}
            nav="rail"
            place="invoices"
            title="Invoices"
        >
            <div className="flex flex-col gap-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Issued</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoicePage(page, rows).map(row => (
                            <TableRow key={row.number}>
                                <TableCell className="text-neutral-600 tabular-nums">
                                    {row.number}
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-2.5 font-medium text-neutral-950">
                                        <Avatar fallback={row.customer.initials} size={24} />
                                        {row.customer.name}
                                    </span>
                                </TableCell>
                                <TableCell className="text-neutral-600">{row.issued}</TableCell>
                                <TableCell className="text-right text-neutral-950 tabular-nums">
                                    {formatEuro(row.amount)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge tone={row.status.tone}>{row.status.label}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Pagination
                    end={
                        <Select
                            onValueChange={value => {
                                if (!value) return;
                                setPerPage(value);
                                setPage(1);
                            }}
                            value={perPage}
                        >
                            <SelectTrigger aria-label="Rows per page" size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="5">5 rows</SelectItem>
                                <SelectItem value="10">10 rows</SelectItem>
                                <SelectItem value="25">25 rows</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                    onPageChange={setPage}
                    page={page}
                    pageCount={pageCount}
                    results={`${first}–${Math.min(first + rows - 1, invoiceCount)} of ${invoiceCount}`}
                />
            </div>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'All invoices',
    note: 'Under the invoices: the range, then the pages, then rows per page.',
    app: true,
    render: () => <InvoicePages />,
};
