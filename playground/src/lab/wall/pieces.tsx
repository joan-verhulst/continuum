import {
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
    Checkbox,
    Chip,
    ChipAction,
    CodeInput,
    DatePicker,
    DateRangePicker,
    Input,
    Kbd,
    MenuItem,
    Pagination,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SettingRow,
    SidebarItem,
    StatusDot,
    Switch,
    TableTree,
    TableTreeTrigger,
    Tabs,
    TabsList,
    TabsTrigger,
} from 'continuum';
import {
    Archive,
    CalendarDays,
    ChevronDown,
    CircleDot,
    Download,
    FileText,
    Inbox,
    Mail,
    Plus,
    Search,
    Share2,
    Sparkles,
    X,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { icon, Labelled } from '../../showcase/kit';
import {
    AiToolbar,
    CanvasToolbar,
    CommentInput,
    DangerHold,
    EditComment,
    FilterPiece,
    FindBar,
    FormatToolbar,
    RangeSegments,
    SelectionToolbar,
    ZoomBar,
    ZoomFitBar,
} from './controls';

export type Piece = {
    id: string;
    /** Pieces of one height sit together by family, in this order. */
    family: string;
    node: ReactNode;
    /** The element whose padding, corner, type and icon are read; the piece's first element by default. */
    root?: string;
};

/**
 * The height each piece is meant to have: Joan's bands where they name the part (20 for the fold
 * chevron and checks, 22 for badges and kbd, 24 for small chips and the switch, 28 for medium chips
 * and small icon buttons, 34 for controls and menu rows, 38 for large controls), else the token the
 * component draws itself on. A piece left out makes no claim.
 */
export const meant: Record<string, number> = {
    breadcrumb: 16,
    kbd: 22,
    'kbd-esc': 22,
    'kbd-chord': 22,
    switch: 24,
    'switch-label': 24,
    'chip-md': 28,
    'chip-md-outline': 28,
    'fold-closed': 20,
    'fold-open': 20,
    checkbox: 20,
    radio: 20,
    'checkbox-label': 20,
    'radio-label': 20,
    badge: 22,
    'badge-success': 22,
    'badge-dot': 22,
    'badge-pill': 22,
    'badge-count': 22,
    'avatar-24': 24,
    'avatar-32': 32,
    chip: 24,
    'chip-outline': 24,
    'icon-button-sm': 28,
    'icon-button-sm-ghost': 28,
    button: 34,
    'button-secondary': 34,
    'button-ghost': 34,
    'button-tint': 34,
    'button-leading': 34,
    'button-trailing': 34,
    'button-loading': 34,
    'button-pill': 34,
    'button-pill-secondary': 34,
    'button-pill-primary': 34,
    'hold-button': 34,
    'icon-button': 34,
    'icon-button-secondary': 34,
    'icon-button-ghost': 34,
    'segmented-edit': 34,
    'segmented-range': 34,
    'tabs-pill': 34,
    'input-sm': 34,
    'comment-input': 34,
    'select-sm': 34,
    'date-sm': 34,
    'toolbar-ai': 34,
    'toolbar-zoom-fit': 34,
    filter: 34,
    pagination: 34,
    'nav-active': 34,
    nav: 34,
    'menu-item': 34,
    'button-lg': 38,
    'button-lg-secondary': 38,
    'input-md': 38,
    'select-md': 38,
    'date-md': 38,
    'date-range': 38,
    'code-input': 38,
    'toolbar-canvas': 38,
    'toolbar-format': 38,
    'toolbar-find': 38,
    'toolbar-selection': 38,
    'toolbar-zoom': 38,
};

const Pages = () => {
    const [page, setPage] = useState(3);
    return <Pagination className="w-[360px]" onPageChange={setPage} page={page} pageCount={12} />;
};

const SettingSwitch = () => {
    const [on, setOn] = useState(true);
    return (
        <SettingRow
            className="w-[360px]"
            control={<Switch checked={on} onCheckedChange={setOn} />}
            description="When a report is ready to read"
            title="Email notifications"
        />
    );
};

/** The fold's chevron alone, as a layout of one's own would place it. */
const Chevron = ({ open }: { open?: boolean }) => (
    <TableTree defaultOpen={open} label="What is in Website">
        <TableTreeTrigger />
    </TableTree>
);

/**
 * Every small part, one instance a piece where it can be, so neighbours of one height can be
 * compared. Order here is only the order within a family; the wall sorts by measured height.
 */
export const pieces: Piece[] = [
    // Marks
    { id: 'kbd', family: 'kbd', node: <Kbd>⌘K</Kbd> },
    { id: 'kbd-esc', family: 'kbd', node: <Kbd>Esc</Kbd> },
    { id: 'kbd-chord', family: 'kbd', node: <Kbd>G I</Kbd> },
    { id: 'fold-closed', family: 'fold', node: <Chevron /> },
    { id: 'fold-open', family: 'fold', node: <Chevron open /> },
    {
        id: 'checkbox',
        family: 'choice',
        node: <Checkbox aria-label="Include PDF" defaultChecked />,
    },
    {
        id: 'radio',
        family: 'choice',
        node: (
            <RadioGroup aria-label="Plan" defaultValue="a">
                <RadioGroupItem value="a" />
            </RadioGroup>
        ),
        root: '[role=radio]',
    },
    { id: 'switch', family: 'choice', node: <Switch aria-label="Notify" defaultChecked /> },
    {
        id: 'checkbox-label',
        family: 'choice',
        node: (
            <Labelled label="Include PDF">
                <Checkbox defaultChecked />
            </Labelled>
        ),
    },
    {
        id: 'switch-label',
        family: 'choice',
        node: (
            <Labelled label="Email me when ready">
                <Switch defaultChecked />
            </Labelled>
        ),
    },
    {
        id: 'radio-label',
        family: 'choice',
        node: (
            <RadioGroup aria-label="Billing" defaultValue="monthly">
                <Labelled label="Monthly">
                    <RadioGroupItem value="monthly" />
                </Labelled>
            </RadioGroup>
        ),
    },
    {
        id: 'status-dot',
        family: 'status',
        node: (
            <span className="flex items-center gap-1.5 text-neutral-700 text-xs leading-4">
                <StatusDot /> Online
            </span>
        ),
    },
    {
        id: 'breadcrumb',
        family: 'breadcrumb',
        node: (
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#view=wall">
                            <BreadcrumbHome />
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#view=wall">Customers</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Northwind</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        ),
    },
    { id: 'badge', family: 'badge', node: <Badge>Draft</Badge> },
    { id: 'badge-success', family: 'badge', node: <Badge tone="success">Paid</Badge> },
    {
        id: 'badge-dot',
        family: 'badge',
        node: (
            <Badge tone="success" variant="dot">
                Live
            </Badge>
        ),
    },
    { id: 'badge-pill', family: 'badge', node: <Badge variant="pill">Beta</Badge> },
    { id: 'badge-count', family: 'badge', node: <Badge variant="count">12</Badge> },
    { id: 'avatar-24', family: 'avatar', node: <Avatar fallback="MC" size={24} /> },
    { id: 'avatar-32', family: 'avatar', node: <Avatar fallback="MC" size={32} /> },
    {
        id: 'chip',
        family: 'chip',
        node: (
            <Chip action={<ChipAction />} icon={<CircleDot {...icon} />}>
                Status is Paid
            </Chip>
        ),
    },
    {
        id: 'chip-outline',
        family: 'chip',
        node: (
            <Chip onClick={() => undefined} variant="outline">
                Owner is Maya
            </Chip>
        ),
    },
    {
        id: 'chip-md',
        family: 'chip',
        node: (
            <Chip onClick={() => undefined} size="md">
                Summarise this thread
            </Chip>
        ),
    },
    {
        id: 'chip-md-outline',
        family: 'chip',
        node: (
            <Chip
                icon={<Sparkles {...icon} />}
                onClick={() => undefined}
                size="md"
                variant="outline"
            >
                Draft a reply
            </Chip>
        ),
    },

    // Buttons
    { id: 'button', family: 'button', node: <Button>Save</Button> },
    { id: 'button-secondary', family: 'button', node: <Button variant="secondary">Cancel</Button> },
    { id: 'button-ghost', family: 'button', node: <Button variant="ghost">Skip</Button> },
    {
        id: 'button-tint',
        family: 'button',
        node: (
            <Button variant="tint">
                <Sparkles {...icon} /> Improve
            </Button>
        ),
    },
    {
        id: 'button-leading',
        family: 'button',
        node: (
            <Button variant="secondary">
                <Download {...icon} /> Export
            </Button>
        ),
    },
    {
        id: 'button-trailing',
        family: 'button',
        node: (
            <Button variant="secondary">
                Status <ChevronDown {...icon} />
            </Button>
        ),
    },
    {
        id: 'button-loading',
        family: 'button',
        node: (
            <Button loading variant="secondary">
                Saving
            </Button>
        ),
    },
    {
        id: 'button-pill',
        family: 'button',
        node: (
            <Button shape="pill" variant="tint">
                <Sparkles {...icon} /> Improve
            </Button>
        ),
    },
    {
        id: 'button-pill-secondary',
        family: 'button',
        node: (
            <Button shape="pill" variant="secondary">
                Explain
            </Button>
        ),
    },
    {
        id: 'button-pill-primary',
        family: 'button',
        node: <Button shape="pill">Reply</Button>,
    },
    { id: 'hold-button', family: 'button', node: <DangerHold /> },
    { id: 'button-lg', family: 'button', node: <Button size="lg">Create invoice</Button> },
    {
        id: 'button-lg-secondary',
        family: 'button',
        node: (
            <Button size="lg" variant="secondary">
                Preview
            </Button>
        ),
    },
    {
        id: 'icon-button',
        family: 'icon-button',
        node: (
            <Button aria-label="Add" size="icon">
                <Plus {...icon} />
            </Button>
        ),
    },
    {
        id: 'icon-button-secondary',
        family: 'icon-button',
        node: (
            <Button aria-label="Share" size="icon" variant="secondary">
                <Share2 {...icon} />
            </Button>
        ),
    },
    {
        id: 'icon-button-ghost',
        family: 'icon-button',
        node: (
            <Button aria-label="Archive" size="icon" variant="ghost">
                <Archive {...icon} />
            </Button>
        ),
    },
    {
        id: 'icon-button-sm',
        family: 'icon-button',
        node: (
            <Button aria-label="Download" size="icon-sm" variant="secondary">
                <Download {...icon} />
            </Button>
        ),
    },
    {
        id: 'icon-button-sm-ghost',
        family: 'icon-button',
        node: (
            <Button aria-label="Close" size="icon-sm" variant="ghost">
                <X {...icon} />
            </Button>
        ),
    },

    // Picks and tabs
    { id: 'segmented-edit', family: 'segmented', node: <EditComment /> },
    { id: 'segmented-range', family: 'segmented', node: <RangeSegments /> },
    {
        id: 'tabs-pill',
        family: 'tabs',
        node: (
            <Tabs defaultValue="summary">
                <TabsList variant="pill">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>
            </Tabs>
        ),
        root: '[role=tab]',
    },

    // Fields
    {
        id: 'input-sm',
        family: 'input',
        node: (
            <Input
                aria-label="Search"
                className="w-52"
                leadingIcon={<Search {...icon} />}
                placeholder="Search customers"
                size="sm"
            />
        ),
    },
    {
        id: 'input-md',
        family: 'input',
        node: (
            <Input
                aria-label="Email"
                className="w-56"
                defaultValue="maya@northwind.co"
                leadingIcon={<Mail {...icon} />}
            />
        ),
    },
    { id: 'comment-input', family: 'input', node: <CommentInput /> },
    {
        id: 'select-sm',
        family: 'select',
        node: (
            <Select defaultValue="30d">
                <SelectTrigger
                    aria-label="Range"
                    className="w-40"
                    leadingIcon={<CalendarDays {...icon} />}
                    size="sm"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
            </Select>
        ),
    },
    {
        id: 'select-md',
        family: 'select',
        node: (
            <Select defaultValue="paid">
                <SelectTrigger aria-label="Status" className="w-32">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="due">Due</SelectItem>
                </SelectContent>
            </Select>
        ),
    },
    {
        id: 'date-sm',
        family: 'picker',
        node: <DatePicker aria-label="Due date" defaultValue={new Date(2026, 10, 3)} size="sm" />,
    },
    {
        id: 'date-md',
        family: 'picker',
        node: <DatePicker aria-label="Sent" defaultValue={new Date(2026, 10, 3)} />,
    },
    { id: 'date-range', family: 'picker', node: <DateRangePicker aria-label="Period" /> },
    { id: 'code-input', family: 'input', node: <CodeInput aria-label="Code" defaultValue="482" /> },

    // Bars
    { id: 'toolbar-ai', family: 'toolbar', node: <AiToolbar /> },
    { id: 'toolbar-zoom-fit', family: 'toolbar', node: <ZoomFitBar /> },
    { id: 'toolbar-canvas', family: 'toolbar', node: <CanvasToolbar /> },
    { id: 'toolbar-format', family: 'toolbar', node: <FormatToolbar /> },
    { id: 'toolbar-find', family: 'toolbar', node: <FindBar /> },
    { id: 'toolbar-selection', family: 'toolbar', node: <SelectionToolbar /> },
    { id: 'toolbar-zoom', family: 'toolbar', node: <ZoomBar /> },
    { id: 'filter', family: 'filter', node: <FilterPiece /> },
    { id: 'pagination', family: 'pagination', node: <Pages /> },

    // Rows
    {
        id: 'nav-active',
        family: 'nav',
        node: (
            <SidebarItem
                active
                className="w-52"
                icon={<Inbox {...icon} />}
                trailing={<Badge variant="count">4</Badge>}
            >
                Inbox
            </SidebarItem>
        ),
    },
    {
        id: 'nav',
        family: 'nav',
        node: (
            <SidebarItem className="w-52" icon={<FileText {...icon} />} trailing={<Kbd>G R</Kbd>}>
                Reports
            </SidebarItem>
        ),
    },
    {
        id: 'menu-item',
        family: 'menu',
        node: (
            <MenuItem className="w-60" leading={<FileText {...icon} />} trailing={<Kbd>⌘O</Kbd>}>
                Open report
            </MenuItem>
        ),
    },
    { id: 'setting-row', family: 'setting', node: <SettingSwitch /> },
    {
        id: 'setting-row-button',
        family: 'setting',
        node: (
            <SettingRow
                className="w-[360px]"
                control={<Button variant="secondary">Add credits</Button>}
                description="1,240 left this month"
                labelControl={false}
                title="Credits"
            />
        ),
    },
];
