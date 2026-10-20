import {
    Bell,
    ChartColumn,
    Folder,
    ListFilter,
    ListTree,
    Megaphone,
    NotebookPen,
    Plus,
    Rocket,
    Settings,
    Star,
    Timer,
    ToggleLeft,
    Users,
    UsersRound,
    Workflow,
    Zap,
} from 'lucide-react';
import {
    AppPanel,
    AppShell,
    Avatar,
    BottomBar,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Dock,
    DockAction,
    type DockActionProps,
    DockItem,
    HeaderBar,
    NavGroup,
    NavItem,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
} from 'personal-design-system';
import { type ReactNode, useState } from 'react';
import { ComponentSet, Specimen, Variant } from '../layout';

const icon = { strokeWidth: 1.5 } as const;

const mainNav = [
    { id: 'sequences', label: 'All sequences', icon: <ListTree {...icon} /> },
    { id: 'active', label: 'Active campaigns', icon: <Timer {...icon} /> },
    { id: 'drafts', label: 'Drafts', icon: <NotebookPen {...icon} /> },
    { id: 'templates', label: 'Templates', icon: <Star {...icon} /> },
];

const projectPages = [
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone {...icon} /> },
    { id: 'automations', label: 'Automations', icon: <Workflow {...icon} /> },
    { id: 'analytics', label: 'Analytics', icon: <ChartColumn {...icon} /> },
    { id: 'permissions', label: 'Permissions', icon: <UsersRound {...icon} /> },
];

const projects = [
    { id: 'q1', label: 'Q1 growth campaign', emoji: '🚀' },
    { id: 'mobile', label: 'Mobile app launch', emoji: '📱' },
    { id: 'retention', label: 'Customer retention plan', emoji: '👥' },
    { id: 'refresh', label: 'Brand refresh', emoji: '🌿' },
];

const labels: Record<string, string> = Object.fromEntries(
    [...mainNav, ...projectPages].map(item => [item.id, item.label]),
);

const Logo = () => (
    <SidebarLogo>
        <Zap className="size-4" {...icon} />
    </SidebarLogo>
);

const Account = () => (
    <>
        <SidebarAccount
            avatar={<Avatar fallback="N" size={36} />}
            name="Northwind Studio"
            plan="Startup plan"
        />
        <Button aria-label="Notifications" size="icon" variant="ghost">
            <Bell className="size-[18px]" {...icon} />
        </Button>
    </>
);

/** The email sequencing sidebar, every part in place. */
const EmailSidebar = ({
    active,
    onSelect,
    className,
}: {
    active: string;
    onSelect: (id: string) => void;
    className?: string;
}) => (
    <Sidebar className={className}>
        <SidebarHeader>
            <Logo />
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Sequences" divided>
            <NavItem icon={<Plus {...icon} />} variant="primary">
                New sequence
            </NavItem>
            {mainNav.map(item => (
                <NavItem
                    active={item.id === active}
                    icon={item.icon}
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                >
                    {item.label}
                </NavItem>
            ))}
        </SidebarGroup>
        <SidebarGroup aria-label="Projects" className="min-h-0 overflow-y-auto" label="Projects">
            {projects.map((project, i) => (
                <NavGroup
                    defaultOpen={i === 0}
                    icon={project.emoji}
                    key={project.id}
                    label={project.label}
                >
                    {i === 0 &&
                        projectPages.map(page => (
                            <NavItem
                                active={page.id === active}
                                icon={page.icon}
                                key={page.id}
                                onClick={() => onSelect(page.id)}
                                variant="inset"
                            >
                                {page.label}
                            </NavItem>
                        ))}
                </NavGroup>
            ))}
            <NavItem icon={<Folder {...icon} />}>All projects</NavItem>
        </SidebarGroup>
        <SidebarFooter>
            <Account />
        </SidebarFooter>
    </Sidebar>
);

