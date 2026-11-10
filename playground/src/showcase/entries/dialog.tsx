import {
    Avatar,
    Badge,
    Button,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Field,
    FieldHelper,
    FieldLabel,
    Input,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    OpenDialog,
    previewIcon,
    useHeldOpen,
} from '../kit';

/*
 * Overlays are shown open: the overlay is portalled into the stage and opens there, scrim and
 * all, so the component itself is on show rather than its trigger. Its own controls still close
 * it, and the trigger opens it again, as in a product.
 */

const DialogPreview = () => {
    const [name, setName] = useState('Northwind Q3 review');
    const { stage, open, onOpenChange } = useHeldOpen();

    return (
        <div className="flex flex-col items-center gap-3">
            <Dialog modal={false} onOpenChange={onOpenChange} open={open}>
                <DialogTrigger render={<Button variant="secondary" />}>
                    <Pencil {...previewIcon} /> Rename report
                </DialogTrigger>
                <DialogContent
                    className="w-[min(420px,calc(100%-32px))]"
                    container={stage}
                    finalFocus={false}
                    initialFocus={false}
                >
                    <DialogHeader>
                        <DialogTitle>Rename report</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            The new name shows up for everyone in the workspace.
                        </DialogDescription>
                        <form
                            id="showcase-rename"
                            onSubmit={event => {
                                event.preventDefault();
                                const value = new FormData(event.currentTarget).get('name');
                                if (typeof value === 'string' && value.trim())
                                    setName(value.trim());
                                onOpenChange(false);
                            }}
                        >
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input defaultValue={name} maxLength={60} name="name" />
                            </Field>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button form="showcase-rename" type="submit">
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <span className="max-w-56 truncate text-neutral-600 text-xxs">{name}</span>
        </div>
    );
};

export const entry: Entry = {
    id: 'dialog',
    name: 'Dialog',
    category: 'overlays',
    description: 'Confirmations and short forms, centred.',
    hero: 'min-h-80',
    Preview: DialogPreview,
};

const DeleteReport = () => {
    const [name, setName] = useState('');

    return (
        <OpenDialog
            footer={
                <>
                    <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                    <DialogClose
                        disabled={name.trim() !== 'Northwind Q3 review'}
                        render={<Button />}
                    >
                        <Trash2 {...icon} /> Delete report
                    </DialogClose>
                </>
            }
            title="Delete report"
            width={420}
        >
            <DialogDescription>
                Northwind Q3 review and its 14 exports go for good. Type the report's name to
                confirm.
            </DialogDescription>
            <Field>
                <FieldLabel>Report name</FieldLabel>
                <Input
                    onChange={event => setName(event.target.value)}
                    placeholder="Northwind Q3 review"
                    value={name}
                />
                <FieldHelper>This cannot be undone.</FieldHelper>
            </Field>
        </OpenDialog>
    );
};

const reports = [
    {
        name: 'Northwind Q3 review',
        owner: 'Maya Chen',
        initials: 'MC',
        edited: '2 days ago',
        exports: 14,
        status: 'Shared',
    },
    {
        name: 'Churn by plan, September',
        owner: 'Liam Ortiz',
        initials: 'LO',
        edited: '4 days ago',
        exports: 6,
        status: 'Shared',
    },
    {
        name: 'Enterprise renewals 2027',
        owner: 'Sara Kim',
        initials: 'SK',
        edited: 'Last week',
        exports: 3,
        status: 'Draft',
    },
    {
        name: 'Weekly revenue digest',
        owner: 'Noah Patel',
        initials: 'NP',
        edited: 'Last week',
        exports: 22,
        status: 'Scheduled',
    },
    {
        name: 'Trial conversion, Q3',
        owner: 'Maya Chen',
        initials: 'MC',
        edited: '3 weeks ago',
        exports: 9,
        status: 'Shared',
    },
    {
        name: 'Support load by region',
        owner: 'Liam Ortiz',
        initials: 'LO',
        edited: 'Last month',
        exports: 4,
        status: 'Draft',
    },
] as const;

const reportTone = { Shared: 'success', Draft: 'neutral', Scheduled: 'primary' } as const;

const ReportsWithDelete = () => (
    <AppScene
        page={{
            place: 'reports',
            trail: ['Reports'],
            title: 'Reports',
            description: 'Weekly and monthly reports, shared with your team.',
            actions: (
                <Button>
                    <Plus {...icon} /> New report
                </Button>
            ),
            children: (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Report</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Last edited</TableHead>
                            <TableHead className="text-right">Exports</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map(report => (
                            <TableRow key={report.name}>
                                <TableCell className="font-medium text-neutral-950">
                                    {report.name}
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-2.5 text-neutral-700">
                                        <Avatar fallback={report.initials} size={24} />
                                        {report.owner}
                                    </span>
                                </TableCell>
                                <TableCell className="text-neutral-600">{report.edited}</TableCell>
                                <TableCell className="text-right text-neutral-950 tabular-nums">
                                    {report.exports}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge tone={reportTone[report.status]}>{report.status}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ),
        }}
    >
        <DeleteReport />
    </AppScene>
);

export const inUse: InUse = {
    title: 'Delete a report',
    note: 'A destructive confirm held over the reports list, asking for the report’s name back.',
    bare: true,
    render: () => <ReportsWithDelete />,
};
