import {
    Avatar,
    Badge,
    Button,
    Checkbox,
    cn,
    Dock,
    DockAction,
    DockItem,
    HeaderBar,
    HeaderBarActions,
    Input,
    SegmentedControl,
    SegmentedControlItem,
    Separator,
    StatCard,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Theme,
    type ThemeMode,
    type ThemeOptions,
} from 'continuum';
import { ChartCard, ChartFrame, type ChartSeries, FunnelChart } from 'continuum/charts';
import { Contrast, Plus, Search, ShoppingCart, Wallet } from 'lucide-react';
import { useId, useState } from 'react';
import {
    Checked,
    CheckProvider,
    GridButton,
    MissesButton,
    useCheckLayer,
    useChecks,
    type Vision,
    VisionFilters,
    VisionSelect,
    visionFilter,
} from './accessibility';

const icon = { strokeWidth: 2 } as const;

/*
 * The preview: a page of a product in the theme being edited, filling the panel beside the page,
 * with the tools that judge it in the panel's header. Only this re-renders while the theme changes.
 */

type InvoiceMarks = { box?: string; number?: string; client?: string; toggle?: string };

/**
 * The invoices, and the pairs their marks measure. Every badge is marked, one tone each; the rest
 * once in the table, on the row that shows it (the off switch is the paid invoice's).
 */
const invoices: {
    number: string;
    client: string;
    amount: string;
    status: string;
    tone: 'success' | 'warning' | 'primary' | 'error';
    remind: boolean;
    selected: boolean;
    marks: InvoiceMarks;
}[] = [
    {
        number: 'INV-0142',
        client: 'Acme Corp',
        amount: '€4,200',
        status: 'Paid',
        tone: 'success',
        remind: false,
        selected: false,
        marks: { box: 'checkbox', toggle: 'track' },
    },
    {
        number: 'INV-0141',
        client: 'Globex',
        amount: '€2,850',
        status: 'Due soon',
        tone: 'warning',
        remind: true,
        selected: true,
        marks: { box: 'action' },
    },
    {
        number: 'INV-0140',
        client: 'Umbrella',
        amount: '€1,600',
        status: 'Scheduled',
        tone: 'primary',
        remind: true,
        selected: false,
        marks: { number: 'cell' },
    },
    {
        number: 'INV-0139',
        client: 'Initech',
        amount: '€3,120',
        status: 'Overdue',
        tone: 'error',
        remind: true,
        selected: false,
        marks: { client: 'quiet' },
    },
];

/** Revenue per plan in €K, oldest first; November adds up to the stat card's €48,260. */
const revenue = [
    { month: 'Jun', basic: 6, pro: 11, team: 9, enterprise: 8 },
    { month: 'Jul', basic: 6, pro: 12, team: 9, enterprise: 8 },
    { month: 'Aug', basic: 6, pro: 12, team: 10, enterprise: 9 },
    { month: 'Sep', basic: 7, pro: 13, team: 11, enterprise: 9 },
    { month: 'Oct', basic: 7, pro: 14, team: 12, enterprise: 10 },
    { month: 'Nov', basic: 8, pro: 16, team: 13, enterprise: 11.26 },
];

/**
 * The plans as the theme's series colours. Enterprise is new, so it alone is drawn as a tint,
 * and the tint is where the theme's chart texture shows.
 */
const plans: ChartSeries[] = [
    { key: 'basic', name: 'Basic' },
    { key: 'pro', name: 'Pro' },
    { key: 'team', name: 'Team' },
    { key: 'enterprise', name: 'Enterprise', fill: 'tint' },
];

/** The checkout, step by step: the theme's step colours, chart-1 to chart-5, in order. */
const checkout = [
    { name: 'Cart', value: 8420 },
    { name: 'Details', value: 5110 },
    { name: 'Payment', value: 3240 },
    { name: 'Paid', value: 2710 },
];

/** The series colours in use: the kit's own card and bar chart, as a project draws them. */
const RevenueCard = () => (
    <ChartCard
        comparison="on the six months before"
        data={revenue}
        delta="+8.4%"
        figures={false}
        formatY={value => `€${value}K`}
        height={168}
        icon={<Wallet {...icon} />}
        kind="bar"
        series={plans}
        stacked
        title="Revenue by plan"
        value="€48,260"
        x="month"
    />
);

