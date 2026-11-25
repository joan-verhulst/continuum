import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    type TableSort,
} from '@contui/ui';
import { useState } from 'react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';
import { useStageWidth } from './table';

const knobs: Knob[] = [
    { id: 'sortable', label: 'Sortable', switch: true, default: true },
    {
        id: 'sort',
        label: 'Revenue sorted',
        options: [
            o('none', 'Not sorted'),
            o('descending', 'Descending'),
            o('ascending', 'Ascending'),
        ],
        default: 'descending',
    },
];

type Customer = { name: string; plan: string; seats: number; mrr: number };

const customers: Customer[] = [
    { name: 'Acme Corp', plan: 'Business', seats: 48, mrr: 2_400 },
    { name: 'Globex', plan: 'Team', seats: 12, mrr: 540 },
    { name: 'Initech', plan: 'Business', seats: 31, mrr: 1_550 },
    { name: 'Northwind Traders', plan: 'Team', seats: 9, mrr: 405 },
    { name: 'Umbrella Health', plan: 'Enterprise', seats: 120, mrr: 7_200 },
];

const euro = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
});

type Key = 'name' | 'seats' | 'mrr';

const compare: Record<Key, (a: Customer, b: Customer) => number> = {
    name: (a, b) => a.name.localeCompare(b.name),
    seats: (a, b) => a.seats - b.seats,
    mrr: (a, b) => a.mrr - b.mrr,
};

/** Customers, sortable by name, seats and revenue; the plan is not something one orders by. */
const SortedCustomers = ({ sortable, initial }: { sortable: boolean; initial: TableSort }) => {
    const width = useStageWidth();
    const [order, setOrder] = useState<{ key: Key; sort: TableSort }>({
        key: 'mrr',
        sort: initial,
    });
    const rows =
        order.sort === 'none'
            ? customers
            : [...customers].sort(
                  (a, b) => compare[order.key](a, b) * (order.sort === 'ascending' ? 1 : -1),
              );
    const sortOf = (key: Key) =>
        sortable
            ? {
                  sort: order.key === key ? order.sort : ('none' as TableSort),
                  onSortChange: (sort: TableSort) => setOrder({ key, sort }),
              }
            : {};

    return (
        <Table wrapperClassName={width}>
            <TableHeader>
                <TableRow>
                    <TableHead {...sortOf('name')}>Customer</TableHead>
                    <TableHead className="w-32">Plan</TableHead>
                    <TableHead className="w-24" numeric {...sortOf('seats')}>
                        Seats
                    </TableHead>
                    <TableHead className="w-32" numeric {...sortOf('mrr')}>
                        Revenue
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map(customer => (
                    <TableRow key={customer.name}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell className="font-normal text-neutral-700">
                            {customer.plan}
                        </TableCell>
                        <TableCell numeric>{customer.seats}</TableCell>
                        <TableCell numeric>{euro.format(customer.mrr)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const HeadPreview = ({ knobs }: PreviewProps) => (
    // Keyed by the knob, so picking an order on the panel starts the table in it.
    <div className="contents">
        <SortedCustomers
            initial={String(knobs.sort) as TableSort}
            key={String(knobs.sort)}
            sortable={Boolean(knobs.sortable)}
        />
    </div>
);

export const entry: Entry = {
    id: 'table-head',
    name: 'Table head',
    category: 'tables',
    description:
        'A column’s head; on the columns a reader orders by, a button that sorts them, with the order’s mark.',
    span: 2,
    knobs,
    Preview: HeadPreview,
};

type Page = { path: string; views: number; visitors: number; bounce: number };

const pages: Page[] = [
    { path: '/pricing', views: 18_420, visitors: 12_030, bounce: 38 },
    { path: '/', views: 41_200, visitors: 29_870, bounce: 44 },
    { path: '/docs/getting-started', views: 9_310, visitors: 6_120, bounce: 21 },
    { path: '/blog/quiet-interfaces', views: 6_880, visitors: 5_940, bounce: 62 },
    { path: '/changelog', views: 3_150, visitors: 2_410, bounce: 35 },
];

type PageKey = 'path' | 'views' | 'visitors' | 'bounce';

const TopPages = () => {
    const [order, setOrder] = useState<{ key: PageKey; sort: TableSort }>({
        key: 'views',
        sort: 'descending',
    });
    const rows =
        order.sort === 'none'
            ? pages
            : [...pages].sort((a, b) => {
                  const by =
                      order.key === 'path'
                          ? a.path.localeCompare(b.path)
                          : a[order.key] - b[order.key];
                  return by * (order.sort === 'ascending' ? 1 : -1);
              });
    const sortOf = (key: PageKey) => ({
        sort: order.key === key ? order.sort : ('none' as TableSort),
        onSortChange: (sort: TableSort) => setOrder({ key, sort }),
    });

    return (
        <AppWindow
            description="The pages read most in the last 30 days."
            nav="sidebar"
            place="reports"
            title="Pages"
            trail={['Reports', 'Pages']}
            width="wide"
        >
            <Table wrapperClassName="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead {...sortOf('path')}>Page</TableHead>
                        <TableHead className="w-32" numeric {...sortOf('views')}>
                            Views
                        </TableHead>
                        <TableHead className="w-32" numeric {...sortOf('visitors')}>
                            Visitors
                        </TableHead>
                        <TableHead className="w-32" numeric {...sortOf('bounce')}>
                            Bounce rate
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map(page => (
                        <TableRow key={page.path}>
                            <TableCell>{page.path}</TableCell>
                            <TableCell numeric>{page.views.toLocaleString('en-GB')}</TableCell>
                            <TableCell numeric>{page.visitors.toLocaleString('en-GB')}</TableCell>
                            <TableCell numeric>{page.bounce}%</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Top pages',
    note: 'A report’s pages, sorted by views to start; every figure sorts, largest first.',
    app: true,
    render: () => <TopPages />,
};
