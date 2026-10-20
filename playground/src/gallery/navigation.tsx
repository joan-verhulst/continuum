import {
    BarChart3,
    Bell,
    CreditCard,
    FileText,
    Inbox,
    LayoutDashboard,
    Plus,
    Search,
    Settings,
    Share2,
    Users,
} from 'lucide-react';
import {
    AppPanel,
    AppShell,
    Avatar,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    HeaderBar,
    Input,
    Kbd,
    NavItem,
    NavSection,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sidebar,
    SidebarFooter,
    SidebarHeader,
    SidebarNav,
    WorkspaceSwitcher,
} from 'personal-design-system';
import { useState } from 'react';
import { Specimen, Variant } from '../layout';

const icon = { strokeWidth: 1.5 } as const;

const mainNav = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard {...icon} />, kbd: '1' },
    { id: 'reports', label: 'Reports', icon: <FileText {...icon} />, count: 12 },
    { id: 'inbox', label: 'Inbox', icon: <Inbox {...icon} />, count: 3 },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 {...icon} />, kbd: '4' },
];

const settingsNav = [
    { id: 'team', label: 'Team', icon: <Users {...icon} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard {...icon} /> },
    { id: 'general', label: 'General', icon: <Settings {...icon} /> },
];

const labels: Record<string, string> = Object.fromEntries(
    [...mainNav, ...settingsNav].map(item => [item.id, item.label]),
);

export const SidebarSection = () => {
    const [active, setActive] = useState('reports');

    return (
        <Specimen
            note="The sidebar sits on the canvas, the page on an inset panel"
            stageClassName="block p-0"
            title="App shell, sidebar and header bar"
        >
            <AppShell className="h-[520px] min-h-0 overflow-hidden">
                <Sidebar className="hidden w-60 sm:flex">
                    <SidebarHeader>
                        <WorkspaceSwitcher
                            avatar={<Avatar fallback="N" />}
                            name="Northwind"
                            plan="Team plan"
                        />
                        <Input
                            leadingIcon={<Search {...icon} />}
                            placeholder="Search"
                            size="sm"
                            trailing={<Kbd>/</Kbd>}
                        />
                    </SidebarHeader>
                    <SidebarNav aria-label="Workspace">
                        {mainNav.map(item => (
                            <NavItem
                                active={item.id === active}
                                icon={item.icon}
                                key={item.id}
                                onClick={() => setActive(item.id)}
                                trailing={
                                    item.count !== undefined ? (
                                        <Badge variant="count">{item.count}</Badge>
                                    ) : (
                                        <Kbd>{item.kbd}</Kbd>
                                    )
                                }
                            >
                                {item.label}
                            </NavItem>
                        ))}
                    </SidebarNav>
                    <NavSection title="Settings">
                        {settingsNav.map(item => (
                            <NavItem
                                active={item.id === active}
                                icon={item.icon}
                                key={item.id}
                                onClick={() => setActive(item.id)}
                            >
                                {item.label}
                            </NavItem>
                        ))}
                    </NavSection>
                    <SidebarFooter>
                        <NavItem icon={<Bell {...icon} />}>Notifications</NavItem>
                    </SidebarFooter>
                </Sidebar>
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
                                    <BreadcrumbPage>{labels[active]}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary">
                                <Share2 {...icon} /> Share
                            </Button>
                            <Button>
                                <Plus {...icon} /> New
                            </Button>
                        </div>
                    </HeaderBar>
                    <div className="flex flex-1 items-center justify-center p-6 text-neutral-500 text-xs">
                        {labels[active]} goes here
                    </div>
                </AppPanel>
            </AppShell>
        </Specimen>
    );
};

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