/** The step colours in use: the kit's funnel, each step in the next of the theme's steps. */
const CheckoutCard = () => (
    <ChartFrame
        comparison="of carts paid"
        icon={<ShoppingCart {...icon} />}
        title="Checkout"
        value="32.2%"
    >
        <FunnelChart
            aria-label="Shoppers at each step of the checkout"
            data={checkout}
            height={112}
        />
    </ChartFrame>
);

const InvoiceTable = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead className="w-11">
                    <Checkbox aria-label="Select every invoice" checked="indeterminate" />
                </TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>
                    {/* The head's fill is the canvas step, so its label is the canvas pair. */}
                    <Checked check="secondary-canvas" place="raised">
                        Client
                    </Checked>
                </TableHead>
                {/* The one column a narrow panel can do without, so the rest never scroll sideways. */}
                <TableHead className="@max-lg:hidden text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remind</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {invoices.map(({ marks, ...invoice }) => (
                <TableRow data-selected={invoice.selected || undefined} key={invoice.number}>
                    <TableCell>
                        <Checked check={marks.box} className="align-middle">
                            <Checkbox
                                aria-label={`Select ${invoice.number}`}
                                defaultChecked={invoice.selected}
                            />
                        </Checked>
                    </TableCell>
                    <TableCell>
                        <Checked check={marks.number} place="raised">
                            {invoice.number}
                        </Checked>
                    </TableCell>
                    <TableCell>
                        <span className="flex items-center gap-2 font-normal text-neutral-700">
                            <Avatar fallback={invoice.client.slice(0, 2).toUpperCase()} size={24} />
                            <Checked check={marks.client} place="raised">
                                {invoice.client}
                            </Checked>
                        </span>
                    </TableCell>
                    <TableCell className="@max-lg:hidden text-right font-normal text-neutral-700 tabular-nums">
                        {invoice.amount}
                    </TableCell>
                    <TableCell>
                        <Checked check={`badge-${invoice.tone}`} className="align-middle">
                            <Badge tone={invoice.tone}>{invoice.status}</Badge>
                        </Checked>
                    </TableCell>
                    <TableCell>
                        <Checked check={marks.toggle} className="align-middle">
                            <Switch
                                aria-label={`Remind ${invoice.client}`}
                                defaultChecked={invoice.remind}
                            />
                        </Checked>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

type ThemePreviewProps = {
    /** The theme's id, or none for the default. Its CSS carries the corners too. */
    theme?: string;
    mode: ThemeMode;
    /** A CSS filter over the whole product, as the vision select sets it. */
    filter?: string;
    className?: string;
};

/**
 * A page of a product in the theme: its title and the period, two figures and a chart in the data
 * colours, a search over a ruled table, and the dock with the one primary action. It scrolls on its
 * own, on the theme's own surface, with no frame of its own: the panel it fills is the frame.
 */
export const ThemePreview = ({ theme, mode, filter, className }: ThemePreviewProps) => {
    const checking = useChecks() !== null;
    const [period, setPeriod] = useState('30d');

    return (
        <Theme
            className={cn('overflow-y-auto overscroll-contain bg-neutral-50', className)}
            mode={mode}
            // The scrollbar in the preview's mode, not the page's.
            style={{ colorScheme: mode, filter }}
            theme={theme}
        >
            <div className="flex min-h-full flex-col gap-8 bg-neutral-50 px-6 pt-8 pb-6 text-neutral-950">
                {/* In a narrow panel the actions go under the title rather than squeeze it. */}
                <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <Checked as="div" check="text" place="after">
                            <p className="font-medium text-2xl">Invoices</p>
                        </Checked>
                        <Checked as="div" check="secondary" place="after">
                            <p className="text-neutral-600 text-sm">
                                48 open, 6 overdue this month.
                            </p>
                        </Checked>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <SegmentedControl
                            aria-label="Period"
                            onValueChange={setPeriod}
                            value={period}
                        >
                            <SegmentedControlItem value="30d">30d</SegmentedControlItem>
                            <SegmentedControlItem value="90d">90d</SegmentedControlItem>
                            <SegmentedControlItem value="12m">12m</SegmentedControlItem>
                        </SegmentedControl>
                        {/* While checking, the theme's focus ring is drawn here, as a keyboard would show it. */}
                        <Checked check="focus">
                            <Button
                                className={cn(
                                    checking &&
                                        'outline-2 outline-focus outline-solid outline-offset-2',
                                )}
                                variant="secondary"
                            >
                                Export
                            </Button>
                        </Checked>
                    </div>
                </header>

                <section aria-label="This month" className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            delta={
                                <Checked check="badge-success" place="inset">
                                    +12%
                                </Checked>
                            }
                            label="Paid this month"
                            value="€48,260"
                        />
                        <StatCard delta="−4%" label="Outstanding" trend="neutral" value="€18,940" />
                    </div>
                    <Checked as="div" check="series" className="flex w-full flex-col">
                        <RevenueCard />
                    </Checked>
                    <CheckoutCard />
                </section>

                <section aria-label="Invoices" className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Checked check="field" className="w-56">
                            <Checked check="muted" className="w-full" place="start">
                                <Input
                                    aria-label="Search invoices"
                                    leadingIcon={<Search {...icon} />}
                                    placeholder="Search invoices"
                                    size="sm"
                                />
                            </Checked>
                        </Checked>
                        <Checked check="tint" className="ml-auto">
                            <Button variant="tint">Ask AI</Button>
                        </Checked>
                    </div>
                    <InvoiceTable />
                </section>

                {/*
                 * The page's views and its one primary action, floating at the foot as it scrolls:
                 * over the rows' marks, and letting the pointer through either side of it.
                 */}
                <div className="pointer-events-none sticky bottom-6 z-20 mt-auto flex justify-center">
                    <div className="pointer-events-auto flex items-center gap-2">
                        <Dock aria-label="Views" defaultValue="all">
                            <DockItem value="all">All</DockItem>
                            <DockItem value="drafts">Drafts</DockItem>
                            <DockItem value="sent">Sent</DockItem>
                            <DockItem value="paid">Paid</DockItem>
                        </Dock>
                        <Checked check="on-action">
                            <DockAction>
                                New invoice
                                <Plus {...icon} />
                            </DockAction>
                        </Checked>
                    </div>
                </div>
            </div>
        </Theme>
    );
};

