import {
    BottomBar,
    Button,
    Card,
    CardTitle,
    Chip,
    ChipAction,
    cn,
    Dock,
    DockItem,
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    focusRing,
    SegmentedControl,
    SegmentedControlItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'continuum';
import {
    Area,
    AreaChart,
    ChartTooltip,
    Grid,
    PieCenter,
    PieChart,
    PieSlice,
    XAxis,
    YAxis,
} from 'continuum/charts';
import {
    Calendar,
    ChartLine,
    CloudUpload,
    Files,
    Gauge,
    LayoutGrid,
    Link,
    ListFilter,
    MapPin,
    Monitor,
    Smartphone,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import {
    AnalyticsPage,
    AnalyticsTopBar,
    ChartAnnotation,
    ChartCardHeader,
    chartMargin,
    formatWeekday,
    PageTitle,
    reportWeek,
    seriesRows,
} from './shared';

const initialFilters = [
    { id: 'device', label: 'Device: 2', icon: <Monitor strokeWidth={2} /> },
    { id: 'os', label: 'OS: 1', icon: <Smartphone strokeWidth={2} /> },
    { id: 'browser', label: 'Browser: 1', icon: <Calendar strokeWidth={2} /> },
    { id: 'region', label: 'Region: 1', icon: <MapPin strokeWidth={2} /> },
    { id: 'source', label: 'Source: 1', icon: <Link strokeWidth={2} /> },
    { id: 'visitor', label: 'New/Returning', icon: <Users strokeWidth={2} /> },
];

// One row per day of the report week; each chart plots its own key. A release went out on Friday:
// the bounce rate rises and the conversion rate dips from that day.
const week = reportWeek.map((date, i) => ({
    date,
    sessions: [1580, 1840, 1910, 1760, 1950, 1820, 1540][i] ?? 0,
    bounce: [41, 42, 40, 43, 52, 50, 48][i] ?? 0,
    conversion: [4.2, 4.4, 4.6, 4.3, 2.8, 3.1, 3.3][i] ?? 0,
}));
const percent = (value: number) => `${value}%`;

// The headlines are the week's own figures: the sessions added up, the rates averaged by session.
const totalSessions = week.reduce((total, day) => total + day.sessions, 0);
const weekRate = (key: 'bounce' | 'conversion') =>
    week.reduce((total, day) => total + day[key] * day.sessions, 0) / totalSessions;
const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 });

const sections = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid strokeWidth={2} /> },
    { id: 'traffic', label: 'Traffic', icon: <ChartLine strokeWidth={2} /> },
    { id: 'performance', label: 'Performance', icon: <Gauge strokeWidth={2} /> },
    { id: 'pages', label: 'Pages', icon: <Files strokeWidth={2} /> },
];

/** One series over the report week, with an optional release marker on a day. */
const WeekAreaChart = ({
    label,
    dataKey,
    name,
    color,
    height,
    format = String,
    annotation,
}: {
    label: string;
    dataKey: 'sessions' | 'bounce' | 'conversion';
    name: string;
    color: string;
    height: number;
    format?: (value: number) => string;
    /** Index of the day a release went out. */
    annotation?: number;
}) => (
    <div aria-label={label} role="img">
        <AreaChart
            data={week}
            formatXLabel={formatWeekday}
            margin={chartMargin}
            style={{ height }}
            // Rates stop at 100%, so the axis does not reach past it for headroom.
            yScaleDomainCap={format === percent ? 100 : undefined}
        >
            <Grid />
            <Area dataKey={dataKey} fill={color} />
            {annotation !== undefined && <ChartAnnotation icon={CloudUpload} index={annotation} />}
            <XAxis numTicks={week.length} />
            <YAxis formatValue={format} />
            <ChartTooltip rows={seriesRows([{ key: dataKey, label: name, color }], format)} />
        </AreaChart>
    </div>
);

