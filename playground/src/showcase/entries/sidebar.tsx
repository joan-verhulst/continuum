import {
    Avatar,
    Badge,
    Button,
    createThemeVariables,
    Kbd,
    NavGroup,
    NavItem,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    type ThemeOptions,
    useTheme,
} from 'continuum';
import {
    BarChart3,
    Bell,
    FileText,
    Folder,
    House,
    Inbox,
    Megaphone,
    Plus,
    Star,
    Timer,
    Users,
    Workflow,
} from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { type Entry, type InUse, icon, type Knob, o, type PreviewProps, previewIcon } from '../kit';

type Page = { id: string; label: string; icon?: ReactNode; pages?: Page[] };

const pageIcons = [FileText, Users, Megaphone, Workflow, Star, Timer, Folder, Inbox];

/**
 * A tree of sections to try the foldout on: `lots` gives each section more pages and more sections
 * beside it, `depth` how many foldouts sit inside each other.
 */
const tree = (lots: boolean, depth: number, withIcons: boolean): Page[] => {
    const names = [
        [
            'Q1 growth campaign',
            'Retention push',
            'Partner launch',
            'Spring sale',
            'Onboarding revamp',
        ],
        ['Campaigns', 'Automations', 'Templates', 'Audiences', 'Reports', 'Settings'],
        ['Drafts', 'Scheduled', 'Sent', 'Archived'],
        ['This week', 'Last week', 'Earlier'],
    ];
    const build = (level: number, prefix: string): Page[] => {
        const list = names[Math.min(level, names.length - 1)] ?? [];
        const count = level === 0 ? (lots ? 5 : 2) : lots ? list.length : 2;
        return list.slice(0, count).map((label, i) => {
            const id = `${prefix}${i}`;
            const Icon = pageIcons[(level + i) % pageIcons.length] ?? FileText;
            // Every second row at a level opens to the next, while there are levels left.
            const opens = level < depth - 1 && (level === 0 || i % 2 === 0);
            return {
                id,
                label,
                icon: level === 0 || withIcons ? <Icon {...previewIcon} /> : undefined,
                pages: opens ? build(level + 1, `${id}-`) : undefined,
            };
        });
    };
    return build(0, 's');
};

/** The id of the first page at a depth, following the first foldout at each level. */
const firstAt = (pages: Page[], depth: number): string | undefined => {
    let level = pages;
    for (let i = 0; i < depth; i++) {
        const open = level.find(page => page.pages);
        if (!open?.pages) return level[0]?.id;
        level = open.pages;
    }
    return level.find(page => !page.pages)?.id ?? level[0]?.id;
};

const NavTree = ({
    pages,
    active,
    onPick,
    level,
}: {
    pages: Page[];
    active: string;
    onPick: (id: string) => void;
    level: number;
}) =>
    pages.map(page =>
        page.pages ? (
            // All open to start, so every level is in view; close one to see a closed section that holds the page.
            <NavGroup defaultOpen icon={page.icon} key={page.id} label={page.label}>
                <NavTree active={active} level={level + 1} onPick={onPick} pages={page.pages} />
            </NavGroup>
        ) : (
            <NavItem
                active={page.id === active}
                icon={page.icon}
                key={page.id}
                onClick={() => onPick(page.id)}
                variant={level === 0 ? 'default' : 'inset'}
            >
                {page.label}
            </NavItem>
        ),
    );

const navKnobs: Knob[] = [
    {
        id: 'look',
        label: 'Look',
        options: [o('quiet', 'Quiet'), o('tinted', 'Tinted'), o('raised', 'Raised')],
        default: 'quiet',
    },
    { id: 'data', label: 'Data', options: [o('few', 'A few'), o('lots', 'Lots')], default: 'lots' },
    {
        id: 'depth',
        label: 'Foldouts',
        options: [o('1', 'None'), o('2', 'One deep'), o('3', 'Two deep'), o('4', 'Three deep')],
        default: '3',
    },
    {
        id: 'at',
        label: 'Active page',
        options: [o('0', 'Top level'), o('1', 'In a foldout'), o('3', 'Deepest')],
        default: '1',
    },
    { id: 'icons', label: 'Icons on pages', switch: true, default: false },
];