export type PreviewPanelProps = {
    theme: ThemeOptions;
    /** The id the theme's CSS is written for, or none while it is the default. */
    themeId?: string;
    mode: ThemeMode;
    onModeChange: (mode: ThemeMode) => void;
    /** Changes the theme; the check layer's balance sets the curves it finds through it. */
    set?: (patch: Partial<ThemeOptions>) => void;
};

/**
 * The preview's panel, filling the aside beside the page: a header with the preview's mode, a
 * colour-vision filter and the check layer's tools, over the product, which scrolls on its own.
 */
export const PreviewPanel = ({ theme, themeId, mode, onModeChange, set }: PreviewPanelProps) => {
    const [vision, setVision] = useState<Vision>('normal');
    const [checking, setChecking] = useState(false);
    const layer = useCheckLayer(theme, mode, checking);
    // useId's colons and guillemets would need escaping inside url(#…).
    const filterId = `vision-${useId().replace(/[^\w-]/g, '')}`;

    return (
        <div className="@container flex min-h-0 flex-1 flex-col">
            <HeaderBar>
                <div className="flex min-w-0 items-center gap-1">
                    <span className="@max-xl:hidden truncate text-neutral-600">Preview</span>
                    {layer && <MissesButton layer={layer} set={set} theme={theme} />}
                </div>
                <HeaderBarActions>
                    <SegmentedControl
                        aria-label="Preview mode"
                        onValueChange={value => onModeChange(value as ThemeMode)}
                        value={mode}
                    >
                        <SegmentedControlItem value="light">Light</SegmentedControlItem>
                        <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
                    </SegmentedControl>
                    <VisionSelect onChange={setVision} value={vision} />
                    {/* Rules the view's settings off from the checks. */}
                    <Separator
                        className="mx-1 data-[orientation=vertical]:h-5"
                        orientation="vertical"
                    />
                    <Button
                        aria-pressed={checking}
                        className={cn(
                            checking &&
                                'bg-selected text-neutral-950 hover:bg-selected hover:text-neutral-950',
                        )}
                        onClick={() => setChecking(on => !on)}
                        variant="ghost"
                    >
                        <Contrast {...icon} />
                        {/* A narrow panel keeps the icon alone, so the count beside the title has room. */}
                        <span className="@max-lg:sr-only">Check</span>
                    </Button>
                    <GridButton theme={theme} />
                </HeaderBarActions>
            </HeaderBar>
            <VisionFilters id={filterId} />
            <CheckProvider value={layer}>
                <ThemePreview
                    className="min-h-0 flex-1"
                    filter={visionFilter(filterId, vision)}
                    mode={mode}
                    theme={themeId}
                />
            </CheckProvider>
        </div>
    );
};
