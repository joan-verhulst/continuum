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
    DialogTrigger,
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
    SheetTrigger,
    Skeleton,
    SkeletonText,
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
    FunnelChart,
    Grid,
    PieCenter,
    // Renamed: lucide's PieChart icon is imported below.
    PieChart as PieChartRoot,
    PieSlice,
    XAxis,
    YAxis,
} from 'continuum/charts';
import {
    ArrowRight,
    BarChart3,
    Bell,
    CalendarDays,
    Check,
    CircleAlert,
    CircleCheck,
    CircleX,
    Clock,
    Columns3,
    Copy,
    Ellipsis,
    Eye,
    FileText,
    Folder,
    Globe,
    HandCoins,
    History,
    Home,
    Inbox,
    Laptop,
    Link2,
    ListTree,
    Mail,
    MapPin,
    Megaphone,
    Minimize2,
    Monitor,
    Pencil,
    PencilLine,
    PieChart,
    Plus,
    Rocket,
    Search,
    Send,
    SendHorizontal,
    Settings,
    ShieldCheck,
    Sparkles,
    Star,
    Table2,
    Timer,
    Trash2,
    TrendingDown,
    TrendingUp,
    UserRound,
    Users,
    WandSparkles,
    Workflow,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useStageContainer } from '../layout';
import { chartMargin, formatWeekday, reportWeek, seriesRows } from '../screens/shared';

const icon = { strokeWidth: 1.5 } as const;

export const categories = [
    { id: 'actions', label: 'Actions' },
    { id: 'forms', label: 'Forms' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'overlays', label: 'Overlays' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'data', label: 'Data' },
    { id: 'charts', label: 'Charts' },
    { id: 'ai', label: 'AI' },
] as const;

export type Category = (typeof categories)[number]['id'];

/*
 * Knobs: a component's variants and states are not laid out as a grid of every
 * combination; the page shows one, and a panel beside the stage picks which.
 */

export type KnobOption = { value: string; label: string };

export type Knob =
    | { id: string; label: string; options: readonly KnobOption[]; default: string }
    | { id: string; label: string; switch: true; default: boolean };

export type KnobValues = Record<string, string | boolean>;

export type PreviewProps = { knobs: KnobValues };

export const knobDefaults = (knobs: readonly Knob[] = []): KnobValues =>
    Object.fromEntries(knobs.map(knob => [knob.id, knob.default]));

const o = (value: string, label = value): KnobOption => ({ value, label });

/** Options named after their values, capitalised. */
const opts = (...values: string[]) =>
    values.map(value => o(value, value.charAt(0).toUpperCase() + value.slice(1)));

const tones = ['neutral', 'success', 'warning', 'error', 'primary'] as const;

type Tone = (typeof tones)[number];

const sizes = [o('sm', 'sm · 34px'), o('md', 'md · 38px')];

export type Entry = {
    id: string;
    name: string;
    category: Category;
    description: string;
    /** Columns taken in the grid; charts and tables need the room. */
    span?: 2 | 3;
    /** Classes for the tile's stage on the grid. */
    stageClassName?: string;
    /** Classes for the stage at the top of the component's page. */
    hero?: string;
    /** What the page's panel can change about the preview; the grid shows the defaults. */
    knobs?: readonly Knob[];
    Preview: (props: PreviewProps) => ReactNode;
};

/** A control with its label beside it; the Field wires the label to the control. */
const Labelled = ({ children, label }: { children: ReactNode; label: string }) => (
    <Field className="flex-row items-center gap-2.5">
        {children}
        <FieldLabel className="cursor-pointer">{label}</FieldLabel>
    </Field>
);

/* ---------- Actions ---------- */

const buttonKnobs: Knob[] = [
    {
        id: 'variant',
        label: 'Variant',
        options: opts('primary', 'secondary', 'ghost', 'tint'),
        default: 'primary',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 34px'), o('lg', 'lg · 38px'), o('icon', 'Icon')],
        default: 'md',
    },
    {
        id: 'icon',
        label: 'Icon',
        options: [o('none', 'None'), o('leading', 'Leading'), o('trailing', 'Trailing')],
        default: 'leading',
    },
    { id: 'pill', label: 'Pill', switch: true, default: false },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const ButtonPreview = ({ knobs }: PreviewProps) => {
    const variant = knobs.variant as 'primary' | 'secondary' | 'ghost' | 'tint';
    const shape = knobs.pill ? 'pill' : undefined;

    if (knobs.size === 'icon') {
        return (
            <Button
                aria-label="New report"
                disabled={Boolean(knobs.disabled)}
                shape={shape}
                size="icon"
                variant={variant}
            >
                <Plus {...icon} />
            </Button>
        );
    }

    return (
        <Button
            disabled={Boolean(knobs.disabled)}
            shape={shape}
            size={knobs.size === 'lg' ? 'lg' : undefined}
            variant={variant}
        >
            {knobs.icon === 'leading' && <Plus {...icon} />}
            New report
            {knobs.icon === 'trailing' && <ArrowRight {...icon} />}
        </Button>
    );
};

const badgeKnobs: Knob[] = [
    {
        id: 'variant',
        label: 'Variant',
        options: opts('soft', 'pill', 'dot', 'count'),
        default: 'soft',
    },
    { id: 'tone', label: 'Tone', options: opts(...tones), default: 'success' },
    { id: 'icon', label: 'Icon', switch: true, default: true },
];

const badgeText: Record<Tone, string> = {
    neutral: 'Draft',
    success: 'Paid',
    warning: 'Due soon',
    error: 'Overdue',
    primary: 'Scheduled',
};

const BadgePreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as Tone;
    const variant = knobs.variant as 'soft' | 'pill' | 'dot' | 'count';
    const glyph = tone === 'error' ? <TrendingDown {...icon} /> : <TrendingUp {...icon} />;

    return (
        <Badge
            icon={variant === 'pill' && knobs.icon ? glyph : undefined}
            tone={tone}
            variant={variant}
        >
            {variant === 'pill'
                ? tone === 'error'
                    ? '−4.2%'
                    : '+12.5%'
                : variant === 'count'
                  ? '24'
                  : badgeText[tone]}
        </Badge>
    );
};

const initialFilters = [
    { id: 'country', label: 'Country is Netherlands', icon: <Globe {...icon} /> },
    { id: 'device', label: 'Device is mobile', icon: <Users {...icon} /> },
];

const FilterChipPreview = () => {
    const [filters, setFilters] = useState(initialFilters);

    return (
        <div className="flex max-w-72 flex-wrap items-center justify-center gap-2">
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
            {filters.length < initialFilters.length && (
                <Button onClick={() => setFilters(initialFilters)} size="icon-sm" variant="ghost">
                    <Plus {...icon} />
                    <span className="sr-only">Restore filters</span>
                </Button>
            )}
        </div>
    );
};

const SuggestionChipPreview = () => {
    const [picked, setPicked] = useState<string>();

    return (
        <div className="flex max-w-72 flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
                {['Summarise this quarter', 'Compare to last year'].map(suggestion => (
                    <SuggestionChip
                        icon={<Sparkles {...icon} />}
                        key={suggestion}
                        onClick={() => setPicked(suggestion)}
                    >
                        {suggestion}
                    </SuggestionChip>
                ))}
            </div>
            <span className="text-neutral-500 text-xxs">
                {picked ? `Asked: ${picked}` : 'Pick one to ask'}
            </span>
        </div>
    );
};

const KbdPreview = () => (
    <p className="flex items-center gap-1.5 text-neutral-600 text-xs">
        Press <Kbd>⌘</Kbd>
        <Kbd>K</Kbd> to search, <Kbd>Esc</Kbd> to close
    </p>
);

const toolbarKnobs: Knob[] = [
    { id: 'variant', label: 'Variant', options: opts('inline', 'floating'), default: 'inline' },
];

const ToolbarPreview = ({ knobs }: PreviewProps) => {
    const [last, setLast] = useState<string>();

    return (
        <div className="flex flex-col items-center gap-3">
            <Toolbar
                aria-label="AI suggestions"
                variant={knobs.variant === 'floating' ? 'floating' : undefined}
            >
                <ToolbarChip>AI</ToolbarChip>
                <ToolbarButton onClick={() => setLast('Rewrite')}>
                    <WandSparkles {...icon} /> Rewrite
                </ToolbarButton>
                <ToolbarButton onClick={() => setLast('Shorten')}>
                    <Minimize2 {...icon} /> Shorten
                </ToolbarButton>
                <ToolbarButton onClick={() => setLast('Accept')}>
                    <Check {...icon} /> Accept
                </ToolbarButton>
            </Toolbar>
            <span className="text-neutral-500 text-xxs">{last ?? 'Inline over a selection'}</span>
        </div>
    );
};

const bottomBarKnobs: Knob[] = [
    {
        id: 'shape',
        label: 'Shape',
        options: [o('theme', 'Theme'), o('pill', 'Pill'), o('rounded', 'Rounded')],
        default: 'theme',
    },
    { id: 'action', label: 'Action', switch: true, default: true },
];

const BottomBarPreview = ({ knobs }: PreviewProps) => {
    const shape = knobs.shape as 'theme' | 'pill' | 'rounded';

    return (
        <BottomBar>
            <Dock aria-label="Campaign" defaultValue="audience" shape={shape}>
                <DockItem value="eligibility">
                    <ShieldCheck {...icon} />
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
            {knobs.action && (
                <DockAction shape={shape}>
                    Start campaign
                    <Rocket {...icon} />
                </DockAction>
            )}
        </BottomBar>
    );
};

/* ---------- Forms ---------- */

const inputKnobs: Knob[] = [
    { id: 'size', label: 'Size', options: sizes, default: 'md' },
    {
        id: 'state',
        label: 'State',
        options: [
            o('empty', 'Empty'),
            o('filled', 'Filled'),
            o('invalid', 'Invalid'),
            o('disabled', 'Disabled'),
        ],
        default: 'filled',
    },
    { id: 'leading', label: 'Leading icon', switch: true, default: true },
    { id: 'trailing', label: 'Trailing kbd', switch: true, default: false },
];

const InputPreview = ({ knobs }: PreviewProps) => (
    <Input
        aria-invalid={knobs.state === 'invalid' || undefined}
        className="w-64"
        defaultValue={knobs.state === 'empty' ? undefined : 'Northwind quarterly review'}
        disabled={knobs.state === 'disabled'}
        key={String(knobs.state)}
        leadingIcon={knobs.leading ? <Search {...icon} /> : undefined}
        placeholder="Search reports"
        size={knobs.size === 'sm' ? 'sm' : 'md'}
        trailing={knobs.trailing ? <Kbd>⌘K</Kbd> : undefined}
    />
);