const pages = {
    pages: [
        ['/', '4,812', '9,204'],
        ['/pricing', '2,140', '3,388'],
        ['/blog/launch-week', '1,377', '1,902'],
        ['/docs/getting-started', '986', '2,215'],
        ['/changelog', '642', '811'],
    ],
    entry: [
        ['/', '3,904', '3,904'],
        ['/blog/launch-week', '1,102', '1,102'],
        ['/pricing', '875', '875'],
        ['/docs', '512', '512'],
        ['/careers', '204', '204'],
    ],
    exit: [
        ['/pricing', '1,210', '3,388'],
        ['/checkout', '806', '1,426'],
        ['/', '733', '9,204'],
        ['/docs/api', '398', '1,040'],
        ['/contact', '187', '402'],
    ],
} as const;

// Shades of one series by opacity, as the legend swatches draw them.
const devices = [
    { label: 'Desktop', share: 0.62, color: 'var(--color-chart-5)', swatch: 'bg-chart-5' },
    {
        label: 'Mobile',
        share: 0.31,
        color: 'color-mix(in oklab, var(--color-chart-5) 80%, transparent)',
        swatch: 'bg-chart-5/80',
    },
    {
        label: 'Tablet',
        share: 0.07,
        color: 'color-mix(in oklab, var(--color-chart-5) 33%, transparent)',
        swatch: 'bg-chart-5/33',
    },
].map(device => ({ ...device, value: Math.round(device.share * totalSessions) }));

