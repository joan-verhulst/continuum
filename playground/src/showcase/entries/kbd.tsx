import {
    Avatar,
    Badge,
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Kbd,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Plus } from 'lucide-react';
import { useStageContainer } from '../../layout';
import { AppScene, type Entry, type InUse, icon } from '../kit';

const KbdPreview = () => (
    <p className="flex items-center gap-1.5 text-neutral-600 text-xs">
        Press <Kbd>⌘</Kbd>
        <Kbd>K</Kbd> to search, <Kbd>Esc</Kbd> to close
    </p>
);

export const entry: Entry = {
    id: 'kbd',
    name: 'Kbd',
    category: 'actions',
    description: 'Keys in hints, menus and inputs.',
    Preview: KbdPreview,
};

// The list a "?" opens, over the invoices whose keys it lists.
const shortcutGroups = [
    {
        label: 'Anywhere',
        shortcuts: [
            { label: 'Search', keys: ['⌘', 'K'] },
            { label: 'Go to overview', keys: ['G', 'O'] },
            { label: 'Go to invoices', keys: ['G', 'I'] },
            { label: 'Go to customers', keys: ['G', 'C'] },
            { label: 'Show shortcuts', keys: ['?'] },
        ],
    },
    {
        label: 'Invoices',
        shortcuts: [
            { label: 'New invoice', keys: ['C'] },
            { label: 'Open invoice', keys: ['↵'] },
            { label: 'Next invoice', keys: ['J'] },
            { label: 'Mark as paid', keys: ['⇧', 'P'] },
            { label: 'Send a reminder', keys: ['⇧', 'R'] },
        ],
    },
];

const invoices = [
    {
        client: 'Acme Corp',
        initials: 'AC',
        number: 'INV-0142',
        amount: '€4,120.00',
        status: 'Due soon',
        tone: 'warning',
    },
    {
        client: 'Northwind',
        initials: 'N',
        number: 'INV-0141',
        amount: '€1,980.00',
        status: 'Paid',
        tone: 'success',
    },
    {
        client: 'Lumen Labs',
        initials: 'LL',
        number: 'INV-0139',
        amount: '€760.00',
        status: 'Overdue',
        tone: 'error',
    },
    {
        client: 'Harbour Street',
        initials: 'HS',
        number: 'INV-0138',
        amount: '€2,310.00',
        status: 'Paid',
        tone: 'success',
    },
    {
        client: 'Tideline Travel',
        initials: 'TT',
        number: 'INV-0137',
        amount: '€540.00',
        status: 'Draft',
        tone: 'neutral',
    },
] as const;

const InvoiceTable = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {invoices.map(row => (
                <TableRow key={row.number}>
                    <TableCell>
                        <span className="flex items-center gap-2.5 font-medium text-neutral-950">
                            <Avatar fallback={row.initials} size={24} />
                            {row.client}
                        </span>
                    </TableCell>
                    <TableCell className="text-neutral-600">{row.number}</TableCell>
                    <TableCell className="text-right text-neutral-950 tabular-nums">
                        {row.amount}
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge tone={row.tone}>{row.status}</Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const ShortcutList = () => {
    const stage = useStageContainer();

    return (
        <Dialog modal={false} open>
            <DialogContent
                container={stage}
                finalFocus={false}
                initialFocus={false}
                style={{ width: 'min(600px, calc(100% - 32px))' }}
            >
                <DialogHeader>
                    <DialogTitle>Keyboard shortcuts</DialogTitle>
                </DialogHeader>
                <DialogBody className="gap-5 pb-6">
                    <DialogDescription className="flex items-center gap-1.5">
                        Press <Kbd>?</Kbd> on any page to open this list.
                    </DialogDescription>
                    <div className="grid grid-cols-2 gap-10">
                        {shortcutGroups.map(group => (
                            <section className="flex flex-col" key={group.label}>
                                <h3 className="pb-2 font-medium text-neutral-950 text-xs">
                                    {group.label}
                                </h3>
                                {group.shortcuts.map(shortcut => (
                                    <p
                                        className="flex h-8 items-center justify-between gap-3 text-neutral-700 text-xs"
                                        key={shortcut.label}
                                    >
                                        {shortcut.label}
                                        <span className="flex items-center gap-1">
                                            {shortcut.keys.map(key => (
                                                <Kbd key={key}>{key}</Kbd>
                                            ))}
                                        </span>
                                    </p>
                                ))}
                            </section>
                        ))}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
};

const ShortcutsOverInvoices = () => (
    <AppScene
        page={{
            nav: 'sidebar',
            place: 'invoices',
            trail: ['Invoices'],
            title: 'Invoices',
            description: '38 sent this month, €9,170 still open.',
            actions: (
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            ),
            children: <InvoiceTable />,
        }}
    >
        <ShortcutList />
    </AppScene>
);

export const inUse: InUse = {
    title: 'Keyboard shortcuts',
    note: 'The list a “?” opens over the invoices, every command with its keys.',
    bare: true,
    render: () => <ShortcutsOverInvoices />,
};