export const SidebarSection = () => {
    const [active, setActive] = useState('sequences');
    const [part, setPart] = useState('active');
    const [section, setSection] = useState('audience');

    return (
        <>
            <Specimen
                note="The sidebar sits on the canvas, the page on an inset panel"
                stageClassName="block p-0"
                title="App shell, sidebar and header bar"
            >
                <AppShell className="h-[720px] min-h-0 overflow-hidden">
                    <EmailSidebar active={active} className="hidden sm:flex" onSelect={setActive} />
                    <AppPanel className="max-sm:ml-2 sm:ml-0">
                        <HeaderBar>
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="#">
                                            <BreadcrumbHome />
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href="#">Email campaigns</BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{labels[active]}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </HeaderBar>
                        <div className="flex flex-1 items-center justify-center p-6 text-neutral-500 text-xs">
                            {labels[active]} goes here
                        </div>
                        <BottomBar floating>
                            <SectionDock onValueChange={setSection} value={section} />
                            <DockAction>
                                Start campaign
                                <Rocket {...icon} />
                            </DockAction>
                        </BottomBar>
                    </AppPanel>
                </AppShell>
            </Specimen>

            <Specimen
                note="Each part on its own, named as exported"
                stageClassName="items-start"
                title="Sidebar parts"
            >
                <ComponentSet className="w-64 bg-neutral-100">
                    <Variant className="w-full" label="SidebarHeader · SidebarLogo + SidebarToggle">
                        <SidebarHeader className="w-full pr-2">
                            <Logo />
                            <SidebarToggle />
                        </SidebarHeader>
                    </Variant>
                    <Variant
                        className="w-full"
                        label='SidebarGroup divided · NavItem variant="primary", default, active'
                    >
                        <SidebarGroup aria-label="Sequences" className="w-full" divided>
                            <NavItem icon={<Plus {...icon} />} variant="primary">
                                New sequence
                            </NavItem>
                            {mainNav.slice(0, 2).map(item => (
                                <NavItem
                                    active={item.id === part}
                                    icon={item.icon}
                                    key={item.id}
                                    onClick={() => setPart(item.id)}
                                >
                                    {item.label}
                                </NavItem>
                            ))}
                        </SidebarGroup>
                    </Variant>
                </ComponentSet>
                <ComponentSet className="w-64 bg-neutral-100">
                    <Variant
                        className="w-full"
                        label='SidebarGroup label="Projects" · NavGroup open with NavItem variant="inset"'
                    >
                        <SidebarGroup aria-label="Projects" className="w-full" label="Projects">
                            <NavGroup defaultOpen icon="🚀" label="Q1 growth campaign">
                                {projectPages.slice(0, 2).map(page => (
                                    <NavItem icon={page.icon} key={page.id} variant="inset">
                                        {page.label}
                                    </NavItem>
                                ))}
                            </NavGroup>
                        </SidebarGroup>
                    </Variant>
                    <Variant className="w-full" label="NavGroup closed (chevron on hover)">
                        <div className="flex w-full flex-col pr-3 pl-2">
                            <NavGroup icon="📱" label="Mobile app launch" />
                        </div>
                    </Variant>
                    <Variant className="w-full" label="NavItem closing the group">
                        <div className="flex w-full flex-col pr-3 pl-2">
                            <NavItem icon={<Folder {...icon} />}>All projects</NavItem>
                        </div>
                    </Variant>
                </ComponentSet>
                <ComponentSet className="w-64 bg-neutral-100">
                    <Variant
                        className="w-full"
                        label="SidebarFooter · SidebarAccount + ghost icon Button"
                    >
                        <SidebarFooter className="w-full">
                            <Account />
                        </SidebarFooter>
                    </Variant>
                </ComponentSet>
            </Specimen>
        </>
    );
};

const SectionDock = ({
    shape,
    value,
    defaultValue,
    onValueChange,
}: {
    shape?: DockActionProps['shape'];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}) => (
    <Dock
        aria-label="Campaign"
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        shape={shape}
        value={value}
    >
        <DockItem value="eligibility">
            <ToggleLeft {...icon} />
            Eligibility
        </DockItem>
        <DockItem value="audience">
            <Users {...icon} />
            Audience
        </DockItem>
        <DockItem value="settings">
            <Settings {...icon} />
            Settings
        </DockItem>
    </Dock>
);

