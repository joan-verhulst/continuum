import {
    Avatar,
    Badge,
    Button,
    Card,
    CardTitle,
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
import { Contrast, Plus, Search } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
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

const plans = ['Basic', 'Pro', 'Team', 'Enterprise'] as const;

/** Revenue per plan in €K, oldest first; November adds up to the stat card's €48,260. */
const revenue = [
    { month: 'Jun', values: [6, 11, 9, 8] },
    { month: 'Jul', values: [6, 12, 9, 8] },
    { month: 'Aug', values: [6, 12, 10, 9] },
    { month: 'Sep', values: [7, 13, 11, 9] },
    { month: 'Oct', values: [7, 14, 12, 10] },
    { month: 'Nov', values: [8, 16, 13, 11.26] },
];

const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

/** The chart's geometry in px: a plot over an x-label band, the y labels to its left. */
const chart = {
    top: 6,
    plot: 96,
    labels: 18,
    axis: 28,
    max: 50,
    ticks: [0, 25, 50],
    gap: 2,
    end: 4,
};

/** The element's content width, measured before paint and kept current. */
const useWidth = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        setWidth(node.clientWidth);
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) setWidth(entry.contentRect.width);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
};

/** A column's top segment: square on the one below, the 4px rounded data end on top. */
const topSegment = (x: number, top: number, bottom: number, width: number) => {
    const r = Math.min(chart.end, bottom - top, width / 2);
    return `M${x},${bottom}V${top + r}A${r},${r} 0 0 1 ${x + r},${top}H${x + width - r}A${r},${r} 0 0 1 ${x + width},${top + r}V${bottom}Z`;
};

/**
 * Revenue by plan as stacked columns in the theme's own series colours, split by a 2px surface
 * gap, over hairline grid lines with 11px labels. No hover: it is a preview, not a report.
 */
const RevenueChart = () => {
    const [ref, width] = useWidth<HTMLDivElement>();
    const baseline = chart.top + chart.plot;
    const band = (width - chart.axis) / revenue.length;
    const barWidth = Math.min(28, Math.round(band * 0.5));
    const y = (value: number) => Math.round(baseline - (value / chart.max) * chart.plot);
    const first = revenue[0];
    const last = revenue.at(-1);
    const label =
        first && last
            ? `Revenue by plan, ${first.month} to ${last.month}: €${Math.round(total(first.values))}K rising to €${Math.round(total(last.values))}K.`
            : 'Revenue by plan.';

    return (
        <div ref={ref}>
            <svg
                aria-label={label}
                className="block overflow-visible text-xxs tabular-nums"
                height={baseline + chart.labels}
                role="img"
                width={width}
            >
                {width > 0 && (
                    <>
                        {chart.ticks.map(tick => (
                            <g key={tick}>
                                <line
                                    shapeRendering="crispEdges"
                                    stroke="var(--color-chart-grid)"
                                    x1={chart.axis}
                                    x2={width}
                                    y1={y(tick) + 0.5}
                                    y2={y(tick) + 0.5}
                                />
                                <text
                                    dominantBaseline="middle"
                                    fill="var(--color-chart-label)"
                                    textAnchor="end"
                                    x={chart.axis - 8}
                                    y={y(tick) + 0.5}
                                >
                                    {tick === 0 ? '0' : `${tick}K`}
                                </text>
                            </g>
                        ))}
                        {revenue.map(({ month, values }, i) => {
                            const x = Math.round(chart.axis + band * i + (band - barWidth) / 2);
                            const tops = values.map((_, j) => y(total(values.slice(0, j + 1))));

                            return (
                                <g key={month}>
                                    {values.map((_, j) => {
                                        const top = tops[j] ?? baseline;
                                        const bottom = tops[j - 1] ?? baseline;
                                        const fill = `var(--color-chart-series-${j + 1})`;
                                        if (j === values.length - 1) {
                                            return (
                                                <path
                                                    d={topSegment(x, top, bottom, barWidth)}
                                                    fill={fill}
                                                    key={plans[j]}
                                                />
                                            );
                                        }
                                        const height = bottom - top - chart.gap;
                                        return height > 0 ? (
                                            <rect
                                                fill={fill}
                                                height={height}
                                                key={plans[j]}
                                                width={barWidth}
                                                x={x}
                                                y={top + chart.gap}
                                            />
                                        ) : null;
                                    })}
                                    <text
                                        fill="var(--color-chart-label)"
                                        textAnchor="middle"
                                        x={x + barWidth / 2}
                                        y={baseline + 15}
                                    >
                                        {month}
                                    </text>
                                </g>
                            );
                        })}
                    </>
                )}
            </svg>
        </div>
    );
};

/** The data colours in use: a key beside the title over stacked columns, so they read in place. */
const RevenueCard = () => (
    <Card layout="list">
        <div className="flex items-center justify-between gap-4">
            <CardTitle>Revenue by plan</CardTitle>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-neutral-600 text-xxs">
                {plans.map((plan, i) => (
                    <li className="flex items-center gap-1.5" key={plan}>
                        <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: `var(--color-chart-series-${i + 1})` }}
                        />
                        {plan}
                    </li>
                ))}
            </ul>
        </div>
        <RevenueChart />
    </Card>
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
            style={{ colorScheme: mode }}
            theme={theme}
        >
            <div
                className="flex min-h-full flex-col gap-8 bg-neutral-50 px-6 pt-8 pb-6 text-neutral-950"
                style={{ filter }}
            >
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
