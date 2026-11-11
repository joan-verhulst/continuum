import {
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    Button,
    DropdownMenuItem,
    DropdownMenuSeparator,
    HeaderBar,
    NavItem,
    Sidebar,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarSwitcher,
    SidebarSwitcherMark,
    SidebarToggle,
    StatCard,
} from 'continuum';
import { Bell, Boxes, Check, LayoutGrid, LifeBuoy, Plus, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStageContainer } from '../../layout';
import { PageHead, places, Trail } from '../../screens/workspace';
import {
    type Entry,
    type InUse,
    icon,
    type Knob,
    o,
    type PreviewProps,
    previewIcon,
    Scene,
    useHeldOpen,
} from '../kit';

const switcherKnobs: Knob[] = [
    {
        id: 'mark',
        label: 'Mark',
        options: [o('initial', 'Initial'), o('avatar', 'Avatar'), o('empty', 'None picked')],
        default: 'initial',
    },
    { id: 'detail', label: 'Detail line', switch: true, default: true },
    {
        id: 'placement',
        label: 'Place',
        options: [o('top', 'Under the header'), o('footer', 'In the footer')],
        default: 'top',
    },
    { id: 'open', label: 'Open', switch: true, default: true },
];

type Workspace = { id: string; name: string; plan: string; color: string };

const northwind: Workspace = {
    id: 'northwind',
    name: 'Northwind',
    plan: 'Pro plan',
    color: 'var(--color-chart-1)',
};

const workspaces: Workspace[] = [
    northwind,
    { id: 'acme', name: 'Acme Corp', plan: 'Starter plan', color: 'var(--color-chart-2)' },
    { id: 'globex', name: 'Globex', plan: 'Enterprise', color: 'var(--color-chart-3)' },
];

const Mark = ({ workspace, size }: { workspace?: Workspace; size: 20 | 28 }) => (
    <SidebarSwitcherMark color={workspace?.color} size={size}>
        {workspace?.name.slice(0, 1)}
    </SidebarSwitcherMark>
);

