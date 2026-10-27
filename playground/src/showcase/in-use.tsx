import {
    ActivityItem,
    ActivityList,
    Alert,
    Avatar,
    AvatarStack,
    Badge,
    BarList,
    BarListItem,
    BottomBar,
    Breadcrumb,
    BreadcrumbHome,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbMenu,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Button,
    Card,
    CardDelta,
    CardFigure,
    CardHeader,
    CardTitle,
    CardValue,
    ChatComposer,
    ChatEvent,
    ChatMessage,
    ChatReference,
    ChatThread,
    ChatToken,
    Checkbox,
    Checklist,
    ChecklistItem,
    CodeInput,
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    CommandMenu,
    CommandMenuContent,
    CommandMenuEmpty,
    CommandMenuFooter,
    CommandMenuGroup,
    CommandMenuInput,
    CommandMenuItem,
    CommandMenuList,
    ContinuumLogo,
    cn,
    countFilters,
    DatePicker,
    DateRangePicker,
    DescriptionItem,
    DescriptionList,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Dock,
    DockAction,
    DockItem,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
    DropZone,
    DropZoneFile,
    DropZoneFiles,
    EmptyState,
    Field,
    FieldHelper,
    FieldLabel,
    FilterBar,
    FilterChip,
    FilterMenu,
    FilterMenuClear,
    FilterMenuContent,
    FilterMenuGroup,
    FilterMenuItem,
    FilterMenuTrigger,
    type FilterValues,
    HeaderBar,
    HeaderBarActions,
    HeaderBarNav,
    HeaderBarNotice,
    HeaderBarStart,
    IconTile,
    InfoTip,
    Input,
    Kbd,
    LiveCount,
    MetaItem,
    MetaList,
    MetaRow,
    Meter,
    NavGroup,
    NavItem,
    OptionList,
    OptionRow,
    Pagination,
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
    Progress,
    RadioGroup,
    RadioGroupItem,
    Rail,
    RailItem,
    RailSeparator,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingGroup,
    SettingRow,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetSection,
    SheetTitle,
    Sidebar,
    SidebarAccount,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarLogo,
    SidebarToggle,
    Skeleton,
    Slider,
    Spinner,
    StatCard,
    StatusDot,
    Stepper,
    StepperItem,
    SuggestionChip,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableGroupRow,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Textarea,
    ToastProvider,
    Toolbar,
    ToolbarButton,
    ToolbarChip,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
    toggleFilter,
    useHeaderNotice,
    usePageHistory,
    useToast,
    ValueField,
} from 'continuum';
import {
    Area,
    AreaChart,
    AreaChartLoading,
    ChartTooltip,
    defaultPieColors,
    FunnelChart,
    Grid,
    PieCenter,
    PieChart,
    PieSlice,
    XAxis,
    YAxis,
} from 'continuum/charts';
import {
    Archive,
    ArrowRight,
    AtSign,
    BarChart3,
    Bell,
    Bold,
    Building2,
    CalendarDays,
    ChartLine,
    Check,
    CircleAlert,
    CircleCheck,
    Clock,
    Columns3,
    Copy,
    Database,
    Download,
    Ellipsis,
    FileText,
    Folder,
    Funnel,
    Gauge,
    Globe,
    Hash,
    History,
    House,
    Image as ImageIcon,
    Inbox,
    Italic,
    Laptop,
    LayoutGrid,
    Link2,
    List,
    Mail,
    MapPin,
    MessageSquare,
    Minimize2,
    Monitor,
    Pencil,
    PieChart as PieIcon,
    Plus,
    Search,
    Send,
    Settings,
    Share2,
    Sparkles,
    Table2,
    Trash2,
    TrendingUp,
    Upload,
    UserRound,
    Users,
    WandSparkles,
    Webhook,
    X,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Stage, useStageContainer } from '../layout';
import { chartMargin, formatWeekday, reportWeek, seriesRows } from '../screens/shared';
import { type UploadEntry, useUploads } from './previews';

const icon = { strokeWidth: 2 } as const;

/*
 * Components in use: one small, real piece of a product per component, built so
 * that component is the thing on show. Form controls sit in the dialog they would
 * be filled in; overlays are shown open; everything else in the card or frame it
 * belongs to, with as little beside it as the piece needs.
 */

export type InUse = {
    title: string;
    /** What the piece is, in a line. */
    note: string;
    /** Drawn on the canvas colour with cards on it, as a product page is. */
    canvas?: boolean;
    /** Draws its own 16:9 stage (a scene with something open), so no frame is put round it. */
    bare?: boolean;
    render: () => ReactNode;
};

/* ---------- Scenes: a stage with something held open on it ---------- */

const Scene = ({ className, children }: { className?: string; children: ReactNode }) => (
    <Stage className={cn('aspect-video min-h-[440px] w-full', className)}>{children}</Stage>
);

type OpenDialogProps = {
    title: string;
    /** The dialog's width in px; it never outgrows the stage. */
    width?: number;
    footer?: ReactNode;
    children: ReactNode;
};

/** A dialog held open, scrim and all, on the stage it is drawn on. */
const OpenDialog = ({ title, width = 440, footer, children }: OpenDialogProps) => {
    const stage = useStageContainer();

    return (
        <Dialog modal={false} open>
            <DialogContent
                container={stage}
                finalFocus={false}
                initialFocus={false}
                style={{ width: `min(${width}px, calc(100% - 32px))` }}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <DialogBody>{children}</DialogBody>
                {footer && <DialogFooter>{footer}</DialogFooter>}
            </DialogContent>
        </Dialog>
    );
};

const DialogActions = ({ action, disabled }: { action: ReactNode; disabled?: boolean }) => (
    <>
        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
        <Button disabled={disabled}>{action}</Button>
    </>
);

/** A control with its label beside it and what it means under the label. */
const Labelled = ({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: ReactNode;
}) => (
    <Field className="flex-row items-start gap-2.5">
        <span className="flex h-5 items-center">{children}</span>
        <span className="flex flex-col gap-0.5">
            <FieldLabel className="cursor-pointer">{label}</FieldLabel>
            {description && <span className="text-neutral-600 text-xs">{description}</span>}
        </span>
    </Field>
);

/* ---------- Actions ---------- */

const EmptyReports = () => (
    <Card className="w-full max-w-md items-center gap-5 px-8 py-10 text-center">
        <IconTile tone="primary" variant="outline">
            <FileText {...icon} />
        </IconTile>
        <div className="flex flex-col gap-1.5">
            <p className="font-medium text-neutral-950 text-sm">No reports yet</p>
            <p className="text-neutral-600 text-xs">
                Start from a template, or bring last quarter’s reports over in one go.
            </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
            <Button variant="secondary">
                <Upload {...icon} /> Import
            </Button>
            <Button>
                <Plus {...icon} /> New report
            </Button>
        </div>
        <Button variant="ghost">
            Browse templates <ArrowRight {...icon} />
        </Button>
    </Card>
);

const statusRows = [
    {
        client: 'Acme Corp',
        number: 'INV-0142',
        amount: '€4,120.00',
        status: 'Due soon',
        tone: 'warning',
    },
    {
        client: 'Northwind',
        number: 'INV-0141',
        amount: '€1,980.00',
        status: 'Paid',
        tone: 'success',
    },
    {
        client: 'Lumen Labs',
        number: 'INV-0139',
        amount: '€760.00',
        status: 'Overdue',
        tone: 'error',
    },
    {
        client: 'Harbour Street',
        number: 'INV-0138',
        amount: '€2,310.00',
        status: 'Scheduled',
        tone: 'primary',
    },
    {
        client: 'Tideline Travel',
        number: 'INV-0137',
        amount: '€540.00',
        status: 'Draft',
        tone: 'neutral',
    },
] as const;

const InvoiceStatuses = () => (
    <Card className="w-full max-w-lg gap-3">
        <CardHeader className="flex-row items-center justify-between">
            <span className="flex items-center gap-2">
                <CardTitle>Invoices this month</CardTitle>
                <Badge variant="count">{statusRows.length}</Badge>
            </span>
            <Badge icon={<TrendingUp {...icon} />} tone="success" variant="pill">
                +12.5%
            </Badge>
        </CardHeader>
        <ul className="flex flex-col divide-y divide-neutral-200">
            {statusRows.map(row => (
                <li className="flex h-11 items-center gap-3 text-xs" key={row.number}>
                    <span className="flex-1 truncate font-medium text-neutral-950">
                        {row.client}
                    </span>
                    <span className="text-neutral-500">{row.number}</span>
                    <span className="w-20 text-right text-neutral-950 tabular-nums">
                        {row.amount}
                    </span>
                    <span className="flex w-24 justify-end">
                        <Badge tone={row.tone} variant={row.tone === 'primary' ? 'dot' : undefined}>
                            {row.status}
                        </Badge>
                    </span>
                </li>
            ))}
        </ul>
    </Card>
);

const initialFilters = [
    { id: 'country', icon: <Globe {...icon} />, label: 'Country is Netherlands' },
    { id: 'device', icon: <Monitor {...icon} />, label: 'Device is desktop' },
    { id: 'source', icon: <Mail {...icon} />, label: 'Source is newsletter' },
];

const FilteredSessions = () => {
    const [filters, setFilters] = useState(initialFilters);
    const count = filters.length === 0 ? 12480 : 1284 * (4 - filters.length);

    return (
        <Card className="w-full max-w-xl gap-4">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Sessions</CardTitle>
                <span className="text-neutral-600 text-xs tabular-nums">
                    {count.toLocaleString('en-GB')} sessions
                </span>
            </CardHeader>
            <div className="flex flex-wrap items-center gap-2">
                <FilterChip icon={<CalendarDays {...icon} />}>Last 30 days</FilterChip>
                {filters.map(filter => (
                    <FilterChip
                        icon={filter.icon}
                        key={filter.id}
                        onRemove={() =>
                            setFilters(current => current.filter(item => item.id !== filter.id))
                        }
                    >
                        {filter.label}
                    </FilterChip>
                ))}
                {filters.length < initialFilters.length ? (
                    <Button onClick={() => setFilters(initialFilters)} variant="ghost">
                        <Plus {...icon} /> Add filter
                    </Button>
                ) : (
                    <Button onClick={() => setFilters([])} variant="ghost">
                        Clear all
                    </Button>
                )}
            </div>
        </Card>
    );
};

const prompts = [
    'Why did sessions drop on Tuesday?',
    'Compare this month to last',
    'Which pages lose the most visitors?',
    'Summarise the funnel',
];

const AskEmpty = () => {
    const [asked, setAsked] = useState<string>();

    return (
        <Card className="w-full max-w-lg items-center gap-5 px-6 py-8">
            <IconTile tone="primary" variant="outline">
                <Sparkles {...icon} />
            </IconTile>
            <div className="flex flex-col items-center gap-1 text-center">
                <p className="font-medium text-neutral-950 text-sm">Ask about Northwind</p>
                <p className="text-neutral-600 text-xs">
                    {asked ? `Asking: ${asked}` : 'Pick a question to start, or write your own.'}
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                {prompts.map(prompt => (
                    <SuggestionChip
                        icon={<Sparkles {...icon} />}
                        key={prompt}
                        onClick={() => setAsked(prompt)}
                    >
                        {prompt}
                    </SuggestionChip>
                ))}
            </div>
        </Card>
    );
};

const SelectionToolbar = () => {
    const [last, setLast] = useState<string>();

    return (
        <Card className="w-full max-w-xl gap-3 p-6">
            <p className="font-medium text-neutral-950 text-sm">Q3 review</p>
            <p className="text-neutral-700 text-xs">
                Sessions held steady through the quarter.{' '}
                <mark className="rounded-chip bg-tint px-0.5 text-tint-fg">
                    Bounce rate rose in August, mostly on mobile, after the pricing page moved below
                    the fold
                </mark>
                , and recovered once it moved back.
            </p>
            <Toolbar aria-label="AI suggestions" className="self-start" variant="floating">
                <ToolbarChip>AI</ToolbarChip>
                <ToolbarButton onClick={() => setLast('Rewritten')}>
                    <WandSparkles {...icon} /> Rewrite
                </ToolbarButton>
                <ToolbarButton onClick={() => setLast('Shortened')}>
                    <Minimize2 {...icon} /> Shorten
                </ToolbarButton>
                <ToolbarButton onClick={() => setLast('Accepted')}>
                    <Check {...icon} /> Accept
                </ToolbarButton>
            </Toolbar>
            <p className="text-neutral-500 text-xs">
                {last ?? 'Conversions followed the same line, a week behind.'}
            </p>
        </Card>
    );
};

