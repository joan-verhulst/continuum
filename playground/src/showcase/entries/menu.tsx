import {
    Button,
    Card,
    CardTitle,
    cn,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuEmpty,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSearch,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
    IconTile,
} from 'continuum';
import {
    Archive,
    Copy,
    Download,
    Ellipsis,
    FileText,
    FolderInput,
    type LucideIcon,
    Pencil,
    Share2,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    type PreviewProps,
    previewIcon,
    scene,
} from '../kit';

type Action = { label: string; Icon: LucideIcon; shortcut?: string; danger?: boolean };

const actions: Action[] = [
    { label: 'Rename', Icon: Pencil, shortcut: 'R' },
    { label: 'Duplicate', Icon: Copy, shortcut: '⌘D' },
    { label: 'Share', Icon: Share2 },
    { label: 'Move to', Icon: FolderInput },
    { label: 'Download', Icon: Download },
    { label: 'Archive', Icon: Archive },
];

const menuKnobs: Knob[] = [
    { id: 'search', label: 'Search', switch: true, default: false },
    { id: 'label', label: 'Label', switch: true, default: true },
];

const MenuPreview = ({ knobs }: PreviewProps) => {
    const [last, setLast] = useState<string>();
    const [query, setQuery] = useState('');
    const stage = useStageContainer();
    const search = Boolean(knobs.search);
    const matches = (label: string) =>
        !search || label.toLowerCase().includes(query.trim().toLowerCase());
    // Without a search the menu keeps to its first few actions, as a short menu would.
    const shown = (search ? actions : actions.slice(0, 2)).filter(action => matches(action.label));
    const showDelete = matches('Delete');

    return (
        // Room below the trigger for the open menu, so the pair sits centred on the stage.
        <div
            className={cn(
                'flex flex-col items-center gap-3',
                stage && (search ? 'pb-80' : 'pb-44'),
            )}
        >
            <DropdownMenu
                modal={stage ? false : undefined}
                onOpenChange={open => open || setQuery('')}
                open={stage ? true : undefined}
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
                    {showDelete && (
                        <>
                            {shown.length > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuItem onClick={() => setLast('Delete')} variant="danger">
                                <Trash2 {...previewIcon} /> Delete
                            </DropdownMenuItem>
                        </>
                    )}
                    {shown.length === 0 && !showDelete && (
                        <DropdownMenuEmpty>No action matches “{query}”</DropdownMenuEmpty>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            {!stage && <span className="text-neutral-500 text-xxs">{last ?? 'Open it'}</span>}
        </div>
    );
};

export const entry: Entry = {
    id: 'menu',
    name: 'Dropdown menu',
    category: 'actions',
    description: 'Row actions with shortcuts, submenus and a danger item; a search for a long one.',
    hero: 'min-h-80',
    knobs: menuKnobs,
    Preview: MenuPreview,
};

const files = [
    { name: 'Q3 review.pdf', meta: '2.4 MB · edited today' },
    { name: 'Funnel export.csv', meta: '120 KB · edited yesterday' },
    { name: 'Board deck.key', meta: '18 MB · edited 3 days ago' },
];

const FileMenu = () => {
    const stage = useStageContainer();

    return (
        <Card className="mb-28 w-full max-w-md gap-2">
            <CardTitle>Files</CardTitle>
            <ul className="flex flex-col divide-y divide-neutral-200">
                {files.map((file, i) => (
                    <li className="flex h-12 items-center gap-3" key={file.name}>
                        <IconTile>
                            <FileText {...icon} />
                        </IconTile>
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium text-neutral-950 text-xs">
                                {file.name}
                            </span>
                            <span className="text-neutral-500 text-xxs">{file.meta}</span>
                        </span>
                        <DropdownMenu modal={false} open={i === 0 ? true : undefined}>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        aria-label={`Actions for ${file.name}`}
                                        size="icon-sm"
                                        variant="ghost"
                                    />
                                }
                            >
                                <Ellipsis {...icon} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52" container={stage}>
                                <DropdownMenuLabel>{file.name}</DropdownMenuLabel>
                                <DropdownMenuItem>
                                    <Pencil {...icon} /> Rename
                                    <DropdownMenuShortcut>R</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Copy {...icon} /> Duplicate
                                    <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Download {...icon} /> Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="danger">
                                    <Trash2 {...icon} /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'File actions',
    note: 'The actions for a row, opened from its ellipsis.',
    bare: true,
    render: scene(<FileMenu />),
};
