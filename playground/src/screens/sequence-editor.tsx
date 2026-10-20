import {
    ChartLine,
    Copy,
    EllipsisVertical,
    FileClock,
    Folder,
    GripHorizontal,
    Info,
    ListTree,
    Mail,
    Megaphone,
    Pencil,
    Plus,
    Rocket,
    Settings,
    Star,
    Timer,
    ToggleLeft,
    Trash2,
    UserRoundCog,
    Users,
    Workflow,
} from 'lucide-react';
import {
    AppPanel,
    AppShell,
    Avatar,
    AvatarStack,
    Badge,
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
    DockItem,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    HeaderBar,
    NavGroup,
    NavItem,
    Separator,
    Sidebar,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    Table,
    TableBody,
    TableCell,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
} from 'personal-design-system';
import { Fragment, useState } from 'react';
import { AccountFooter, SectionTitle, WorkspaceMark } from './shared';

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
    { id: 'mobile', icon: '📱', label: 'Mobile app launch' },
    { id: 'retention', icon: '👯', label: 'Customer retention program' },
    { id: 'refresh', icon: '🌿', label: 'Brand refresh initiative' },
];

const SequenceSidebar = () => (
    <Sidebar>
        <SidebarHeader>
            <SidebarLogo>
                <Mail strokeWidth={2} />
            </SidebarLogo>
            <SidebarToggle />
        </SidebarHeader>
        <SidebarGroup aria-label="Sequences" divided>
            {/* The call to action sits a step apart from the list below it. */}
            <NavItem icon={<Plus strokeWidth={1.5} />} variant="primary">
                New sequence
            </NavItem>
            <NavItem icon={<ListTree strokeWidth={1.5} />}>All sequences</NavItem>
            <NavItem active icon={<Timer strokeWidth={1.5} />}>
                Active campaigns
            </NavItem>
            <NavItem icon={<FileClock strokeWidth={1.5} />}>Drafts</NavItem>
            <NavItem icon={<Star strokeWidth={1.5} />}>Templates</NavItem>
        </SidebarGroup>
        <SidebarGroup aria-label="Projects" label="Projects">
            <NavGroup defaultOpen icon="🚀" label="Q1 growth campaign">
                <NavItem icon={<Megaphone strokeWidth={1.5} />} variant="inset">
                    Campaigns
                </NavItem>
                <NavItem icon={<Workflow strokeWidth={1.5} />} variant="inset">
                    Automations
                </NavItem>
                <NavItem icon={<ChartLine strokeWidth={1.5} />} variant="inset">
                    Analytics
                </NavItem>
                <NavItem icon={<UserRoundCog strokeWidth={1.5} />} variant="inset">
                    Permissions
                </NavItem>
            </NavGroup>
            {projects.map(project => (
                <NavGroup icon={project.icon} key={project.id} label={project.label}>
                    <NavItem icon={<Megaphone strokeWidth={1.5} />} variant="inset">
                        Campaigns
                    </NavItem>
                    <NavItem icon={<ChartLine strokeWidth={1.5} />} variant="inset">
                        Analytics
                    </NavItem>
                </NavGroup>
            ))}
            {/* Set at the project rows' size, as drawn. */}
            <NavItem variant="project" icon={<Folder strokeWidth={1.5} />}>
                All projects
            </NavItem>
        </SidebarGroup>
        <AccountFooter
            avatar={
                <WorkspaceMark>
                    <Mail strokeWidth={2} />
                </WorkspaceMark>
            }
            name="Northwind Agency"
            plan="Startup"
        />
    </Sidebar>
);

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
            <AppPanel>
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

                <BottomBar floating>
                    <Dock aria-label="Campaign">
                        <DockItem value="eligibility">
                            <ToggleLeft strokeWidth={1.5} />
                            Eligibility
                        </DockItem>
                        <DockItem value="audience">
                            <Users strokeWidth={1.5} />
                            Audience
                        </DockItem>
                        <DockItem value="settings">
                            <Settings strokeWidth={1.5} />
                            Settings
                        </DockItem>
                    </Dock>
                    <DockAction>
                        Start campaign
                        <Rocket strokeWidth={1.5} />
                    </DockAction>
                </BottomBar>
            </AppPanel>
        </AppShell>
    );
};
