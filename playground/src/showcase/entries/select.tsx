import {
    Button,
    Field,
    FieldLabel,
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
import { CalendarDays, Folder, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    DialogActions,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    o,
    type PreviewProps,
    previewIcon,
    sizes,
} from '../kit';

const selectKnobs: Knob[] = [
    { id: 'size', label: 'Size', options: sizes, default: 'sm' },
    {
        id: 'state',
        label: 'State',
        options: [o('default', 'Default'), o('invalid', 'Invalid'), o('disabled', 'Disabled')],
        default: 'default',
    },
    { id: 'leading', label: 'Leading icon', switch: true, default: true },
];

const SelectPreview = ({ knobs }: PreviewProps) => {
    const [range, setRange] = useState('30d');
    const [open, setOpen] = useState(false);
    const stage = useStageContainer();
    const shown = Boolean(stage) && knobs.state !== 'disabled';

    return (
        // On a stage the list is open under the box; room below keeps the pair centred.
        <div className={shown ? 'pb-40' : 'contents'}>
            <Select
                modal={stage ? false : undefined}
                onOpenChange={setOpen}
                onValueChange={setRange}
                // Controlled from the first render: Base UI keeps whichever mode a popup starts in.
                open={shown ? true : open}
                value={range}
            >
                <SelectTrigger
                    aria-invalid={knobs.state === 'invalid' || undefined}
                    className="w-48"
                    disabled={knobs.state === 'disabled'}
                    leadingIcon={knobs.leading ? <CalendarDays {...previewIcon} /> : undefined}
                    size={knobs.size === 'md' ? 'md' : 'sm'}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent container={stage}>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="3m">Last 3 months</SelectItem>
                    <SelectItem value="12m">Last 12 months</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

export const entry: Entry = {
    id: 'select',
    name: 'Select',
    category: 'inputs',
    description: 'The input’s box with the dropdown’s panel.',
    knobs: selectKnobs,
    Preview: SelectPreview,
};

const MoveReport = () => {
    const stage = useStageContainer();
    const [folder, setFolder] = useState('q4');

    return (
        <OpenDialog footer={<DialogActions action="Move" />} title="Move report">
            <Field>
                <FieldLabel>Visibility</FieldLabel>
                <Select defaultValue="team">
                    <SelectTrigger leadingIcon={<Users {...icon} />}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="me">Only me</SelectItem>
                        <SelectItem value="team">Everyone at Acme</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
            <Field>
                <FieldLabel>Folder</FieldLabel>
                <Select modal={false} onValueChange={setFolder} open value={folder}>
                    <SelectTrigger leadingIcon={<Folder {...icon} />}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent container={stage}>
                        <SelectItem value="q3">Q3 reviews</SelectItem>
                        <SelectItem value="q4">Q4 planning</SelectItem>
                        <SelectItem value="clients">Client reports</SelectItem>
                        <SelectItem value="archive">Archive</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
            {/* Room for the open list, so it covers nothing of the form. */}
            <div className="h-40" />
        </OpenDialog>
    );
};

const reports = [
    { name: 'Q3 review', folder: 'Q3 reviews', owner: 'Maya Chen', updated: 'Today' },
    { name: 'October revenue', folder: 'Q4 planning', owner: 'Liam Ortiz', updated: 'Yesterday' },
    { name: 'Churn by plan', folder: 'Client reports', owner: 'Sara Kim', updated: '28 Oct' },
    { name: 'Pipeline forecast', folder: 'Q4 planning', owner: 'Maya Chen', updated: '24 Oct' },
    {
        name: 'Northwind quarterly',
        folder: 'Client reports',
        owner: 'Liam Ortiz',
        updated: '19 Oct',
    },
    { name: 'Q2 review', folder: 'Archive', owner: 'Sara Kim', updated: '2 Jul' },
];

/** The reports list the moved report comes from, behind the dialog. */
const ReportList = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Updated</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {reports.map(row => (
                <TableRow key={row.name}>
                    <TableCell className="font-medium text-neutral-950">{row.name}</TableCell>
                    <TableCell className="text-neutral-600">{row.folder}</TableCell>
                    <TableCell className="text-neutral-600">{row.owner}</TableCell>
                    <TableCell className="text-right text-neutral-600 tabular-nums">
                        {row.updated}
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

export const inUse: InUse = {
    title: 'Move report',
    note: 'A dialog over the reports list, its folder select open on four choices.',
    bare: true,
    render: () => (
        <AppScene
            page={{
                nav: 'top',
                place: 'reports',
                title: 'Reports',
                description: 'Weekly and monthly reports, shared with your team.',
                actions: (
                    <Button>
                        <Plus {...icon} /> New report
                    </Button>
                ),
                children: <ReportList />,
            }}
        >
            <MoveReport />
        </AppScene>
    ),
};