const commands = [
    { icon: <House {...icon} />, label: 'Go to home', keys: ['G', 'H'] },
    { icon: <FileText {...icon} />, label: 'Go to reports', keys: ['G', 'R'] },
    { icon: <Plus {...icon} />, label: 'New report', keys: ['C'] },
    { icon: <Share2 {...icon} />, label: 'Share this page', keys: ['⌘', 'S'] },
    { icon: <Settings {...icon} />, label: 'Open settings', keys: ['⌘', ','] },
];

const CommandPalette = () => (
    <OpenDialog title="Go to" width={480}>
        <Input
            aria-label="Search commands"
            leadingIcon={<Search {...icon} />}
            placeholder="Search commands"
            size="sm"
            trailing={<Kbd>⌘K</Kbd>}
        />
        <ul className="-mx-2 flex flex-col">
            {commands.map((command, i) => (
                <li
                    className={cn(
                        'flex h-9 items-center gap-2.5 rounded-item px-2 text-neutral-950 text-xs [&_svg]:size-4 [&_svg]:text-neutral-600',
                        i === 0 && 'bg-neutral-950/5',
                    )}
                    key={command.label}
                >
                    {command.icon}
                    <span className="flex-1">{command.label}</span>
                    <span className="flex gap-1">
                        {command.keys.map(key => (
                            <Kbd key={key}>{key}</Kbd>
                        ))}
                    </span>
                </li>
            ))}
        </ul>
        <p className="flex flex-wrap items-center gap-1.5 text-neutral-500 text-xs">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to move, <Kbd>↵</Kbd> to open, <Kbd>Esc</Kbd> to close
        </p>
    </OpenDialog>
);

const DockFrame = () => {
    const [section, setSection] = useState('audience');

    return (
        <div className="relative flex h-80 w-full flex-col gap-4 overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 p-6">
            <p className="font-medium text-neutral-950 text-sm">Start campaign</p>
            <div className="grid grid-cols-3 gap-4 opacity-60">
                <div className="h-20 rounded-card border border-neutral-200" />
                <div className="h-20 rounded-card border border-neutral-200" />
                <div className="h-20 rounded-card border border-neutral-200" />
            </div>
            <BottomBar floating>
                <Dock aria-label="Campaign" onValueChange={setSection} value={section}>
                    <DockItem value="eligibility">
                        <CircleCheck {...icon} />
                        Eligibility
                    </DockItem>
                    <DockItem value="audience">
                        <Users {...icon} />
                        Audience
                    </DockItem>
                    <DockItem value="schedule">
                        <CalendarDays {...icon} />
                        Schedule
                    </DockItem>
                </Dock>
                <DockAction>
                    Start campaign <Send {...icon} />
                </DockAction>
            </BottomBar>
        </div>
    );
};

/* ---------- Forms ---------- */

const NewProject = () => (
    <OpenDialog footer={<DialogActions action="Create project" />} title="New project">
        <Field>
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Northwind Q4 launch" />
        </Field>
        <Field invalid>
            <FieldLabel>Address</FieldLabel>
            <Input
                defaultValue="northwind q4"
                leadingIcon={<Globe {...icon} />}
                trailing={<span className="text-neutral-500 text-xs">.continuum.app</span>}
            />
            <FieldHelper>Letters, numbers and dashes only.</FieldHelper>
        </Field>
        <Field>
            <FieldLabel>Owner email</FieldLabel>
            <Input leadingIcon={<AtSign {...icon} />} placeholder="name@company.com" />
        </Field>
    </OpenDialog>
);

const InviteTeammate = () => (
    <OpenDialog footer={<DialogActions action="Send invite" />} title="Invite a teammate">
        <DialogDescription>
            They join Northwind as a member and can see every report.
        </DialogDescription>
        <Field>
            <FieldLabel>Name</FieldLabel>
            <Input defaultValue="Bram Jansen" />
        </Field>
        <Field invalid>
            <FieldLabel>Email</FieldLabel>
            <Input defaultValue="bram@northwind" />
            <FieldHelper>Add the domain, such as northwind.com.</FieldHelper>
        </Field>
        <Field>
            <FieldLabel>Message</FieldLabel>
            <Textarea className="min-h-16" placeholder="Optional; shown in the invite" />
            <FieldHelper>Up to 280 characters.</FieldHelper>
        </Field>
    </OpenDialog>
);

const MoveReport = () => {
    const stage = useStageContainer();
    const [folder, setFolder] = useState('q4');

    return (
        <OpenDialog footer={<DialogActions action="Move" />} title="Move report">
            <Field>
                <FieldLabel>Visibility</FieldLabel>
                <Select defaultValue="team">
                    <SelectTrigger leadingIcon={<Users {...icon} />}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="me">Only me</SelectItem>
                        <SelectItem value="team">Everyone in Northwind</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
            <Field>
                <FieldLabel>Folder</FieldLabel>
                <Select modal={false} onValueChange={setFolder} open value={folder}>
                    <SelectTrigger leadingIcon={<Folder {...icon} />}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent container={stage}>
                        <SelectItem value="q3">Q3 reviews</SelectItem>
                        <SelectItem value="q4">Q4 planning</SelectItem>
                        <SelectItem value="clients">Client reports</SelectItem>
                        <SelectItem value="archive">Archive</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
            {/* Room for the open list, so it covers nothing of the form. */}
            <div className="h-40" />
        </OpenDialog>
    );
};

const owners = [
    'Anna de Vries',
    'Bram Jansen',
    'Chloé Martin',
    'Daan Visser',
    'Eva Bakker',
    'Femke Smit',
];