/** The menu every switcher here opens: the workspaces, a check on the current, then the rest. */
const WorkspaceItems = ({
    current,
    onPick,
    iconProps,
}: {
    current?: string;
    onPick: (id: string) => void;
    iconProps: { strokeWidth: number };
}) => (
    <>
        {workspaces.map(workspace => (
            <DropdownMenuItem key={workspace.id} onClick={() => onPick(workspace.id)}>
                <Mark size={20} workspace={workspace} />
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {workspace.id === current && (
                    <Check className="size-4 text-neutral-950" {...iconProps} />
                )}
            </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
            <LayoutGrid {...iconProps} /> All workspaces
        </DropdownMenuItem>
        <DropdownMenuItem>
            <Plus {...iconProps} /> New workspace
        </DropdownMenuItem>
    </>
);

const SwitcherPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();
    // A tile is a still, held open; on the page it opens held open too, but closes and reopens.
    const tile = Boolean(stage?.inert);
    const [open, setOpen] = useState(true);
    const [currentId, setCurrentId] = useState<string | undefined>('northwind');
    const empty = knobs.mark === 'empty';
    const current = empty ? undefined : workspaces.find(w => w.id === currentId);
    const footer = knobs.placement === 'footer';
    const held = Boolean(knobs.open);
    // Turning Open back on opens it again, even after it was closed on the page.
    useEffect(() => setOpen(held), [held]);

    const switcher = (
        <SidebarSwitcher
            aria-label={current ? `${current.name}. Switch workspace` : 'Pick a workspace'}
            container={stage}
            detail={knobs.detail ? (current ? current.plan : 'Pick one to work on') : undefined}
            mark={
                knobs.mark === 'avatar' && current ? (
                    <Avatar fallback={current.name.slice(0, 2).toUpperCase()} tone="blue" />
                ) : (
                    <Mark size={28} workspace={current} />
                )
            }
            modal={stage ? false : undefined}
            name={current ? current.name : 'No workspace'}
            onOpenChange={setOpen}
            open={held ? (tile ? true : stage ? open : undefined) : tile ? false : undefined}
            placement={footer ? 'footer' : 'top'}
        >
            <WorkspaceItems
                current={current?.id}
                iconProps={previewIcon}
                onPick={id => setCurrentId(id)}
            />
        </SidebarSwitcher>
    );

    return (
        // On a piece of the canvas, as a sidebar sits on it, rather than loose on the surface.
        <Sidebar className="h-100 rounded-item bg-neutral-100">
            <SidebarHeader>
                <SidebarLogo>
                    <Boxes {...previewIcon} />
                </SidebarLogo>
                <SidebarToggle />
            </SidebarHeader>
            {!footer && switcher}
            <SidebarGroup aria-label="Main">
                {places.slice(0, 3).map((place, i) => (
                    <NavItem active={i === 0} icon={place.icon} key={place.id}>
                        {place.label}
                    </NavItem>
                ))}
            </SidebarGroup>
            {footer && (
                <SidebarFooter>
                    {switcher}
                    <Button aria-label="Notifications" size="icon-sm" variant="ghost">
                        <Bell {...previewIcon} />
                    </Button>
                </SidebarFooter>
            )}
        </Sidebar>
    );
};

export const entry: Entry = {
    id: 'sidebar-switcher',
    name: 'Sidebar switcher',
    category: 'frame',
    description: 'The current workspace at the top of the sidebar, a click from the others.',
    hero: 'min-h-115',
    knobs: switcherKnobs,
    Preview: SwitcherPreview,
};

const SwitchWorkspace = () => {
    const { stage, open, onOpenChange } = useHeldOpen();
    const [currentId, setCurrentId] = useState('northwind');
    const current = workspaces.find(w => w.id === currentId) ?? northwind;

    return (
        <Scene className="p-0">
            <div className="absolute inset-0">
                <AppShell className="h-full min-h-0 w-full">
                    <Sidebar>
                        <SidebarHeader>
                            <SidebarLogo>
                                <Boxes {...icon} />
                            </SidebarLogo>
                            <SidebarToggle />
                        </SidebarHeader>
                        <SidebarSwitcher
                            aria-label={`${current.name}. Switch workspace`}
                            container={stage}
                            detail={current.plan}
                            mark={<Mark size={28} workspace={current} />}
                            modal={false}
                            name={current.name}
                            onOpenChange={onOpenChange}
                            open={open}
                        >
                            <WorkspaceItems
                                current={current.id}
                                iconProps={icon}
                                onPick={setCurrentId}
                            />
                        </SidebarSwitcher>
                        <SidebarGroup aria-label="Main">
                            {places.map((place, i) => (
                                <NavItem
                                    active={i === 0}
                                    icon={place.icon}
                                    key={place.id}
                                    trailing={
                                        place.count ? (
                                            <Badge variant="count">{place.count}</Badge>
                                        ) : undefined
                                    }
                                >
                                    {place.label}
                                </NavItem>
                            ))}
                        </SidebarGroup>
                        <SidebarGroup aria-label="Workspace" label="Workspace">
                            <NavItem icon={<Settings {...icon} />}>Settings</NavItem>
                            <NavItem icon={<LifeBuoy {...icon} />}>Help and support</NavItem>
                        </SidebarGroup>
                    </Sidebar>
                    <AppPanel>
                        <HeaderBar>
                            <Trail trail={['Overview']} />
                        </HeaderBar>
                        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden @max-shell-compact/shell:px-4 px-10 @max-shell-compact/shell:pt-10 pt-10">
                            <PageHead
                                description={`${current.name}, week of 19 October.`}
                                title="Overview"
                            />
                            <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
                                <StatCard delta="+12.4%" label="Revenue" value="€48,210" />
                                <StatCard delta="+3" label="New customers" value="27" />
                                <StatCard delta="−1.2%" label="Churn" trend="down" value="2.4%" />
                            </div>
                        </div>
                    </AppPanel>
                </AppShell>
            </div>
        </Scene>
    );
};

export const inUse: InUse = {
    title: 'Switch workspace',
    note: 'The workspace under the logo, its menu open on the others, then all of them and a new one.',
    bare: true,
    render: () => <SwitchWorkspace />,
};
