import {
    ArrowRight,
    BellRing,
    CircleAlert,
    CircleCheck,
    CircleHelp,
    EllipsisVertical,
    FilePen,
    FileText,
    Folder,
    History,
    House,
    MessageCircleQuestion,
    PanelLeftClose,
    Plus,
    Search,
    Sparkles,
    SquarePen,
    Users,
    Wand,
} from 'lucide-react';
import {
    AppPanel,
    AppShell,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    cn,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    HeaderBar,
    Kbd,
    NavGroup,
    NavItem,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sidebar,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Toolbar,
    ToolbarButton,
    ToolbarChip,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from 'continuum';
import { type ReactNode, useId, useState } from 'react';
import { AccountFooter, WorkspaceMark } from './shared';

const topics = [
    'Occupational health policy',
    'Health and safety service',
    'Works council and staff',
    'Performance cycle',
    'Information and instruction',
    'Language barriers',
    'Safety culture and behaviour',
    'Supervision at the workplace',
    'Smoking, alcohol and drugs',
    'Special categories of workers',
    'Clients, designers and contractors',
    'Hazardous substances',
    'Biological agents',
    'Physical strain',
    'Lighting, layout and climate',
    'Noise',
    'Radiation',
    'Working under overpressure',
    'Vibration',
    'Working with machinery',
    'Pressure vessels',
    'Working and rest hours',
    'Company vehicles',
    'Psychosocial workload',
];

const assessments = [
    {
        id: 'likelihood',
        label: 'Likelihood',
        text: 'The chance of an adverse effect from an unclear or ineffective health policy is very small, namely 0.5. The policy is clearly aimed at safety and wellbeing at work and is communicated well across the organisation.',
    },
    {
        id: 'exposure',
        label: 'Exposure frequency',
        text: 'Staff are exposed to the consequences of an unclear policy only rarely, namely 0.5.',
    },
    {
        id: 'effect',
        label: 'Effect',
        text: 'The effect of an undocumented or non-operational policy is a nuisance and undesirable, so 1.',
    },
];

const scores = [
    ['R', '0.3'],
    ['W', '0.5'],
    ['B', '0.5'],
    ['E', '1'],
];

const projects = [
    { id: 'depot', icon: '🚚', label: 'Fleet depot' },
    { id: 'lab', icon: '🧪', label: 'Research lab' },
    { id: 'office', icon: '🏢', label: 'Head office' },
];

const ReportSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Sparkles strokeWidth={2} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Reports" divided>
            <NavItem icon={<Plus strokeWidth={1.5} />} variant="primary">
                New report
            </NavItem>
            <NavItem icon={<House strokeWidth={1.5} />} trailing={<Kbd>H</Kbd>}>
                Home
            </NavItem>
            <NavItem icon={<BellRing strokeWidth={1.5} />}>Needs action</NavItem>
            <NavItem active icon={<FileText strokeWidth={1.5} />}>
                Reports
            </NavItem>
            <NavItem icon={<FilePen strokeWidth={1.5} />}>Open reports</NavItem>
        </SidebarGroup>
        <SidebarGroup aria-label="Projects" label="Projects">
            <NavGroup defaultOpen icon="🏭" label="Riverside warehouse">
                <NavItem icon={<FileText strokeWidth={1.5} />} variant="inset">
                    Reports
                </NavItem>
                <NavItem icon={<Users strokeWidth={1.5} />} variant="inset">
                    Users
                </NavItem>
                <NavItem icon={<History strokeWidth={1.5} />} variant="inset">
                    Audit logs
                </NavItem>
            </NavGroup>
            {projects.map(project => (
                <NavGroup icon={project.icon} key={project.id} label={project.label}>
                    <NavItem icon={<FileText strokeWidth={1.5} />} variant="inset">
                        Reports
                    </NavItem>
                    <NavItem icon={<Users strokeWidth={1.5} />} variant="inset">
                        Users
                    </NavItem>
                </NavGroup>
            ))}
            <NavItem variant="project" icon={<Folder strokeWidth={1.5} />}>
                All projects
            </NavItem>
        </SidebarGroup>
        <AccountFooter
            avatar={
                <WorkspaceMark>
                    <Sparkles strokeWidth={2} />
                </WorkspaceMark>
            }
            name="Northwind Safety"
            plan="Business"
        />
    </Sidebar>
);