const NavPreview = ({ knobs }: PreviewProps) => {
    const { mode } = useTheme();
    const lots = knobs.data === 'lots';
    const depth = Number(knobs.depth);
    const pages = useMemo(
        () => tree(lots, depth, Boolean(knobs.icons)),
        [lots, depth, knobs.icons],
    );
    const top = [
        { id: 'home', label: 'Home', icon: <House {...previewIcon} /> },
        { id: 'inbox', label: 'Inbox', icon: <Inbox {...previewIcon} /> },
    ];
    const start = Number(knobs.at) === 0 ? 'home' : (firstAt(pages, Number(knobs.at)) ?? 'home');
    const [active, setActive] = useState(start);
    // A change of knob puts the active page where the knob says.
    useEffect(() => setActive(start), [start]);

    // The look as a theme writes it: only its sidebar tokens, on this piece of the canvas.
    const look = String(knobs.look) as NonNullable<ThemeOptions['nav']>;
    const style = useMemo(() => {
        const { light, dark } = createThemeVariables({ nav: look });
        return (mode === 'dark' ? { ...light, ...dark } : light) as CSSProperties;
    }, [look, mode]);

    return (
        // On a piece of the canvas, as a sidebar sits on it, rather than loose on the surface.
        <div
            className="flex max-h-140 w-sidebar flex-col gap-0.5 overflow-y-auto rounded-item bg-neutral-100 p-2"
            style={style}
        >
            {top.map(item => (
                <NavItem
                    active={item.id === active}
                    icon={item.icon}
                    key={item.id}
                    onClick={() => setActive(item.id)}
                >
                    {item.label}
                </NavItem>
            ))}
            <NavTree active={active} level={0} onPick={setActive} pages={pages} />
        </div>
    );
};

export const entry: Entry = {
    id: 'sidebar',
    // Named for what the preview draws; the whole sidebar is the piece under In use.
    name: 'Nav items and groups',
    category: 'frame',
    description: 'The sidebar’s rows: its places, and sections that fold open to their pages.',
    hero: 'min-h-145',
    knobs: navKnobs,
    Preview: NavPreview,
};

const SidebarNav = () => {
    const [active, setActive] = useState('home');

    return (
        <Sidebar className="h-125 w-sidebar">
            <SidebarHeader>
                <SidebarLogo>
                    <BarChart3 {...icon} />
                </SidebarLogo>
                <SidebarToggle />
            </SidebarHeader>
            <SidebarGroup aria-label="Main">
                <NavItem icon={<Plus {...icon} />} variant="primary">
                    New report
                </NavItem>
                <NavItem
                    active={active === 'home'}
                    icon={<House {...icon} />}
                    onClick={() => setActive('home')}
                    trailing={<Kbd>H</Kbd>}
                >
                    Home
                </NavItem>
                <NavItem
                    active={active === 'inbox'}
                    icon={<Inbox {...icon} />}
                    onClick={() => setActive('inbox')}
                    trailing={
                        <Badge tone="primary" variant="count">
                            12
                        </Badge>
                    }
                >
                    Needs action
                </NavItem>
                <NavItem
                    active={active === 'reports'}
                    icon={<FileText {...icon} />}
                    onClick={() => setActive('reports')}
                >
                    Reports
                </NavItem>
            </SidebarGroup>
            <SidebarGroup aria-label="Projects" label="Projects">
                <NavGroup defaultOpen icon="🏭" label="Riverside warehouse">
                    <NavItem icon={<FileText {...icon} />} variant="inset">
                        Reports
                    </NavItem>
                    <NavItem icon={<Users {...icon} />} variant="inset">
                        Users
                    </NavItem>
                </NavGroup>
                <NavGroup icon="🚚" label="Fleet depot" />
                <NavItem icon={<Folder {...icon} />}>All projects</NavItem>
            </SidebarGroup>
            <SidebarFooter>
                <SidebarAccount
                    avatar={<Avatar fallback="JC" />}
                    name="Jane Cooper"
                    plan="Business"
                />
                <Button aria-label="Notifications" size="icon-sm" variant="ghost">
                    <Bell {...icon} />
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
};

export const inUse: InUse = {
    title: 'Sidebar',
    note: 'The call to action, rows with a shortcut and a count, projects that fold open, the account.',
    canvas: true,
    render: () => <SidebarNav />,
};
