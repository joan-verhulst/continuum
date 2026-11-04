import { cn, Input, Kbd } from 'continuum';
import { FileText, House, Plus, Search, Settings, Share2 } from 'lucide-react';
import { type Entry, type InUse, icon, OpenDialog, scene } from '../kit';

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

const commands = [
    { icon: <House {...icon} />, label: 'Go to home', keys: ['G', 'H'] },
    { icon: <FileText {...icon} />, label: 'Go to reports', keys: ['G', 'R'] },
    { icon: <Plus {...icon} />, label: 'New report', keys: ['C'] },
    { icon: <Share2 {...icon} />, label: 'Share this page', keys: ['⌘', 'S'] },
    { icon: <Settings {...icon} />, label: 'Open settings', keys: ['⌘', ','] },
];

const CommandPalette = () => (
    <OpenDialog title="Go to" width={480}>
        <Input
            aria-label="Search commands"
            leadingIcon={<Search {...icon} />}
            placeholder="Search commands"
            size="sm"
            trailing={<Kbd>⌘K</Kbd>}
        />
        <ul className="-mx-2 flex flex-col">
            {commands.map((command, i) => (
                <li
                    className={cn(
                        'flex h-9 items-center gap-2.5 rounded-item px-2 text-neutral-950 text-xs [&_svg]:size-4 [&_svg]:text-neutral-600',
                        i === 0 && 'bg-neutral-950/5',
                    )}
                    key={command.label}
                >
                    {command.icon}
                    <span className="flex-1">{command.label}</span>
                    <span className="flex gap-1">
                        {command.keys.map(key => (
                            <Kbd key={key}>{key}</Kbd>
                        ))}
                    </span>
                </li>
            ))}
        </ul>
        <p className="flex flex-wrap items-center gap-1.5 text-neutral-500 text-xs">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to move, <Kbd>↵</Kbd> to open, <Kbd>Esc</Kbd> to close
        </p>
    </OpenDialog>
);

export const inUse: InUse = {
    title: 'Command palette',
    note: 'A shortcut beside every command, and the keys to drive the list.',
    bare: true,
    render: scene(<CommandPalette />),
};
