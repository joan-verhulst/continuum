import {
    Calendar,
    ChartLine,
    CloudUpload,
    Files,
    Funnel,
    Gauge,
    LayoutGrid,
    Link,
    ListFilter,
    MapPin,
    Monitor,
    Smartphone,
    Users,
} from 'lucide-react';
import {
    AreaChart,
    BottomBar,
    Card,
    CardTitle,
    cn,
    Dock,
    DockAction,
    DockItem,
    DonutChart,
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    FilterChip,
    focusRing,
    SegmentedControl,
    SegmentedControlItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'personal-design-system';
import { useState } from 'react';
import { AnalyticsPage, AnalyticsTopBar, ChartCardHeader, PageTitle } from './shared';

const initialFilters = [
    { id: 'device', label: 'Device: 2', icon: <Monitor strokeWidth={1.5} /> },
    { id: 'os', label: 'OS: 1', icon: <Smartphone strokeWidth={1.5} /> },
    { id: 'browser', label: 'Browser: 1', icon: <Calendar strokeWidth={1.5} /> },
    { id: 'region', label: 'Region: 1', icon: <MapPin strokeWidth={1.5} /> },
    { id: 'source', label: 'Source: 1', icon: <Link strokeWidth={1.5} /> },
    { id: 'visitor', label: 'New/Returning', icon: <Users strokeWidth={1.5} /> },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const percentTicks = [0, 25, 50, 75, 100];

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

const devices = [
    { label: 'Desktop', value: 0.62, swatch: 'bg-chart-5' },
    { label: 'Mobile', value: 0.31, swatch: 'bg-chart-5/80' },
    { label: 'Tablet', value: 0.07, swatch: 'bg-chart-5/33' },
];

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
            <Select defaultValue="7d">
                <SelectTrigger aria-label="Period" size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="flex flex-1 items-center gap-8 px-2">
            <DonutChart rings={devices} size={152}>
                <span className="block text-lg">12.4k</span>
                <span className="block font-normal text-neutral-600 text-xxs">sessions</span>
            </DonutChart>
            <ul className="flex flex-1 flex-col gap-3 text-xs">
                {devices.map(device => (
                    <li className="flex items-center gap-2" key={device.label}>
                        <span className={`size-2 rounded-full ${device.swatch}`} />
                        <span className="flex-1 text-neutral-600">{device.label}</span>
                        <span className="font-medium text-neutral-950 tabular-nums">
                            {Math.round(device.value * 100)}%
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

    return (
        <AnalyticsPage
            bottomBar={
                <BottomBar floating>
                    <Dock aria-label="Sections" onValueChange={setSection} value={section}>
                        <DockItem value="overview">
                            <LayoutGrid strokeWidth={1.5} />
                            Overview
                        </DockItem>
                        <DockItem value="pages">
                            <Files strokeWidth={1.5} />
                            Pages
                        </DockItem>
                        <DockItem value="performance">
                            <Gauge strokeWidth={1.5} />
                            Performance
                        </DockItem>
                        <DockItem value="traffic">
                            <ChartLine strokeWidth={1.5} />
                            Traffic
                        </DockItem>
                        <DockItem value="funnels">
                            <Funnel strokeWidth={1.5} />
                            Funnels
                        </DockItem>
                    </Dock>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <DockAction aria-label={`Filters, ${filters.length} applied`}>
                                <ListFilter strokeWidth={1.5} />({filters.length})
                            </DockAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top">
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
                                    onSelect={event => event.preventDefault()}
                                >
                                    {filter.icon}
                                    {filter.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </BottomBar>
            }
            rail="analytics"
        >
            <AnalyticsTopBar trail={['Analytics', 'Overview']} />

            <div className="mt-1 flex min-h-[56px] items-end justify-between gap-6">
                <div className="flex flex-wrap gap-1.5">
                    {filters.map(filter => (
                        <FilterChip
                            icon={filter.icon}
                            key={filter.id}
                            onRemove={() =>
                                setFilters(current => current.filter(f => f.id !== filter.id))
                            }
                        >
                            {filter.label}
                        </FilterChip>
                    ))}
                    {filters.length === 0 && (
                        <span className="text-neutral-500 text-xs">No filters applied</span>
                    )}
                </div>
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

            <div className="mt-24">
                <PageTitle>Analytics — Overview</PageTitle>
            </div>

            <div className="mt-8 flex flex-col gap-8">
                <Card className="gap-8 p-5 pb-8">
                    <ChartCardHeader
                        delta="+10.7% last mo"
                        title="Sessions over time"
                        value="12.4k"
                    />
                    <AreaChart
                        aria-label="Sessions per day, last week"
                        data={days.map((label, i) => ({
                            label,
                            value: [4, 58, 398, 296, 236, 288, 0][i] ?? 0,
                        }))}
                        height={280}
                        yTicks={[0, 100, 200, 300, 400]}
                    />
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card className="gap-8 p-5 pb-8">
                        <ChartCardHeader
                            delta="+10.7% last mo"
                            size="lg"
                            title="Bounce rate"
                            trend="down"
                            value="67%"
                        />
                        <AreaChart
                            annotation={{ index: 4, icon: <CloudUpload strokeWidth={1.5} /> }}
                            aria-label="Bounce rate per day"
                            color="var(--pds-error-500)"
                            data={days.map((label, i) => ({
                                label,
                                value: [6, 12, 21, 34, 46, 58, 67][i] ?? 0,
                            }))}
                            formatY={value => `${value}%`}
                            height={240}
                            yTicks={percentTicks}
                        />
                    </Card>
                    <Card className="gap-8 p-5 pb-8">
                        <ChartCardHeader
                            delta="+10.7% last mo"
                            size="lg"
                            title="Conversion rate"
                            value="45%"
                        />
                        <AreaChart
                            annotation={{ index: 4, icon: <CloudUpload strokeWidth={1.5} /> }}
                            aria-label="Conversion rate per day"
                            color="var(--pds-success-500)"
                            data={days.map((label, i) => ({
                                label,
                                value: [2, 4, 9, 22, 38, 52, 64][i] ?? 0,
                            }))}
                            formatY={value => `${value}%`}
                            height={240}
                            yTicks={percentTicks}
                        />
                    </Card>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <TopPagesCard />
                    <DevicesCard />
                </div>
            </div>
        </AnalyticsPage>
    );
};
