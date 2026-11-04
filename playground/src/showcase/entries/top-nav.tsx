import {
    AppPanel,
    AppShell,
    Avatar,
    Button,
    ContinuumMark,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Skeleton,
    TopNav,
    TopNavActions,
    TopNavBrand,
    TopNavLink,
    TopNavLinks,
} from 'continuum';
import { Bell, Inbox, Search, Users, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useStageContainer } from '../../layout';
import { type Entry, type Knob, type PreviewProps, previewIcon } from '../kit';

const topNavKnobs: Knob[] = [
    { id: 'name', label: 'Product name', switch: true, default: true },
    { id: 'icons', label: 'Icons', switch: true, default: false },
    { id: 'actions', label: 'Search, bell and account', switch: true, default: true },
];

const topNavSections = [
    { id: 'connections', label: 'Connections', icon: <Workflow {...previewIcon} /> },
    { id: 'browse', label: 'Browse', icon: <Search {...previewIcon} /> },
    { id: 'users', label: 'Users', icon: <Users {...previewIcon} /> },
    { id: 'tickets', label: 'Tickets', icon: <Inbox {...previewIcon} /> },
];

const TopNavPreview = ({ knobs }: PreviewProps) => {
    const [section, setSection] = useState('connections');
    const stage = useStageContainer();
    const current = topNavSections.find(item => item.id === section);

    return (
        // A whole app, small: the bar on the canvas, the page on its panel under it.
        <AppShell
            className="h-[340px] max-h-full min-h-0 w-[680px] overflow-hidden rounded-panel border border-neutral-200"
            nav="top"
        >
            <TopNav>
                <TopNavBrand
                    href="#"
                    logo={<ContinuumMark size={22} />}
                    onClick={event => event.preventDefault()}
                >
                    {knobs.name ? 'Northwind' : undefined}
                </TopNavBrand>
                <TopNavLinks aria-label="Sections">
                    {topNavSections.map(item => (
                        <TopNavLink
                            active={item.id === section}
                            icon={knobs.icons ? item.icon : undefined}
                            key={item.id}
                            onClick={() => setSection(item.id)}
                        >
                            {item.label}
                        </TopNavLink>
                    ))}
                </TopNavLinks>
                {knobs.actions && (
                    <TopNavActions>
                        <Button aria-label="Search" size="icon" variant="ghost">
                            <Search {...previewIcon} />
                        </Button>
                        <Button aria-label="Notifications" size="icon" variant="ghost">
                            <Bell {...previewIcon} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                aria-label="Account"
                                className="cursor-pointer rounded-chip outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                            >
                                <Avatar fallback="JV" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48" container={stage}>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuItem>Billing</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Sign out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TopNavActions>
                )}
            </TopNav>
            <AppPanel className="gap-4 p-6">
                <h3 className="font-medium text-lg text-neutral-950">{current?.label}</h3>
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/5" />
            </AppPanel>
        </AppShell>
    );
};

export const entry: Entry = {
    id: 'top-nav',
    name: 'Top navigation',
    category: 'frame',
    description: 'The sidebar on its side: the brand, a handful of sections, the account.',
    // Wide enough for every section, so it starts past the properties panel rather than under it.
    hero: '[&>div:last-child]:pl-[280px]',
    span: 2,
    knobs: topNavKnobs,
    Preview: TopNavPreview,
};
