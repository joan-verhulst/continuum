import {
    Avatar,
    Badge,
    Button,
    Skeleton,
    SkeletonText,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { customers, formatEuro, statusTone } from '../../screens/workspace';
import {
    AppWindow,
    type Entry,
    type InUse,
    icon,
    type Knob,
    opts,
    type PreviewProps,
} from '../kit';

const skeletonKnobs: Knob[] = [
    { id: 'shape', label: 'Stands in for', options: opts('rows', 'card', 'text'), default: 'rows' },
];

const SkeletonPreview = ({ knobs }: PreviewProps) => (
    <div aria-busy className="w-90">
        <span className="sr-only">Loading</span>
        {knobs.shape === 'card' ? (
            <div className="flex flex-col gap-4 rounded-card border border-neutral-200 p-5">
                <Skeleton className="h-3.5 w-24 rounded-chip" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-22 w-full" />
            </div>
        ) : knobs.shape === 'text' ? (
            <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-48 rounded-chip" />
                <SkeletonText lines={4} />
            </div>
        ) : (
            <div className="flex flex-col gap-4">
                {[0, 1, 2].map(row => (
                    <div className="flex items-center gap-3" key={row}>
                        <Skeleton className="size-8 rounded-full" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-2.5 w-2/5 rounded-chip" />
                            <Skeleton className="h-2.5 w-3/5 rounded-chip" />
                        </div>
                        <Skeleton className="h-5.5 w-14 rounded-chip" />
                    </div>
                ))}
            </div>
        )}
    </div>
);

export const entry: Entry = {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'status',
    description: 'Quiet placeholders at the real element’s size while data loads.',
    knobs: skeletonKnobs,
    Preview: SkeletonPreview,
};

const LoadingCustomers = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!loading) return;
        const timer = window.setTimeout(() => setLoading(false), 2400);
        return () => window.clearTimeout(timer);
    }, [loading]);

    return (
        <AppWindow
            actions={
                <>
                    <Button loading={loading} onClick={() => setLoading(true)} variant="secondary">
                        {loading ? 'Loading' : 'Reload'}
                    </Button>
                    <Button>
                        <Plus {...icon} /> Add customer
                    </Button>
                </>
            }
            description="Everyone with an account, the most recently active first."
            nav="top"
            place="customers"
            title="Customers"
        >
            <Table aria-busy={loading}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead numeric>MRR</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.slice(0, 6).map(customer => (
                        <TableRow key={customer.id}>
                            {loading ? (
                                <>
                                    <TableCell>
                                        <span className="flex items-center gap-3">
                                            <Skeleton className="size-6 rounded-full" />
                                            <Skeleton className="h-2.5 w-32 rounded-chip" />
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-2.5 w-16 rounded-chip" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5.5 w-14 rounded-chip" />
                                    </TableCell>
                                    <TableCell numeric>
                                        <Skeleton className="ml-auto h-2.5 w-14 rounded-chip" />
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell>
                                        <span className="flex items-center gap-3 font-medium text-neutral-950">
                                            <Avatar
                                                fallback={customer.initials}
                                                shape="round"
                                                size={24}
                                            />
                                            {customer.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-neutral-600">
                                        {customer.plan}
                                    </TableCell>
                                    <TableCell>
                                        <Badge tone={statusTone[customer.status]}>
                                            {customer.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell numeric>{formatEuro(customer.mrr)}</TableCell>
                                </>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppWindow>
    );
};

export const inUse: InUse = {
    title: 'Customers loading',
    note: 'The customer table while it loads, each row held at its real size; Reload loads it again.',
    app: true,
    render: () => <LoadingCustomers />,
};
