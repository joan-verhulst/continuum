import {
    Badge,
    BarList,
    BarListItem,
    Button,
    Card,
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    FilterChip,
    LiveCount,
} from 'continuum';
import { History, ListFilter, Monitor, Smartphone, Tablet } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

type Dimension = 'page' | 'country' | 'source' | 'device';

type Row = { name: string; visitors: number; icon?: ReactNode };

const icon = { strokeWidth: 2 } as const;

// Countries go unmarked: a data colour beside a name with no chart to read it against is decoration.

// Each breakdown adds up to the same 129 visitors, so the four lists describe one audience.
const BASE_TOTAL = 129;

const breakdowns: Record<Dimension, Row[]> = {
    page: [
        { name: '/about', visitors: 48 },
        { name: '/pricing', visitors: 31 },
        { name: '/contact', visitors: 18 },
        { name: '/services', visitors: 14 },
        { name: '/portfolio', visitors: 9 },
        { name: '/blog/launch-week', visitors: 5 },
        { name: '/careers', visitors: 4 },
    ],
    country: [
        { name: 'Germany', visitors: 41 },
        { name: 'Netherlands', visitors: 28 },
        { name: 'France', visitors: 22 },
        { name: 'Spain', visitors: 17 },
        { name: 'Italy', visitors: 9 },
        { name: 'Sweden', visitors: 6 },
        { name: 'Belgium', visitors: 4 },
        { name: 'Poland', visitors: 2 },
    ],
    source: [
        { name: 'Google', visitors: 52 },
        { name: 'Direct', visitors: 31 },
        { name: 'Twitter', visitors: 21 },
        { name: 'LinkedIn', visitors: 13 },
        { name: 'Reddit', visitors: 7 },
        { name: 'Newsletter', visitors: 5 },
    ],
    device: [
        { name: 'Desktop', visitors: 78, icon: <Monitor {...icon} /> },
        { name: 'Mobile', visitors: 46, icon: <Smartphone {...icon} /> },
        { name: 'Tablet', visitors: 5, icon: <Tablet {...icon} /> },
    ],
};

const sections: { dimension: Dimension; title: string; limit: number }[] = [
    { dimension: 'page', title: 'Top pages', limit: 4 },
    { dimension: 'country', title: 'Country', limit: 5 },
    { dimension: 'source', title: 'Sources', limit: 4 },
    { dimension: 'device', title: 'Devices', limit: 4 },
];

const dimensionLabels: Record<Dimension, string> = {
    page: 'Page',
    country: 'Country',
    source: 'Source',
    device: 'Device',
};

const comparisons = {
    '1h': { label: '1h ago', menu: 'An hour ago', visitors: 115 },
    '24h': { label: 'this time yesterday', menu: 'This time yesterday', visitors: 142 },
    '7d': { label: 'last week', menu: 'This time last week', visitors: 104 },
} as const;

type Comparison = keyof typeof comparisons;

type Filters = Record<Dimension, string[]>;

const noFilters: Filters = { page: [], country: [], source: [], device: [] };

const dimensions = Object.keys(breakdowns) as Dimension[];

/** The share of visitors a dimension's filter keeps: 1 when nothing in it is picked. */
const shareOf = (dimension: Dimension, filters: Filters) => {
    const picked = filters[dimension];
    if (picked.length === 0) return 1;
    const rows = breakdowns[dimension];
    const kept = rows.filter(row => picked.includes(row.name));
    return kept.reduce((sum, row) => sum + row.visitors, 0) / BASE_TOTAL;
};

const formatDelta = (ratio: number) => {
    const percent = Math.round(ratio * 100);
    // A true minus sign, so "−9%" and "+12%" line up in tabular figures.
    return percent > 0 ? `+${percent}%` : percent < 0 ? `−${Math.abs(percent)}%` : '0%';
};

/** "Live visitors": who is on the site right now, by page, country, source and device, filterable by any row. */
export const liveAnalyticsExample = () => <LiveAnalytics />;

