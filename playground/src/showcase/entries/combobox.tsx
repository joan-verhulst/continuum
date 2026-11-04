import {
    Avatar,
    Badge,
    Button,
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    DialogDescription,
    Field,
    FieldLabel,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    DialogActions,
    type Entry,
    type InUse,
    icon,
    OpenDialog,
    previewIcon,
} from '../kit';

const owners = [
    'Anna de Vries',
    'Bram Jansen',
    'Chloé Martin',
    'Daan Visser',
    'Eva Bakker',
    'Femke Smit',
];

const ComboboxPreview = () => {
    const [open, setOpen] = useState(false);
    const stage = useStageContainer();

    return (
        <div className={stage ? 'pb-56' : 'contents'}>
            <Combobox
                defaultValue="Eva Bakker"
                items={owners}
                modal={stage ? false : undefined}
                onOpenChange={setOpen}
                open={stage ? true : open}
            >
                <ComboboxInput
                    aria-label="Account owner"
                    className="w-56"
                    leadingIcon={<UserRound {...previewIcon} />}
                    placeholder="Search people"
                    size="sm"
                />
                <ComboboxContent container={stage}>
                    <ComboboxEmpty />
                    <ComboboxList>
                        {(item: string) => (
                            <ComboboxItem key={item} value={item}>
                                {item}
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    );
};

export const entry: Entry = {
    id: 'combobox',
    name: 'Combobox',
    category: 'inputs',
    description: 'A select you type into, for long lists.',
    // Taller than a tile, so the tile keeps the top in view and lets the rest run off.
    stageClassName: 'items-start',
    Preview: ComboboxPreview,
};

const ownersInUse = [
    'Anna de Vries',
    'Bram Jansen',
    'Chloé Martin',
    'Daan Visser',
    'Eva Bakker',
    'Femke Smit',
];

const queue = [
    {
        client: 'Acme Corp',
        number: 'INV-0142',
        amount: '€4,120.00',
        due: '26 Oct',
        owner: undefined,
        status: 'Due soon',
        tone: 'warning',
    },
    {
        client: 'Northwind',
        number: 'INV-0141',
        amount: '€1,980.00',
        due: '14 Oct',
        owner: 'Anna de Vries',
        status: 'Paid',
        tone: 'success',
    },
    {
        client: 'Lumen Labs',
        number: 'INV-0139',
        amount: '€760.00',
        due: '2 Oct',
        owner: 'Daan Visser',
        status: 'Overdue',
        tone: 'error',
    },
    {
        client: 'Harbour Street',
        number: 'INV-0138',
        amount: '€2,310.00',
        due: '9 Nov',
        owner: 'Bram Jansen',
        status: 'Scheduled',
        tone: 'primary',
    },
    {
        client: 'Tideline Travel',
        number: 'INV-0137',
        amount: '€540.00',
        due: '—',
        owner: undefined,
        status: 'Draft',
        tone: 'neutral',
    },
    {
        client: 'Globex',
        number: 'INV-0136',
        amount: '€1,240.00',
        due: '30 Sep',
        owner: 'Eva Bakker',
        status: 'Paid',
        tone: 'success',
    },
] as const;

const initials = (name: string) =>
    name
        .split(' ')
        .filter(word => word[0] === word[0]?.toUpperCase())
        .map(word => word[0])
        .join('')
        .slice(0, 2);

// The invoices the dialog was opened from: one row's owner is being picked.
const InvoiceQueue = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {queue.map(row => (
                <TableRow key={row.number}>
                    <TableCell className="text-neutral-950">{row.number}</TableCell>
                    <TableCell className="font-normal text-neutral-700">{row.client}</TableCell>
                    <TableCell>
                        {row.owner ? (
                            <span className="flex items-center gap-2 font-normal text-neutral-700">
                                <Avatar fallback={initials(row.owner)} shape="round" size={24} />
                                {row.owner}
                            </span>
                        ) : (
                            <span className="font-normal text-neutral-500">Unassigned</span>
                        )}
                    </TableCell>
                    <TableCell className="font-normal text-neutral-600">{row.due}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.amount}</TableCell>
                    <TableCell className="text-right">
                        <Badge tone={row.tone} variant={row.tone === 'primary' ? 'dot' : undefined}>
                            {row.status}
                        </Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const AssignOwner = () => {
    const stage = useStageContainer();

    return (
        <OpenDialog footer={<DialogActions action="Assign" />} title="Assign INV-0142">
            <DialogDescription>
                Acme Corp, €4,120.00, due 26 October. The owner chases it and gets the replies.
            </DialogDescription>
            <Field>
                <FieldLabel>Owner</FieldLabel>
                <Combobox defaultValue="Eva Bakker" items={ownersInUse} modal={false} open>
                    <ComboboxInput
                        leadingIcon={<UserRound {...icon} />}
                        placeholder="Search people"
                    />
                    <ComboboxContent container={stage}>
                        <ComboboxEmpty />
                        <ComboboxList>
                            {(item: string) => (
                                <ComboboxItem key={item} value={item}>
                                    {item}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </Field>
            {/* Room for the open list, as the rest of the form would sit under it. */}
            <div className="h-56" />
        </OpenDialog>
    );
};

const InvoicesWithAssign = () => (
    <AppScene
        page={{
            nav: 'rail',
            place: 'invoices',
            title: 'Invoices',
            description: 'Two without an owner; nobody chases those.',
            actions: (
                <Button>
                    <Plus {...icon} /> New invoice
                </Button>
            ),
            children: <InvoiceQueue />,
        }}
    >
        <AssignOwner />
    </AppScene>
);

export const inUse: InUse = {
    title: 'Assign an invoice',
    note: 'An owner picked by typing, the list open under the box, in a dialog over the invoices.',
    bare: true,
    render: () => <InvoicesWithAssign />,
};