const RowActions = ({ label }: { label: string }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button aria-label={`Actions for ${label}`} size="icon-sm" variant="ghost">
                <EllipsisVertical strokeWidth={1.5} />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem>
                <SquarePen strokeWidth={1.5} />
                Edit score
            </DropdownMenuItem>
            <DropdownMenuItem>
                <History strokeWidth={1.5} />
                View history
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const EmptyTab = ({ children }: { children: ReactNode }) => (
    <div className="flex flex-col items-start gap-3 rounded-panel border border-neutral-200 border-dashed p-6 text-neutral-600 text-xs">
        {children}
        <Button variant="secondary">
            Generate with AI
            <Sparkles strokeWidth={1.5} />
        </Button>
    </div>
);

/** Risk report editor (Electric, 2025): topic list, pill tabs and an inline AI toolbar. */
export const RiskReport = () => {
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(0);
    const [isRisk, setIsRisk] = useState(true);
    const [editing, setEditing] = useState<string | null>('likelihood');
    const switchId = useId();

    const listed = filter === 'all' ? topics : topics.filter((_, i) => i % 3 === 1);
    const title = `${selected + 1}. ${topics[selected]}`;
    const nextTopic = topics[selected + 1];

    return (
        <AppShell className="h-full min-h-0 min-w-[1280px]">
            <ReportSidebar />
            <AppPanel>
                <HeaderBar className="h-[50px]">
                    <Breadcrumb>
                        <BreadcrumbList className="text-sm">
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">
                                    <BreadcrumbHome />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Reports</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBar>

                <div className="flex min-h-0 flex-1">
                    <div className="flex w-64 shrink-0 flex-col gap-3 border-neutral-200 border-r p-3">
                        <div className="flex items-center justify-between">
                            <Button aria-label="Hide list" size="icon-sm" variant="ghost">
                                <PanelLeftClose strokeWidth={1.5} />
                            </Button>
                            <Button aria-label="Search topics" size="icon-sm" variant="ghost">
                                <Search strokeWidth={1.5} />
                            </Button>
                        </div>
                        <SegmentedControl
                            aria-label="Topic filter"
                            className="w-full"
                            onValueChange={setFilter}
                            value={filter}
                        >
                            <SegmentedControlItem value="all">All</SegmentedControlItem>
                            <SegmentedControlItem value="open">Unassessed</SegmentedControlItem>
                        </SegmentedControl>
                        <nav
                            aria-label="Topics"
                            className="-mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto px-1"
                        >
                            {listed.map(topic => {
                                const index = topics.indexOf(topic);
                                return (
                                    <NavItem
                                        active={index === selected}
                                        className="shrink-0 pl-2.5"
                                        key={topic}
                                        onClick={() => setSelected(index)}
                                    >
                                        {index + 1}. {topic}
                                    </NavItem>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col overflow-auto">
                        <div className="flex items-start justify-between gap-6 px-6 pt-6 pb-8">
                            <div className="flex max-w-[650px] flex-col gap-2">
                                <h1 className="font-medium text-base text-neutral-950">{title}</h1>
                                <p className="text-neutral-600 text-xs">
                                    Assess this risk for the organisation by its likelihood,
                                    exposure frequency, effect and control measures. Use the AI
                                    features to find relevant legislation and to upload supporting
                                    documents.
                                </p>
                            </div>
                            <Button size="lg">
                                Generate
                                <Sparkles strokeWidth={1.5} />
                            </Button>
                        </div>

                        <Tabs className="flex-1 gap-0" defaultValue="evaluation">
                            <TabsList className="border-neutral-200 border-b px-5 py-3">
                                <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                                <TabsTrigger value="legislation">Legislation</TabsTrigger>
                                <TabsTrigger value="research">Research</TabsTrigger>
                                <TabsTrigger value="measures">Control measures</TabsTrigger>
                            </TabsList>

                            <TabsContent className="flex flex-col gap-6 p-6" value="evaluation">
                                <Table className="table-fixed">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Risk</TableHead>
                                            <TableHead>Explanation</TableHead>
                                            <TableHead>
                                                <span className="flex items-center gap-2">
                                                    Score
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                aria-label="Score legend"
                                                                className="-my-1.5 size-6"
                                                                size="icon-sm"
                                                                variant="ghost"
                                                            >
                                                                <CircleHelp strokeWidth={1.5} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            R risk · W likelihood · B exposure · E
                                                            effect
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="h-32 align-top">
                                                <label
                                                    className="flex cursor-pointer items-center gap-4"
                                                    htmlFor={switchId}
                                                >
                                                    <Switch
                                                        checked={isRisk}
                                                        id={switchId}
                                                        onCheckedChange={setIsRisk}
                                                    />
                                                    {isRisk
                                                        ? 'Yes, this is a risk for the organisation'
                                                        : 'No, not a risk for the organisation'}
                                                </label>
                                            </TableCell>
                                            <TableCell className="align-top">
                                                A health and safety policy was drawn up by the
                                                management on 16-03-2022, signed and shared with all
                                                employees. It is also posted on the notice board in
                                                the break room.
                                            </TableCell>
                                            <TableCell className="border-neutral-200 border-l p-0 align-top">
                                                <dl className="grid grid-cols-4">
                                                    {scores.map(([key, value]) => (
                                                        <div className="flex flex-col" key={key}>
                                                            <dt className="border-neutral-200 border-b p-3 font-normal text-neutral-600">
                                                                {key}
                                                            </dt>
                                                            <dd className="p-3 tabular-nums">
                                                                {isRisk ? value : '—'}
                                                            </dd>
                                                        </div>
                                                    ))}
                                                </dl>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>

                                <Table className="table-fixed">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[22%]">Assessment</TableHead>
                                            <TableHead className="w-[40%]">Explanation</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead className="w-28">
                                                <span className="sr-only">Level</span>
                                            </TableHead>
                                            <TableHead className="w-14">
                                                <span className="sr-only">Actions</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assessments.map(row => {
                                            const active = editing === row.id;
                                            return (
                                                <TableRow key={row.id}>
                                                    <TableCell className="h-32 align-top">
                                                        {row.label}
                                                    </TableCell>
                                                    <TableCell
                                                        className={cn(
                                                            'relative p-0 align-top',
                                                            active &&
                                                                'bg-tint outline-2 outline-focus -outline-offset-2',
                                                        )}
                                                    >
                                                        <button
                                                            aria-pressed={active}
                                                            className="block min-h-32 w-full cursor-text p-3 text-left outline-none"
                                                            onClick={() => setEditing(row.id)}
                                                            onFocus={() => setEditing(row.id)}
                                                            type="button"
                                                        >
                                                            {row.text}
                                                        </button>
                                                        {active && (
                                                            <Toolbar
                                                                aria-label="AI actions"
                                                                className="absolute bottom-3 left-3 z-10"
                                                            >
                                                                <ToolbarChip>
                                                                    AI suggestions
                                                                </ToolbarChip>
                                                                <ToolbarButton>
                                                                    <Wand strokeWidth={1.5} />
                                                                    Generate
                                                                </ToolbarButton>
                                                                <ToolbarButton>
                                                                    <SquarePen strokeWidth={1.5} />
                                                                    Edit
                                                                </ToolbarButton>
                                                                <ToolbarButton>
                                                                    <MessageCircleQuestion
                                                                        strokeWidth={1.5}
                                                                    />
                                                                    Explain
                                                                </ToolbarButton>
                                                            </Toolbar>
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        className="align-top"
                                                        numeric
                                                        align="left"
                                                    >
                                                        0.15
                                                    </TableCell>
                                                    <TableCell className="align-top" align="right">
                                                        <Badge tone="error" variant="dot">
                                                            High
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell
                                                        className="py-2 align-top"
                                                        align="right"
                                                    >
                                                        <RowActions label={row.label} />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent className="p-6" value="legislation">
                                <EmptyTab>
                                    No legislation linked yet. Let AI find the regulations that
                                    apply to this topic.
                                </EmptyTab>
                            </TabsContent>
                            <TabsContent className="p-6" value="research">
                                <EmptyTab>No research notes for this topic yet.</EmptyTab>
                            </TabsContent>
                            <TabsContent className="p-6" value="measures">
                                <EmptyTab>No control measures described yet.</EmptyTab>
                            </TabsContent>
                        </Tabs>

                        <div className="sticky bottom-0 flex justify-end gap-4 bg-neutral-50 px-6 pt-4 pb-6">
                            <Select defaultValue="approved">
                                <SelectTrigger
                                    aria-label="Review status"
                                    className="w-48"
                                    size="sm"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="approved">
                                        <CircleCheck
                                            className="text-success-500"
                                            strokeWidth={1.5}
                                        />
                                        Approved
                                    </SelectItem>
                                    <SelectItem value="review">
                                        <CircleAlert
                                            className="text-warning-500"
                                            strokeWidth={1.5}
                                        />
                                        Needs review
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {nextTopic && (
                                <Button onClick={() => setSelected(selected + 1)}>
                                    <span className="max-w-40 truncate">Next: {nextTopic}</span>
                                    <ArrowRight strokeWidth={1.5} />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </AppPanel>
        </AppShell>
    );
};
