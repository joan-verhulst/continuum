import {
    Avatar,
    AvatarStack,
    Badge,
    Button,
    DescriptionItem,
    DescriptionList,
    DialogDescription,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Download } from 'lucide-react';
import { AppScene, DialogActions, type Entry, type InUse, icon, OpenDialog } from '../kit';

const DescriptionPreview = () => (
    <DescriptionList className="w-full max-w-72">
        <DescriptionItem term="Client">Acme Studio</DescriptionItem>
        <DescriptionItem term="Status">
            <Badge tone="warning">Due soon</Badge>
        </DescriptionItem>
        <DescriptionItem term="Owners">
            <AvatarStack>
                <Avatar fallback="AS" shape="round" size={24} />
                <Avatar fallback="TB" shape="round" size={24} />
            </AvatarStack>
        </DescriptionItem>
    </DescriptionList>
);

export const entry: Entry = {
    id: 'description-list',
    name: 'Description list',
    category: 'content',
    description: 'Facts about one object, term beside value.',
    Preview: DescriptionPreview,
};

const overdue = [
    {
        number: 'INV-0139',
        client: 'Lumen Labs',
        amount: '€760.00',
        due: '2 Oct',
        status: 'Overdue',
    },
    {
        number: 'INV-0142',
        client: 'Acme Corp',
        amount: '€4,120.00',
        due: '26 Oct',
        status: 'Due soon',
    },
    {
        number: 'INV-0134',
        client: 'Umbrella Health',
        amount: '€2,340.00',
        due: '21 Oct',
        status: 'Overdue',
    },
    {
        number: 'INV-0129',
        client: 'Stark Logistics',
        amount: '€5,400.00',
        due: '14 Oct',
        status: 'Overdue',
    },
] as const;

// The invoices the reminder was asked for from: one row's reminder is being confirmed.
const OverdueInvoices = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {overdue.map(row => (
                <TableRow key={row.number}>
                    <TableCell className="text-neutral-950">{row.number}</TableCell>
                    <TableCell className="font-normal text-neutral-700">{row.client}</TableCell>
                    <TableCell className="font-normal text-neutral-600">{row.due}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.amount}</TableCell>
                    <TableCell className="text-right">
                        <Badge tone={row.status === 'Overdue' ? 'error' : 'warning'}>
                            {row.status}
                        </Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

// The facts the reminder carries, in the box, so they are checked before it goes.
const SendReminder = () => (
    <OpenDialog footer={<DialogActions action="Send reminder" />} title="Send a reminder">
        <DialogDescription>
            Lumen Labs gets this by email, with the invoice attached as a PDF.
        </DialogDescription>
        <DescriptionList>
            <DescriptionItem term="Invoice">INV-0139</DescriptionItem>
            <DescriptionItem term="Amount">€760.00</DescriptionItem>
            <DescriptionItem term="Due">
                <Badge tone="error">Overdue by 9 days</Badge>
            </DescriptionItem>
            <DescriptionItem term="To">billing@lumenlabs.io</DescriptionItem>
            <DescriptionItem term="Owner">
                <span className="flex items-center gap-2">
                    <Avatar fallback="DV" shape="round" size={24} />
                    Daan Visser
                </span>
            </DescriptionItem>
        </DescriptionList>
    </OpenDialog>
);

const InvoicesWithReminder = () => (
    <AppScene
        page={{
            place: 'invoices',
            trail: ['Invoices'],
            title: 'Invoices',
            description: 'Four waiting on payment, three of them past due.',
            actions: (
                <Button variant="secondary">
                    Export <Download {...icon} />
                </Button>
            ),
            children: <OverdueInvoices />,
        }}
    >
        <SendReminder />
    </AppScene>
);

export const inUse: InUse = {
    title: 'Send a reminder',
    note: 'The facts a reminder carries, a term beside each value in a bordered box, checked in the dialog before it goes.',
    bare: true,
    render: () => <InvoicesWithReminder />,
};
