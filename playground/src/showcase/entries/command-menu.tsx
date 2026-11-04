import {
    Avatar,
    CommandMenu,
    CommandMenuContent,
    CommandMenuEmpty,
    CommandMenuFooter,
    CommandMenuGroup,
    CommandMenuInput,
    CommandMenuItem,
    CommandMenuList,
    Kbd,
} from 'continuum';
import { FileText, Home, Mail, Plus, Settings, Upload, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
    scene,
} from '../kit';

const commandKnobs: Knob[] = [
    {
        id: 'query',
        label: 'Search',
        options: [o('', 'Empty'), o('inv', 'Typed “inv”'), o('zzz', 'Nothing matches')],
        default: '',
    },
    { id: 'hints', label: 'Shortcuts', switch: true, default: true },
    { id: 'footer', label: 'Key hints', switch: true, default: true },
];

const CommandMenuPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();
    const [query, setQuery] = useState('');
    const [ran, setRan] = useState<string>();

    useEffect(() => setQuery(String(knobs.query)), [knobs.query]);

    const run = (name: string) => () => setRan(name);

    return (
        <CommandMenu modal={false} onQueryChange={setQuery} open query={query}>
            <CommandMenuContent
                className="mt-6 w-[min(480px,calc(100%-32px))]"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <CommandMenuInput trailing={<Kbd>Esc</Kbd>} />
                <CommandMenuList>
                    <CommandMenuGroup label="Go to">
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>G O</Kbd>}
                            icon={<Home {...previewIcon} />}
                            onSelect={run('Overview')}
                            value="Overview"
                        />
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>G I</Kbd>}
                            icon={<FileText {...previewIcon} />}
                            keywords={['billing']}
                            onSelect={run('Invoices')}
                            value="Invoices"
                        />
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>G C</Kbd>}
                            icon={<Users {...previewIcon} />}
                            onSelect={run('Customers')}
                            value="Customers"
                        />
                    </CommandMenuGroup>
                    <CommandMenuGroup label="Actions">
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>⌘N</Kbd>}
                            icon={<Plus {...previewIcon} />}
                            onSelect={run('New invoice')}
                            value="New invoice"
                        />
                        <CommandMenuItem
                            icon={<Mail {...previewIcon} />}
                            keywords={['team', 'member']}
                            onSelect={run('Invite teammate')}
                            value="Invite teammate"
                        />
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>⌘,</Kbd>}
                            icon={<Settings {...previewIcon} />}
                            onSelect={run('Settings')}
                            value="Settings"
                        />
                    </CommandMenuGroup>
                    <CommandMenuEmpty />
                </CommandMenuList>
                {knobs.footer && (
                    <CommandMenuFooter>
                        <span className="flex items-center gap-1.5">
                            <Kbd>↑</Kbd>
                            <Kbd>↓</Kbd> to move
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd>↵</Kbd> {ran ? `ran ${ran}` : 'to run'}
                        </span>
                    </CommandMenuFooter>
                )}
            </CommandMenuContent>
        </CommandMenu>
    );
};

export const entry: Entry = {
    id: 'command-menu',
    name: 'Command menu',
    category: 'navigation',
    description: 'Search and run anything from the keyboard, with ⌘K.',
    hero: 'min-h-[460px]',
    stageClassName: 'items-start',
    knobs: commandKnobs,
    Preview: CommandMenuPreview,
};

const recentReports = ['Northwind Q3 review', 'Acme renewal forecast', 'Board pack · October'];

const JumpAnywhere = () => {
    const stage = useStageContainer();
    const [query, setQuery] = useState('');

    return (
        <CommandMenu modal={false} onQueryChange={setQuery} open query={query}>
            <CommandMenuContent
                className="mt-8"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <CommandMenuInput placeholder="Search reports, people and settings" />
                <CommandMenuList>
                    <CommandMenuGroup label="Recent reports">
                        {recentReports.map(report => (
                            <CommandMenuItem
                                hint="Report"
                                icon={<FileText {...icon} />}
                                key={report}
                                value={report}
                            />
                        ))}
                    </CommandMenuGroup>
                    <CommandMenuGroup label="People">
                        <CommandMenuItem
                            hint="Finance"
                            icon={<Avatar className="size-4 text-[8px]" fallback="AV" size={24} />}
                            value="Anna de Vries"
                        />
                        <CommandMenuItem
                            hint="Sales"
                            icon={<Avatar className="size-4 text-[8px]" fallback="BJ" size={24} />}
                            value="Bram Jansen"
                        />
                    </CommandMenuGroup>
                    <CommandMenuGroup label="Actions">
                        <CommandMenuItem
                            hint={<Kbd>⌘N</Kbd>}
                            icon={<Plus {...icon} />}
                            value="New report"
                        />
                        <CommandMenuItem
                            icon={<Upload {...icon} />}
                            keywords={['csv', 'contacts']}
                            value="Import contacts"
                        />
                        <CommandMenuItem
                            hint={<Kbd>⌘,</Kbd>}
                            icon={<Settings {...icon} />}
                            value="Workspace settings"
                        />
                    </CommandMenuGroup>
                    <CommandMenuEmpty />
                </CommandMenuList>
                <CommandMenuFooter>
                    <span className="flex items-center gap-1.5">
                        <Kbd>↑</Kbd>
                        <Kbd>↓</Kbd> to move
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Kbd>↵</Kbd> to open
                    </span>
                    <span className="ml-auto flex items-center gap-1.5">
                        <Kbd>⌘K</Kbd> from anywhere
                    </span>
                </CommandMenuFooter>
            </CommandMenuContent>
        </CommandMenu>
    );
};

export const inUse: InUse = {
    title: 'Jump anywhere',
    note: 'Recent reports, people and actions in one search; type to narrow it.',
    bare: true,
    render: scene(<JumpAnywhere />, 'min-h-[520px] items-start'),
};
