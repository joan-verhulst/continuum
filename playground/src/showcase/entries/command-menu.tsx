import {
    Avatar,
    BarList,
    BarListItem,
    Card,
    CommandMenu,
    CommandMenuContent,
    CommandMenuEmpty,
    CommandMenuFooter,
    CommandMenuGroup,
    CommandMenuInput,
    CommandMenuItem,
    CommandMenuList,
    Kbd,
    StatCard,
} from 'continuum';
import { FileText, Home, Mail, Plus, Settings, Upload, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStageContainer } from '../../layout';
import {
    AppScene,
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
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
    const [query, setQuery] = useState(String(knobs.query));
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
    hero: 'min-h-115',
    stageClassName: 'items-start',
    knobs: commandKnobs,
    Preview: CommandMenuPreview,
};

const recentReports = ['Northwind Q3 review', 'Revenue by plan'];

const JumpAnywhere = () => {
    const stage = useStageContainer();
    const [query, setQuery] = useState('');

    return (
        <CommandMenu modal={false} onQueryChange={setQuery} open query={query}>
            <CommandMenuContent
                className="mt-10"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <CommandMenuInput placeholder="Search customers, reports and actions" />
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
                    <CommandMenuGroup label="Customers">
                        <CommandMenuItem
                            hint="Enterprise"
                            icon={<Avatar className="size-4 text-[8px]" fallback="NT" size={24} />}
                            value="Northwind Traders"
                        />
                        <CommandMenuItem
                            hint="Pro"
                            icon={<Avatar className="size-4 text-[8px]" fallback="GX" size={24} />}
                            value="Globex"
                        />
                    </CommandMenuGroup>
                    <CommandMenuGroup label="Actions">
                        <CommandMenuItem
                            hint={<Kbd>⌘N</Kbd>}
                            icon={<Plus {...icon} />}
                            value="New invoice"
                        />
                        <CommandMenuItem
                            icon={<Upload {...icon} />}
                            keywords={['csv', 'contacts']}
                            value="Import customers"
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

// The overview the menu was opened from.
const OverviewBehind = () => (
    <>
        <div className="grid @max-shell-compact/shell:grid-cols-2 grid-cols-4 gap-4">
            <StatCard delta="+6.2%" label="Revenue" value="€184,200" />
            <StatCard delta="+12" label="New customers" value="48" />
            <StatCard delta="−0.4%" label="Churn" trend="down" value="1.8%" />
            <StatCard delta="+3.1%" label="Invoices paid" value="92%" />
        </div>
        <Card>
            <BarList title="Revenue by plan" valueLabel="This month">
                <BarListItem value={96400}>Enterprise</BarListItem>
                <BarListItem value={61800}>Pro</BarListItem>
                <BarListItem value={26000}>Starter</BarListItem>
            </BarList>
        </Card>
    </>
);

const SearchFromOverview = () => (
    <AppScene
        page={{
            nav: 'rail',
            place: 'overview',
            title: 'Overview',
            description: 'October, against September.',
            children: <OverviewBehind />,
        }}
    >
        <JumpAnywhere />
    </AppScene>
);

export const inUse: InUse = {
    title: 'Jump anywhere',
    note: 'Opened with ⌘K over the overview: reports, customers and actions in one search.',
    bare: true,
    render: () => <SearchFromOverview />,
};