const AssignOwner = () => {
    const stage = useStageContainer();

    return (
        <OpenDialog footer={<DialogActions action="Assign" />} title="Assign INV-0142">
            <Field>
                <FieldLabel>Owner</FieldLabel>
                <Combobox defaultValue="Eva Bakker" items={owners} modal={false} open>
                    <ComboboxInput
                        leadingIcon={<UserRound {...icon} />}
                        placeholder="Search people"
                    />
                    <ComboboxContent container={stage}>
                        <ComboboxEmpty />
                        <ComboboxList>
                            {(item: string) => (
                                <ComboboxItem key={item} value={item}>
                                    {item}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </Field>
            {/* Room for the open list, as the rest of the form would sit under it. */}
            <div className="h-56" />
        </OpenDialog>
    );
};

const invoices = [
    {
        id: 'i1',
        client: 'Acme Corp',
        initials: 'AC',
        number: 'INV-0142',
        status: 'Due soon',
        tone: 'warning',
        amount: '€4,120.00',
        due: '26 Oct 2025',
    },
    {
        id: 'i2',
        client: 'Northwind',
        initials: 'NW',
        number: 'INV-0141',
        status: 'Paid',
        tone: 'success',
        amount: '€1,980.00',
        due: '14 Oct 2025',
    },
    {
        id: 'i3',
        client: 'Lumen Labs',
        initials: 'LL',
        number: 'INV-0139',
        status: 'Overdue',
        tone: 'error',
        amount: '€760.00',
        due: '2 Oct 2025',
    },
    {
        id: 'i4',
        client: 'Tideline Travel',
        initials: 'TT',
        number: 'INV-0138',
        status: 'Draft',
        tone: 'neutral',
        amount: '€2,310.00',
        due: '—',
    },
] as const;

const InvoiceTable = () => {
    const [picked, setPicked] = useState<string[]>(['i3']);
    const [page, setPage] = useState(1);
    const all = picked.length === invoices.length;

    return (
        <div className="flex w-full flex-col gap-3">
            <Table wrapperClassName="w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                aria-label="Select all"
                                checked={all ? true : picked.length > 0 ? 'indeterminate' : false}
                                onCheckedChange={checked =>
                                    setPicked(checked === true ? invoices.map(row => row.id) : [])
                                }
                            />
                        </TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead numeric>Amount</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead className="w-12">
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map(row => (
                        <TableRow key={row.id}>
                            <TableCell>
                                <Checkbox
                                    aria-label={`Select ${row.number}`}
                                    checked={picked.includes(row.id)}
                                    onCheckedChange={checked =>
                                        setPicked(current =>
                                            checked === true
                                                ? [...current, row.id]
                                                : current.filter(id => id !== row.id),
                                        )
                                    }
                                />
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center gap-2.5">
                                    <Avatar fallback={row.initials} size={24} />
                                    {row.client}
                                </span>
                            </TableCell>
                            <TableCell className="font-normal text-neutral-600">
                                {row.number}
                            </TableCell>
                            <TableCell>
                                <Badge tone={row.tone}>{row.status}</Badge>
                            </TableCell>
                            <TableCell numeric>{row.amount}</TableCell>
                            <TableCell className="font-normal text-neutral-600">
                                {row.due}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <Button
                                                aria-label="Actions"
                                                size="icon-sm"
                                                variant="ghost"
                                            />
                                        }
                                    >
                                        <Ellipsis {...icon} />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Pencil {...icon} /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Send {...icon} /> Send reminder
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem variant="danger">
                                            <Trash2 {...icon} /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Pagination
                end={
                    <Select defaultValue="4">
                        <SelectTrigger aria-label="Rows per page" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="4">4 rows</SelectItem>
                            <SelectItem value="10">10 rows</SelectItem>
                            <SelectItem value="25">25 rows</SelectItem>
                        </SelectContent>
                    </Select>
                }
                onPageChange={setPage}
                page={page}
                pageCount={9}
                results={`${(page - 1) * 4 + 1} – ${page * 4} of 36`}
            />
        </div>
    );
};

const ExportFormat = () => {
    const [format, setFormat] = useState('xlsx');

    return (
        <OpenDialog
            footer={
                <DialogActions
                    action={
                        <>
                            <Download {...icon} /> Export
                        </>
                    }
                />
            }
            title="Export sessions"
        >
            <DialogDescription>12,480 sessions from 1 to 31 October.</DialogDescription>
            <RadioGroup
                aria-label="Format"
                className="gap-4"
                onValueChange={value => setFormat(String(value))}
                value={format}
            >
                <Labelled description="Plain values, for any spreadsheet or script" label="CSV">
                    <RadioGroupItem value="csv" />
                </Labelled>
                <Labelled description="One sheet per week, with totals" label="Excel">
                    <RadioGroupItem value="xlsx" />
                </Labelled>
                <Labelled description="The charts and the summary, ready to send" label="PDF">
                    <RadioGroupItem value="pdf" />
                </Labelled>
            </RadioGroup>
        </OpenDialog>
    );
};

const sharing = [
    {
        id: 'link',
        label: 'Anyone with the link can view',
        description: 'No account needed',
        on: true,
    },
    {
        id: 'comments',
        label: 'Allow comments',
        description: 'Viewers can comment on charts',
        on: true,
    },
    { id: 'downloads', label: 'Allow downloads', description: 'As PDF and CSV', on: false },
    {
        id: 'expire',
        label: 'Expire the link after 30 days',
        description: 'You can renew it at any time',
        on: false,
    },
];

const ShareReport = () => (
    <Card className="w-full max-w-md gap-5">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Share Q3 review</CardTitle>
            <Badge tone="success" variant="dot">
                Public
            </Badge>
        </CardHeader>
        <div className="flex flex-col gap-4">
            {sharing.map(item => (
                <Field className="flex-row items-center justify-between gap-4" key={item.id}>
                    <span className="flex flex-col gap-0.5">
                        <FieldLabel className="cursor-pointer">{item.label}</FieldLabel>
                        <span className="text-neutral-600 text-xs">{item.description}</span>
                    </span>
                    <Switch defaultChecked={item.on} />
                </Field>
            ))}
        </div>
        <Button className="self-end" variant="secondary">
            <Copy {...icon} /> Copy link
        </Button>
    </Card>
);

const Thresholds = () => {
    const [bounce, setBounce] = useState([60]);
    const [errors, setErrors] = useState([2]);
    const [hours, setHours] = useState([22, 31]);
    const clock = (value: number) => `${String(value % 24).padStart(2, '0')}:00`;

    return (
        <Card className="w-full max-w-md gap-6">
            <CardTitle>Alert thresholds</CardTitle>
            <Field>
                <div className="flex justify-between">
                    <FieldLabel>Bounce rate above</FieldLabel>
                    <span className="text-neutral-950 text-xs tabular-nums">{bounce[0]}%</span>
                </div>
                <Slider max={100} min={0} onValueChange={setBounce} value={bounce} />
            </Field>
            <Field>
                <div className="flex justify-between">
                    <FieldLabel>Error rate above</FieldLabel>
                    <span className="text-neutral-950 text-xs tabular-nums">{errors[0]}%</span>
                </div>
                <Slider max={10} min={0} onValueChange={setErrors} step={0.5} value={errors} />
            </Field>
            <Field>
                <div className="flex justify-between">
                    <FieldLabel>Quiet hours</FieldLabel>
                    <span className="text-neutral-950 text-xs tabular-nums">
                        {clock(hours[0] ?? 22)} – {clock(hours[1] ?? 31)}
                    </span>
                </div>
                <Slider max={36} min={12} onValueChange={setHours} value={hours} />
            </Field>
        </Card>
    );
};

const appearance = [
    { id: 'theme', label: 'Theme', options: ['Light', 'Dark', 'System'], value: 'System' },
    { id: 'density', label: 'Density', options: ['Compact', 'Comfortable'], value: 'Compact' },
    { id: 'week', label: 'Week starts on', options: ['Monday', 'Sunday'], value: 'Monday' },
    { id: 'chart', label: 'Charts as', options: ['Lines', 'Areas', 'Bars'], value: 'Areas' },
];

const Appearance = () => (
    <Card className="w-full max-w-md gap-5">
        <CardTitle>Appearance</CardTitle>
        {appearance.map(row => (
            <div className="flex items-center justify-between gap-4" key={row.id}>
                <span className="font-medium text-neutral-950 text-xs">{row.label}</span>
                <SegmentedControl aria-label={row.label} defaultValue={row.value}>
                    {row.options.map(option => (
                        <SegmentedControlItem key={option} value={option}>
                            {option}
                        </SegmentedControlItem>
                    ))}
                </SegmentedControl>
            </div>
        ))}
    </Card>
);

const exportParts = [
    {
        id: 'summary',
        icon: <FileText {...icon} />,
        label: 'Executive summary',
        description: 'One page, written for the board',
    },
    {
        id: 'charts',
        icon: <PieIcon {...icon} />,
        label: 'Charts',
        description: 'Reach, engagement and growth',
    },
    {
        id: 'table',
        icon: <Table2 {...icon} />,
        label: 'Post table',
        description: 'Every post with its numbers',
    },
];

const ExportReport = () => {
    const [picked, setPicked] = useState(['summary', 'charts']);
    const [audience, setAudience] = useState('client');

    return (
        <OpenDialog
            footer={
                <DialogActions
                    action={`Export ${picked.length} parts`}
                    disabled={picked.length === 0}
                />
            }
            title="Export report"
            width={480}
        >
            <OptionList>
                {exportParts.map(part => (
                    <OptionRow
                        control={
                            <Checkbox
                                checked={picked.includes(part.id)}
                                onCheckedChange={checked =>
                                    setPicked(current =>
                                        checked === true
                                            ? [...current, part.id]
                                            : current.filter(id => id !== part.id),
                                    )
                                }
                            />
                        }
                        description={part.description}
                        icon={part.icon}
                        key={part.id}
                        label={part.label}
                    />
                ))}
            </OptionList>
            <RadioGroup
                aria-label="Audience"
                onValueChange={value => setAudience(String(value))}
                value={audience}
            >
                <OptionList>
                    <OptionRow
                        control={<RadioGroupItem value="client" />}
                        description="Numbers only, no notes"
                        label="For the client"
                    />
                    <OptionRow
                        control={<RadioGroupItem value="team" />}
                        description="With notes and next steps"
                        label="For the team"
                    />
                </OptionList>
            </RadioGroup>
        </OpenDialog>
    );
};

const NotificationSettings = () => {
    const [alerts, setAlerts] = useState(true);

    return (
        <Card className="w-full max-w-md">
            <SettingGroup title="Notifications">
                <SettingRow
                    control={<Switch checked={alerts} onCheckedChange={setAlerts} />}
                    description="Email when something is flagged for attention"
                    title="Anomaly alerts"
                />
                <SettingRow
                    control={
                        <Select defaultValue="medium">
                            <SelectTrigger indicator="right" size="sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                    description="Threshold for flagging anomalies"
                    disabled={!alerts}
                    title="Alert sensitivity"
                />
                <SettingRow
                    control={<Switch defaultChecked />}
                    description="A seven-day overview every Monday"
                    title="Weekly digest"
                />
                <SettingRow
                    control={<Button variant="secondary">Send a test</Button>}
                    description="A sample alert to every channel"
                    labelControl={false}
                    title="Test alerts"
                />
            </SettingGroup>
        </Card>
    );
};

const ScheduleReport = () => (
    <OpenDialog footer={<DialogActions action="Schedule" />} title="Schedule report">
        <DialogDescription>
            Q3 review goes to finance@acme.com on every date between these two.
        </DialogDescription>
        <div className="grid grid-cols-2 gap-3">
            <Field>
                <FieldLabel>First send</FieldLabel>
                <DatePicker defaultValue={new Date(2025, 10, 3)} />
            </Field>
            <Field>
                <FieldLabel>Last send</FieldLabel>
                <DatePicker defaultValue={new Date(2026, 2, 30)} />
            </Field>
        </div>
        <Field>
            <FieldLabel>Repeat</FieldLabel>
            <Select defaultValue="month">
                <SelectTrigger leadingIcon={<History {...icon} />}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="week">Every week</SelectItem>
                    <SelectItem value="month">Every month</SelectItem>
                    <SelectItem value="quarter">Every quarter</SelectItem>
                </SelectContent>
            </Select>
            <FieldHelper>Five sends, the first on Monday 3 November.</FieldHelper>
        </Field>
    </OpenDialog>
);

const ComparePeriods = () => (
    <Card className="w-full max-w-md gap-5">
        <CardTitle>Compare periods</CardTitle>
        <Field>
            <FieldLabel>Period</FieldLabel>
            <DateRangePicker
                defaultValue={{ from: new Date(2025, 9, 1), to: new Date(2025, 9, 31) }}
                icon="trailing"
            />
        </Field>
        <Field>
            <FieldLabel>Compared to</FieldLabel>
            <DateRangePicker
                defaultValue={{ from: new Date(2025, 8, 1), to: new Date(2025, 8, 30) }}
                icon="trailing"
            />
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-item bg-neutral-950/3 px-3 py-2.5 text-xs">
            <span className="text-neutral-600">Sessions</span>
            <span className="flex items-center gap-2">
                <span className="font-medium text-neutral-950 tabular-nums">12,480</span>
                <CardDelta>+12.4%</CardDelta>
            </span>
        </div>
    </Card>
);

const VerifyEmail = () => {
    const [code, setCode] = useState('482');

    return (
        <OpenDialog
            footer={
                <>
                    <Button variant="ghost">Resend code</Button>
                    <Button disabled={code.length < 6}>Continue</Button>
                </>
            }
            title="Verify your email"
            width={420}
        >
            <DialogDescription>
                We sent a six-digit code to maya@acme.app. It is valid for ten minutes.
            </DialogDescription>
            <Field>
                <FieldLabel>Verification code</FieldLabel>
                <CodeInput onValueChange={setCode} value={code} />
                <FieldHelper>
                    {code.length === 6 ? 'Checking the code…' : 'Paste it or type it in.'}
                </FieldHelper>
            </Field>
        </OpenDialog>
    );
};

const Credentials = () => (
    <Card className="w-full max-w-lg gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>API credentials</CardTitle>
            <Button variant="ghost">Rotate secret</Button>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3">
            <ValueField copyable label="Client ID" value="cnt_live_4f9a2c" />
            <ValueField
                copyable
                copyValue="sk_live_8Hd2kQm"
                label="Secret"
                value="sk_live_••••••••"
            />
            <ValueField
                className="col-span-2"
                copyable
                label="Webhook URL"
                value="https://api.northwind.studio/hooks/continuum"
            />
            <ValueField label="Status" tone="success" value="Active" variant="vital" />
            <ValueField label="Last call" value="2 minutes ago" variant="vital" />
        </div>
    </Card>
);

/* ---------- Navigation ---------- */

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

const railItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid {...icon} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 {...icon} /> },
    { id: 'traffic', label: 'Traffic', icon: <ChartLine {...icon} /> },
    { id: 'funnels', label: 'Funnels', icon: <Funnel {...icon} /> },
];

const RailFrame = () => {
    const [active, setActive] = useState('analytics');

    return (
        <TooltipProvider>
            <div className="flex h-80 w-full gap-6 overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 p-6">
                <Rail aria-label="Main" className="self-start">
                    {railItems.map(item => (
                        <RailItem
                            active={item.id === active}
                            key={item.id}
                            label={item.label}
                            onClick={() => setActive(item.id)}
                        >
                            {item.icon}
                        </RailItem>
                    ))}
                    <RailSeparator />
                    <RailItem label="Settings">
                        <Settings {...icon} />
                    </RailItem>
                    <div className="mt-1">
                        <Avatar fallback="NW" shape="round" size={24} />
                    </div>
                </Rail>
                <div className="flex flex-1 flex-col gap-4 opacity-60">
                    <p className="font-medium text-neutral-950 text-sm capitalize">{active}</p>
                    <div className="h-24 rounded-card border border-neutral-200" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 rounded-card border border-neutral-200" />
                        <div className="h-20 rounded-card border border-neutral-200" />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

const findings = [
    'Supplier contract ends in 30 days',
    'Shared admin account',
    'Backups weekly, not daily',
];

const RiskTabs = () => (
    <Card className="w-full max-w-lg gap-4">
        <CardTitle>Q3 risk report</CardTitle>
        <Tabs defaultValue="summary">
            <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger disabled value="history">
                    History
                </TabsTrigger>
            </TabsList>
            <TabsContent className="pt-4 text-neutral-700 text-xs" value="summary">
                Three risks need a decision before the review on Friday: the supplier contract, the
                shared admin account and the backup schedule.
            </TabsContent>
            <TabsContent className="flex flex-col gap-2 pt-4 text-xs" value="findings">
                {findings.map(finding => (
                    <span className="flex items-center gap-2 text-neutral-700" key={finding}>
                        <CircleAlert {...icon} className="size-4 text-warning-600" /> {finding}
                    </span>
                ))}
            </TabsContent>
            <TabsContent className="pt-4 text-neutral-700 text-xs" value="sources">
                Built from 38 documents in the Northwind workspace.
            </TabsContent>
        </Tabs>
    </Card>
);

const foldedCrumbs = ['Finance', 'Payments', '2026'];

const BreadcrumbHeader = () => {
    const stage = useStageContainer();
    const [workspace, setWorkspace] = useState('Northwind');

    return (
        <div className="mb-24 w-full max-w-2xl self-start overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
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
                            <BreadcrumbMenu container={stage} label={workspace}>
                                {['Northwind', 'Acme Corp', 'Globex'].map(name => (
                                    <DropdownMenuItem key={name} onClick={() => setWorkspace(name)}>
                                        {name}
                                    </DropdownMenuItem>
                                ))}
                            </BreadcrumbMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbMenu container={stage} defaultOpen modal={false}>
                                {foldedCrumbs.map(name => (
                                    <DropdownMenuItem key={name}>
                                        <Folder {...icon} /> {name}
                                    </DropdownMenuItem>
                                ))}
                            </BreadcrumbMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">October batches</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Batch #12345 · European suppliers</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <Button variant="secondary">
                    <Download {...icon} /> Export
                </Button>
            </HeaderBar>
            <div className="flex flex-col gap-1.5 px-6 py-8 opacity-60">
                <p className="font-medium text-neutral-950 text-sm">Batch #12345</p>
                <p className="text-neutral-600 text-xs">
                    14 payouts · €18,420.00 · sent 14 October
                </p>
            </div>
        </div>
    );
};

const EditReport = () => {
    const { notice, show } = useHeaderNotice();
    // You came here from another report, so back has somewhere to go and forward returns.
    const history = usePageHistory(['Acme renewal forecast', 'Northwind Q3 review']);
    const [titles, setTitles] = useState<Record<string, string>>({});
    const title = titles[history.page] ?? history.page;
    const setTitle = (next: string) => setTitles(current => ({ ...current, [history.page]: next }));

    // The piece opens just after a save, so its notice is showing.
    // biome-ignore lint/correctness/useExhaustiveDependencies: once, on mount
    useEffect(() => show('Saved', { timeout: 0 }), []);

    const save = () => {
        show('Saving…', { icon: <Spinner size="sm" />, timeout: 0 });
        window.setTimeout(() => show('Saved'), 900);
    };

    return (
        <div className="w-full overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
            <HeaderBar>
                <HeaderBarStart>
                    <HeaderBarNav
                        canGoBack={history.canGoBack}
                        canGoForward={history.canGoForward}
                        onBack={history.back}
                        onForward={history.forward}
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Reports</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{title || 'Untitled report'}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBarStart>
                <HeaderBarActions>
                    <Button onClick={() => show('Link copied')} variant="secondary">
                        <Link2 {...icon} /> Copy link
                    </Button>
                    <Button onClick={save}>Save</Button>
                </HeaderBarActions>
                <HeaderBarNotice {...notice} />
            </HeaderBar>
            <form
                className="mx-auto flex max-w-[560px] flex-col gap-3 px-6 pt-14 pb-10"
                onSubmit={event => {
                    event.preventDefault();
                    save();
                }}
            >
                <input
                    aria-label="Title"
                    className="bg-transparent font-medium text-2xl text-neutral-950 outline-none"
                    onChange={event => setTitle(event.target.value)}
                    value={title}
                />
                <p className="text-neutral-700 text-sm leading-relaxed">
                    Revenue grew 12% on the quarter, led by the Business plan. Churn held at 1.8%;
                    the two accounts that left both moved to an in-house tool.
                </p>
            </form>
        </div>
    );
};

const contacts = [
    { name: 'Anna de Vries', email: 'anna@acme.com', company: 'Acme Corp' },
    { name: 'Bram Jansen', email: 'bram@northwind.com', company: 'Northwind' },
    { name: 'Chloé Martin', email: 'chloe@lumenlabs.io', company: 'Lumen Labs' },
    { name: 'Daan Visser', email: 'daan@tideline.travel', company: 'Tideline Travel' },
];

const ContactsList = () => {
    const [page, setPage] = useState(3);

    return (
        <Card className="w-full gap-3">
            <CardTitle>Contacts</CardTitle>
            <ul className="flex flex-col divide-y divide-neutral-200 text-xs">
                {contacts.map(contact => (
                    <li className="flex h-10 items-center gap-4" key={contact.email}>
                        <span className="w-40 font-medium text-neutral-950">{contact.name}</span>
                        <span className="flex-1 text-neutral-600">{contact.email}</span>
                        <span className="text-neutral-600">{contact.company}</span>
                    </li>
                ))}
            </ul>
            <Pagination
                end={
                    <Select defaultValue="4">
                        <SelectTrigger aria-label="Rows per page" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="4">4 rows</SelectItem>
                            <SelectItem value="10">10 rows</SelectItem>
                        </SelectContent>
                    </Select>
                }
                onPageChange={setPage}
                page={page}
                pageCount={12}
                results={`${(page - 1) * 4 + 1} – ${page * 4} of 48`}
            />
        </Card>
    );
};

const SignIn = () => (
    <Card className="w-full max-w-sm items-stretch gap-5 px-6 py-8">
        <ContinuumLogo className="self-center" size={24} />
        <div className="flex flex-col items-center gap-1 text-center">
            <p className="font-medium text-neutral-950 text-sm">Sign in to your workspace</p>
            <p className="text-neutral-600 text-xs">We send a link to your email; no password.</p>
        </div>
        <Field>
            <FieldLabel>Work email</FieldLabel>
            <Input leadingIcon={<Mail {...icon} />} placeholder="name@company.com" />
        </Field>
        <Button size="lg">Continue</Button>
    </Card>
);

/* ---------- Overlays ---------- */

const DeleteReport = () => {
    const [name, setName] = useState('');

    return (
        <OpenDialog
            footer={
                <>
                    <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                    <Button disabled={name.trim() !== 'Northwind Q3 review'}>
                        <Trash2 {...icon} /> Delete report
                    </Button>
                </>
            }
            title="Delete report"
            width={420}
        >
            <DialogDescription>
                Northwind Q3 review and its 14 exports go for good. Type the report's name to
                confirm.
            </DialogDescription>
            <Field>
                <FieldLabel>Report name</FieldLabel>
                <Input
                    onChange={event => setName(event.target.value)}
                    placeholder="Northwind Q3 review"
                    value={name}
                />
                <FieldHelper>This cannot be undone.</FieldHelper>
            </Field>
        </OpenDialog>
    );
};

const history = [
    {
        tone: 'success',
        icon: <CircleCheck {...icon} />,
        title: 'Payment received from Acme',
        time: 'Today, 09:12',
        status: 'Paid',
    },
    {
        tone: 'warning',
        icon: <Clock {...icon} />,
        title: 'Reminder sent',
        time: '2 days ago',
        status: 'Reminder',
    },
    {
        tone: 'neutral',
        icon: <Send {...icon} />,
        title: 'Invoice sent to finance@acme.com',
        time: '12 days ago',
        status: 'Sent',
    },
    {
        tone: 'neutral',
        icon: <FileText {...icon} />,
        title: 'Invoice created',
        time: '12 days ago',
        status: 'Draft',
    },
] as const;

const HistorySheet = () => {
    const stage = useStageContainer();

    return (
        <div className="flex w-full flex-col gap-4 self-start pr-[420px]">
            <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-neutral-950 text-sm">INV-0142 · Acme Corp</p>
                <Button variant="secondary">
                    <History {...icon} /> Status history
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 opacity-60">
                <ValueField label="Amount" value="€4,120.00" />
                <ValueField label="Due" value="26 Oct 2025" />
            </div>
            <Sheet open>
                <SheetContent
                    className="w-[min(380px,calc(100%-64px))]"
                    container={stage}
                    finalFocus={false}
                    initialFocus={false}
                >
                    <SheetHeader icon={<History />}>
                        <SheetTitle>Status history</SheetTitle>
                    </SheetHeader>
                    <SheetBody>
                        <SheetSection className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-neutral-600">Current status</span>
                            <Badge tone="success">Paid</Badge>
                        </SheetSection>
                        <SheetSection>
                            <ActivityList>
                                {history.map(entry => (
                                    <ActivityItem
                                        action={<Badge tone={entry.tone}>{entry.status}</Badge>}
                                        icon={entry.icon}
                                        key={entry.title}
                                        time={entry.time}
                                        title={entry.title}
                                        tone={entry.tone}
                                    />
                                ))}
                            </ActivityList>
                        </SheetSection>
                    </SheetBody>
                </SheetContent>
            </Sheet>
        </div>
    );
};

const files = [
    { name: 'Q3 review.pdf', meta: '2.4 MB · edited today' },
    { name: 'Funnel export.csv', meta: '120 KB · edited yesterday' },
    { name: 'Board deck.key', meta: '18 MB · edited 3 days ago' },
];

const FileMenu = () => {
    const stage = useStageContainer();

    return (
        <Card className="mb-28 w-full max-w-md gap-2">
            <CardTitle>Files</CardTitle>
            <ul className="flex flex-col divide-y divide-neutral-200">
                {files.map((file, i) => (
                    <li className="flex h-12 items-center gap-3" key={file.name}>
                        <IconTile>
                            <FileText {...icon} />
                        </IconTile>
                        <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium text-neutral-950 text-xs">
                                {file.name}
                            </span>
                            <span className="text-neutral-500 text-xxs">{file.meta}</span>
                        </span>
                        <DropdownMenu modal={false} open={i === 0 ? true : undefined}>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        aria-label={`Actions for ${file.name}`}
                                        size="icon-sm"
                                        variant="ghost"
                                    />
                                }
                            >
                                <Ellipsis {...icon} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52" container={stage}>
                                <DropdownMenuLabel>{file.name}</DropdownMenuLabel>
                                <DropdownMenuItem>
                                    <Pencil {...icon} /> Rename
                                    <DropdownMenuShortcut>R</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Copy {...icon} /> Duplicate
                                    <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Download {...icon} /> Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="danger">
                                    <Trash2 {...icon} /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const columnNames = ['Client', 'Status', 'Amount', 'Due', 'Owner'];

const ColumnsPopover = () => {
    const stage = useStageContainer();
    const [shown, setShown] = useState(['Client', 'Status', 'Amount', 'Due']);

    return (
        <Card className="mb-36 w-full max-w-xl gap-4">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Open invoices</CardTitle>
                <Popover modal={false} open>
                    <PopoverTrigger render={<Button variant="secondary" />}>
                        <Columns3 {...icon} /> Columns
                    </PopoverTrigger>
                    <PopoverContent
                        align="end"
                        className="w-56"
                        container={stage}
                        finalFocus={false}
                        initialFocus={false}
                    >
                        <PopoverHeader>
                            <PopoverTitle>Columns</PopoverTitle>
                            <PopoverDescription>Pick what the table shows.</PopoverDescription>
                        </PopoverHeader>
                        <div className="flex flex-col gap-2.5">
                            {columnNames.map(column => (
                                <Field className="flex-row items-center gap-2.5" key={column}>
                                    <Checkbox
                                        checked={shown.includes(column)}
                                        onCheckedChange={checked =>
                                            setShown(current =>
                                                checked
                                                    ? [...current, column]
                                                    : current.filter(name => name !== column),
                                            )
                                        }
                                    />
                                    <FieldLabel className="cursor-pointer">{column}</FieldLabel>
                                </Field>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </CardHeader>
            <div className="flex gap-6 border-neutral-200 border-b pb-2 text-neutral-600 text-xs">
                {shown.map(column => (
                    <span className="flex-1" key={column}>
                        {column}
                    </span>
                ))}
            </div>
            <div className="h-16" />
        </Card>
    );
};

const formatting = [
    { label: 'Bold', glyph: <Bold {...icon} /> },
    { label: 'Italic', glyph: <Italic {...icon} /> },
    { label: 'Add a link', glyph: <Link2 {...icon} /> },
    { label: 'Bulleted list', glyph: <List {...icon} /> },
    { label: 'Insert image', glyph: <ImageIcon {...icon} /> },
];

const EditorTooltips = () => {
    const stage = useStageContainer();

    return (
        <TooltipProvider>
            <Card className="w-full max-w-md gap-4">
                <div className="flex gap-1 border-neutral-200 border-b pb-3">
                    {formatting.map((item, i) => (
                        <Tooltip key={item.label} open={i === 2 ? true : undefined}>
                            <TooltipTrigger
                                render={
                                    <Button aria-label={item.label} size="icon" variant="ghost" />
                                }
                            >
                                {item.glyph}
                            </TooltipTrigger>
                            <TooltipContent container={stage} side="bottom">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
                <p className="pt-4 text-neutral-700 text-xs">
                    Sessions held steady through the quarter, and the pricing page brought most of
                    the new sign-ups.
                </p>
            </Card>
        </TooltipProvider>
    );
};

const CreditsTip = () => {
    const stage = useStageContainer();

    return (
        <Card className="mt-16 w-full max-w-sm gap-4">
            <span className="flex items-center gap-1.5 font-medium text-neutral-950 text-xs">
                Credits
                <InfoTip
                    container={stage}
                    content="One credit is one AI summary or one export. Unused credits roll over for a month."
                    open
                />
            </span>
            <p className="font-medium text-2xl text-neutral-950 tabular-nums">7,550</p>
            <Meter
                caption="Resets in 10 days"
                label="Used this month"
                max={10000}
                tone="chart"
                value={2450}
            />
            <Button className="self-start" variant="secondary">
                <Plus {...icon} /> Add credits
            </Button>
        </Card>
    );
};

/* ---------- Data ---------- */

const WeekStats = () => (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard delta="+12.4%" label="Sessions" value="12,480" />
        <StatCard delta="−3.1%" label="Bounce rate" trend="down" value="41.2%" />
        <StatCard delta="0.0%" label="Avg. duration" trend="neutral" value="2m 14s" />
        <StatCard delta="+8.9%" label="Conversions" value="1,204" />
    </div>
);

const RevenueCards = () => (
    <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Revenue this month</CardTitle>
                <CardFigure>
                    <CardValue size="xl">€48,210</CardValue>
                    <CardDelta>+6.2%</CardDelta>
                </CardFigure>
            </CardHeader>
            <MetaRow label="Invoices paid" value="38 of 44" />
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Returning visitors</CardTitle>
                <CardFigure>
                    <CardValue size="xl">38%</CardValue>
                    <CardDelta trend="down">−2.4%</CardDelta>
                </CardFigure>
            </CardHeader>
            <MetaRow label="Compared to" value="September" />
        </Card>
    </div>
);

const InvoiceSummary = () => (
    <Card className="w-full max-w-sm gap-3">
        <CardTitle>INV-0142 · summary</CardTitle>
        <div className="flex flex-col gap-2">
            <MetaRow label="Website design" value="€3,200.00" />
            <MetaRow label="Brand identity" value="€1,400.00" />
            <MetaRow label="Discount (10%)" value="−€460.00" />
            <MetaRow label="VAT (21%)" value="€869.40" />
        </div>
        <div className="flex items-baseline justify-between border-neutral-200 border-t pt-3">
            <span className="font-medium text-neutral-950 text-xs">Total due</span>
            <span className="font-medium text-lg text-neutral-950 tabular-nums">€5,009.40</span>
        </div>
    </Card>
);

const phases = [
    {
        title: 'Welcome',
        hint: 'day 0 to 3',
        steps: [
            { subject: 'Welcome to Northwind', delay: 'Immediately', sent: 1240, opened: 812 },
            { subject: 'Set up your first report', delay: '1 day', sent: 1188, opened: 604 },
        ],
    },
    {
        title: 'Activation',
        hint: 'week 1 to 2',
        steps: [
            { subject: 'Invite your team', delay: '4 days', sent: 1032, opened: 455 },
            { subject: 'Your first month in numbers', delay: '14 days', sent: 980, opened: 520 },
        ],
    },
];

const SequenceTable = () => (
    <Table wrapperClassName="w-full">
        <TableHeader>
            <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead numeric>Sent</TableHead>
                <TableHead numeric>Open rate</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {phases.map(phase => [
                <TableGroupRow hint={phase.hint} key={phase.title}>
                    {phase.title}
                </TableGroupRow>,
                ...phase.steps.map(step => (
                    <TableRow key={step.subject}>
                        <TableCell>
                            <span className="inline-flex items-center gap-2">
                                <Mail className="size-4 text-neutral-600" {...icon} />
                                {step.subject}
                            </span>
                        </TableCell>
                        <TableCell className="font-normal text-neutral-600">{step.delay}</TableCell>
                        <TableCell numeric>{step.sent.toLocaleString('en-GB')}</TableCell>
                        <TableCell numeric>
                            <Badge tone={step.opened / step.sent > 0.5 ? 'success' : 'neutral'}>
                                {Math.round((step.opened / step.sent) * 100)}%
                            </Badge>
                        </TableCell>
                    </TableRow>
                )),
            ])}
        </TableBody>
    </Table>
);

const CustomerDetails = () => (
    <Card className="w-full max-w-md gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Customer</CardTitle>
            <Button variant="ghost">
                <Pencil {...icon} /> Edit
            </Button>
        </CardHeader>
        <DescriptionList>
            <DescriptionItem term="Company">Acme Corp</DescriptionItem>
            <DescriptionItem term="Plan">Business · 12 of 20 seats</DescriptionItem>
            <DescriptionItem term="Status">
                <Badge tone="success">Active</Badge>
            </DescriptionItem>
            <DescriptionItem term="Owners">
                <AvatarStack>
                    <Avatar fallback="AS" shape="round" size={24} />
                    <Avatar fallback="TB" shape="round" size={24} />
                </AvatarStack>
            </DescriptionItem>
            <DescriptionItem term="Customer since">12 April 2023</DescriptionItem>
        </DescriptionList>
    </Card>
);

const ActivityFeed = () => (
    <Card className="w-full max-w-md gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Activity</CardTitle>
            <Button variant="ghost">View all</Button>
        </CardHeader>
        <ActivityList>
            <ActivityItem
                action={<Badge tone="success">Paid</Badge>}
                icon={<CircleCheck {...icon} />}
                time="Today, 09:12"
                title="Payment received from Acme"
                tone="success"
            />
            <ActivityItem
                action={<Badge tone="warning">Reminder</Badge>}
                icon={<Clock {...icon} />}
                time="2 days ago"
                title="Reminder sent to Lumen Labs"
                tone="warning"
            />
            <ActivityItem
                action={<Badge tone="error">Failed</Badge>}
                icon={<CircleAlert {...icon} />}
                time="3 days ago"
                title="Payout to Tideline Travel bounced"
                tone="error"
            />
            <ActivityItem
                icon={<FileText {...icon} />}
                time="5 days ago"
                title="INV-0142 created by Jane"
            />
        </ActivityList>
    </Card>
);

const members = [
    {
        initials: 'JC',
        name: 'Jane Cooper',
        email: 'jane@northwind.studio',
        role: 'Owner',
        shape: 'round',
    },
    {
        initials: 'BJ',
        name: 'Bram Jansen',
        email: 'bram@northwind.studio',
        role: 'Admin',
        shape: 'round',
    },
    {
        initials: 'EB',
        name: 'Eva Bakker',
        email: 'eva@northwind.studio',
        role: 'Member',
        shape: 'round',
    },
    { initials: 'AC', name: 'Acme Corp', email: 'Guest workspace', role: 'Guest', shape: 'square' },
] as const;

const TeamCard = () => (
    <Card className="w-full max-w-md gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Team</CardTitle>
            <AvatarStack max={4}>
                {['JC', 'BJ', 'EB', 'DV', 'FS', 'CM'].map(initials => (
                    <Avatar fallback={initials} key={initials} shape="round" size={24} />
                ))}
            </AvatarStack>
        </CardHeader>
        <ul className="flex flex-col gap-3">
            {members.map(member => (
                <li className="flex items-center gap-3" key={member.name}>
                    <Avatar fallback={member.initials} shape={member.shape} />
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-neutral-950 text-xs">
                            {member.name}
                        </span>
                        <span className="truncate text-neutral-500 text-xxs">{member.email}</span>
                    </span>
                    <Badge tone={member.role === 'Owner' ? 'primary' : 'neutral'}>
                        {member.role}
                    </Badge>
                </li>
            ))}
        </ul>
    </Card>
);

const integrations = [
    {
        icon: <Hash {...icon} />,
        name: 'Slack',
        description: 'Alerts in a channel',
        connected: true,
    },
    {
        icon: <Mail {...icon} />,
        name: 'Email',
        description: 'Reports on a schedule',
        connected: true,
    },
    {
        icon: <Webhook {...icon} />,
        name: 'Webhooks',
        description: 'Every event, as JSON',
        connected: false,
    },
    {
        icon: <Database {...icon} />,
        name: 'Warehouse',
        description: 'A nightly export',
        connected: false,
    },
];

const Integrations = () => (
    <Card className="w-full max-w-md gap-4">
        <CardTitle>Integrations</CardTitle>
        <ul className="flex flex-col gap-3">
            {integrations.map(item => (
                <li className="flex items-center gap-3" key={item.name}>
                    <IconTile
                        tone={item.connected ? 'success' : 'neutral'}
                        variant={item.connected ? 'outline' : 'filled'}
                    >
                        {item.icon}
                    </IconTile>
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium text-neutral-950 text-xs">{item.name}</span>
                        <span className="text-neutral-500 text-xxs">{item.description}</span>
                    </span>
                    {item.connected ? (
                        <Badge tone="success" variant="dot">
                            Connected
                        </Badge>
                    ) : (
                        <Button variant="secondary">Connect</Button>
                    )}
                </li>
            ))}
        </ul>
    </Card>
);

const TopLists = () => (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
        <Card>
            <BarList limit={4} title="Top pages" valueLabel="Visitors">
                <BarListItem href="#about" value={3312}>
                    /about
                </BarListItem>
                <BarListItem href="#pricing" value={2840}>
                    /pricing
                </BarListItem>
                <BarListItem href="#contact" value={1204}>
                    /contact
                </BarListItem>
                <BarListItem href="#blog" value={860}>
                    /blog
                </BarListItem>
                <BarListItem href="#careers" value={64}>
                    /careers
                </BarListItem>
            </BarList>
        </Card>
        <Card>
            <BarList title="Countries" valueLabel="Visitors">
                <BarListItem value={4210}>Netherlands</BarListItem>
                <BarListItem value={2980}>Germany</BarListItem>
                <BarListItem value={1640}>Belgium</BarListItem>
                <BarListItem value={720}>France</BarListItem>
            </BarList>
        </Card>
    </div>
);

const SessionMeta = () => (
    <Card className="w-full max-w-md gap-4">
        <div className="flex items-center gap-3">
            <Avatar fallback="EB" shape="round" />
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium text-neutral-950 text-xs">Eva Bakker</span>
                <span className="text-neutral-500 text-xxs">Session started 6 minutes ago</span>
            </span>
            <Badge tone="success" variant="dot">
                Live
            </Badge>
        </div>
        <MetaList separated>
            <MetaItem icon={<Clock {...icon} />} label="Duration">
                6m 14s
            </MetaItem>
            <MetaItem icon={<FileText {...icon} />} label="Pages">
                4 pages
            </MetaItem>
            <MetaItem icon={<MessageSquare {...icon} />} label="Chats">
                1 chat
            </MetaItem>
        </MetaList>
        <MetaList layout="grid">
            <MetaItem icon={<MapPin {...icon} />} label="Location">
                Zierikzee
            </MetaItem>
            <MetaItem icon={<Globe {...icon} />} label="Browser">
                Chrome 141
            </MetaItem>
            <MetaItem icon={<Monitor {...icon} />} label="Operating system">
                Windows 11
            </MetaItem>
            <MetaItem icon={<Laptop {...icon} />} label="Device">
                Desktop
            </MetaItem>
            <MetaItem icon={<Building2 {...icon} />} label="Company">
                Northwind
            </MetaItem>
            <MetaItem icon={<Gauge {...icon} />} label="Speed">
                Fast
            </MetaItem>
        </MetaList>
    </Card>
);

/* ---------- Charts ---------- */

const traffic = reportWeek.map((date, i) => ({
    date,
    visitors: [4200, 5100, 4800, 6300, 5900, 3600, 4100][i] ?? 0,
    returning: [1800, 2300, 2100, 2900, 2600, 1500, 1700][i] ?? 0,
}));

const trafficSeries = [
    { key: 'visitors', label: 'Visitors', color: 'var(--color-chart-line-primary)' },
    { key: 'returning', label: 'Returning', color: 'var(--color-chart-line-secondary)' },
];

const VisitorsChart = () => (
    <Card className="w-full gap-3" layout="chart">
        <CardHeader className="flex-row items-start justify-between">
            <div className="flex flex-col gap-1">
                <CardTitle>Visitors this week</CardTitle>
                <CardFigure>
                    <CardValue size="lg">33,900</CardValue>
                    <CardDelta>+10.7% last week</CardDelta>
                </CardFigure>
            </div>
            <SegmentedControl aria-label="Range" defaultValue="7d">
                <SegmentedControlItem value="7d">7d</SegmentedControlItem>
                <SegmentedControlItem value="30d">30d</SegmentedControlItem>
                <SegmentedControlItem value="12m">12m</SegmentedControlItem>
            </SegmentedControl>
        </CardHeader>
        <div aria-label="Visitors and returning visitors per day" className="w-full" role="img">
            <AreaChart
                data={traffic}
                formatXLabel={formatWeekday}
                margin={chartMargin}
                style={{ height: 200 }}
            >
                <Grid />
                {trafficSeries.map(series => (
                    <Area dataKey={series.key} fill={series.color} key={series.key} />
                ))}
                <XAxis numTicks={traffic.length} />
                <YAxis formatValue={value => (value === 0 ? '0' : `${value / 1000}k`)} />
                <ChartTooltip
                    rows={seriesRows(trafficSeries, value => value.toLocaleString('en-GB'))}
                />
            </AreaChart>
        </div>
    </Card>
);

const devices = [
    { label: 'Desktop', value: 7688 },
    { label: 'Mobile', value: 3844 },
    { label: 'Tablet', value: 868 },
];

const DevicesCard = () => (
    <Card className="w-full max-w-md flex-row items-center gap-8 p-6">
        <div aria-label="Sessions by device: desktop 62%, mobile 31%, tablet 7%" role="img">
            <PieChart cornerRadius={2} data={devices} innerRadius={52} padAngle={0.02} size={160}>
                {devices.map((device, index) => (
                    <PieSlice index={index} key={device.label} showGlow={false} />
                ))}
                <PieCenter
                    defaultLabel="Sessions"
                    formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }}
                />
            </PieChart>
        </div>
        <div className="flex flex-1 flex-col gap-3">
            <CardTitle>By device</CardTitle>
            {devices.map((device, i) => (
                <span className="flex items-center gap-2 text-xs" key={device.label}>
                    {/* The slices' own colours, so the legend matches them in every theme. */}
                    <span
                        className="size-2 rounded-full"
                        style={{ background: defaultPieColors[i] }}
                    />
                    <span className="flex-1 text-neutral-700">{device.label}</span>
                    <span className="font-medium text-neutral-950 tabular-nums">
                        {Math.round((device.value / 12400) * 100)}%
                    </span>
                </span>
            ))}
        </div>
    </Card>
);

const FunnelCard = () => (
    <Card className="w-full gap-4">
        <CardHeader>
            <CardTitle>Checkout funnel</CardTitle>
            <CardFigure>
                <CardValue size="lg">32%</CardValue>
                <CardDelta trend="down">−5.1% completion</CardDelta>
            </CardFigure>
        </CardHeader>
        <div className="w-full overflow-x-auto">
            <FunnelChart
                className="min-w-[640px]"
                data={[
                    { label: '/cart', value: 8420 },
                    { label: '/checkout', value: 5110 },
                    { label: '/payment', value: 3240 },
                    { label: '/thank-you', value: 2710 },
                ]}
                style={{ height: 200 }}
            />
        </div>
    </Card>
);

const LoadingChart = () => (
    <Card className="w-full gap-3" layout="chart">
        <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
                <CardTitle>Sessions over time</CardTitle>
                <span className="text-neutral-500 text-xs">Fetching 12 months of data…</span>
            </div>
            <Button disabled variant="secondary">
                <Download {...icon} /> Export
            </Button>
        </CardHeader>
        <AreaChartLoading
            className="h-[200px] w-full"
            label="Loading sessions"
            margin={chartMargin}
        />
    </Card>
);

/* ---------- Feedback ---------- */

const uploads = [
    { name: 'brand-guidelines.pdf', size: '2.4 MB', value: 100 },
    { name: 'homepage-hero.png', size: '860 KB', value: 64 },
    { name: 'q3-figures.xlsx', size: '120 KB', value: 12 },
];

const Uploads = () => (
    <Card className="w-full max-w-md gap-5">
        <Progress label="Uploading 3 files" showValue size="md" value={59} />
        <ul className="flex flex-col gap-4">
            {uploads.map(file => (
                <li className="flex items-center gap-3" key={file.name}>
                    <IconTile
                        tone={file.value === 100 ? 'success' : 'neutral'}
                        variant={file.value === 100 ? 'outline' : 'filled'}
                    >
                        {file.value === 100 ? <CircleCheck {...icon} /> : <FileText {...icon} />}
                    </IconTile>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="truncate font-medium text-neutral-950">
                                {file.name}
                            </span>
                            <span className="shrink-0 text-neutral-500">{file.size}</span>
                        </div>
                        <Progress
                            aria-label={`${file.name} upload`}
                            tone={file.value === 100 ? 'success' : undefined}
                            value={file.value}
                        />
                    </div>
                    <Button aria-label={`Cancel ${file.name}`} size="icon-sm" variant="ghost">
                        <X {...icon} />
                    </Button>
                </li>
            ))}
        </ul>
    </Card>
);

const Usage = () => (
    <Card className="w-full max-w-md gap-5">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Usage · Business plan</CardTitle>
            <Button variant="ghost">Upgrade</Button>
        </CardHeader>
        <Meter label="Seats" showValue value={60} />
        <Meter caption="9.2 of 10 GB" label="Storage" size="md" tone="warning" value={92} />
        <Meter caption="Resets in 10 days" label="Credits" max={10000} tone="chart" value={2450} />
        <Meter caption="Limit reached" label="API calls" size="md" tone="error" value={100} />
    </Card>
);

const systems = [
    { name: 'API', tone: 'success', label: 'Operational' },
    { name: 'Dashboard', tone: 'success', label: 'Operational' },
    { name: 'Webhooks', tone: 'warning', label: 'Delayed' },
    { name: 'Payouts', tone: 'error', label: 'Down' },
] as const;

const StatusPage = () => (
    <Card className="w-full max-w-md gap-4">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Systems</CardTitle>
            <LiveCount count={1284} />
        </CardHeader>
        <ul className="flex flex-col divide-y divide-neutral-200">
            {systems.map(system => (
                <li className="flex h-10 items-center gap-3" key={system.name}>
                    <StatusDot pulse={system.tone !== 'success'} tone={system.tone} />
                    <span className="flex-1 text-neutral-950 text-xs">{system.name}</span>
                    <span className="text-neutral-600 text-xs">{system.label}</span>
                </li>
            ))}
        </ul>
    </Card>
);

/* ---------- AI ---------- */

const SupportThread = () => (
    <Card className="w-full max-w-lg gap-0 p-0">
        <ChatThread className="h-[340px] w-full px-4 pt-4">
            <ChatMessage status="read" time="2:48 PM" variant="own">
                Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>
            </ChatMessage>
            <ChatReference status={<Badge tone="warning">Pending</Badge>} token="#inv_1CU2KZuPR5">
                Payout of €340.00
            </ChatReference>
            <ChatMessage
                author="@Support Bot"
                avatar={<Avatar fallback="SB" shape="round" size={24} />}
                badge={<Badge tone="primary">AI</Badge>}
                time="2:49 PM"
            >
                The payout left on 14 October and usually lands within three working days. I have
                flagged it for the finance team as well.
            </ChatMessage>
            <ChatEvent>Ticket assigned to Lena</ChatEvent>
            <ChatMessage status="delivered" time="2:51 PM" variant="own">
                Thanks, I’ll wait for Lena.
            </ChatMessage>
        </ChatThread>
    </Card>
);

const ComposeQuestion = () => {
    const [sent, setSent] = useState<string[]>([]);

    return (
        <Card className="w-full max-w-lg gap-4">
            <CardTitle>Ask about this report</CardTitle>
            <ChatThread
                className="h-40 w-full p-0"
                empty="Ask anything about Q3: what changed, why, and what to do next."
            >
                {sent.map(text => (
                    <ChatMessage key={text} status="sent" time="now" variant="own">
                        {text}
                    </ChatMessage>
                ))}
            </ChatThread>
            <ChatComposer
                defaultValue="Why did the bounce rate rise in August?"
                onAdd={() => setSent(current => [...current, 'Attached q3-figures.xlsx'])}
                onSend={text => setSent(current => [...current, text])}
                placeholder="Ask a question"
            />
        </Card>
    );
};

/* ---------- Forms, built from the gaps ---------- */

const contactLists: UploadEntry[] = [
    { id: 'october', name: 'contacts-october.csv', size: 2_516_582, progress: 100, status: 'done' },
    { id: 'webinar', name: 'webinar-leads.xlsx', size: 880_640, progress: 38, status: 'uploading' },
];

const ImportContacts = () => {
    const { files, add, remove } = useUploads(contactLists);
    const busy = files.some(file => file.status === 'uploading');

    return (
        <OpenDialog
            footer={
                <DialogActions
                    action={busy ? 'Uploading…' : `Import ${files.length} files`}
                    disabled={busy || files.length === 0}
                />
            }
            title="Import contacts"
            width={520}
        >
            <DropZone
                accept=".csv,.xlsx"
                description="CSV or XLSX with an email column"
                onFiles={add}
                title="Drop contact lists here"
            />
            {files.length > 0 && (
                <DropZoneFiles>
                    {files.map(file => (
                        <DropZoneFile
                            key={file.id}
                            name={file.name}
                            onRemove={() => remove(file.id)}
                            progress={file.progress}
                            size={file.size}
                            status={file.status}
                        />
                    ))}
                </DropZoneFiles>
            )}
        </OpenDialog>
    );
};

const wizardSteps = [
    { label: 'Details', description: 'Name and sender' },
    { label: 'Audience', description: 'Who gets it' },
    { label: 'Schedule', description: 'Date and time' },
    { label: 'Review', description: 'A last check' },
];

const NewCampaign = () => {
    const [step, setStep] = useState(2);
    const last = step === wizardSteps.length;

    return (
        <div className="flex w-full max-w-2xl flex-col gap-8">
            <Stepper aria-label="New campaign" onValueChange={setStep} value={step}>
                {wizardSteps.map((item, i) => (
                    <StepperItem
                        description={item.description}
                        key={item.label}
                        label={item.label}
                        step={i + 1}
                    />
                ))}
            </Stepper>
            <div className="flex flex-col gap-5">
                {step === 1 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel>Campaign name</FieldLabel>
                            <Input defaultValue="Winter webinar follow-up" size="sm" />
                        </Field>
                        <Field>
                            <FieldLabel>Sender</FieldLabel>
                            <Input
                                defaultValue="anna@northwind.io"
                                leadingIcon={<AtSign {...icon} />}
                                size="sm"
                            />
                        </Field>
                    </div>
                )}
                {step === 2 && (
                    <RadioGroup aria-label="Audience" defaultValue="leads">
                        <OptionList>
                            <OptionRow
                                control={<RadioGroupItem value="leads" />}
                                description="1,284 people who signed up for the webinar"
                                label="Webinar leads"
                            />
                            <OptionRow
                                control={<RadioGroupItem value="customers" />}
                                description="3,920 people on a paid plan"
                                label="Customers"
                            />
                        </OptionList>
                    </RadioGroup>
                )}
                {step === 3 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel>Start date</FieldLabel>
                            <DatePicker defaultValue={new Date(2026, 10, 2)} />
                        </Field>
                        <Field>
                            <FieldLabel>Send at</FieldLabel>
                            <Input
                                defaultValue="09:30"
                                leadingIcon={<Clock {...icon} />}
                                size="sm"
                            />
                        </Field>
                    </div>
                )}
                {last && (
                    <DescriptionList>
                        <DescriptionItem term="Campaign">Winter webinar follow-up</DescriptionItem>
                        <DescriptionItem term="Audience">
                            Webinar leads · 1,284 people
                        </DescriptionItem>
                        <DescriptionItem term="Starts">2 November 2026 at 09:30</DescriptionItem>
                    </DescriptionList>
                )}
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    disabled={step === 1}
                    onClick={() => setStep(current => current - 1)}
                    variant="secondary"
                >
                    Back
                </Button>
                <Button onClick={() => setStep(current => (last ? 1 : current + 1))}>
                    {last ? 'Start campaign' : 'Continue'}
                    {last ? <Send {...icon} /> : <ArrowRight {...icon} />}
                </Button>
            </div>
        </div>
    );
};

const filterGroups = [
    {
        id: 'status',
        label: 'Status',
        options: ['Paid', 'Due soon', 'Overdue'],
    },
    {
        id: 'owner',
        label: 'Owner',
        options: ['Anna de Vries', 'Bram Jansen', 'Chloé Martin'],
    },
];

const filteredInvoices = [
    {
        number: 'INV-0142',
        client: 'Acme Corp',
        status: 'Due soon',
        owner: 'Anna de Vries',
        amount: '€4,120.00',
    },
    {
        number: 'INV-0139',
        client: 'Globex',
        status: 'Overdue',
        owner: 'Bram Jansen',
        amount: '€1,860.00',
    },
    {
        number: 'INV-0137',
        client: 'Initech',
        status: 'Paid',
        owner: 'Anna de Vries',
        amount: '€920.00',
    },
    {
        number: 'INV-0134',
        client: 'Umbrella',
        status: 'Overdue',
        owner: 'Chloé Martin',
        amount: '€2,340.00',
    },
    {
        number: 'INV-0131',
        client: 'Hooli',
        status: 'Paid',
        owner: 'Bram Jansen',
        amount: '€6,480.00',
    },
];

const statusTone: Record<string, 'success' | 'warning' | 'error'> = {
    Paid: 'success',
    'Due soon': 'warning',
    Overdue: 'error',
};

const FilteredInvoices = () => {
    const stage = useStageContainer();
    const [values, setValues] = useState<FilterValues>({ status: ['Due soon', 'Overdue'] });
    const count = countFilters(values);
    const rows = filteredInvoices.filter(invoice =>
        Object.entries(values).every(([group, picked]) =>
            picked.includes(group === 'status' ? invoice.status : invoice.owner),
        ),
    );

    return (
        <Card className="w-full max-w-xl gap-4 self-start">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Invoices</CardTitle>
                <span className="text-neutral-600 text-xs tabular-nums">
                    {rows.length} of {filteredInvoices.length}
                </span>
            </CardHeader>
            <FilterBar>
                <FilterMenu modal={false} open>
                    <FilterMenuTrigger count={count} />
                    <FilterMenuContent container={stage}>
                        {filterGroups.map(group => (
                            <FilterMenuGroup key={group.id} label={group.label}>
                                {group.options.map(option => (
                                    <FilterMenuItem
                                        checked={values[group.id]?.includes(option) ?? false}
                                        count={
                                            filteredInvoices.filter(invoice =>
                                                [invoice.status, invoice.owner].includes(option),
                                            ).length
                                        }
                                        key={option}
                                        onCheckedChange={() =>
                                            setValues(current =>
                                                toggleFilter(current, group.id, option),
                                            )
                                        }
                                    >
                                        {option}
                                    </FilterMenuItem>
                                ))}
                            </FilterMenuGroup>
                        ))}
                        <FilterMenuClear disabled={count === 0} onClick={() => setValues({})} />
                    </FilterMenuContent>
                </FilterMenu>
            </FilterBar>
            <ul className="flex flex-col gap-3">
                {rows.map(invoice => (
                    <li className="flex items-center gap-3 text-xs" key={invoice.number}>
                        <span className="w-20 shrink-0 text-neutral-500 tabular-nums">
                            {invoice.number}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                            {invoice.client}
                        </span>
                        <Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge>
                        <span className="w-20 shrink-0 text-right text-neutral-900 tabular-nums">
                            {invoice.amount}
                        </span>
                    </li>
                ))}
                {rows.length === 0 && (
                    <li className="text-neutral-600 text-xs">No invoices match these filters.</li>
                )}
            </ul>
        </Card>
    );
};

/* ---------- Navigation and feedback, built from the gaps ---------- */

const recentReports = ['Northwind Q3 review', 'Acme renewal forecast', 'Board pack · October'];

const JumpAnywhere = () => {
    const stage = useStageContainer();
    const [query, setQuery] = useState('');

    return (
        <CommandMenu modal={false} onQueryChange={setQuery} open query={query}>
            <CommandMenuContent
                className="mt-8"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <CommandMenuInput placeholder="Search reports, people and settings" />
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
                    <CommandMenuGroup label="People">
                        <CommandMenuItem
                            hint="Finance"
                            icon={<Avatar className="size-4 text-[8px]" fallback="AV" size={24} />}
                            value="Anna de Vries"
                        />
                        <CommandMenuItem
                            hint="Sales"
                            icon={<Avatar className="size-4 text-[8px]" fallback="BJ" size={24} />}
                            value="Bram Jansen"
                        />
                    </CommandMenuGroup>
                    <CommandMenuGroup label="Actions">
                        <CommandMenuItem
                            hint={<Kbd>⌘N</Kbd>}
                            icon={<Plus {...icon} />}
                            value="New report"
                        />
                        <CommandMenuItem
                            icon={<Upload {...icon} />}
                            keywords={['csv', 'contacts']}
                            value="Import contacts"
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

const archivable = [
    { id: 'q3', name: 'Northwind Q3 review', owner: 'Anna de Vries' },
    { id: 'renewal', name: 'Acme renewal forecast', owner: 'Bram Jansen' },
    { id: 'board', name: 'Board pack · October', owner: 'Chloé Martin' },
    { id: 'churn', name: 'Churn by plan', owner: 'Daan Visser' },
];

const ReportRows = () => {
    const toast = useToast();
    const [reports, setReports] = useState(archivable.slice(1));

    // The piece opens just after an export and an archive, so a long toast and a short one show.
    // biome-ignore lint/correctness/useExhaustiveDependencies: once, on mount
    useEffect(() => {
        const first = archivable[0];
        if (!first) return;
        const exported = toast.add({
            title: 'Board pack is exporting',
            description:
                '38 pages with charts, so it takes a minute or two. We’ll email you a download link when it’s ready.',
            timeout: 0,
            actionProps: { children: 'Open exports' },
        });
        const id = toast.add({
            title: 'Report archived',
            description: first.name,
            type: 'success',
            timeout: 0,
            actionProps: {
                children: 'Undo',
                onClick: () => {
                    setReports(current => [first, ...current]);
                    toast.close(id);
                },
            },
        });
        return () => {
            toast.close(exported);
            toast.close(id);
        };
    }, []);

    const archive = (report: (typeof archivable)[number]) => {
        setReports(current => current.filter(item => item.id !== report.id));
        const id = toast.add({
            title: 'Report archived',
            description: report.name,
            type: 'success',
            actionProps: {
                children: 'Undo',
                onClick: () => {
                    setReports(current =>
                        archivable.filter(item =>
                            [...current.map(row => row.id), report.id].includes(item.id),
                        ),
                    );
                    toast.close(id);
                },
            },
        });
    };

    return (
        <Card className="mb-16 w-full max-w-lg gap-3">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Reports</CardTitle>
                <span className="text-neutral-600 text-xs tabular-nums">{reports.length}</span>
            </CardHeader>
            <ul className="flex flex-col gap-1">
                {reports.map(report => (
                    <li className="flex h-[34px] items-center gap-3 text-xs" key={report.id}>
                        <FileText className="size-4 shrink-0 text-neutral-600" {...icon} />
                        <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                            {report.name}
                        </span>
                        <span className="shrink-0 text-neutral-500 max-sm:hidden">
                            {report.owner}
                        </span>
                        <Button
                            aria-label={`Archive ${report.name}`}
                            onClick={() => archive(report)}
                            size="icon-sm"
                            variant="ghost"
                        >
                            <Archive {...icon} />
                        </Button>
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const ArchiveReports = () => {
    const stage = useStageContainer();

    return (
        <ToastProvider container={stage}>
            <ReportRows />
        </ToastProvider>
    );
};

const BillingNotice = () => (
    <Card className="w-full max-w-xl gap-5">
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Billing</CardTitle>
            <Badge tone="success">Business plan</Badge>
        </CardHeader>
        <Alert
            action={<Button variant="secondary">Update card</Button>}
            title="Your card expires next month"
            tone="warning"
        >
            Update it before 1 December to keep the Business plan.
        </Alert>
        <SettingGroup>
            <SettingRow
                control={<Switch defaultChecked />}
                description="Send each invoice to finance@northwind.io as well"
                title="Copy invoices to finance"
            />
            <SettingRow
                control={<Button variant="secondary">Change</Button>}
                description="Visa ending 4242, expires 11/26"
                labelControl={false}
                title="Payment method"
            />
        </SettingGroup>
    </Card>
);

const onboarding = [
    { title: 'Create your workspace', description: '', action: '' },
    {
        title: 'Invite your team',
        description: 'Reports are better with the people who read them.',
        action: 'Invite teammates',
    },
    {
        title: 'Connect a data source',
        description: 'Analytics, your CRM or a spreadsheet; numbers refresh every hour.',
        action: 'Connect a source',
    },
    {
        title: 'Send your first report',
        description: 'Pick a template and send it to yourself first.',
        action: 'Send a report',
    },
    {
        title: 'Schedule a weekly digest',
        description: 'Every Monday at nine, the week in one email.',
        action: 'Schedule it',
    },
];

const GetStarted = () => {
    const [done, setDone] = useState(2);
    const finished = done === onboarding.length;

    return (
        <Checklist
            action={
                finished ? (
                    <Button onClick={() => setDone(1)} variant="ghost">
                        Start over
                    </Button>
                ) : (
                    <Button variant="ghost">Skip for now</Button>
                )
            }
            className="w-full max-w-md"
            completed={done}
            title={finished ? 'You’re all set' : 'Get started with Continuum'}
            total={onboarding.length}
        >
            {onboarding.map((step, i) => (
                <ChecklistItem
                    action={
                        <>
                            <Button onClick={() => setDone(n => n + 1)}>{step.action}</Button>
                            <Button onClick={() => setDone(n => n + 1)} variant="ghost">
                                Skip
                            </Button>
                        </>
                    }
                    current={i === done}
                    description={step.description}
                    done={i < done}
                    key={step.title}
                    title={step.title}
                />
            ))}
        </Checklist>
    );
};

const customers = [
    { name: 'Acme Corp', email: 'billing@acme.com', initials: 'AC', plan: 'Business' },
    { name: 'Globex', email: 'ap@globex.io', initials: 'GL', plan: 'Starter' },
    { name: 'Initech', email: 'finance@initech.com', initials: 'IN', plan: 'Business' },
    { name: 'Umbrella', email: 'accounts@umbrella.co', initials: 'UM', plan: 'Enterprise' },
];

const LoadingCustomers = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!loading) return;
        const timer = window.setTimeout(() => setLoading(false), 2400);
        return () => window.clearTimeout(timer);
    }, [loading]);

    return (
        <Card className="w-full max-w-lg gap-4">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Customers</CardTitle>
                <Button loading={loading} onClick={() => setLoading(true)} variant="ghost">
                    {loading ? 'Loading' : 'Reload'}
                </Button>
            </CardHeader>
            <ul aria-busy={loading} className="flex flex-col gap-4">
                {customers.map(customer => (
                    <li className="flex h-8 items-center gap-3" key={customer.name}>
                        {loading ? (
                            <>
                                <Skeleton className="size-8 rounded-full" />
                                <div className="flex flex-1 flex-col gap-2">
                                    <Skeleton className="h-2.5 w-28 rounded-chip" />
                                    <Skeleton className="h-2.5 w-40 rounded-chip" />
                                </div>
                                <Skeleton className="h-[22px] w-16 rounded-chip" />
                            </>
                        ) : (
                            <>
                                <Avatar fallback={customer.initials} shape="round" size={32} />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate font-medium text-neutral-950 text-xs">
                                        {customer.name}
                                    </span>
                                    <span className="truncate text-neutral-600 text-xs">
                                        {customer.email}
                                    </span>
                                </div>
                                <Badge>{customer.plan}</Badge>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    );
};

const PublishReport = () => {
    const [state, setState] = useState<'idle' | 'busy' | 'done'>('busy');

    useEffect(() => {
        if (state !== 'busy') return;
        const timer = window.setTimeout(() => setState('done'), 2400);
        return () => window.clearTimeout(timer);
    }, [state]);

    return (
        <OpenDialog
            footer={
                <>
                    <DialogClose
                        render={<Button disabled={state === 'busy'} variant="secondary" />}
                    >
                        Cancel
                    </DialogClose>
                    <Button loading={state === 'busy'} onClick={() => setState('busy')}>
                        {state === 'busy'
                            ? 'Publishing…'
                            : state === 'done'
                              ? 'Publish again'
                              : 'Publish'}
                    </Button>
                </>
            }
            title="Publish report"
        >
            <DialogDescription>
                Everyone with the link sees the numbers as they are now; later changes wait for the
                next publish.
            </DialogDescription>
            <ValueField copyable label="Link" value="continuum.app/r/northwind-q3" />
            {state === 'done' && (
                <p className="flex items-center gap-1.5 text-neutral-600 text-xs">
                    <CircleCheck className="size-4 text-success-600" {...icon} /> Published just now
                </p>
            )}
        </OpenDialog>
    );
};

const overdueInvoices = [
    { number: 'INV-0139', client: 'Globex', amount: '€1,860.00' },
    { number: 'INV-0134', client: 'Umbrella', amount: '€2,340.00' },
];

const NoOverdue = () => {
    const [filtered, setFiltered] = useState(true);

    return (
        <div className="flex w-full max-w-xl flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-neutral-950 text-sm">Invoices</p>
                <Button>
                    New invoice <Plus {...icon} />
                </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <FilterChip icon={<CalendarDays {...icon} />}>This quarter</FilterChip>
                {filtered ? (
                    <FilterChip
                        icon={<CircleAlert {...icon} />}
                        onRemove={() => setFiltered(false)}
                        removeLabel="Remove the overdue filter"
                    >
                        Status is Overdue
                    </FilterChip>
                ) : (
                    <Button onClick={() => setFiltered(true)} variant="ghost">
                        <Plus {...icon} /> Overdue only
                    </Button>
                )}
            </div>
            {filtered ? (
                <EmptyState
                    action={
                        <Button onClick={() => setFiltered(false)} variant="secondary">
                            Show all invoices
                        </Button>
                    }
                    description="Everything sent this quarter has been paid or is not due yet."
                    icon={<CircleCheck {...icon} />}
                    title="No overdue invoices"
                />
            ) : (
                <ul className="flex flex-col gap-3">
                    {overdueInvoices
                        .map(invoice => ({ ...invoice, status: 'Due soon' }))
                        .map(invoice => (
                            <li className="flex items-center gap-3 text-xs" key={invoice.number}>
                                <span className="w-20 shrink-0 text-neutral-500 tabular-nums">
                                    {invoice.number}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                                    {invoice.client}
                                </span>
                                <Badge tone="warning">{invoice.status}</Badge>
                                <span className="w-20 shrink-0 text-right text-neutral-900 tabular-nums">
                                    {invoice.amount}
                                </span>
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
};

/* ---------- One piece per component ---------- */

const scene = (node: ReactNode, className?: string) => () => (
    <Scene className={className}>{node}</Scene>
);

export const inUse: Record<string, InUse> = {
    button: {
        title: 'Empty state',
        note: 'The primary action, a secondary one beside it, and a ghost link under them.',
        canvas: true,
        render: () => <EmptyReports />,
    },
    badge: {
        title: 'Invoice statuses',
        note: 'A soft badge per status, a count by the title and a delta pill beside it.',
        canvas: true,
        render: () => <InvoiceStatuses />,
    },
    'filter-chip': {
        title: 'Applied filters',
        note: 'Every filter as a chip that removes itself, over the number it narrows.',
        canvas: true,
        render: () => <FilteredSessions />,
    },
    'suggestion-chip': {
        title: 'Assistant, before the first question',
        note: 'Questions to start from, as chips.',
        canvas: true,
        render: () => <AskEmpty />,
    },
    toolbar: {
        title: 'Selection toolbar',
        note: 'AI actions floating under a selected sentence in a document.',
        canvas: true,
        render: () => <SelectionToolbar />,
    },
    kbd: {
        title: 'Command palette',
        note: 'A shortcut beside every command, and the keys to drive the list.',
        bare: true,
        render: scene(<CommandPalette />),
    },
    'bottom-bar': {
        title: 'Campaign wizard',
        note: 'The steps as a dock at the foot of the page, the action beside them.',
        render: () => <DockFrame />,
    },
    input: {
        title: 'New project',
        note: 'Inputs in a dialog: a plain one, one with an icon and a suffix that is invalid, an empty one.',
        bare: true,
        render: scene(<NewProject />),
    },
    field: {
        title: 'Invite a teammate',
        note: 'Every field labelled, one invalid with its message, a textarea with a hint.',
        bare: true,
        render: scene(<InviteTeammate />),
    },
    select: {
        title: 'Move report',
        note: 'Two selects in a dialog, the first one open.',
        bare: true,
        render: scene(<MoveReport />, 'min-h-[480px]'),
    },
    combobox: {
        title: 'Assign a record',
        note: 'A person picked by typing, the list open under the box.',
        bare: true,
        render: scene(<AssignOwner />, 'min-h-[480px]'),
    },
    checkbox: {
        title: 'Invoice table',
        note: 'Selection, a client with an avatar, status badges, numeric columns, row actions and pagination.',
        render: () => <InvoiceTable />,
    },
    radio: {
        title: 'Export format',
        note: 'One choice of three, each with what it means.',
        bare: true,
        render: scene(<ExportFormat />),
    },
    switch: {
        title: 'Share settings',
        note: 'Switches that take effect at once, each with what it does.',
        canvas: true,
        render: () => <ShareReport />,
    },
    slider: {
        title: 'Alert thresholds',
        note: 'Two sliders and a range, each with its value beside the label.',
        canvas: true,
        render: () => <Thresholds />,
    },
    segmented: {
        title: 'Appearance',
        note: 'A segmented control per setting, each holding one value.',
        canvas: true,
        render: () => <Appearance />,
    },
    'option-row': {
        title: 'Export report',
        note: 'Parts to include as checkbox rows, the audience as radio rows.',
        bare: true,
        render: scene(<ExportReport />, 'min-h-[480px]'),
    },
    'setting-row': {
        title: 'Notification settings',
        note: 'Setting rows with a switch, a picker and an action, one disabling the next.',
        canvas: true,
        render: () => <NotificationSettings />,
    },
    'date-picker': {
        title: 'Schedule a report',
        note: 'Two dates side by side in a dialog.',
        bare: true,
        render: scene(<ScheduleReport />),
    },
    'date-range-picker': {
        title: 'Compare periods',
        note: 'A range and the one it is compared to.',
        canvas: true,
        render: () => <ComparePeriods />,
    },
    'code-input': {
        title: 'Verify your email',
        note: 'Six boxes, half filled; Continue waits for the rest.',
        bare: true,
        render: scene(<VerifyEmail />),
    },
    'value-field': {
        title: 'API credentials',
        note: 'Values to read and copy, and two vitals under them.',
        canvas: true,
        render: () => <Credentials />,
    },
    'drop-zone': {
        title: 'Import contacts',
        note: 'A drop zone in a dialog, its files uploading under it; Import waits for them.',
        bare: true,
        render: scene(<ImportContacts />, 'min-h-[480px]'),
    },
    stepper: {
        title: 'New campaign',
        note: 'Four steps over the form; Continue moves on, a done step goes back.',
        render: () => <NewCampaign />,
    },
    'filter-menu': {
        title: 'Filtered invoices',
        note: 'The menu open over the list it narrows, the count of what is picked on its button.',
        bare: true,
        render: scene(<FilteredInvoices />, 'min-h-[480px] items-start'),
    },
    sidebar: {
        title: 'Sidebar',
        note: 'The call to action, rows with a shortcut and a count, projects that fold open, the account.',
        canvas: true,
        render: () => <SidebarNav />,
    },
    rail: {
        title: 'Dashboard rail',
        note: 'The sections as icons, each named in a tooltip on hover.',
        render: () => <RailFrame />,
    },
    tabs: {
        title: 'Report facets',
        note: 'Tabs that switch the content under them, one not available yet.',
        canvas: true,
        render: () => <RiskTabs />,
    },
    breadcrumb: {
        title: 'A deep trail',
        note: 'A workspace switcher first, the middle folded into a menu, the page truncating last.',
        bare: true,
        render: scene(<BreadcrumbHeader />, 'items-start'),
    },
    'header-bar': {
        title: 'Editing a report',
        note: 'Save and Copy link answer from under the bar; nothing lands on the page.',
        canvas: true,
        render: () => <EditReport />,
    },
    pagination: {
        title: 'Contacts',
        note: 'Results on the left, the pages in the middle, rows per page on the right.',
        canvas: true,
        render: () => <ContactsList />,
    },
    logo: {
        title: 'Sign in',
        note: 'The lockup over a one-field sign in.',
        canvas: true,
        render: () => <SignIn />,
    },
    'command-menu': {
        title: 'Jump anywhere',
        note: 'Recent reports, people and actions in one search; type to narrow it.',
        bare: true,
        render: scene(<JumpAnywhere />, 'min-h-[520px] items-start'),
    },
    dialog: {
        title: 'Confirm a deletion',
        note: 'A destructive action that asks for the name back.',
        bare: true,
        render: scene(<DeleteReport />),
    },
    sheet: {
        title: 'History beside a record',
        note: 'The record stays usable; its history is in a sheet beside it.',
        bare: true,
        render: scene(<HistorySheet />, 'min-h-[460px] items-start justify-start p-6'),
    },
    menu: {
        title: 'File actions',
        note: 'The actions for a row, opened from its ellipsis.',
        bare: true,
        render: scene(<FileMenu />),
    },
    popover: {
        title: 'Column settings',
        note: 'Controls in a panel anchored to the button that opened it.',
        bare: true,
        render: scene(<ColumnsPopover />),
    },
    tooltip: {
        title: 'Formatting bar',
        note: 'Icon buttons, each named in a tooltip.',
        bare: true,
        render: scene(<EditorTooltips />),
    },
    'info-tip': {
        title: 'Credits',
        note: 'A term explained where it is used.',
        bare: true,
        render: scene(<CreditsTip />),
    },
    'stat-card': {
        title: 'This week',
        note: 'Four numbers with their change, up, down and flat.',
        canvas: true,
        render: () => <WeekStats />,
    },
    card: {
        title: 'Headline figures',
        note: 'A title, a value with its change, and one fact under it.',
        canvas: true,
        render: () => <RevenueCards />,
    },
    'meta-row': {
        title: 'Invoice summary',
        note: 'The lines of an invoice, label and value, with the total under them.',
        canvas: true,
        render: () => <InvoiceSummary />,
    },
    table: {
        title: 'Email sequence',
        note: 'Steps grouped into phases, numbers right-aligned.',
        render: () => <SequenceTable />,
    },
    'description-list': {
        title: 'Customer',
        note: 'Facts about a record, a term and its value per row.',
        canvas: true,
        render: () => <CustomerDetails />,
    },
    activity: {
        title: 'Activity feed',
        note: 'What happened, when, in a tone, with the status beside it.',
        canvas: true,
        render: () => <ActivityFeed />,
    },
    avatar: {
        title: 'Team',
        note: 'People round, a workspace square, the whole team stacked in the header.',
        canvas: true,
        render: () => <TeamCard />,
    },
    'icon-tile': {
        title: 'Integrations',
        note: 'A tile per integration, outlined in a tone once it is connected.',
        canvas: true,
        render: () => <Integrations />,
    },
    'bar-list': {
        title: 'Top pages and countries',
        note: 'Ranked rows with a bar behind each, one list folded after four.',
        canvas: true,
        render: () => <TopLists />,
    },
    'meta-list': {
        title: 'Live session',
        note: 'Small facts about a visit, in a row and in a grid.',
        canvas: true,
        render: () => <SessionMeta />,
    },
    'area-chart': {
        title: 'Visitors this week',
        note: 'Two series with a tooltip, under the figure they add up to.',
        canvas: true,
        render: () => <VisitorsChart />,
    },
    'pie-chart': {
        title: 'Sessions by device',
        note: 'A donut with its total in the middle and the share of each slice beside it.',
        canvas: true,
        render: () => <DevicesCard />,
    },
    'funnel-chart': {
        title: 'Checkout funnel',
        note: 'The steps as the chart, the completion rate as the figure.',
        canvas: true,
        render: () => <FunnelCard />,
    },
    'chart-loading': {
        title: 'Loading a chart',
        note: 'The chart’s shape while its data is on the way.',
        canvas: true,
        render: () => <LoadingChart />,
    },
    progress: {
        title: 'Uploads',
        note: 'Progress for the whole and for every file.',
        canvas: true,
        render: () => <Uploads />,
    },
    meter: {
        title: 'Usage',
        note: 'Usage against each limit, in the tone of how close it is.',
        canvas: true,
        render: () => <Usage />,
    },
    'status-dot': {
        title: 'Status page',
        note: 'A dot per system, pulsing while something is wrong, and a live count.',
        canvas: true,
        render: () => <StatusPage />,
    },
    alert: {
        title: 'Billing',
        note: 'A warning at the top of the settings it concerns, with the fix beside it.',
        canvas: true,
        render: () => <BillingNotice />,
    },
    toast: {
        title: 'Archive a report',
        note: 'Each archive confirms itself at the foot, with Undo that puts the row back.',
        bare: true,
        render: scene(<ArchiveReports />),
    },
    'empty-state': {
        title: 'Filtered to nothing',
        note: 'A filter that matches nothing says so, and offers the way back.',
        render: () => <NoOverdue />,
    },
    skeleton: {
        title: 'Customers loading',
        note: 'Rows at their real size while the list loads; Reload loads it again.',
        canvas: true,
        render: () => <LoadingCustomers />,
    },
    spinner: {
        title: 'Publish report',
        note: 'The button that was pressed works; Cancel waits for it.',
        bare: true,
        render: scene(<PublishReport />),
    },
    checklist: {
        title: 'Get started',
        note: 'Five steps, two done, the next one open with its action.',
        canvas: true,
        render: () => <GetStarted />,
    },
    chat: {
        title: 'Support thread',
        note: 'Own and other messages, a referenced record and a system event.',
        canvas: true,
        render: () => <SupportThread />,
    },
    'chat-composer': {
        title: 'Ask about a report',
        note: 'An empty thread and the composer with a question drafted.',
        canvas: true,
        render: () => <ComposeQuestion />,
    },
};

/** The one piece an entry is shown in. */
export const inUseOf = (id: string): InUse | undefined => inUse[id];
