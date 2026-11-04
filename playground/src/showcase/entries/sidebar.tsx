import {
    Avatar,
    Badge,
    Button,
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
} from 'continuum';
import {
    BarChart3,
    Bell,
    FileText,
    Folder,
    House,
    Inbox,
    ListTree,
    Megaphone,
    Plus,
    Star,
    Timer,
    Users,
    Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { type Entry, type InUse, icon, previewIcon } from '../kit';

const navItems = [
    { id: 'sequences', label: 'All sequences', icon: <ListTree {...previewIcon} /> },
    { id: 'active', label: 'Active campaigns', icon: <Timer {...previewIcon} /> },
    { id: 'templates', label: 'Templates', icon: <Star {...previewIcon} /> },
];

const NavPreview = () => {
    const [active, setActive] = useState('sequences');

    return (
        // On a piece of the canvas, as a sidebar sits on it, rather than loose on the surface.
        <div className="flex w-64 flex-col gap-0.5 rounded-item bg-neutral-100 p-2">
            {navItems.map(item => (
                <NavItem
                    active={item.id === active}
                    icon={item.icon}
                    key={item.id}
                    onClick={() => setActive(item.id)}
                >
                    {item.label}
                </NavItem>
            ))}
            <NavGroup defaultOpen icon="🚀" label="Q1 growth campaign">
                {[
                    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone {...previewIcon} /> },
                    {
                        id: 'automations',
                        label: 'Automations',
                        icon: <Workflow {...previewIcon} />,
                    },
                ].map(page => (
                    <NavItem
                        active={page.id === active}
                        icon={page.icon}
                        key={page.id}
                        onClick={() => setActive(page.id)}
                        variant="inset"
                    >
                        {page.label}
                    </NavItem>
                ))}
            </NavGroup>
        </div>
    );
};

export const entry: Entry = {
    id: 'sidebar',
    name: 'Sidebar and nav items',
    category: 'frame',
    description: 'Nav items and projects that fold open to their pages.',
    hero: 'min-h-[420px]',
    Preview: NavPreview,
};

const SidebarNav = () => {
    const [active, setActive] = useState('home');

    return (
        <Sidebar className="h-[500px] w-64">
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
