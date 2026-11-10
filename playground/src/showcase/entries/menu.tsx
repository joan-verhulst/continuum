import {
    Avatar,
    Button,
    cn,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuEmpty,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSearch,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import {
    Archive,
    Copy,
    Download,
    Ellipsis,
    EllipsisVertical,
    FileText,
    Folder,
    FolderInput,
    type LucideIcon,
    Pencil,
    Plus,
    Share2,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    type PreviewProps,
    previewIcon,
} from '../kit';

type Action = { label: string; Icon: LucideIcon; shortcut?: string; danger?: boolean };

const actions: Action[] = [
    { label: 'Rename', Icon: Pencil, shortcut: 'R' },
    { label: 'Duplicate', Icon: Copy, shortcut: '⌘D' },
    { label: 'Share', Icon: Share2 },
    { label: 'Download', Icon: Download },
    { label: 'Archive', Icon: Archive },
];

const menuKnobs: Knob[] = [
    { id: 'search', label: 'Search', switch: true, default: false },
    { id: 'label', label: 'Label', switch: true, default: true },
];

const folders = ['Board packs', 'Quarterly', 'Shared with clients'];

const MenuPreview = ({ knobs }: PreviewProps) => {
    const [last, setLast] = useState<string>();
    const [query, setQuery] = useState('');
    const stage = useStageContainer();
    // A tile is a still, held open; on the page it opens held open too, but closes and reopens.
    const tile = Boolean(stage?.inert);
    const [open, setOpen] = useState(true);
    const search = Boolean(knobs.search);
    const matches = (label: string) =>
        !search || label.toLowerCase().includes(query.trim().toLowerCase());
    // Without a search the menu keeps to its first few actions, as a short menu would.
    const shown = (search ? actions : actions.slice(0, 2)).filter(action => matches(action.label));
    const showMove = matches('Move to');
    const showDelete = matches('Delete');

    return (
        // Room below the trigger for the open menu, so the pair sits centred on the stage.
        <div
            className={cn(
                'flex flex-col items-center gap-3',
                stage && (search ? 'pb-80' : 'pb-52'),
            )}
        >
            {/* Above the trigger, where the open menu never covers it. */}
            {!tile && (
                <span aria-live="polite" className="text-neutral-600 text-xxs">
                    {last ?? 'Pick an action'}
                </span>
            )}
            <DropdownMenu
                modal={stage ? false : undefined}
                onOpenChange={next => {
                    setOpen(next);
                    if (!next) setQuery('');
                }}
                open={tile ? true : stage ? open : undefined}
            >
                <DropdownMenuTrigger render={<Button variant="secondary" />}>
                    Actions <Ellipsis {...previewIcon} />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" container={stage}>
                    {search && (
                        <DropdownMenuSearch
                            aria-label="Search actions"
                            onValueChange={setQuery}
                            placeholder="Search actions"
                            value={query}
                        />
                    )}
                    {knobs.label && <DropdownMenuLabel>Northwind Q3 review</DropdownMenuLabel>}
                    {shown.map(({ label, Icon, shortcut }) => (
                        <DropdownMenuItem key={label} onClick={() => setLast(label)}>
                            <Icon {...previewIcon} /> {label}
                            {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
                        </DropdownMenuItem>
                    ))}
                    {showMove && (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger icon={<FolderInput {...previewIcon} />}>
                                Move to
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-52" container={stage}>
                                {folders.map(folder => (
                                    <DropdownMenuItem
                                        key={folder}
                                        onClick={() => setLast(`Moved to ${folder}`)}
                                    >
                                        <Folder {...previewIcon} /> {folder}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    )}
                    {showDelete && (
                        <>
                            {(shown.length > 0 || showMove) && <DropdownMenuSeparator />}
                            <DropdownMenuItem onClick={() => setLast('Deleted')} variant="danger">
                                <Trash2 {...previewIcon} /> Delete
                            </DropdownMenuItem>
                        </>
                    )}
                    {shown.length === 0 && !showMove && !showDelete && (
                        <DropdownMenuEmpty>No action matches “{query}”</DropdownMenuEmpty>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export const entry: Entry = {
    id: 'menu',
    name: 'Dropdown menu',
    category: 'actions',
    description: 'Row actions with shortcuts, submenus and a danger item; a search for a long one.',
    hero: 'min-h-90',
    knobs: menuKnobs,
    Preview: MenuPreview,
};

const reports = [
    {
        name: 'Northwind Q3 review',
        owner: 'Maya Chen',
        initials: 'MC',
        schedule: 'Quarterly',
        run: 'Today, 09:12',
    },
    {
        name: 'Revenue by plan',
        owner: 'Liam Ortiz',
        initials: 'LO',
        schedule: 'Every Monday',
        run: 'Yesterday',
    },
    {
        name: 'Churn and renewals',
        owner: 'Sara Kim',
        initials: 'SK',
        schedule: 'Monthly',
        run: '1 October',
    },
    {
        name: 'Board pack · October',
        owner: 'Maya Chen',
        initials: 'MC',
        schedule: 'Once',
        run: '28 September',
    },
    {
        name: 'Invoice ageing',
        owner: 'Noah Patel',
        initials: 'NP',
        schedule: 'Every Friday',
        run: '27 September',
    },
];

const ReportRows = () => {
    const stage = useStageContainer();

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Last run</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reports.map((report, i) => (
                    <TableRow key={report.name}>
                        <TableCell>
                            <span className="flex items-center gap-2.5 font-medium text-neutral-950">
                                <FileText {...icon} className="size-4 text-neutral-600" />
                                {report.name}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className="flex items-center gap-2 text-neutral-900">
                                <Avatar fallback={report.initials} size={24} />
                                {report.owner}
                            </span>
                        </TableCell>
                        <TableCell className="text-neutral-600">{report.schedule}</TableCell>
                        <TableCell className="text-neutral-600">{report.run}</TableCell>
                        <TableCell className="w-12 py-0 text-right">
                            <DropdownMenu modal={false} open={i === 0 ? true : undefined}>
                                <DropdownMenuTrigger
                                    render={
                                        <Button
                                            aria-label={`Actions for ${report.name}`}
                                            size="icon-sm"
                                            variant="ghost"
                                        />
                                    }
                                >
                                    <EllipsisVertical {...icon} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52" container={stage}>
                                    <DropdownMenuLabel>{report.name}</DropdownMenuLabel>
                                    <DropdownMenuItem>
                                        <Pencil {...icon} /> Rename
                                        <DropdownMenuShortcut>R</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Copy {...icon} /> Duplicate
                                        <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Share2 {...icon} /> Share
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Download {...icon} /> Download PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="danger">
                                        <Trash2 {...icon} /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const ReportActions = () => (
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
            children: <ReportRows />,
        }}
    />
);

export const inUse: InUse = {
    title: 'Report actions',
    note: 'A report’s actions, opened from the ellipsis at the end of its row.',
    bare: true,
    render: () => <ReportActions />,
};