const LiveAnalytics = () => {
    const [live, setLive] = useState(BASE_TOTAL);
    const [comparison, setComparison] = useState<Comparison>('1h');
    const [filters, setFilters] = useState<Filters>(noFilters);

    // A gentle random walk stands in for the live feed, held within a believable band.
    useEffect(() => {
        const timer = window.setInterval(() => {
            setLive(current =>
                Math.min(141, Math.max(118, current + Math.round(Math.random() * 6 - 3))),
            );
        }, 3000);
        return () => window.clearInterval(timer);
    }, []);

    const toggle = (dimension: Dimension, name: string) =>
        setFilters(current => ({
            ...current,
            [dimension]: current[dimension].includes(name)
                ? current[dimension].filter(item => item !== name)
                : [...current[dimension], name],
        }));

    const active = dimensions.flatMap(dimension =>
        filters[dimension].map(name => ({ dimension, name })),
    );

    // Dimensions are treated as independent: a filter on one scales every other breakdown by its share.
    const scale = live / BASE_TOTAL;
    const filteredShare = dimensions.reduce((product, d) => product * shareOf(d, filters), 1);
    const count = Math.round(live * filteredShare);
    const baseline = comparisons[comparison].visitors;
    const delta = live / baseline - 1;

    const rowsFor = (dimension: Dimension) => {
        // A list is not narrowed by its own filter, so the other rows stay there to add.
        const others = dimensions
            .filter(d => d !== dimension)
            .reduce((product, d) => product * shareOf(d, filters), 1);
        return breakdowns[dimension]
            .map(row => ({ ...row, value: Math.round(row.visitors * scale * others) }))
            .filter(row => row.value > 0 || filters[dimension].includes(row.name))
            .sort((a, b) => b.value - a.value);
    };

    return (
        <Card
            aria-labelledby="live-analytics-title"
            className="w-full max-w-[640px] gap-6"
            layout="list"
            role="region"
        >
            <h2 className="sr-only" id="live-analytics-title">
                Live visitors
            </h2>
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <LiveCount count={count} />
                        <span className="inline-flex items-center gap-1.5">
                            <Badge
                                className="tabular-nums"
                                tone={delta >= 0 ? 'success' : 'error'}
                                variant="pill"
                            >
                                {formatDelta(delta)}
                            </Badge>
                            <span className="text-neutral-500 text-xs">
                                vs {comparisons[comparison].label}
                            </span>
                        </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button aria-label="Compare with" size="icon" variant="ghost" />
                                }
                            >
                                <History {...icon} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-52">
                                <DropdownMenuRadioGroup
                                    onValueChange={value => setComparison(value as Comparison)}
                                    value={comparison}
                                >
                                    <DropdownMenuLabel>Compare with</DropdownMenuLabel>
                                    {(Object.keys(comparisons) as Comparison[]).map(key => (
                                        <DropdownMenuRadioItem key={key} value={key}>
                                            {comparisons[key].menu}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        aria-label={
                                            active.length > 0
                                                ? `Filters, ${active.length} applied`
                                                : 'Filters'
                                        }
                                        size="icon"
                                        // The hairline marks a filtered view without spending the action colour.
                                        variant={active.length > 0 ? 'secondary' : 'ghost'}
                                    />
                                }
                            >
                                <ListFilter {...icon} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-48">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                                    {dimensions.map(dimension => (
                                        <DropdownMenuSub key={dimension}>
                                            <DropdownMenuSubTrigger>
                                                {dimensionLabels[dimension]}
                                                {filters[dimension].length > 0 && (
                                                    <span className="ml-auto text-neutral-500 text-xxs tabular-nums">
                                                        {filters[dimension].length}
                                                    </span>
                                                )}
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent className="min-w-48">
                                                {breakdowns[dimension].map(row => (
                                                    <DropdownMenuCheckboxItem
                                                        checked={filters[dimension].includes(
                                                            row.name,
                                                        )}
                                                        closeOnClick={false}
                                                        key={row.name}
                                                        onCheckedChange={() =>
                                                            toggle(dimension, row.name)
                                                        }
                                                    >
                                                        {row.name}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                    ))}
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    disabled={active.length === 0}
                                    onClick={() => setFilters(noFilters)}
                                >
                                    Clear filters
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {active.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {active.map(({ dimension, name }) => (
                            <FilterChip
                                key={`${dimension}:${name}`}
                                onRemove={() => toggle(dimension, name)}
                                removeLabel={`Remove ${dimensionLabels[dimension].toLowerCase()} filter ${name}`}
                            >
                                <span className="text-neutral-500">
                                    {dimensionLabels[dimension]}
                                </span>{' '}
                                {name}
                            </FilterChip>
                        ))}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                {sections.map(({ dimension, title, limit }) => (
                    <BarList key={dimension} limit={limit} title={title}>
                        {rowsFor(dimension).map(row => {
                            const selected = filters[dimension].includes(row.name);
                            return (
                                <BarListItem
                                    aria-pressed={selected}
                                    icon={row.icon}
                                    key={row.name}
                                    onClick={() => toggle(dimension, row.name)}
                                    value={row.value}
                                >
                                    {row.name}
                                </BarListItem>
                            );
                        })}
                    </BarList>
                ))}
            </div>
        </Card>
    );
};