const fieldKnobs: Knob[] = [
    { id: 'control', label: 'Control', options: opts('input', 'textarea'), default: 'input' },
    { id: 'helper', label: 'Helper', switch: true, default: true },
    { id: 'invalid', label: 'Invalid', switch: true, default: false },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const FieldPreview = ({ knobs }: PreviewProps) => (
    <Field className="w-64" disabled={Boolean(knobs.disabled)} invalid={Boolean(knobs.invalid)}>
        <FieldLabel>{knobs.control === 'textarea' ? 'Notes' : 'Invoice number'}</FieldLabel>
        {knobs.control === 'textarea' ? (
            <Textarea className="min-h-16" placeholder="Add a note for the client" />
        ) : (
            <Input defaultValue="INV-2025-0142" size="sm" />
        )}
        {knobs.helper && (
            <FieldHelper>
                {knobs.invalid
                    ? 'This number is already in use.'
                    : 'Shown on every page of the invoice.'}
            </FieldHelper>
        )}
    </Field>
);

const selectKnobs: Knob[] = [
    { id: 'size', label: 'Size', options: sizes, default: 'sm' },
    {
        id: 'state',
        label: 'State',
        options: [o('default', 'Default'), o('invalid', 'Invalid'), o('disabled', 'Disabled')],
        default: 'default',
    },
    { id: 'leading', label: 'Leading icon', switch: true, default: true },
];

const SelectPreview = ({ knobs }: PreviewProps) => {
    const [range, setRange] = useState('30d');
    const [open, setOpen] = useState(false);
    const stage = useStageContainer();
    const shown = Boolean(stage) && knobs.state !== 'disabled';

    return (
        // On a stage the list is open under the box; room below keeps the pair centred.
        <div className={shown ? 'pb-40' : 'contents'}>
            <Select
                modal={stage ? false : undefined}
                onOpenChange={setOpen}
                onValueChange={setRange}
                // Controlled from the first render: Base UI keeps whichever mode a popup starts in.
                open={shown ? true : open}
                value={range}
            >
                <SelectTrigger
                    aria-invalid={knobs.state === 'invalid' || undefined}
                    className="w-48"
                    disabled={knobs.state === 'disabled'}
                    leadingIcon={knobs.leading ? <CalendarDays {...icon} /> : undefined}
                    size={knobs.size === 'md' ? 'md' : 'sm'}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent container={stage}>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="3m">Last 3 months</SelectItem>
                    <SelectItem value="12m">Last 12 months</SelectItem>
                </SelectContent>
            </Select>
        </div>
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

const ComboboxPreview = () => {
    const [open, setOpen] = useState(false);
    const stage = useStageContainer();

    return (
        <div className={stage ? 'pb-56' : 'contents'}>
            <Combobox
                defaultValue="Eva Bakker"
                items={owners}
                modal={stage ? false : undefined}
                onOpenChange={setOpen}
                open={stage ? true : open}
            >
                <ComboboxInput
                    aria-label="Account owner"
                    className="w-56"
                    leadingIcon={<UserRound {...icon} />}
                    placeholder="Search people"
                    size="sm"
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
        </div>
    );
};

const checkboxKnobs: Knob[] = [
    {
        id: 'state',
        label: 'State',
        options: [o('checked', 'Checked'), o('unchecked', 'Unchecked'), o('mixed', 'Mixed')],
        default: 'checked',
    },
    { id: 'label', label: 'Label', switch: true, default: true },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const CheckboxPreview = ({ knobs }: PreviewProps) => {
    const [checked, setChecked] = useState<boolean | 'indeterminate'>(true);

    // The knob sets the state; a click still toggles it, as it would in a form.
    useEffect(() => {
        setChecked(knobs.state === 'mixed' ? 'indeterminate' : knobs.state === 'checked');
    }, [knobs.state]);

    const box = (
        <Checkbox
            aria-label={knobs.label ? undefined : 'Include PDF'}
            checked={checked}
            disabled={Boolean(knobs.disabled)}
            onCheckedChange={next => setChecked(next === true)}
        />
    );

    return knobs.label ? <Labelled label="Include PDF">{box}</Labelled> : box;
};

const radioKnobs: Knob[] = [
    { id: 'labels', label: 'Labels', switch: true, default: true },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const RadioPreview = ({ knobs }: PreviewProps) => (
    <RadioGroup
        aria-label="Frequency"
        className={knobs.labels ? undefined : 'flex-row gap-3'}
        defaultValue="weekly"
    >
        {[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
        ].map(option =>
            knobs.labels ? (
                <Labelled key={option.value} label={option.label}>
                    <RadioGroupItem
                        disabled={Boolean(knobs.disabled) && option.value === 'monthly'}
                        value={option.value}
                    />
                </Labelled>
            ) : (
                <RadioGroupItem
                    aria-label={option.label}
                    disabled={Boolean(knobs.disabled) && option.value === 'monthly'}
                    key={option.value}
                    value={option.value}
                />
            ),
        )}
    </RadioGroup>
);

const switchKnobs: Knob[] = [
    { id: 'on', label: 'On', switch: true, default: true },
    { id: 'label', label: 'Label', switch: true, default: true },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const SwitchPreview = ({ knobs }: PreviewProps) => {
    const [on, setOn] = useState(true);

    useEffect(() => setOn(Boolean(knobs.on)), [knobs.on]);

    const control = (
        <Switch
            aria-label={knobs.label ? undefined : 'Email me when a report is ready'}
            checked={on}
            disabled={Boolean(knobs.disabled)}
            onCheckedChange={setOn}
        />
    );

    return knobs.label ? (
        <Labelled label="Email me when a report is ready">{control}</Labelled>
    ) : (
        control
    );
};

const sliderKnobs: Knob[] = [
    { id: 'range', label: 'Range', switch: true, default: false },
    { id: 'field', label: 'In a field', switch: true, default: true },
    { id: 'disabled', label: 'Disabled', switch: true, default: false },
];

const SliderPreview = ({ knobs }: PreviewProps) => {
    const [value, setValue] = useState([64]);
    const [range, setRange] = useState([40, 96]);
    const slider = knobs.range ? (
        <Slider
            aria-label="Column width"
            disabled={Boolean(knobs.disabled)}
            max={120}
            min={32}
            onValueChange={setRange}
            value={range}
        />
    ) : (
        <Slider
            aria-label="Narrowest column"
            disabled={Boolean(knobs.disabled)}
            max={120}
            min={32}
            onValueChange={setValue}
            value={value}
        />
    );

    if (!knobs.field) return <div className="w-64">{slider}</div>;

    return (
        <Field className="w-64" disabled={Boolean(knobs.disabled)}>
            <div className="flex justify-between">
                <FieldLabel>{knobs.range ? 'Column width' : 'Narrowest column'}</FieldLabel>
                <span className="text-neutral-950 text-xs tabular-nums">
                    {knobs.range ? `${range[0]} – ${range[1]}px` : `${value[0]}px`}
                </span>
            </div>
            {slider}
        </Field>
    );
};

const segmentedKnobs: Knob[] = [
    { id: 'icons', label: 'Icons', switch: true, default: false },
    { id: 'fill', label: 'Fill the width', switch: true, default: false },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const SegmentedPreview = ({ knobs }: PreviewProps) => (
    <div className={knobs.fill ? 'w-80' : undefined}>
        <SegmentedControl aria-label="Range" defaultValue="30d" fill={Boolean(knobs.fill)}>
            <SegmentedControlItem value="7d">
                {knobs.icons && <Clock {...icon} />}7d
            </SegmentedControlItem>
            <SegmentedControlItem value="30d">
                {knobs.icons && <CalendarDays {...icon} />}30d
            </SegmentedControlItem>
            <SegmentedControlItem value="12m">
                {knobs.icons && <Timer {...icon} />}12m
            </SegmentedControlItem>
            <SegmentedControlItem disabled={Boolean(knobs.disabled)} value="all">
                All time
            </SegmentedControlItem>
        </SegmentedControl>
    </div>
);

const reportSections = [
    {
        id: 'summary',
        icon: <FileText {...icon} />,
        label: 'Executive summary',
        description: 'One page, written for the board',
    },
    {
        id: 'charts',
        icon: <PieChart {...icon} />,
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

const OptionRowPreview = () => {
    const [picked, setPicked] = useState(['summary']);

    return (
        <OptionList className="w-full max-w-80">
            {reportSections.slice(0, 2).map(section => (
                <OptionRow
                    control={
                        <Checkbox
                            checked={picked.includes(section.id)}
                            onCheckedChange={checked =>
                                setPicked(current =>
                                    checked === true
                                        ? [...current, section.id]
                                        : current.filter(id => id !== section.id),
                                )
                            }
                        />
                    }
                    description={section.description}
                    icon={section.icon}
                    key={section.id}
                    label={section.label}
                />
            ))}
        </OptionList>
    );
};

/** Files that upload on a timer, so a drop zone in the playground fills its list as a real one would. */
export type UploadEntry = {
    id: string;
    name: string;
    size: number;
    progress: number;
    status: 'uploading' | 'done' | 'error';
    error?: string;
};

export const useUploads = (initial: UploadEntry[]) => {
    const [files, setFiles] = useState(initial);
    const busy = files.some(file => file.status === 'uploading');

    useEffect(() => {
        if (!busy) return;
        const timer = window.setInterval(() => {
            setFiles(current =>
                current.map(file => {
                    if (file.status !== 'uploading') return file;
                    // Each file at its own pace, so a list of them does not finish in step.
                    const progress = Math.min(100, file.progress + 4 + (file.size % 7));
                    return { ...file, progress, status: progress === 100 ? 'done' : 'uploading' };
                }),
            );
        }, 240);
        return () => window.clearInterval(timer);
    }, [busy]);

    const add = (picked: File[]) =>
        setFiles(current => [
            ...current,
            ...picked.map((file, i) => ({
                id: `${file.name}-${current.length + i}`,
                name: file.name,
                size: file.size,
                progress: 0,
                status: 'uploading' as const,
            })),
        ]);
    const remove = (id: string) => setFiles(current => current.filter(file => file.id !== id));

    return { files, add, remove };
};

const dropZoneKnobs: Knob[] = [
    {
        id: 'state',
        label: 'State',
        options: [
            o('idle', 'Idle'),
            o('dragging', 'Dragging over'),
            o('invalid', 'Invalid'),
            o('disabled', 'Disabled'),
        ],
        default: 'idle',
    },
    { id: 'files', label: 'File list', switch: true, default: true },
];

const sampleUploads: UploadEntry[] = [
    {
        id: 'contacts',
        name: 'contacts-october.csv',
        size: 2_516_582,
        progress: 100,
        status: 'done',
    },
    { id: 'leads', name: 'webinar-leads.xlsx', size: 880_640, progress: 46, status: 'uploading' },
];

const rejectedUpload: UploadEntry = {
    id: 'logo',
    name: 'logo.png',
    size: 0,
    progress: 0,
    status: 'error',
    error: 'Not a CSV or XLSX file',
};

const DropZonePreview = ({ knobs }: PreviewProps) => {
    const { files, add, remove } = useUploads(sampleUploads);
    const invalid = knobs.state === 'invalid';
    const shown = invalid ? [...files, rejectedUpload] : files;

    return (
        <div className="flex w-[420px] flex-col gap-4">
            <DropZone
                accept=".csv,.xlsx"
                aria-invalid={invalid || undefined}
                // The knob holds the drag-over look; a real drag sets the same attribute.
                data-dragging={knobs.state === 'dragging' || undefined}
                description={
                    invalid
                        ? 'Only CSV and XLSX files can be imported'
                        : 'CSV or XLSX, up to 10 MB each'
                }
                disabled={knobs.state === 'disabled'}
                onFiles={add}
                title="Drop contact lists here"
            />
            {knobs.files && shown.length > 0 && (
                <DropZoneFiles>
                    {shown.map(file => (
                        <DropZoneFile
                            error={file.error}
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
        </div>
    );
};

const campaignSteps = [
    { label: 'Details', description: 'Name and sender' },
    { label: 'Audience', description: 'Who gets it' },
    { label: 'Schedule', description: 'Date and time' },
    { label: 'Review', description: 'A last check' },
];

const stepperKnobs: Knob[] = [
    {
        id: 'orientation',
        label: 'Orientation',
        options: opts('horizontal', 'vertical'),
        default: 'horizontal',
    },
    {
        id: 'step',
        label: 'Current step',
        options: campaignSteps.map((step, i) => o(String(i + 1), `${i + 1} · ${step.label}`)),
        default: '2',
    },
    {
        id: 'width',
        label: 'Width',
        options: [o('wide', 'Wide · 540px'), o('narrow', 'Narrow · 320px')],
        default: 'wide',
    },
    { id: 'descriptions', label: 'Descriptions', switch: true, default: true },
    { id: 'invalid', label: 'First step needs fixing', switch: true, default: false },
    { id: 'content', label: 'Fields under the current step', switch: true, default: false },
    { id: 'back', label: 'Done steps go back', switch: true, default: true },
];

const StepperPreview = ({ knobs }: PreviewProps) => {
    const [current, setCurrent] = useState(2);
    const vertical = knobs.orientation === 'vertical';

    // The knob sets the step; a click on a done step still goes back to it.
    useEffect(() => setCurrent(Number(knobs.step)), [knobs.step]);

    return (
        <Stepper
            aria-label="New campaign"
            className={vertical ? 'w-64' : knobs.width === 'narrow' ? 'w-80' : 'w-[540px]'}
            onValueChange={knobs.back ? setCurrent : undefined}
            orientation={vertical ? 'vertical' : 'horizontal'}
            value={current}
        >
            {campaignSteps.map((step, i) => {
                const invalid = Boolean(knobs.invalid) && i === 0;

                return (
                    <StepperItem
                        description={
                            invalid
                                ? 'Sender is missing'
                                : knobs.descriptions
                                  ? step.description
                                  : undefined
                        }
                        invalid={invalid}
                        key={step.label}
                        label={step.label}
                        step={i + 1}
                    >
                        {knobs.content && i + 1 === current && (
                            <div className="flex flex-col gap-3">
                                <Input
                                    aria-label={step.label}
                                    defaultValue={i === 0 ? 'Winter follow-up' : 'Webinar leads'}
                                    size="sm"
                                />
                                <Button
                                    className="self-start"
                                    onClick={() =>
                                        setCurrent(n => Math.min(n + 1, campaignSteps.length))
                                    }
                                >
                                    Continue
                                </Button>
                            </div>
                        )}
                    </StepperItem>
                );
            })}
        </Stepper>
    );
};

const invoiceFilters = [
    {
        id: 'status',
        label: 'Status',
        icon: <CircleCheck {...icon} />,
        options: [
            { value: 'Paid', count: 128 },
            { value: 'Due soon', count: 14 },
            { value: 'Overdue', count: 6 },
        ],
    },
    {
        id: 'owner',
        label: 'Owner',
        icon: <UserRound {...icon} />,
        options: [
            { value: 'Anna de Vries', count: 61 },
            { value: 'Bram Jansen', count: 52 },
            { value: 'Chloé Martin', count: 35 },
        ],
    },
];

/** "Status is Paid", "Status is Paid or Overdue", "Owner is Anna de Vries and 2 more". */
const filterChipLabel = (group: string, picked: string[]) =>
    `${group} is ${
        picked.length <= 2 ? picked.join(' or ') : `${picked[0]} and ${picked.length - 1} more`
    }`;

/** Drops one group from the applied filters, as its chip's × does. */
const withoutFilter = (values: FilterValues, group: string): FilterValues =>
    Object.fromEntries(Object.entries(values).filter(([id]) => id !== group));

const filterMenuKnobs: Knob[] = [
    { id: 'chips', label: 'Applied as chips', switch: true, default: false },
    { id: 'counts', label: 'Counts', switch: true, default: true },
];

const FilterMenuPreview = ({ knobs }: PreviewProps) => {
    const [values, setValues] = useState<FilterValues>({ status: ['Due soon', 'Overdue'] });
    const stage = useStageContainer();
    const count = countFilters(values);

    return (
        // Room below for the open menu, so the bar and the menu sit centred on the stage.
        <div className={cn('flex w-[520px] justify-center', stage && 'pb-72')}>
            <FilterBar onClear={knobs.chips && count > 0 ? () => setValues({}) : undefined}>
                <FilterMenu modal={stage ? false : undefined} open={stage ? true : undefined}>
                    <FilterMenuTrigger count={count} />
                    <FilterMenuContent container={stage}>
                        {invoiceFilters.map(group => (
                            <FilterMenuGroup key={group.id} label={group.label}>
                                {group.options.map(option => (
                                    <FilterMenuItem
                                        checked={values[group.id]?.includes(option.value) ?? false}
                                        count={knobs.counts ? option.count : undefined}
                                        key={option.value}
                                        onCheckedChange={() =>
                                            setValues(current =>
                                                toggleFilter(current, group.id, option.value),
                                            )
                                        }
                                    >
                                        {option.value}
                                    </FilterMenuItem>
                                ))}
                            </FilterMenuGroup>
                        ))}
                        <FilterMenuClear disabled={count === 0} onClick={() => setValues({})} />
                    </FilterMenuContent>
                </FilterMenu>
                {knobs.chips &&
                    invoiceFilters.map(group => {
                        const picked = values[group.id];
                        if (!picked) return null;
                        return (
                            <FilterChip
                                icon={group.icon}
                                key={group.id}
                                onRemove={() =>
                                    setValues(current => withoutFilter(current, group.id))
                                }
                                removeLabel={`Remove the ${group.label.toLowerCase()} filter`}
                            >
                                {filterChipLabel(group.label, picked)}
                            </FilterChip>
                        );
                    })}
            </FilterBar>
        </div>
    );
};

/* ---------- Navigation ---------- */

const navItems = [
    { id: 'sequences', label: 'All sequences', icon: <ListTree {...icon} /> },
    { id: 'active', label: 'Active campaigns', icon: <Timer {...icon} /> },
    { id: 'templates', label: 'Templates', icon: <Star {...icon} /> },
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
                    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone {...icon} /> },
                    { id: 'automations', label: 'Automations', icon: <Workflow {...icon} /> },
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

const railItems = [
    { id: 'home', label: 'Home', icon: <Home {...icon} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 {...icon} /> },
    { id: 'inbox', label: 'Inbox', icon: <Inbox {...icon} /> },
];

const RailPreview = () => {
    const [active, setActive] = useState('analytics');

    return (
        <TooltipProvider>
            <Rail aria-label="Main">
                {railItems.map(item => (
                    <RailItem
                        active={item.id === active}
                        aria-current={item.id === active ? 'page' : undefined}
                        key={item.id}
                        label={item.label}
                        onClick={() => setActive(item.id)}
                    >
                        {item.icon}
                    </RailItem>
                ))}
                <RailSeparator />
                <RailItem
                    active={active === 'settings'}
                    aria-current={active === 'settings' ? 'page' : undefined}
                    label="Settings"
                    onClick={() => setActive('settings')}
                >
                    <Settings {...icon} />
                </RailItem>
            </Rail>
        </TooltipProvider>
    );
};

const tabsKnobs: Knob[] = [
    { id: 'content', label: 'Content', switch: true, default: true },
    { id: 'disabled', label: 'One disabled', switch: true, default: false },
];

const TabsPreview = ({ knobs }: PreviewProps) => (
    <Tabs className="w-72" defaultValue="summary">
        <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="findings">Findings</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            {knobs.disabled && (
                <TabsTrigger disabled value="history">
                    History
                </TabsTrigger>
            )}
        </TabsList>
        {knobs.content && (
            <>
                <TabsContent className="text-neutral-600 text-xs" value="summary">
                    Three risks need a decision before Friday.
                </TabsContent>
                <TabsContent className="text-neutral-600 text-xs" value="findings">
                    Twelve findings, four of them new.
                </TabsContent>
                <TabsContent className="text-neutral-600 text-xs" value="sources">
                    Built from 38 documents.
                </TabsContent>
            </>
        )}
    </Tabs>
);

const breadcrumbKnobs: Knob[] = [
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 13px'), o('lg', 'lg · 14px')],
        default: 'md',
    },
    {
        id: 'trail',
        label: 'Trail',
        options: [
            o('short', 'Short'),
            o('long', 'Long, all shown'),
            o('collapsed', 'Long, collapsed'),
        ],
        default: 'collapsed',
    },
    { id: 'switcher', label: 'Workspace switcher', switch: true, default: true },
    { id: 'home', label: 'Home icon', switch: true, default: true },
    { id: 'longPage', label: 'Long page name', switch: true, default: false },
];

const hiddenCrumbs = ['Finance', 'Payments', '2026'];
const workspaces = ['Northwind', 'Acme Corp', 'Globex'];

const BreadcrumbPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();
    const [workspace, setWorkspace] = useState('Northwind');
    const middle =
        knobs.trail === 'short' ? [] : knobs.trail === 'long' ? hiddenCrumbs : ['collapsed'];

    return (
        // A bar's width, so a long page name has something to truncate against.
        <Breadcrumb className="w-[440px]">
            <BreadcrumbList size={knobs.size === 'lg' ? 'lg' : 'md'}>
                {knobs.home && (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#">
                                <BreadcrumbHome />
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                    </>
                )}
                <BreadcrumbItem>
                    {knobs.switcher ? (
                        <BreadcrumbMenu container={stage} label={workspace}>
                            {workspaces.map(name => (
                                <DropdownMenuItem key={name} onClick={() => setWorkspace(name)}>
                                    {name}
                                </DropdownMenuItem>
                            ))}
                        </BreadcrumbMenu>
                    ) : (
                        <BreadcrumbLink href="#">{workspace}</BreadcrumbLink>
                    )}
                </BreadcrumbItem>
                {middle.map(crumb => (
                    <BreadcrumbItem key={crumb}>
                        <BreadcrumbSeparator />
                        {crumb === 'collapsed' ? (
                            <BreadcrumbMenu container={stage}>
                                {hiddenCrumbs.map(name => (
                                    <DropdownMenuItem key={name}>
                                        <Folder {...icon} /> {name}
                                    </DropdownMenuItem>
                                ))}
                            </BreadcrumbMenu>
                        ) : (
                            <BreadcrumbLink href="#">{crumb}</BreadcrumbLink>
                        )}
                    </BreadcrumbItem>
                ))}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href="#">Batches</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>
                        {knobs.longPage
                            ? 'Batch #12345 · October payouts to European suppliers'
                            : 'Batch #12345'}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
};

const headerBarKnobs: Knob[] = [
    {
        id: 'leading',
        label: 'Before the trail',
        options: [o('none', 'Nothing'), o('nav', 'Back and forward'), o('back', 'Back only')],
        default: 'nav',
    },
    {
        id: 'actions',
        label: 'Actions',
        options: [o('0', 'None'), o('1', 'One'), o('2', 'Two')],
        default: '2',
    },
    {
        id: 'notice',
        label: 'Notice',
        options: [o('off', 'Hidden'), o('saving', 'Saving…'), o('saved', 'Saved')],
        default: 'saved',
    },
];

const HeaderBarPreview = ({ knobs }: PreviewProps) => {
    const { notice, show, clear } = useHeaderNotice();

    // The knob holds a notice open; Save plays the real sequence, saving then saved.
    // biome-ignore lint/correctness/useExhaustiveDependencies: follows the knob only
    useEffect(() => {
        if (knobs.notice === 'saving') show('Saving…', { icon: <Spinner size="sm" />, timeout: 0 });
        else if (knobs.notice === 'saved') show('Saved', { timeout: 0 });
        else clear();
    }, [knobs.notice]);

    const save = () => {
        show('Saving…', { icon: <Spinner size="sm" />, timeout: 0 });
        window.setTimeout(() => show('Saved'), 900);
    };

    // A few pages to move between: a crumb or a report visits one, the arrows walk the history.
    const history = usePageHistory<string[]>([['Reports'], ['Reports', 'Northwind Q3 review']]);
    const trail = history.page;

    return (
        // The top of a panel: its corners, its surface, and the page under the bar.
        <div className="w-[540px] overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50">
            <HeaderBar>
                <HeaderBarStart>
                    {knobs.leading !== 'none' && (
                        <HeaderBarNav
                            canGoBack={history.canGoBack}
                            canGoForward={history.canGoForward}
                            onBack={history.back}
                            onForward={knobs.leading === 'nav' ? history.forward : undefined}
                        />
                    )}
                    <Breadcrumb>
                        <BreadcrumbList>
                            {trail.map((crumb, i) => (
                                <BreadcrumbItem key={crumb}>
                                    {i > 0 && <BreadcrumbSeparator />}
                                    {i === trail.length - 1 ? (
                                        <BreadcrumbPage>{crumb}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink
                                            href="#"
                                            onClick={() => history.go(trail.slice(0, i + 1))}
                                        >
                                            {crumb}
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </HeaderBarStart>
                {knobs.actions !== '0' && (
                    <HeaderBarActions>
                        {knobs.actions === '2' && (
                            <Button onClick={() => show('Link copied')} variant="secondary">
                                <Link2 {...icon} /> Copy link
                            </Button>
                        )}
                        <Button onClick={save}>Save</Button>
                    </HeaderBarActions>
                )}
                <HeaderBarNotice {...notice} />
            </HeaderBar>
            {trail.length === 1 ? (
                <ul className="flex flex-col gap-1 px-4 pt-12 pb-6">
                    {['Northwind Q3 review', 'Acme renewal forecast', 'Board pack · October'].map(
                        report => (
                            <li key={report}>
                                <button
                                    className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-item px-2 text-left text-neutral-950 text-xs hover:bg-neutral-950/5"
                                    onClick={() => history.go(['Reports', report])}
                                    type="button"
                                >
                                    <FileText {...icon} className="size-4 text-neutral-600" />
                                    {report}
                                </button>
                            </li>
                        ),
                    )}
                </ul>
            ) : (
                <div className="flex flex-col gap-2 px-6 pt-14 pb-8">
                    <div className="h-3 w-40 rounded-chip bg-neutral-950/[0.06]" />
                    <div className="h-2.5 w-72 rounded-chip bg-neutral-950/[0.04]" />
                    <div className="h-2.5 w-60 rounded-chip bg-neutral-950/[0.04]" />
                </div>
            )}
        </div>
    );
};

const PaginationPreview = () => {
    const [page, setPage] = useState(4);

    return (
        <div className="w-full overflow-x-auto">
            <Pagination
                className="min-w-[520px]"
                onPageChange={setPage}
                page={page}
                pageCount={12}
            />
        </div>
    );
};

const LogoPreview = () => (
    <div className="flex flex-col items-center gap-6">
        <ContinuumLogo size={32} />
        <ContinuumLogo size={20} />
    </div>
);

/* ---------- Overlays ---------- */

/*
 * Overlays are shown open: on a stage, the overlay is portalled into the stage and held
 * open there, scrim and all, so the component itself is on show rather than its trigger.
 * Off a stage, the trigger opens it as it would in a product.
 */

const DialogPreview = () => {
    const [name, setName] = useState('Northwind Q3 review');
    const [open, setOpen] = useState(false);
    const stage = useStageContainer();

    return (
        <div className="flex flex-col items-center gap-3">
            <Dialog
                modal={stage ? false : undefined}
                onOpenChange={setOpen}
                open={stage ? true : open}
            >
                <DialogTrigger render={<Button variant="secondary" />}>
                    <Pencil {...icon} /> Rename report
                </DialogTrigger>
                <DialogContent
                    className={stage ? 'w-[min(420px,calc(100%-32px))]' : undefined}
                    container={stage}
                    finalFocus={stage ? false : undefined}
                    initialFocus={stage ? false : undefined}
                >
                    <DialogHeader>
                        <DialogTitle>Rename report</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            The new name shows up for everyone in the workspace.
                        </DialogDescription>
                        <form
                            id="showcase-rename"
                            onSubmit={event => {
                                event.preventDefault();
                                const value = new FormData(event.currentTarget).get('name');
                                if (typeof value === 'string' && value.trim())
                                    setName(value.trim());
                                setOpen(false);
                            }}
                        >
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input defaultValue={name} maxLength={60} name="name" />
                            </Field>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button form="showcase-rename" type="submit">
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {!stage && <span className="max-w-56 truncate text-neutral-500 text-xxs">{name}</span>}
        </div>
    );
};

const statusHistory = [
    {
        tone: 'success',
        icon: <HandCoins {...icon} />,
        title: 'Acme Corp paid the invoice',
        time: '14/03/2025 10:24',
        status: 'Paid',
    },
    {
        tone: 'neutral',
        icon: <SendHorizontal {...icon} />,
        title: 'Invoice sent to Acme Corp',
        time: '12/03/2025 09:02',
        status: 'Sent',
    },
    {
        tone: 'warning',
        icon: <FileText {...icon} />,
        title: 'Status set to Open',
        time: '12/03/2025 09:00',
        status: 'Open',
    },
    {
        tone: 'error',
        icon: <CircleX {...icon} />,
        title: 'Acme Corp rejected the invoice',
        time: '11/03/2025 16:08',
        status: 'Rejected',
    },
    {
        tone: 'neutral',
        icon: <Eye {...icon} />,
        title: 'Acme Corp viewed the invoice',
        time: '11/03/2025 15:51',
        status: 'Viewed',
    },
    {
        tone: 'neutral',
        icon: <SendHorizontal {...icon} />,
        title: 'Invoice sent to Acme Corp',
        time: '10/03/2025 09:12',
        status: 'Sent',
    },
    {
        tone: 'primary',
        icon: <PencilLine {...icon} />,
        title: 'Invoice saved as draft',
        time: '09/03/2025 17:34',
        status: 'Draft',
    },
] as const;

const SheetPreview = () => {
    const stage = useStageContainer();

    return (
        // On a stage the trigger keeps to the left, where the page would be, and the sheet is open beside it.
        <div className={stage ? 'flex w-full justify-start' : 'contents'}>
            <Sheet open={stage ? true : undefined}>
                <SheetTrigger render={<Button variant="secondary" />}>
                    <History {...icon} /> Status history
                </SheetTrigger>
                <SheetContent
                    className={stage ? 'w-[min(360px,calc(100%-96px))]' : undefined}
                    container={stage}
                    finalFocus={stage ? false : undefined}
                    initialFocus={stage ? false : undefined}
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
                                {statusHistory.map(entry => (
                                    <ActivityItem
                                        action={<Badge>{entry.status}</Badge>}
                                        icon={entry.icon}
                                        key={entry.time}
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

const MenuPreview = () => {
    const [last, setLast] = useState<string>();
    const stage = useStageContainer();

    return (
        // Room below the trigger for the open menu, so the pair sits centred on the stage.
        <div className={cn('flex flex-col items-center gap-3', stage && 'pb-44')}>
            <DropdownMenu modal={stage ? false : undefined} open={stage ? true : undefined}>
                <DropdownMenuTrigger render={<Button variant="secondary" />}>
                    Actions <Ellipsis {...icon} />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" container={stage}>
                    <DropdownMenuLabel>Northwind Q3 review</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setLast('Renamed')}>
                        <Pencil {...icon} /> Rename
                        <DropdownMenuShortcut>R</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLast('Duplicated')}>
                        <Copy {...icon} /> Duplicate
                        <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLast('Deleted')} variant="danger">
                        <Trash2 {...icon} /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {!stage && <span className="text-neutral-500 text-xxs">{last ?? 'Open it'}</span>}
        </div>
    );
};

const columnNames = ['Owner', 'Status', 'Amount', 'Due date'];

const PopoverPreview = () => {
    const [shown, setShown] = useState(['Owner', 'Status', 'Amount']);
    const stage = useStageContainer();

    return (
        <div className={stage ? 'pb-48' : 'contents'}>
            <Popover modal={stage ? false : undefined} open={stage ? true : undefined}>
                <PopoverTrigger render={<Button variant="secondary" />}>
                    <Columns3 {...icon} /> Columns
                </PopoverTrigger>
                <PopoverContent
                    className="w-56"
                    container={stage}
                    finalFocus={stage ? false : undefined}
                    initialFocus={stage ? false : undefined}
                >
                    <PopoverHeader>
                        <PopoverTitle>Columns</PopoverTitle>
                        <PopoverDescription>Pick what the table shows.</PopoverDescription>
                    </PopoverHeader>
                    <div className="flex flex-col gap-2.5">
                        {columnNames.map(column => (
                            <Labelled key={column} label={column}>
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
                            </Labelled>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const tooltipKnobs: Knob[] = [
    { id: 'side', label: 'Side', options: opts('top', 'bottom', 'left', 'right'), default: 'top' },
];

const TooltipPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();
    const side = knobs.side as 'top' | 'bottom' | 'left' | 'right';

    return (
        <TooltipProvider>
            {/* Room on the open tooltip's side, so the row sits centred with it. */}
            <div
                className={cn(
                    'flex gap-2',
                    stage && side === 'top' && 'pt-8',
                    stage && side === 'bottom' && 'pb-8',
                    stage && side === 'left' && 'pl-16',
                    stage && side === 'right' && 'pr-16',
                )}
            >
                {[
                    { label: 'Notifications', glyph: <Bell {...icon} /> },
                    { label: 'Send', glyph: <Send {...icon} /> },
                    { label: 'Delete', glyph: <Trash2 {...icon} /> },
                ].map(({ label, glyph }, i) => (
                    <Tooltip key={label} open={stage && i === 1 ? true : undefined}>
                        <TooltipTrigger
                            render={<Button aria-label={label} size="icon" variant="secondary" />}
                        >
                            {glyph}
                        </TooltipTrigger>
                        <TooltipContent container={stage} side={side}>
                            {label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
};

/* ---------- Data ---------- */

const StatCardPreview = () => (
    <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <StatCard delta="+12.4%" label="Sessions" value="12,480" />
        <StatCard delta="−3.1%" label="Bounce rate" trend="down" value="41.2%" />
    </div>
);

const CardPreview = () => (
    <Card className="w-64">
        <CardHeader>
            <CardTitle>Returning visitors</CardTitle>
            <CardFigure>
                <CardValue size="xl">38%</CardValue>
                <CardDelta trend="down">−2.4%</CardDelta>
            </CardFigure>
        </CardHeader>
    </Card>
);

const MetaRowPreview = () => (
    <div className="flex w-64 flex-col gap-3">
        <MetaRow label="Invoice date" value="12 Oct 2025" />
        <MetaRow label="Due date" value="26 Oct 2025" />
    </div>
);

const steps = [
    { subject: 'Welcome to Northwind', delay: 'Immediately', sent: 1240, opened: 812 },
    { subject: 'Set up your first report', delay: '1 day', sent: 1188, opened: 604 },
    { subject: 'Invite your team', delay: '4 days', sent: 1032, opened: 455 },
];

const TablePreview = () => (
    <Table wrapperClassName="w-full">
        <TableHeader>
            <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead numeric>Sent</TableHead>
                <TableHead numeric>Open rate</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {steps.map(step => (
                <TableRow key={step.subject}>
                    <TableCell>
                        <span className="inline-flex items-center gap-2">
                            <Mail className="size-4 text-neutral-600" {...icon} />
                            {step.subject}
                        </span>
                    </TableCell>
                    <TableCell className="font-normal text-neutral-600">{step.delay}</TableCell>
                    <TableCell numeric>{step.sent.toLocaleString('en-US')}</TableCell>
                    <TableCell numeric>
                        <Badge tone={step.opened / step.sent > 0.5 ? 'success' : 'neutral'}>
                            {Math.round((step.opened / step.sent) * 100)}%
                        </Badge>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const DescriptionPreview = () => (
    <DescriptionList className="w-full max-w-72">
        <DescriptionItem term="Client">Acme Studio</DescriptionItem>
        <DescriptionItem term="Status">
            <Badge tone="warning">Due soon</Badge>
        </DescriptionItem>
        <DescriptionItem term="Owners">
            <AvatarStack>
                <Avatar fallback="AS" shape="round" size={24} />
                <Avatar fallback="TB" shape="round" size={24} />
            </AvatarStack>
        </DescriptionItem>
    </DescriptionList>
);

const ActivityPreview = () => (
    <ActivityList className="w-full max-w-80">
        <ActivityItem
            action={<Badge tone="success">Paid</Badge>}
            icon={<CircleCheck {...icon} />}
            time="Today, 09:12"
            title="Payment received"
            tone="success"
        />
        <ActivityItem
            action={<Badge tone="warning">Reminder</Badge>}
            icon={<Clock {...icon} />}
            time="2 days ago"
            title="Reminder sent"
            tone="warning"
        />
    </ActivityList>
);

const avatarKnobs: Knob[] = [
    { id: 'shape', label: 'Shape', options: opts('round', 'square'), default: 'round' },
    { id: 'size', label: 'Size', options: [o('24', '24px'), o('32', '32px')], default: '32' },
    { id: 'initials', label: 'Initials', switch: true, default: true },
    { id: 'stack', label: 'Stack of six, max 4', switch: true, default: false },
];

const AvatarPreview = ({ knobs }: PreviewProps) => {
    const shape = knobs.shape === 'square' ? 'square' : 'round';
    const size = knobs.size === '24' ? 24 : 32;

    if (knobs.stack) {
        return (
            <AvatarStack max={4}>
                {['AS', 'TB', 'RV', 'EP', 'JL', 'MK'].map(initials => (
                    <Avatar
                        fallback={knobs.initials ? initials : undefined}
                        key={initials}
                        shape={shape}
                        size={size}
                    />
                ))}
            </AvatarStack>
        );
    }

    return <Avatar fallback={knobs.initials ? 'AS' : undefined} shape={shape} size={size} />;
};

const tileGlyphs: Record<Tone, ReactNode> = {
    neutral: <FileText {...icon} />,
    success: <CircleCheck {...icon} />,
    warning: <Clock {...icon} />,
    error: <CircleAlert {...icon} />,
    primary: <Send {...icon} />,
};

const iconTileKnobs: Knob[] = [
    { id: 'tone', label: 'Tone', options: opts(...tones), default: 'success' },
    { id: 'variant', label: 'Variant', options: opts('outline', 'filled'), default: 'outline' },
];

const IconTilePreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as Tone;

    return (
        <IconTile tone={tone} variant={knobs.variant === 'filled' ? 'filled' : 'outline'}>
            {tileGlyphs[tone]}
        </IconTile>
    );
};

/* ---------- Charts ---------- */

// The library page's two series, shortened to the tile.
const traffic = reportWeek.map((date, i) => ({
    date,
    visitors: [4200, 5100, 4800, 6300, 5900, 3600, 4100][i] ?? 0,
    returning: [1800, 2300, 2100, 2900, 2600, 1500, 1700][i] ?? 0,
}));
const trafficSeries = [
    { key: 'visitors', label: 'Visitors', color: 'var(--color-chart-line-primary)' },
    { key: 'returning', label: 'Returning', color: 'var(--color-chart-line-secondary)' },
];

const AreaChartPreview = () => (
    <div aria-label="Visitors and returning visitors per day" className="w-full" role="img">
        <AreaChart
            data={traffic}
            formatXLabel={formatWeekday}
            margin={chartMargin}
            style={{ height: 176 }}
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
);

const deviceSessions = [
    { label: 'Desktop', value: 7688 },
    { label: 'Mobile', value: 3844 },
    { label: 'Tablet', value: 868 },
];

const PiePreview = () => (
    <div aria-label="Sessions by device: desktop 62%, mobile 31%, tablet 7%" role="img">
        <PieChartRoot
            cornerRadius={2}
            data={deviceSessions}
            innerRadius={50}
            padAngle={0.02}
            size={152}
        >
            {deviceSessions.map((device, index) => (
                <PieSlice index={index} key={device.label} showGlow={false} />
            ))}
            <PieCenter
                defaultLabel="Sessions"
                formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }}
            />
        </PieChartRoot>
    </div>
);

const FunnelPreview = () => (
    <div className="w-full overflow-x-auto">
        <FunnelChart
            className="min-w-[640px]"
            data={[
                { label: '/cart', value: 8420 },
                { label: '/checkout', value: 5110 },
                { label: '/payment', value: 3240 },
                { label: '/thank-you', value: 2710 },
            ]}
            style={{ height: 180 }}
        />
    </div>
);

const ChartLoadingPreview = () => (
    <AreaChartLoading className="h-[152px] w-full" label="Loading" margin={chartMargin} />
);

/* ---------- Built from the reference designs ---------- */

const SettingRowPreview = () => {
    const [alerts, setAlerts] = useState(true);

    return (
        <SettingGroup className="w-full max-w-80" title="Notifications">
            <SettingRow
                control={<Switch checked={alerts} onCheckedChange={setAlerts} />}
                description="Email when something is flagged"
                title="Anomaly alerts"
            />
            <SettingRow
                control={<Switch defaultChecked />}
                description="A seven-day overview every Monday"
                disabled={!alerts}
                title="Weekly digest"
            />
        </SettingGroup>
    );
};

const DatePickerPreview = () => (
    <Field className="w-56">
        <FieldLabel>Start date</FieldLabel>
        <DatePicker defaultValue={new Date(2026, 10, 2)} />
    </Field>
);

const DateRangePickerPreview = () => (
    <DateRangePicker
        aria-label="Report period"
        className="w-64"
        defaultValue={{ from: new Date(2026, 9, 12), to: new Date(2026, 9, 26) }}
        icon="trailing"
    />
);

const CodeInputPreview = () => {
    const [code, setCode] = useState('');

    return (
        <Field>
            <FieldLabel>Verification code</FieldLabel>
            <CodeInput onValueChange={setCode} value={code} />
            <FieldHelper>
                {code.length === 6 ? 'Checking the code…' : 'Sent to your email.'}
            </FieldHelper>
        </Field>
    );
};

const ValueFieldPreview = () => (
    <div className="grid w-full max-w-72 grid-cols-2 gap-3">
        <ValueField copyable label="Entry page" value="/home" />
        <ValueField label="Source" value={null} />
    </div>
);

const InfoTipPreview = () => {
    const stage = useStageContainer();

    return (
        <span
            className={cn(
                'flex items-center gap-1.5 font-medium text-neutral-950 text-xs',
                stage && 'pt-14',
            )}
        >
            How should this campaign start?
            <InfoTip
                container={stage}
                content="A set date starts everyone at once; a trigger starts each recipient on their own action."
                open={stage ? true : undefined}
            />
        </span>
    );
};

const BarListPreview = () => (
    <BarList className="w-full max-w-80" limit={3} title="Top pages" valueLabel="Visitors">
        <BarListItem href="#about" value={3312}>
            /about
        </BarListItem>
        <BarListItem href="#pricing" value={2840}>
            /pricing
        </BarListItem>
        <BarListItem href="#contact" value={1204}>
            /contact
        </BarListItem>
        <BarListItem href="#careers" value={64}>
            /careers
        </BarListItem>
    </BarList>
);

const MetaListPreview = () => (
    <MetaList className="w-full max-w-72" layout="grid">
        <MetaItem icon={<MapPin {...icon} />} label="Location">
            Zierikzee
        </MetaItem>
        <MetaItem icon={<Globe {...icon} />} label="Browser">
            Chrome
        </MetaItem>
        <MetaItem icon={<Monitor {...icon} />} label="Operating system">
            Windows
        </MetaItem>
        <MetaItem icon={<Laptop {...icon} />} label="Device">
            Desktop
        </MetaItem>
    </MetaList>
);

const progressKnobs: Knob[] = [
    {
        id: 'state',
        label: 'State',
        options: [
            o('running', 'Under way'),
            o('indeterminate', 'Indeterminate'),
            o('done', 'Done'),
        ],
        default: 'running',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 4px'), o('md', 'md · 8px')],
        default: 'sm',
    },
    { id: 'value', label: 'Show the value', switch: true, default: true },
    { id: 'caption', label: 'Caption', switch: true, default: false },
];

const ProgressPreview = ({ knobs }: PreviewProps) => {
    const done = knobs.state === 'done';

    return (
        <Progress
            caption={
                knobs.caption
                    ? done
                        ? 'Done'
                        : knobs.state === 'indeterminate'
                          ? 'Usually under a minute'
                          : '2 of 3 files'
                    : undefined
            }
            className="w-full max-w-72"
            label={
                done
                    ? 'Uploaded 3 files'
                    : knobs.state === 'indeterminate'
                      ? 'Preparing export'
                      : 'Uploading 3 files'
            }
            showValue={Boolean(knobs.value) && knobs.state !== 'indeterminate'}
            size={knobs.size === 'md' ? 'md' : 'sm'}
            tone={done ? 'success' : undefined}
            value={done ? 100 : knobs.state === 'indeterminate' ? null : 64}
        />
    );
};

const meterKnobs: Knob[] = [
    {
        id: 'tone',
        label: 'Tone',
        options: [
            o('chart', 'Chart'),
            o('action', 'Action'),
            o('warning', 'Warning'),
            o('error', 'Error'),
        ],
        default: 'chart',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 4px'), o('md', 'md · 8px')],
        default: 'sm',
    },
    { id: 'value', label: 'Show the value', switch: true, default: false },
    { id: 'caption', label: 'Caption', switch: true, default: true },
];

const MeterPreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as 'chart' | 'action' | 'warning' | 'error';
    const value = tone === 'error' ? 10000 : tone === 'warning' ? 9200 : 2450;

    return (
        <Meter
            caption={knobs.caption ? 'Resets in 10 days' : undefined}
            className="w-full max-w-72"
            label="Credit usage"
            max={10000}
            showValue={Boolean(knobs.value)}
            size={knobs.size === 'md' ? 'md' : 'sm'}
            tone={tone === 'action' ? undefined : tone}
            value={value}
        />
    );
};

const dotText: Record<Tone, string> = {
    neutral: 'Paused',
    success: 'All systems operational',
    warning: 'Webhooks delayed',
    error: 'Payouts down',
    primary: 'Syncing',
};

const statusDotKnobs: Knob[] = [
    { id: 'tone', label: 'Tone', options: opts(...tones), default: 'success' },
    {
        id: 'size',
        label: 'Size',
        options: [o('sm', 'sm · 6px'), o('md', 'md · 8px')],
        default: 'md',
    },
    { id: 'pulse', label: 'Pulse', switch: true, default: false },
    { id: 'text', label: 'Beside text', switch: true, default: true },
    { id: 'count', label: 'As a live count', switch: true, default: false },
];

const StatusDotPreview = ({ knobs }: PreviewProps) => {
    const tone = knobs.tone as Tone;

    if (knobs.count) return <LiveCount count={129} />;

    const dot = (
        <StatusDot
            label={knobs.text ? undefined : dotText[tone]}
            pulse={Boolean(knobs.pulse)}
            size={knobs.size === 'sm' ? 'sm' : undefined}
            tone={tone}
        />
    );

    return knobs.text ? (
        <span className="inline-flex items-center gap-2 text-neutral-700 text-xs">
            {dot} {dotText[tone]}
        </span>
    ) : (
        dot
    );
};

const ChatPreview = () => (
    <ChatThread className="h-64 w-full p-0">
        <ChatMessage status="read" time="2:48 PM" variant="own">
            Hey, I didn’t receive my payout for <ChatToken>#inv_1CU2KZuPR5</ChatToken>
        </ChatMessage>
        <ChatMessage author="@Support Bot" badge={<Badge tone="primary">AI</Badge>} time="2:48 PM">
            The payout is still processing; it should land within 24 hours.
        </ChatMessage>
        <ChatEvent>System: Ticket assigned to @Joan</ChatEvent>
    </ChatThread>
);

const ChatComposerPreview = () => {
    const [sent, setSent] = useState<string>();

    return (
        <div className="flex w-full max-w-80 flex-col gap-3">
            <ChatComposer onAdd={() => {}} onSend={setSent} placeholder="Message #payment issue" />
            <span className="text-neutral-500 text-xxs">
                {sent ? `Sent: ${sent}` : 'Enter sends'}
            </span>
        </div>
    );
};

/* ---------- Built from the gaps: navigation and feedback ---------- */

const commandKnobs: Knob[] = [
    {
        id: 'query',
        label: 'Search',
        options: [o('', 'Empty'), o('inv', 'Typed “inv”'), o('zzz', 'Nothing matches')],
        default: '',
    },
    { id: 'hints', label: 'Shortcuts', switch: true, default: true },
    { id: 'footer', label: 'Key hints', switch: true, default: true },
];

const CommandMenuPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();
    const [query, setQuery] = useState('');
    const [ran, setRan] = useState<string>();

    useEffect(() => setQuery(String(knobs.query)), [knobs.query]);

    const run = (name: string) => () => setRan(name);

    return (
        <CommandMenu modal={false} onQueryChange={setQuery} open query={query}>
            <CommandMenuContent
                className="mt-6 w-[min(480px,calc(100%-32px))]"
                container={stage}
                finalFocus={false}
                initialFocus={false}
            >
                <CommandMenuInput trailing={<Kbd>Esc</Kbd>} />
                <CommandMenuList>
                    <CommandMenuGroup label="Go to">
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>G O</Kbd>}
                            icon={<Home {...icon} />}
                            onSelect={run('Overview')}
                            value="Overview"
                        />
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>G I</Kbd>}
                            icon={<FileText {...icon} />}
                            keywords={['billing']}
                            onSelect={run('Invoices')}
                            value="Invoices"
                        />
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>G C</Kbd>}
                            icon={<Users {...icon} />}
                            onSelect={run('Customers')}
                            value="Customers"
                        />
                    </CommandMenuGroup>
                    <CommandMenuGroup label="Actions">
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>⌘N</Kbd>}
                            icon={<Plus {...icon} />}
                            onSelect={run('New invoice')}
                            value="New invoice"
                        />
                        <CommandMenuItem
                            icon={<Mail {...icon} />}
                            keywords={['team', 'member']}
                            onSelect={run('Invite teammate')}
                            value="Invite teammate"
                        />
                        <CommandMenuItem
                            hint={knobs.hints && <Kbd>⌘,</Kbd>}
                            icon={<Settings {...icon} />}
                            onSelect={run('Settings')}
                            value="Settings"
                        />
                    </CommandMenuGroup>
                    <CommandMenuEmpty />
                </CommandMenuList>
                {knobs.footer && (
                    <CommandMenuFooter>
                        <span className="flex items-center gap-1.5">
                            <Kbd>↑</Kbd>
                            <Kbd>↓</Kbd> to move
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd>↵</Kbd> {ran ? `ran ${ran}` : 'to run'}
                        </span>
                    </CommandMenuFooter>
                )}
            </CommandMenuContent>
        </CommandMenu>
    );
};

const toastKnobs: Knob[] = [
    { id: 'type', label: 'Type', options: opts('neutral', 'success', 'error'), default: 'success' },
    {
        id: 'length',
        label: 'Text',
        options: [o('short', 'Short · one line'), o('long', 'Long · stacked')],
        default: 'short',
    },
    { id: 'description', label: 'Description', switch: true, default: true },
    { id: 'action', label: 'Action', switch: true, default: true },
];

const toastText = {
    short: {
        neutral: { title: 'Link copied', description: 'Anyone in the workspace', action: 'Undo' },
        success: { title: 'Report archived', description: 'Northwind Q3 review', action: 'Undo' },
        error: { title: 'Couldn’t archive', description: 'You’re offline', action: 'Retry' },
    },
    long: {
        neutral: {
            title: 'Export is on its way',
            description:
                'The board pack is 38 pages with charts, so it takes a minute or two. We’ll email anna@northwind.io a download link when it’s ready.',
            action: 'Open exports',
        },
        success: {
            title: 'October report sent to 1,284 people',
            description:
                'Delivered to everyone on the Webinar leads list at 09:30. Opens and clicks show up under Activity within the hour.',
            action: 'View activity',
        },
        error: {
            title: 'Three recipients bounced',
            description:
                'Their addresses at globex.io no longer exist, so they did not get the October report. Everyone else did.',
            action: 'Review recipients',
        },
    },
} as const;

/** Raises one toast that stays while the knobs describe it, and another from the button. */
const ToastTrigger = ({ knobs }: PreviewProps) => {
    const toast = useToast();
    const type = knobs.type === 'neutral' || knobs.type === 'error' ? knobs.type : 'success';
    const text = toastText[knobs.length === 'long' ? 'long' : 'short'][type];
    const show = (timeout?: number) =>
        toast.add({
            title: text.title,
            description: knobs.description ? text.description : undefined,
            type,
            timeout,
            actionProps: knobs.action ? { children: text.action } : undefined,
        });

    // biome-ignore lint/correctness/useExhaustiveDependencies: a new toast for each change of the knobs
    useEffect(() => {
        const id = show(0);
        return () => toast.close(id);
    }, [knobs.type, knobs.length, knobs.description, knobs.action]);

    return (
        <Button onClick={() => show()} variant="secondary">
            Show another
        </Button>
    );
};

const ToastPreview = ({ knobs }: PreviewProps) => {
    const stage = useStageContainer();

    return (
        <ToastProvider container={stage}>
            <div className="pb-16">
                <ToastTrigger knobs={knobs} />
            </div>
        </ToastProvider>
    );
};

const alertKnobs: Knob[] = [
    { id: 'tone', label: 'Tone', options: opts(...tones), default: 'warning' },
    { id: 'description', label: 'Description', switch: true, default: true },
    { id: 'action', label: 'Action', switch: true, default: true },
    { id: 'dismiss', label: 'Dismissible', switch: true, default: false },
];

const alertText: Record<Tone, { title: string; description: string; action: string }> = {
    neutral: {
        title: 'Reports refresh every hour',
        description: 'The last refresh was 12 minutes ago.',
        action: 'Refresh now',
    },
    primary: {
        title: 'A board template is ready',
        description: 'It turns this report into one page for the board.',
        action: 'Try it',
    },
    success: {
        title: 'Your domain is verified',
        description: 'Emails now send from northwind.io.',
        action: 'Send a test',
    },
    warning: {
        title: 'Your card expires next month',
        description: 'Update it before 1 December to keep the Business plan.',
        action: 'Update card',
    },
    error: {
        title: 'The last import failed',
        description: 'Three rows have no email address.',
        action: 'Review rows',
    },
};

const AlertPreview = ({ knobs }: PreviewProps) => {
    const tone = (tones as readonly string[]).includes(String(knobs.tone))
        ? (knobs.tone as Tone)
        : 'warning';
    const [dismissed, setDismissed] = useState(false);
    const text = alertText[tone];

    // Turning the knob brings a dismissed alert back.
    // biome-ignore lint/correctness/useExhaustiveDependencies: reset on each change of the knob
    useEffect(() => setDismissed(false), [knobs.dismiss]);

    return dismissed ? (
        <Button onClick={() => setDismissed(false)} variant="secondary">
            Show it again
        </Button>
    ) : (
        <Alert
            action={knobs.action && <Button variant="secondary">{text.action}</Button>}
            className="w-[480px]"
            onDismiss={knobs.dismiss ? () => setDismissed(true) : undefined}
            title={text.title}
            tone={tone}
        >
            {knobs.description && text.description}
        </Alert>
    );
};

const setupSteps = [
    {
        title: 'Create your workspace',
        description: 'A name and an address for your team.',
        action: 'Name it',
    },
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
];

const checklistKnobs: Knob[] = [
    {
        id: 'done',
        label: 'Done',
        options: setupSteps
            .map((_, i) => o(String(i), `${i} of ${setupSteps.length}`))
            .concat(o(String(setupSteps.length), 'All of them')),
        default: '1',
    },
];

const ChecklistPreview = ({ knobs }: PreviewProps) => {
    const [done, setDone] = useState(1);

    useEffect(() => setDone(Number(knobs.done)), [knobs.done]);

    return (
        <Checklist
            action={done === setupSteps.length && <Button variant="ghost">Dismiss</Button>}
            className="w-[380px]"
            completed={done}
            title="Get started"
            total={setupSteps.length}
        >
            {setupSteps.map((step, i) => (
                <ChecklistItem
                    action={
                        <Button onClick={() => setDone(n => n + 1)} variant="secondary">
                            {step.action}
                        </Button>
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

const skeletonKnobs: Knob[] = [
    { id: 'shape', label: 'Stands in for', options: opts('rows', 'card', 'text'), default: 'rows' },
];

const SkeletonPreview = ({ knobs }: PreviewProps) => (
    <div aria-busy className="w-[360px]">
        <span className="sr-only">Loading</span>
        {knobs.shape === 'card' ? (
            <div className="flex flex-col gap-4 rounded-card border border-neutral-200 p-5">
                <Skeleton className="h-3.5 w-24 rounded-chip" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-[88px] w-full" />
            </div>
        ) : knobs.shape === 'text' ? (
            <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-48 rounded-chip" />
                <SkeletonText lines={4} />
            </div>
        ) : (
            <div className="flex flex-col gap-4">
                {[0, 1, 2].map(row => (
                    <div className="flex items-center gap-3" key={row}>
                        <Skeleton className="size-8 rounded-full" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-2.5 w-2/5 rounded-chip" />
                            <Skeleton className="h-2.5 w-3/5 rounded-chip" />
                        </div>
                        <Skeleton className="h-[22px] w-14 rounded-chip" />
                    </div>
                ))}
            </div>
        )}
    </div>
);

const spinnerKnobs: Knob[] = [
    {
        id: 'variant',
        label: 'Button',
        options: opts('primary', 'secondary', 'ghost'),
        default: 'primary',
    },
    {
        id: 'size',
        label: 'Size',
        options: [o('md', 'md · 34px'), o('lg', 'lg · 38px')],
        default: 'md',
    },
    { id: 'icon', label: 'Icon button', switch: true, default: false },
    { id: 'loading', label: 'Busy', switch: true, default: true },
];

const SpinnerPreview = ({ knobs }: PreviewProps) => {
    const [busy, setBusy] = useState(true);

    useEffect(() => setBusy(Boolean(knobs.loading)), [knobs.loading]);

    // A click starts the work again; it settles after a moment unless the knob holds it busy.
    useEffect(() => {
        if (!busy || knobs.loading) return;
        const timer = window.setTimeout(() => setBusy(false), 1600);
        return () => window.clearTimeout(timer);
    }, [busy, knobs.loading]);

    const variant =
        knobs.variant === 'secondary' || knobs.variant === 'ghost' ? knobs.variant : 'primary';

    return knobs.icon ? (
        <Button
            aria-label="Refresh"
            loading={busy}
            onClick={() => setBusy(true)}
            size="icon"
            variant={variant === 'primary' ? 'secondary' : variant}
        >
            <History {...icon} />
        </Button>
    ) : (
        <Button
            loading={busy}
            onClick={() => setBusy(true)}
            size={knobs.size === 'lg' ? 'lg' : 'md'}
            variant={variant}
        >
            {busy ? 'Saving…' : 'Save changes'}
        </Button>
    );
};

const emptyKnobs: Knob[] = [
    {
        id: 'kind',
        label: 'Why it is empty',
        options: [o('first', 'Nothing yet'), o('filtered', 'Filtered to nothing')],
        default: 'first',
    },
    { id: 'icon', label: 'Icon', switch: true, default: true },
    { id: 'action', label: 'Action', switch: true, default: true },
];

const EmptyStatePreview = ({ knobs }: PreviewProps) =>
    knobs.kind === 'filtered' ? (
        <EmptyState
            action={knobs.action && <Button variant="secondary">Clear filters</Button>}
            className="w-[460px]"
            description="No invoices are overdue and owned by Bram Jansen."
            icon={knobs.icon && <Search {...icon} />}
            title="Nothing matches these filters"
        />
    ) : (
        <EmptyState
            action={
                knobs.action && (
                    <Button variant="secondary">
                        New invoice <Plus {...icon} />
                    </Button>
                )
            }
            className="w-[460px]"
            description="Invoices you send show up here, with when they are due and who has paid."
            icon={knobs.icon && <FileText {...icon} />}
            title="No invoices yet"
        />
    );

/** Every exported component family, in the order the library documents them. */
export const entries: Entry[] = [
    {
        id: 'button',
        name: 'Button',
        category: 'actions',
        description: 'Primary, secondary and ghost in two heights, plus icon buttons.',
        knobs: buttonKnobs,
        Preview: ButtonPreview,
    },
    {
        id: 'badge',
        name: 'Badge',
        category: 'actions',
        description: 'Soft statuses, delta pills, workflow dots and nav counts.',
        knobs: badgeKnobs,
        Preview: BadgePreview,
    },
    {
        id: 'filter-chip',
        name: 'Filter chip',
        category: 'actions',
        description: 'Removable filters in a top bar.',
        Preview: FilterChipPreview,
    },
    {
        id: 'suggestion-chip',
        name: 'Suggestion chip',
        category: 'actions',
        description: 'Prompts offered to the AI.',
        Preview: SuggestionChipPreview,
    },
    {
        id: 'toolbar',
        name: 'Toolbar',
        category: 'actions',
        description: 'Inline AI actions and the floating selection bar.',
        knobs: toolbarKnobs,
        Preview: ToolbarPreview,
    },
    {
        id: 'kbd',
        name: 'Kbd',
        category: 'actions',
        description: 'Keys in hints, menus and inputs.',
        Preview: KbdPreview,
    },
    {
        id: 'bottom-bar',
        name: 'Bottom bar and dock',
        category: 'actions',
        description: 'Sections of a page and its main action, floating at the bottom.',
        span: 2,
        knobs: bottomBarKnobs,
        Preview: BottomBarPreview,
    },
    {
        id: 'input',
        name: 'Input',
        category: 'forms',
        description: 'Two heights, with icons and a trailing slot inside the box.',
        knobs: inputKnobs,
        Preview: InputPreview,
    },
    {
        id: 'field',
        name: 'Field and textarea',
        category: 'forms',
        description: 'Label, control and helper wired together, invalid included.',
        knobs: fieldKnobs,
        Preview: FieldPreview,
    },
    {
        id: 'select',
        name: 'Select',
        category: 'forms',
        description: 'The input’s box with the dropdown’s panel.',
        knobs: selectKnobs,
        Preview: SelectPreview,
    },
    {
        id: 'combobox',
        name: 'Combobox',
        category: 'forms',
        description: 'A select you type into, for long lists.',
        Preview: ComboboxPreview,
    },
    {
        id: 'checkbox',
        name: 'Checkbox',
        category: 'forms',
        description: 'Checked, indeterminate and a parent that follows its children.',
        knobs: checkboxKnobs,
        Preview: CheckboxPreview,
    },
    {
        id: 'radio',
        name: 'Radio group',
        category: 'forms',
        description: 'One choice from a short list.',
        knobs: radioKnobs,
        Preview: RadioPreview,
    },
    {
        id: 'switch',
        name: 'Switch',
        category: 'forms',
        description: 'Settings that take effect at once.',
        knobs: switchKnobs,
        Preview: SwitchPreview,
    },
    {
        id: 'slider',
        name: 'Slider',
        category: 'forms',
        description: 'A hairline track filled with the action colour.',
        knobs: sliderKnobs,
        Preview: SliderPreview,
    },
    {
        id: 'segmented',
        name: 'Segmented control',
        category: 'forms',
        description: 'Filters in place; always holds one value.',
        knobs: segmentedKnobs,
        Preview: SegmentedPreview,
    },
    {
        id: 'option-row',
        name: 'Option row',
        category: 'forms',
        description: 'A bordered row that toggles the control it holds.',
        Preview: OptionRowPreview,
    },
    {
        id: 'setting-row',
        name: 'Setting row',
        category: 'forms',
        description: 'A setting with its switch, picker or button on the right.',
        stageClassName: 'items-stretch',
        Preview: SettingRowPreview,
    },
    {
        id: 'date-picker',
        name: 'Date picker',
        category: 'forms',
        description: 'An input-like trigger that opens a calendar.',
        Preview: DatePickerPreview,
    },
    {
        id: 'date-range-picker',
        name: 'Date range picker',
        category: 'forms',
        description: 'Two months with presets, for report ranges.',
        Preview: DateRangePickerPreview,
    },
    {
        id: 'code-input',
        name: 'Code input',
        category: 'forms',
        description: 'Boxes for a sign-in code, with paste and autofill.',
        Preview: CodeInputPreview,
    },
    {
        id: 'value-field',
        name: 'Value field',
        category: 'forms',
        description: 'A read-only value in a well, with copy.',
        stageClassName: 'items-stretch',
        Preview: ValueFieldPreview,
    },
    {
        id: 'drop-zone',
        name: 'Drop zone',
        category: 'forms',
        description: 'A dashed well to drop files on, with the files listed under it.',
        hero: 'min-h-96',
        knobs: dropZoneKnobs,
        Preview: DropZonePreview,
    },
    {
        id: 'stepper',
        name: 'Stepper',
        category: 'forms',
        description: 'The steps of a long form: what is done, where you are, what is left.',
        span: 2,
        knobs: stepperKnobs,
        Preview: StepperPreview,
    },
    {
        id: 'filter-menu',
        name: 'Filter menu',
        category: 'forms',
        description: 'Grouped checkbox filters that turn into chips, with Clear all.',
        // The open menu is taller than a tile, so the tile keeps the button in view and lets the list run off.
        stageClassName: 'items-start',
        hero: 'min-h-[440px]',
        knobs: filterMenuKnobs,
        Preview: FilterMenuPreview,
    },
    {
        id: 'sidebar',
        name: 'Sidebar and nav items',
        category: 'navigation',
        description: 'Nav items and projects that fold open to their pages.',
        hero: 'min-h-[420px]',
        Preview: NavPreview,
    },
    {
        id: 'rail',
        name: 'Rail',
        category: 'navigation',
        description: 'The collapsed sidebar, labelled by tooltips.',
        Preview: RailPreview,
    },
    {
        id: 'tabs',
        name: 'Tabs',
        category: 'navigation',
        description: 'Pill tabs for facets of one object.',
        knobs: tabsKnobs,
        Preview: TabsPreview,
    },
    {
        id: 'breadcrumb',
        name: 'Breadcrumb',
        category: 'navigation',
        description: 'Where the page sits; a long trail folds its middle into a menu.',
        knobs: breadcrumbKnobs,
        Preview: BreadcrumbPreview,
    },
    {
        id: 'header-bar',
        name: 'Header bar',
        category: 'navigation',
        description:
            'The bar over the page: the trail, the actions, and a notice that hangs from it.',
        span: 2,
        knobs: headerBarKnobs,
        Preview: HeaderBarPreview,
    },
    {
        id: 'pagination',
        name: 'Pagination',
        category: 'navigation',
        description: 'The same number of slots on every page.',
        span: 2,
        Preview: PaginationPreview,
    },
    {
        id: 'logo',
        name: 'Logo',
        category: 'navigation',
        description: 'The Continuum mark, a rounded endless loop.',
        Preview: LogoPreview,
    },
    {
        id: 'command-menu',
        name: 'Command menu',
        category: 'navigation',
        description: 'Search and run anything from the keyboard, with ⌘K.',
        hero: 'min-h-[460px]',
        stageClassName: 'items-start',
        knobs: commandKnobs,
        Preview: CommandMenuPreview,
    },
    {
        id: 'dialog',
        name: 'Dialog',
        category: 'overlays',
        description: 'Confirmations and short forms, centred.',
        hero: 'min-h-80',
        Preview: DialogPreview,
    },
    {
        id: 'sheet',
        name: 'Sheet',
        category: 'overlays',
        description: 'A non-modal side sheet beside the page.',
        hero: 'min-h-[520px]',
        Preview: SheetPreview,
    },
    {
        id: 'menu',
        name: 'Dropdown menu',
        category: 'overlays',
        description: 'Row actions with shortcuts, submenus and a danger item.',
        hero: 'min-h-80',
        Preview: MenuPreview,
    },
    {
        id: 'popover',
        name: 'Popover',
        category: 'overlays',
        description: 'An anchored panel for pickers and quick edits.',
        hero: 'min-h-80',
        Preview: PopoverPreview,
    },
    {
        id: 'tooltip',
        name: 'Tooltip',
        category: 'overlays',
        description: 'A dark chip naming an icon button.',
        knobs: tooltipKnobs,
        Preview: TooltipPreview,
    },
    {
        id: 'info-tip',
        name: 'Info tip',
        category: 'overlays',
        description: 'An info icon that explains a title in a tooltip.',
        Preview: InfoTipPreview,
    },
    {
        id: 'stat-card',
        name: 'Stat card',
        category: 'data',
        description: 'A KPI with its delta on one baseline.',
        Preview: StatCardPreview,
    },
    {
        id: 'card',
        name: 'Card',
        category: 'data',
        description: 'Title, figure and delta; told apart by the hairline alone.',
        Preview: CardPreview,
    },
    {
        id: 'meta-row',
        name: 'Meta row',
        category: 'data',
        description: 'One fact in a bordered row.',
        Preview: MetaRowPreview,
    },
    {
        id: 'table',
        name: 'Table',
        category: 'data',
        description: 'Ruled for data you work through, rows for ranked lists.',
        span: 2,
        Preview: TablePreview,
    },
    {
        id: 'description-list',
        name: 'Description list',
        category: 'data',
        description: 'Facts about one object, term beside value.',
        Preview: DescriptionPreview,
    },
    {
        id: 'activity',
        name: 'Activity list',
        category: 'data',
        description: 'History, newest first, toned by what happened.',
        Preview: ActivityPreview,
    },
    {
        id: 'avatar',
        name: 'Avatar',
        category: 'data',
        description: 'Square for workspaces, round for people, stacked.',
        knobs: avatarKnobs,
        Preview: AvatarPreview,
    },
    {
        id: 'icon-tile',
        name: 'Icon tile',
        category: 'data',
        description: 'A 32px well that gives an icon a status.',
        knobs: iconTileKnobs,
        Preview: IconTilePreview,
    },
    {
        id: 'bar-list',
        name: 'Bar list',
        category: 'data',
        description: 'Ranked rows with a bar sized to each value.',
        stageClassName: 'items-stretch',
        Preview: BarListPreview,
    },
    {
        id: 'meta-list',
        name: 'Meta list',
        category: 'data',
        description: 'Small facts about a record, with icons.',
        Preview: MetaListPreview,
    },
    {
        id: 'area-chart',
        name: 'Area chart',
        category: 'charts',
        description: 'Monotone lines over fading fills, with a tooltip that follows the pointer.',
        span: 2,
        stageClassName: 'items-stretch',
        Preview: AreaChartPreview,
    },
    {
        id: 'pie-chart',
        name: 'Pie chart',
        category: 'charts',
        description: 'Shares as slices, the total in the centre; hover a slice for its value.',
        Preview: PiePreview,
    },
    {
        id: 'funnel-chart',
        name: 'Funnel chart',
        category: 'charts',
        description: 'Drop-off between the steps of a flow, with the share kept at each step.',
        span: 3,
        Preview: FunnelPreview,
    },
    {
        id: 'chart-loading',
        name: 'Chart loading',
        category: 'charts',
        description: 'A skeleton line with a shimmer while the data is on its way.',
        stageClassName: 'items-stretch',
        Preview: ChartLoadingPreview,
    },
    {
        id: 'progress',
        name: 'Progress',
        category: 'feedback',
        description: 'A task under way, or indeterminate while it starts.',
        stageClassName: 'items-stretch',
        knobs: progressKnobs,
        Preview: ProgressPreview,
    },
    {
        id: 'meter',
        name: 'Meter',
        category: 'feedback',
        description: 'Usage against a limit: credits, seats, storage.',
        stageClassName: 'items-stretch',
        knobs: meterKnobs,
        Preview: MeterPreview,
    },
    {
        id: 'status-dot',
        name: 'Status dot and live count',
        category: 'feedback',
        description: 'A status in a dot; pulsing for something live.',
        knobs: statusDotKnobs,
        Preview: StatusDotPreview,
    },
    {
        id: 'alert',
        name: 'Alert',
        category: 'feedback',
        description: 'An inline notice on a page or form, its tone in the icon.',
        knobs: alertKnobs,
        Preview: AlertPreview,
    },
    {
        id: 'toast',
        name: 'Toast',
        category: 'feedback',
        description: 'A short confirmation at the foot of the screen, with undo.',
        knobs: toastKnobs,
        Preview: ToastPreview,
    },
    {
        id: 'empty-state',
        name: 'Empty state',
        category: 'feedback',
        description: 'A dashed panel saying what goes here, with one action.',
        knobs: emptyKnobs,
        Preview: EmptyStatePreview,
    },
    {
        id: 'skeleton',
        name: 'Skeleton',
        category: 'feedback',
        description: 'Quiet placeholders at the real element’s size while data loads.',
        knobs: skeletonKnobs,
        Preview: SkeletonPreview,
    },
    {
        id: 'spinner',
        name: 'Spinner',
        category: 'feedback',
        description: 'Only inside the button that is busy.',
        knobs: spinnerKnobs,
        Preview: SpinnerPreview,
    },
    {
        id: 'checklist',
        name: 'Setup checklist',
        category: 'feedback',
        description: 'Onboarding steps that tick off, with overall progress.',
        hero: 'min-h-[480px]',
        knobs: checklistKnobs,
        Preview: ChecklistPreview,
    },
    {
        id: 'chat',
        name: 'Chat thread',
        category: 'ai',
        description: 'Messages, system events and tokens in a support thread.',
        span: 2,
        stageClassName: 'items-stretch',
        Preview: ChatPreview,
    },
    {
        id: 'chat-composer',
        name: 'Chat composer',
        category: 'ai',
        description: 'A box that grows with the draft; Enter sends.',
        stageClassName: 'items-stretch',
        Preview: ChatComposerPreview,
    },
];