const actions: {
    id: string;
    label: string;
    render: (shape?: DockActionProps['shape']) => ReactNode;
}[] = [
    {
        id: 'labelled',
        label: 'labelled action',
        render: shape => (
            <DockAction shape={shape}>
                Start campaign
                <Rocket {...icon} />
            </DockAction>
        ),
    },
    {
        id: 'filter',
        label: 'filter with count',
        render: shape => (
            <DockAction aria-label="Filters, 6 applied" shape={shape}>
                <ListFilter {...icon} />
                (6)
            </DockAction>
        ),
    },
    {
        id: 'icon',
        label: 'size="icon"',
        render: shape => (
            <DockAction aria-label="New" shape={shape} size="icon">
                <Plus {...icon} />
            </DockAction>
        ),
    },
];

const shapes = [
    { id: 'theme', label: 'theme default (pill in Eyes, 10px elsewhere)', shape: undefined },
    { id: 'pill', label: 'shape="pill"', shape: 'pill' },
    { id: 'rounded', label: 'shape="rounded"', shape: 'rounded' },
] as const;

export const BottomBarSection = () => (
    <>
        <Specimen
            note="BottomBar holds the Dock and one DockAction"
            stageClassName="flex-col items-center gap-8 bg-neutral-100 py-10"
            title="Actions"
        >
            {actions.map(action => (
                <Variant className="items-center" key={action.id} label={action.label}>
                    <BottomBar>
                        <SectionDock defaultValue="audience" />
                        {action.render()}
                    </BottomBar>
                </Variant>
            ))}
        </Specimen>

        <Specimen
            note="Corners follow the theme unless shape says otherwise"
            stageClassName="block bg-neutral-100 p-0"
            title="Shapes"
        >
            <div className="grid gap-px bg-neutral-200 xl:grid-cols-3">
                {shapes.map(item => (
                    <div
                        className="flex flex-col items-center gap-4 bg-neutral-100 px-4 py-8"
                        key={item.id}
                    >
                        {actions.map(action => (
                            <BottomBar key={action.id}>
                                <SectionDock defaultValue="audience" shape={item.shape} />
                                {action.render(item.shape)}
                            </BottomBar>
                        ))}
                        <span className="text-neutral-500 text-xxs">{item.label}</span>
                    </div>
                ))}
            </div>
        </Specimen>

        <Specimen
            note="floating pins it 24px above the bottom of its positioned parent"
            stageClassName="block p-0"
            title="Floating"
        >
            <div className="relative h-56 bg-neutral-50">
                <div className="flex h-full items-center justify-center pb-16 text-neutral-500 text-xs">
                    Page content
                </div>
                <BottomBar floating>
                    <SectionDock defaultValue="eligibility" />
                    <DockAction aria-label="New" size="icon">
                        <Plus {...icon} />
                    </DockAction>
                </BottomBar>
            </div>
        </Specimen>
    </>
);

export const BreadcrumbSection = () => (
    <Specimen title="Breadcrumb">
        <Variant label="home · links · current page">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#">
                            <BreadcrumbHome />
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#">Invoices</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>INV-2025-0142</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </Variant>
        <Variant label="custom separator">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#">Acme</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Onboarding sequence</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </Variant>
    </Specimen>
);

export const PaginationSection = () => {
    const [page, setPage] = useState(4);
    const [perPage, setPerPage] = useState('10');
    const total = 96;
    const pageCount = Math.ceil(total / Number(perPage));
    const current = Math.min(page, pageCount);
    const from = (current - 1) * Number(perPage) + 1;
    const to = Math.min(total, current * Number(perPage));

    return (
        <Specimen
            note="Same number of slots on every page"
            stageClassName="block"
            title="Pagination"
        >
            <div className="overflow-x-auto">
                <Pagination
                    className="min-w-[640px]"
                    end={
                        <Select
                            onValueChange={value => {
                                setPerPage(value);
                                setPage(1);
                            }}
                            value={perPage}
                        >
                            <SelectTrigger aria-label="Rows per page" size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 per page</SelectItem>
                                <SelectItem value="25">25 per page</SelectItem>
                                <SelectItem value="50">50 per page</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                    onPageChange={setPage}
                    page={current}
                    pageCount={pageCount}
                    // PaginationProps keeps the legacy `results?: number` attribute of <nav>, which
                    // narrows the slot to number; cast until the component omits it.
                    results={`Results: ${from} - ${to} of ${total}` as unknown as number}
                />
            </div>
        </Specimen>
    );
};
