import {
    Avatar,
    Badge,
    Button,
    Card,
    CardHeader,
    CardTitle,
    Skeleton,
    SkeletonText,
} from 'continuum';
import { useEffect, useState } from 'react';
import { type Entry, type InUse, type Knob, opts, type PreviewProps } from '../kit';

const skeletonKnobs: Knob[] = [
    { id: 'shape', label: 'Stands in for', options: opts('rows', 'card', 'text'), default: 'rows' },
];

const SkeletonPreview = ({ knobs }: PreviewProps) => (
    <div aria-busy className="w-[360px]">
        <span className="sr-only">Loading</span>
        {knobs.shape === 'card' ? (
            <div className="flex flex-col gap-4 rounded-card border border-neutral-200 p-5">
                <Skeleton className="h-3.5 w-24 rounded-chip" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-[88px] w-full" />
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
                        <Skeleton className="h-[22px] w-14 rounded-chip" />
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

const customers = [
    { name: 'Acme Corp', email: 'billing@acme.com', initials: 'AC', plan: 'Business' },
    { name: 'Globex', email: 'ap@globex.io', initials: 'GL', plan: 'Starter' },
    { name: 'Initech', email: 'finance@initech.com', initials: 'IN', plan: 'Business' },
    { name: 'Umbrella', email: 'accounts@umbrella.co', initials: 'UM', plan: 'Enterprise' },
];

const LoadingCustomers = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!loading) return;
        const timer = window.setTimeout(() => setLoading(false), 2400);
        return () => window.clearTimeout(timer);
    }, [loading]);

    return (
        <Card className="w-full max-w-lg gap-4">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Customers</CardTitle>
                <Button loading={loading} onClick={() => setLoading(true)} variant="ghost">
                    {loading ? 'Loading' : 'Reload'}
                </Button>
            </CardHeader>
            <ul aria-busy={loading} className="flex flex-col gap-4">
                {customers.map(customer => (
                    <li className="flex h-8 items-center gap-3" key={customer.name}>
                        {loading ? (
                            <>
                                <Skeleton className="size-8 rounded-full" />
                                <div className="flex flex-1 flex-col gap-2">
                                    <Skeleton className="h-2.5 w-28 rounded-chip" />
                                    <Skeleton className="h-2.5 w-40 rounded-chip" />
                                </div>
                                <Skeleton className="h-[22px] w-16 rounded-chip" />
                            </>
                        ) : (
                            <>
                                <Avatar fallback={customer.initials} shape="round" size={32} />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate font-medium text-neutral-950 text-xs">
                                        {customer.name}
                                    </span>
                                    <span className="truncate text-neutral-600 text-xs">
                                        {customer.email}
                                    </span>
                                </div>
                                <Badge>{customer.plan}</Badge>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Customers loading',
    note: 'Rows at their real size while the list loads; Reload loads it again.',
    canvas: true,
    render: () => <LoadingCustomers />,
};
