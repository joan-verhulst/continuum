import {
    ActivityItem,
    ActivityList,
    Badge,
    Button,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetSection,
    SheetTitle,
    SheetTrigger,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    ValueField,
} from 'continuum';
import {
    CircleCheck,
    CircleX,
    Clock,
    Eye,
    FileText,
    HandCoins,
    History,
    PencilLine,
    Send,
    SendHorizontal,
} from 'lucide-react';
import { useStageContainer } from '../../layout';
import { AppScene, type Entry, type InUse, icon, previewIcon } from '../kit';

const statusHistory = [
    {
        tone: 'success',
        icon: <HandCoins {...previewIcon} />,
        title: 'Acme Corp paid the invoice',
        time: '14/03/2025 10:24',
        status: 'Paid',
    },
    {
        tone: 'neutral',
        icon: <SendHorizontal {...previewIcon} />,
        title: 'Invoice sent to Acme Corp',
        time: '12/03/2025 09:02',
        status: 'Sent',
    },
    {
        tone: 'warning',
        icon: <FileText {...previewIcon} />,
        title: 'Status set to Open',
        time: '12/03/2025 09:00',
        status: 'Open',
    },
    {
        tone: 'error',
        icon: <CircleX {...previewIcon} />,
        title: 'Acme Corp rejected the invoice',
        time: '11/03/2025 16:08',
        status: 'Rejected',
    },
    {
        tone: 'neutral',
        icon: <Eye {...previewIcon} />,
        title: 'Acme Corp viewed the invoice',
        time: '11/03/2025 15:51',
        status: 'Viewed',
    },
    {
        tone: 'neutral',
        icon: <SendHorizontal {...previewIcon} />,
        title: 'Invoice sent to Acme Corp',
        time: '10/03/2025 09:12',
        status: 'Sent',
    },
    {
        tone: 'primary',
        icon: <PencilLine {...previewIcon} />,
        title: 'Invoice saved as draft',
        time: '09/03/2025 17:34',
        status: 'Draft',
    },
] as const;

const SheetPreview = () => {
    const stage = useStageContainer();
    // A tile is a still: it shows the page the sheet sits beside, and only as much sheet as fits.
    const tile = Boolean(stage?.inert);

    return (
        // On a stage the trigger keeps to the left, where the page would be, and the sheet is open beside it.
        <div className={stage ? 'flex w-full justify-start' : 'contents'}>
            <Sheet open={stage ? true : undefined}>
                {tile ? (
                    <div className="flex w-[28%] flex-col gap-3">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2.5 w-full" />
                        <Skeleton className="h-2.5 w-5/6" />
                        <Skeleton className="h-2.5 w-2/3" />
                    </div>
                ) : (
                    <SheetTrigger render={<Button variant="secondary" />}>
                        <History {...previewIcon} /> Status history
                    </SheetTrigger>
                )}
                <SheetContent
                    className={
                        tile ? 'w-[64%]' : stage ? 'w-[min(360px,calc(100%-176px))]' : undefined
                    }
                    container={stage}
                    finalFocus={stage ? false : undefined}
                    initialFocus={stage ? false : undefined}
                >
                    <SheetHeader icon={<History />}>
                        <SheetTitle>Status history</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                        <SheetSection className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-neutral-600">Current status</span>
                            <Badge tone="success">Paid</Badge>
                        </SheetSection>
                        <SheetSection>
                            <ActivityList>
                                {statusHistory.slice(0, tile ? 1 : undefined).map(entry => (
                                    <ActivityItem
                                        action={<Badge>{entry.status}</Badge>}
                                        icon={entry.icon}
                                        key={entry.time}
                                        time={entry.time}
                                        title={entry.title}
                                        tone={entry.tone}
                                    />
                                ))}
                            </ActivityList>
                        </SheetSection>
                    </SheetBody>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export const entry: Entry = {
    id: 'sheet',
    name: 'Sheet',
    category: 'overlays',
    description: 'A non-modal side sheet beside the page.',
    hero: 'min-h-[520px]',
    Preview: SheetPreview,
};

const history = [
    {
        tone: 'success',
        icon: <CircleCheck {...icon} />,
        title: 'Payment received from Acme',
        time: 'Today, 09:12',
        status: 'Paid',
    },
    {
        tone: 'warning',
        icon: <Clock {...icon} />,
        title: 'Reminder sent',
        time: '2 days ago',
        status: 'Reminder',
    },
    {
        tone: 'neutral',
        icon: <Send {...icon} />,
        title: 'Invoice sent to finance@acme.com',
        time: '12 days ago',
        status: 'Sent',
    },
    {
        tone: 'neutral',
        icon: <FileText {...icon} />,
        title: 'Invoice created',
        time: '12 days ago',
        status: 'Draft',
    },
] as const;

const lineItems = [
    { item: 'Enterprise plan, October', quantity: '1', amount: '€3,200.00' },
    { item: 'Additional seats', quantity: '12', amount: '€720.00' },
    { item: 'Credit pack, 5,000', quantity: '1', amount: '€200.00' },
];

const HistorySheet = () => {
    const stage = useStageContainer();

    return (
        <Sheet open>
            <SheetContent
                // Below the top nav, as a sheet area would set it: the nav's 56px and its 16px gap.
                className="top-[72px] w-[380px]"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <SheetHeader icon={<History />}>
                    <SheetTitle>Status history</SheetTitle>
                </SheetHeader>
                <SheetBody>
                    <SheetSection className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-neutral-600">Current status</span>
                        <Badge tone="success">Paid</Badge>
                    </SheetSection>
                    <SheetSection>
                        <ActivityList>
                            {history.map(entry => (
                                <ActivityItem
                                    action={<Badge tone={entry.tone}>{entry.status}</Badge>}
                                    icon={entry.icon}
                                    key={entry.title}
                                    time={entry.time}
                                    title={entry.title}
                                    tone={entry.tone}
                                />
                            ))}
                        </ActivityList>
                    </SheetSection>
                </SheetBody>
            </SheetContent>
        </Sheet>
    );
};

const InvoiceWithHistory = () => (
    <AppScene
        page={{
            place: 'invoices',
            nav: 'top',
            title: 'INV-0142',
            description: 'Northwind Traders, sent 12 October.',
            actions: (
                <Button variant="secondary">
                    <History {...icon} /> History
                </Button>
            ),
            // The page keeps to the left of the open sheet, as it would beside it.
            className: 'pr-[420px]',
            children: (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        <ValueField label="Amount" value="€4,120.00" />
                        <ValueField label="Issued" value="12 Oct 2026" />
                        <ValueField label="Due" value="26 Oct 2026" />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.map(line => (
                                <TableRow key={line.item}>
                                    <TableCell className="text-neutral-950">{line.item}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {line.quantity}
                                    </TableCell>
                                    <TableCell className="text-right text-neutral-950 tabular-nums">
                                        {line.amount}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell className="font-medium text-neutral-950">
                                    Total
                                </TableCell>
                                <TableCell />
                                <TableCell className="text-right font-medium text-neutral-950 tabular-nums">
                                    €4,120.00
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </>
            ),
        }}
    >
        <HistorySheet />
    </AppScene>
);

export const inUse: InUse = {
    title: 'An invoice’s history',
    note: 'The invoice stays in view while its history is read in a sheet beside it.',
    bare: true,
    render: () => <InvoiceWithHistory />,
};