const TopPagesCard = () => {
    const [view, setView] = useState<keyof typeof pages>('pages');

    return (
        <Card className="gap-4 p-5">
            <div className="flex items-center justify-between gap-4">
                <CardTitle>Top pages</CardTitle>
                <SegmentedControl
                    aria-label="Page list"
                    onValueChange={next => setView(next as keyof typeof pages)}
                    value={view}
                >
                    <SegmentedControlItem value="pages">Pages</SegmentedControlItem>
                    <SegmentedControlItem value="entry">Entry</SegmentedControlItem>
                    <SegmentedControlItem value="exit">Exit</SegmentedControlItem>
                </SegmentedControl>
            </div>
            <Table variant="rows">
                <TableHeader>
                    <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="w-16" numeric>
                            Visitors
                        </TableHead>
                        <TableHead className="w-16" numeric>
                            Views
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pages[view].map(([page, visitors, views]) => (
                        <TableRow key={page}>
                            <TableCell>{page}</TableCell>
                            <TableCell numeric>{visitors}</TableCell>
                            <TableCell numeric>{views}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
};

const DevicesCard = () => (
    <Card className="gap-4 p-5">
        <div className="flex items-center justify-between gap-4">
            <CardTitle>Devices</CardTitle>
            <span className="text-neutral-600 text-xs">Sessions, this week</span>
        </div>
        <div className="flex flex-1 items-center gap-8 px-2">
            <div
                aria-label={devices
                    .map(device => `${device.label} ${Math.round(device.share * 100)}%`)
                    .join(', ')}
                role="img"
            >
                <PieChart data={devices} innerRadius={50} padAngle={0.02} size={152}>
                    {devices.map((device, index) => (
                        <PieSlice index={index} key={device.label} showGlow={false} />
                    ))}
                    <PieCenter
                        defaultLabel="sessions"
                        formatOptions={{ notation: 'compact', maximumFractionDigits: 1 }}
                    />
                </PieChart>
            </div>
            <ul className="flex flex-1 flex-col gap-3 text-xs">
                {devices.map(device => (
                    <li className="flex items-center gap-2" key={device.label}>
                        <span className={`size-2 rounded-full ${device.swatch}`} />
                        <span className="flex-1 text-neutral-600">{device.label}</span>
                        <span className="font-medium text-neutral-950 tabular-nums">
                            {Math.round(device.share * 100)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    </Card>
);

/** Analytics overview (Eyes, 2026): filters, three area charts, top pages and devices. */
export const AnalyticsOverview = () => {
    const [filters, setFilters] = useState(initialFilters);
    const [section, setSection] = useState('overview');
    const current = sections.find(s => s.id === section) ?? sections[0];
    // The overview shows every card; each other section shows only its own.
    const show = (id: string) => section === 'overview' || section === id;

    return (
        <AnalyticsPage
            bottomBar={
                <BottomBar floating>
                    {/* The page's one primary is Add to Ask in the top bar, so the dock holds only the sections. */}
                    <Dock
                        aria-label="Sections"
                        onValueChange={next => {
                            if (next) setSection(next);
                        }}
                        value={section}
                    >
                        {sections.map(item => (
                            <DockItem key={item.id} value={item.id}>
                                {item.icon}
                                {item.label}
                            </DockItem>
                        ))}
                    </Dock>
                </BottomBar>
            }
            rail="analytics"
        >
            <AnalyticsTopBar trail={['Analytics', current?.label ?? 'Overview']} />

            <div className="mt-1 flex min-h-14 items-end justify-between gap-6">
                <div className="flex flex-wrap gap-1.5">
                    {filters.map(filter => (
                        <Chip
                            icon={filter.icon}
                            key={filter.id}
                            action={
                                <ChipAction
                                    onClick={() =>
                                        setFilters(current =>
                                            current.filter(f => f.id !== filter.id),
                                        )
                                    }
                                />
                            }
                        >
                            {filter.label}
                        </Chip>
                    ))}
                    {filters.length === 0 && (
                        <span className="text-neutral-600 text-xs">No filters applied</span>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" />}>
                            <ListFilter strokeWidth={2} />
                            Filters
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filters</DropdownMenuLabel>
                            {initialFilters.map(filter => (
                                <DropdownMenuCheckboxItem
                                    checked={filters.some(f => f.id === filter.id)}
                                    key={filter.id}
                                    onCheckedChange={checked =>
                                        setFilters(current =>
                                            checked
                                                ? initialFilters.filter(
                                                      f => f === filter || current.includes(f),
                                                  )
                                                : current.filter(f => f.id !== filter.id),
                                        )
                                    }
                                >
                                    {filter.icon}
                                    {filter.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                        className={cn(
                            'shrink-0 cursor-pointer rounded-xs text-neutral-600 text-xs transition-colors duration-150 hover:text-neutral-950 disabled:cursor-default disabled:opacity-50',
                            focusRing,
                        )}
                        disabled={filters.length === 0}
                        onClick={() => setFilters([])}
                        type="button"
                    >
                        Clear all
                    </button>
                </div>
            </div>

            <div className="mt-24">
                <PageTitle>Analytics — {current?.label}</PageTitle>
            </div>

            <div className="mt-8 flex flex-col gap-8">
                {show('traffic') && (
                    <Card className="gap-8 p-5 pb-8">
                        <ChartCardHeader
                            delta="+10.7% on last week"
                            title="Sessions this week"
                            value={compact.format(totalSessions)}
                        />
                        <WeekAreaChart
                            color="var(--color-chart-line-primary)"
                            dataKey="sessions"
                            height={280}
                            label="Sessions per day, this week"
                            name="Sessions"
                        />
                    </Card>
                )}

                {show('performance') && (
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="gap-8 p-5 pb-8">
                            <ChartCardHeader
                                delta="+3.1 pts on last week"
                                size="lg"
                                title="Bounce rate"
                                trend="down"
                                value={`${Math.round(weekRate('bounce'))}%`}
                            />
                            <WeekAreaChart
                                annotation={4}
                                color="var(--color-error-500)"
                                dataKey="bounce"
                                format={percent}
                                height={240}
                                label="Bounce rate per day"
                                name="Bounce rate"
                            />
                        </Card>
                        <Card className="gap-8 p-5 pb-8">
                            <ChartCardHeader
                                delta="−0.4 pts on last week"
                                size="lg"
                                title="Conversion rate"
                                trend="down"
                                value={`${weekRate('conversion').toFixed(1)}%`}
                            />
                            <WeekAreaChart
                                annotation={4}
                                color="var(--color-success-500)"
                                dataKey="conversion"
                                format={percent}
                                height={240}
                                label="Conversion rate per day"
                                name="Conversion rate"
                            />
                        </Card>
                    </div>
                )}

                {(show('pages') || show('traffic')) && (
                    <div className={cn('grid gap-4', section === 'overview' && 'grid-cols-2')}>
                        {show('pages') && <TopPagesCard />}
                        {show('traffic') && <DevicesCard />}
                    </div>
                )}
            </div>
        </AnalyticsPage>
    );
};
