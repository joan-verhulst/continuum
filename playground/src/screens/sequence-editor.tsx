import {
    Bell,
    ChartLine,
    ChevronDown,
    Copy,
    EllipsisVertical,
    FileClock,
    Folder,
    GripHorizontal,
    Info,
    ListTree,
    Mail,
    Megaphone,
    PanelLeft,
    Pencil,
    Plus,
    Rocket,
    Settings,
    ShieldCheck,
    Star,
    Timer,
    ToggleLeft,
    Trash2,
    Users,
    Workflow,
} from 'lucide-react';
import {
    AppPanel,
    AppShell,
    Avatar,
    AvatarStack,
    Badge,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    HeaderBar,
    NavItem,
    NavSection,
    Separator,
    Sidebar,
    SidebarFooter,
    SidebarHeader,
    SidebarNav,
    Table,
    TableBody,
    TableCell,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
    Toolbar,
    ToolbarButton,
    WorkspaceSwitcher,
} from 'personal-design-system';
import { Fragment, useState } from 'react';
import { SectionTitle } from './shared';

type Email = { id: number; name: string; delay?: string };
type Phase = { id: string; title: string; interval?: string; emails: Email[] };

const initialPhases: Phase[] = [
    { id: 'unassigned', title: 'Unassigned', emails: [{ id: 1, name: 'New email' }] },
    {
        id: 'phase-1',
        title: 'Phase 1',
        interval: '72h interval',
        emails: [
            { id: 2, name: 'Welcome email' },
            { id: 3, name: 'Getting started guide', delay: '+72h' },
            { id: 4, name: 'Tips & tricks', delay: '+72h' },
        ],
    },
    {
        id: 'phase-2',
        title: 'Phase 2',
        interval: '4w interval',
        emails: [
            { id: 5, name: 'Case study', delay: '+4w' },
            { id: 6, name: 'Feedback request', delay: '+4w' },
        ],
    },
];

const projects = [
    { id: 'mobile', label: 'Mobile app launch' },
    { id: 'retention', label: 'Customer retention program' },
    { id: 'refresh', label: 'Brand refresh initiative' },
];

const SequenceSidebar = () => {
    const [expanded, setExpanded] = useState(true);

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center justify-between py-1 pl-1">
                    {/* The product mark; the system has no logo slot of its own. */}
                    <span className="grid size-[26px] place-items-center rounded-chip bg-action text-on-action">
                        <Mail className="size-4" strokeWidth={1.5} />
                    </span>
                    <Button aria-label="Collapse sidebar" size="icon-sm" variant="ghost">
                        <PanelLeft strokeWidth={1.5} />
                    </Button>
                </div>
                <Button className="w-full justify-start">
                    <Plus strokeWidth={1.5} />
                    New sequence
                </Button>
            </SidebarHeader>
            <SidebarNav aria-label="Sequences">
                <NavItem icon={<ListTree strokeWidth={1.5} />}>All sequences</NavItem>
                <NavItem icon={<Timer strokeWidth={1.5} />}>Active campaigns</NavItem>
                <NavItem icon={<FileClock strokeWidth={1.5} />}>Drafts</NavItem>
                <NavItem icon={<Star strokeWidth={1.5} />}>Templates</NavItem>
            </SidebarNav>
            <Separator />
            <NavSection title="Projects">
                <NavItem
                    active
                    aria-expanded={expanded}
                    icon={<Rocket strokeWidth={1.5} />}
                    onClick={() => setExpanded(open => !open)}
                    trailing={
                        <ChevronDown
                            className={expanded ? 'size-4' : 'size-4 -rotate-90'}
                            strokeWidth={1.5}
                        />
                    }
                >
                    Q1 growth campaign
                </NavItem>
                {expanded && (
                    <div className="flex flex-col gap-0.5 pl-5">
                        <NavItem icon={<Megaphone strokeWidth={1.5} />}>Campaigns</NavItem>
                        <NavItem icon={<Workflow strokeWidth={1.5} />}>Automations</NavItem>
                        <NavItem icon={<ChartLine strokeWidth={1.5} />}>Analytics</NavItem>
                        <NavItem icon={<ShieldCheck strokeWidth={1.5} />}>Permissions</NavItem>
                    </div>
                )}
                {projects.map(project => (
                    <NavItem icon={<Folder strokeWidth={1.5} />} key={project.id}>
                        {project.label}
                    </NavItem>
                ))}
                <NavItem icon={<Folder strokeWidth={1.5} />}>All projects</NavItem>
            </NavSection>
            <SidebarFooter>
                <Separator />
                <div className="flex items-center gap-1">
                    <WorkspaceSwitcher
                        avatar={<Avatar alt="" fallback="N" />}
                        className="min-w-0 flex-1"
                        name="Northwind"
                        plan="Startup"
                    />
                    <Button aria-label="Notifications" size="icon" variant="ghost">
                        <Bell strokeWidth={1.5} />
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
};

