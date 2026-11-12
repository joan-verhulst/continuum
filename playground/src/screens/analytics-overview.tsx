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
import { ChartCard, type ChartColor, ChartFrame, ChartLegend, DonutChart } from 'continuum/charts';
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
    MousePointerClick,
    ShoppingCart,
    Smartphone,
    Users,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { AnalyticsPage, AnalyticsTopBar, formatWeekday, PageTitle, reportWeek } from './shared';

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

/** The day the release went out: the bounce rate rises and the conversion rate dips from it. */
const release = [{ index: 4, label: 'Release 2.4', icon: <CloudUpload /> }];

/** One rate over the report week in its card, the release marked on the day it went out. */
const RateCard = ({
    title,
    icon,
    dataKey,
    color,
    value,
    delta,
}: {
    title: string;
    icon: ReactNode;
    dataKey: 'bounce' | 'conversion';
    color: ChartColor;
    value: string;
    delta: string;
}) => (
    <ChartCard
        comparison="on last week"
        data={week}
        delta={delta}
        formatX={formatWeekday}
        formatY={percent}
        height={240}
        icon={icon}
        markers={release}
        series={[{ key: dataKey, name: title, color }]}
        title={title}
        trend="down"
        value={value}
        x="date"
        xTicks={week.length}
        // Rates stop at 100%, so the axis does not reach past it for headroom.
        yMax={100}
    />
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

// The week's sessions by device; the shares add up to the whole week.
const devices = [
    { name: 'Desktop', share: 0.62 },
    { name: 'Mobile', share: 0.31 },
    { name: 'Tablet', share: 0.07 },
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

/** The week's sessions by device: the total at the card's head, the ring and its key beside it. */
const DevicesCard = () => (
    <ChartFrame
        comparison="sessions this week"
        icon={<Monitor />}
        table={{
            columns: ['Device', 'Sessions'],
            rows: devices.map(device => [device.name, device.value]),
        }}
        title="Devices"
        value={compact.format(totalSessions)}
    >
        <div className="flex items-center gap-6">
            <DonutChart
                aria-label="Sessions by device, this week"
                data={devices}
                size={132}
                total={false}
            />
            <ChartLegend
                className="min-w-0 flex-1"
                items={devices.map(device => ({
                    name: device.name,
                    value: `${Math.round(device.share * 100)}%`,
                }))}
                layout="list"
            />
        </div>
    </ChartFrame>
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
                    <ChartCard
                        comparison="on last week"
                        data={week}
                        delta="+10.7%"
                        formatX={formatWeekday}
                        height={280}
                        icon={<Users />}
                        series={[{ key: 'sessions', name: 'Sessions' }]}
                        title="Sessions this week"
                        value={compact.format(totalSessions)}
                        x="date"
                        xTicks={week.length}
                    />
                )}

                {show('performance') && (
                    <div className="grid grid-cols-2 gap-4">
                        <RateCard
                            color="error"
                            dataKey="bounce"
                            delta="+3.1 pts"
                            icon={<MousePointerClick />}
                            title="Bounce rate"
                            value={`${Math.round(weekRate('bounce'))}%`}
                        />
                        <RateCard
                            color="success"
                            dataKey="conversion"
                            delta="−0.4 pts"
                            icon={<ShoppingCart />}
                            title="Conversion rate"
                            value={`${weekRate('conversion').toFixed(1)}%`}
                        />
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
