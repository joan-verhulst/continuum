import {
    Field,
    FieldLabel,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'continuum';
import { CalendarDays, Folder, Users } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    DialogActions,
    type Entry,
    type InUse,
    icon,
    type Knob,
    OpenDialog,
    o,
    type PreviewProps,
    previewIcon,
    scene,
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
                        <SelectItem value="team">Everyone in Northwind</SelectItem>
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

export const inUse: InUse = {
    title: 'Move report',
    note: 'Two selects in a dialog, the first one open.',
    bare: true,
    render: scene(<MoveReport />, 'min-h-[480px]'),
};