const EmailActions = ({ name, onDelete }: { name: string; onDelete: () => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button aria-label={`Actions for ${name}`} size="icon-sm" variant="ghost">
                <EllipsisVertical strokeWidth={1.5} />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem>
                <Pencil strokeWidth={1.5} />
                Edit email
            </DropdownMenuItem>
            <DropdownMenuItem>
                <Copy strokeWidth={1.5} />
                Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} variant="danger">
                <Trash2 strokeWidth={1.5} />
                Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

/** Email sequence editor (Indigo, 2024): grouped, draggable phases and a floating action bar. */
export const SequenceEditor = () => {
    const [phases, setPhases] = useState(initialPhases);

    const nextId = () => Math.max(0, ...phases.flatMap(p => p.emails.map(e => e.id))) + 1;

    const addEmail = () =>
        setPhases(current =>
            current.map(phase =>
                phase.id === 'unassigned'
                    ? { ...phase, emails: [...phase.emails, { id: nextId(), name: 'New email' }] }
                    : phase,
            ),
        );

    const addPhase = () =>
        setPhases(current => [
            ...current,
            {
                id: `phase-${current.length}`,
                title: `Phase ${current.length}`,
                interval: '1w interval',
                emails: [],
            },
        ]);

    const removeEmail = (id: number) =>
        setPhases(current =>
            current.map(phase => ({ ...phase, emails: phase.emails.filter(e => e.id !== id) })),
        );

    return (
        <AppShell className="h-full min-h-0 min-w-[1280px]">
            <SequenceSidebar />
            <AppPanel className="relative">
                <HeaderBar>
                    <Breadcrumb>
                        <BreadcrumbList className="text-sm">
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
                                <BreadcrumbPage>Q1 growth campaign</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBar>

                <div className="min-h-0 flex-1 overflow-auto">
                    <div className="mx-auto flex w-[1024px] flex-col pt-20 pb-32">
                        <div className="flex items-center gap-3">
                            <AvatarStack>
                                <Avatar alt="Netherlands" fallback="NL" shape="round" size={24} />
                                <Avatar alt="Germany" fallback="DE" shape="round" size={24} />
                                <Avatar alt="Belgium" fallback="BE" shape="round" size={24} />
                            </AvatarStack>
                            <h1 className="font-medium text-lg text-neutral-950">
                                Q1 growth campaign
                            </h1>
                            <Separator className="h-4" orientation="vertical" />
                            <Badge icon={<Info strokeWidth={1.5} />}>Inactive</Badge>
                        </div>

                        <Separator className="mt-8 mb-12" />

                        <div className="flex items-start justify-between gap-6">
                            <SectionTitle
                                description="Build the sequence by adding emails and grouping them into phases. Emails in a phase go out in order at the set interval. Drag to reorder."
                                title="Email sequencing"
                            />
                            <Button onClick={addEmail}>
                                Add email
                                <Plus strokeWidth={1.5} />
                            </Button>
                        </div>

                        <Table className="mt-8">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <span className="sr-only">Reorder</span>
                                    </TableHead>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead className="w-40">Delay</TableHead>
                                    <TableHead>Email name</TableHead>
                                    <TableHead className="w-40">Template</TableHead>
                                    <TableHead className="w-40">Click rate</TableHead>
                                    <TableHead className="w-40">Open rate</TableHead>
                                    <TableHead className="w-11">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {phases.map(phase => (
                                    <Fragment key={phase.id}>
                                        <TableGroupRow hint={phase.interval}>
                                            {phase.interval && (
                                                <Button
                                                    aria-label={`${phase.title} settings`}
                                                    className="float-right -my-1.5 -mr-1.5"
                                                    size="icon-sm"
                                                    variant="ghost"
                                                >
                                                    <Settings strokeWidth={1.5} />
                                                </Button>
                                            )}
                                            {!phase.interval && (
                                                <Info
                                                    className="mr-1.5 inline size-3 align-[-1px]"
                                                    strokeWidth={1.5}
                                                />
                                            )}
                                            {phase.title}
                                        </TableGroupRow>
                                        {phase.emails.map((email, i) => (
                                            <TableRow key={email.id}>
                                                <TableCell className="cursor-grab text-neutral-600">
                                                    <GripHorizontal
                                                        aria-hidden
                                                        className="size-4"
                                                        strokeWidth={1.5}
                                                    />
                                                </TableCell>
                                                <TableCell className="tabular-nums">
                                                    {phase.interval ? i + 1 : ''}
                                                </TableCell>
                                                <TableCell>{email.delay}</TableCell>
                                                <TableCell>{email.name}</TableCell>
                                                <TableCell className="text-neutral-700">
                                                    Template
                                                </TableCell>
                                                <TableCell>N/A</TableCell>
                                                <TableCell>N/A</TableCell>
                                                <TableCell className="py-0" align="right">
                                                    <EmailActions
                                                        name={email.name}
                                                        onDelete={() => removeEmail(email.id)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </Fragment>
                                ))}
                                <TableRow>
                                    <TableCell className="py-1" colSpan={8}>
                                        <Button
                                            className="-ml-2 px-2 text-neutral-950"
                                            onClick={addPhase}
                                            variant="ghost"
                                        >
                                            <Plus strokeWidth={1.5} />
                                            Add phase
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
                    <div className="pointer-events-auto flex items-center gap-2">
                        <Toolbar aria-label="Campaign" variant="floating">
                            <ToolbarButton>
                                <ToggleLeft strokeWidth={1.5} />
                                Eligibility
                            </ToolbarButton>
                            <ToolbarButton>
                                <Users strokeWidth={1.5} />
                                Audience
                            </ToolbarButton>
                            <ToolbarButton>
                                <Settings strokeWidth={1.5} />
                                Settings
                            </ToolbarButton>
                        </Toolbar>
                        <Button size="lg">
                            Start campaign
                            <Rocket strokeWidth={1.5} />
                        </Button>
                    </div>
                </div>
            </AppPanel>
        </AppShell>
    );
};
