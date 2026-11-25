'use client';

import {
    Badge,
    Button,
    cn,
    DataGrid,
    type DataGridRange,
    PageContent,
    SegmentedControl,
    SegmentedControlItem,
    StatCard,
    TableToolbar,
} from '@contui/ui';
import { CalendarRange, Check, Ellipsis, Layers, Send, Share2, Target } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { compact, Frame, icon } from './shell';

/*
 * Pipeline, the forecast: where the revenue lead plans what each segment books a month and gets
 * every month to its target before publishing. The page is one object, the sheet, as a forecast
 * is in the spreadsheet it replaces: the document's name and state over it, its actions (Share,
 * Publish) in the header bar where a document's are, the scenario and where the plan stands on the
 * sheet's own bar, and the months' pacing inside the sheet as its last rows: the total of each
 * month, its target (typed, like any input) and the gap between them. Type over a cell and its
 * month's total, gap and the plan's standing follow.
 */

/** The page's start: the system's 96 below the header bar's hairline, as the other screens. */
const TOP = 96;

/** The plan published in November, for the change the planned total shows. */
const LAST_PLAN = 1_495_000;

/** Segments with every month planned on Monday, for the change the count shows. */
const PLANNED_MONDAY = 9;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const MONTHS = months.length;

const grouped = new Intl.NumberFormat('en-GB');

const numberOf = (value: string | undefined) => {
    const trimmed = (value ?? '').replaceAll(',', '').replace('€', '').replace('−', '-').trim();
    const n = Number(trimmed);
    return trimmed !== '' && Number.isFinite(n) ? n : null;
};

/** A month's figure as the sheet writes it: 48,200; a shortfall with a true minus. */
const amount = (n: number) => (n < 0 ? `−${grouped.format(-n)}` : grouped.format(n));

const line = (segment: string, figures: number[] | null, note = '') => [
    segment,
    ...(figures ? figures.map(amount) : months.map(() => '')),
    note,
];

const base = [
    line('DACH · Enterprise', [48200, 51600, 55000, 58400, 61800, 65200], 'Umbrella renews'),
    line('DACH · Business', [21400, 22100, 22800, 23500, 24200, 24900]),
    line('Benelux · Enterprise', [33800, 33800, 41500, 41500, 41500, 46000], 'Initech expands'),
    line('Benelux · Business', [12600, 13100, 13600, 14100, 14600, 15100]),
    line('Nordics · Enterprise', [27400, 27400, 27400, 31900, 31900, 31900]),
    line('Nordics · Business', [9800, 10200, 10600, 11000, 11400, 11800]),
    line('Iberia · Enterprise', [18900, 18900, 22400, 22400, 25900, 25900], 'Lisbon office'),
    line('Iberia · Business', [7400, 7700, 8000, 8300, 8600, 8900]),
    line('UK · Enterprise', [39600, 41200, 42800, 44400, 46000, 47600]),
    line('UK · Business', [15300, 15900, 16500, 17100, 17700, 18300]),
    line('France · Enterprise', null, 'Plan with Ana'),
];

/** Each month's target, rising through the half: €1.80M in all. */
const firstTargets = [270_000, 285_000, 295_000, 305_000, 315_000, 330_000];

type Scenario = 'base' | 'stretch' | 'conservative';

const scenarioLabels: Record<Scenario, string> = {
    base: 'Base',
    stretch: 'Stretch',
    conservative: 'Conservative',
};

/** A scenario is the base plan moved by a share, to the nearest hundred. */
const scaled = (factor: number) =>
    base.map(cells =>
        cells.map((cell, col) => {
            const n = col >= 1 && col <= MONTHS ? numberOf(cell) : null;
            return n === null ? cell : amount(Math.round((n * factor) / 100) * 100);
        }),
    );

type Plan = { segments: string[][]; targets: number[] };

const initial: Record<Scenario, Plan> = {
    base: { segments: base, targets: firstTargets },
    stretch: { segments: scaled(1.08), targets: firstTargets },
    conservative: { segments: scaled(0.92), targets: firstTargets },
};

const totalsOf = (segments: string[][]) =>
    months.map((_, m) => segments.reduce((sum, cells) => sum + (numberOf(cells[m + 1]) ?? 0), 0));

/** The sheet as drawn: the segments, then the month's total, its target and the gap to it. */
const sheetOf = ({ segments, targets }: Plan) => {
    const totals = totalsOf(segments);
    return [
        ...segments,
        ['Total', ...totals.map(amount), ''],
        ['Target', ...targets.map(amount), ''],
        ['Gap', ...totals.map((total, m) => amount(total - (targets[m] ?? 0))), ''],
    ];
};

/** €1.59M, €42K: a figure read at a glance. */
const short = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `€${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `€${Math.round(value / 1_000)}K`;
    return `€${value}`;
};

/** What the grid's selection adds up to, as a spreadsheet's status bar says it. */
const Summary = ({ sheet, ranges }: { sheet: string[][]; ranges: DataGridRange[] }) => {
    const numbers: number[] = [];
    const seen = new Set<string>();
    for (const range of ranges)
        for (let r = range.top; r <= range.bottom; r++)
            for (let c = range.left; c <= range.right; c++) {
                if (seen.has(`${r},${c}`)) continue;
                seen.add(`${r},${c}`);
                const n = c >= 1 && c <= MONTHS ? numberOf(sheet[r]?.[c]) : null;
                if (n !== null) numbers.push(n);
            }
    if (numbers.length < 2) return <span>Select a block to add it up</span>;
    const sum = numbers.reduce((total, n) => total + n, 0);
    return (
        <>
            <span>
                Sum <span className="font-medium text-neutral-900">€{amount(sum)}</span>
            </span>
            <span>
                Average{' '}
                <span className="font-medium text-neutral-900">
                    €{amount(Math.round(sum / numbers.length))}
                </span>
            </span>
            <span>Count {numbers.length}</span>
        </>
    );
};

/**
 * On a phone the sheet scrolls sideways in its own frame, and the segment column stays with the row
 * numbers, so each month is read against its segment. It sits over the marks of the selection, as a
 * frozen column does, and under the editor, so a name being typed in shows.
 */
const frozen = cn(
    '@max-shell-compact/shell:[&_td:first-of-type]:sticky @max-shell-compact/shell:[&_td:first-of-type]:left-11 @max-shell-compact/shell:[&_td:first-of-type]:z-8 @max-shell-compact/shell:[&_td:first-of-type]:bg-neutral-50',
    '@max-shell-compact/shell:[&_thead_th:nth-child(2)]:left-11 @max-shell-compact/shell:[&_thead_th:nth-child(2)]:z-25',
    '@max-shell-compact/shell:[&_[data-slot=data-grid-editor]]:z-9',
);

/**
 * Whether the shell is compact (a phone, under 640). The sheet's column widths are numbers, not
 * classes, so the segment column reads the shell's width here to narrow to its longest name.
 */
const useCompact = (node: HTMLElement | null) => {
    const [compact, setCompact] = useState(false);
    useLayoutEffect(() => {
        const shell = node?.closest<HTMLElement>('[data-slot=app-shell]');
        if (!shell) return;
        const measure = () => setCompact(shell.clientWidth < 640);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(shell);
        return () => observer.disconnect();
    }, [node]);
    return compact;
};

/** A card's own menu: what is done with that figure. */
const Menu = ({ label }: { label: string }) => (
    <Button aria-label={`${label} options`} size="icon-sm" variant="ghost">
        <Ellipsis />
    </Button>
);

export const ForecastScreen = () => {
    const [scenario, setScenario] = useState<Scenario>('base');
    const [plans, setPlans] = useState(initial);
    const [ranges, setRanges] = useState<DataGridRange[]>([
        { top: 0, left: 1, bottom: 0, right: 1 },
    ]);
    const [published, setPublished] = useState(false);
    const [page, setPage] = useState<HTMLDivElement | null>(null);
    const phone = useCompact(page);
    const plan = plans[scenario];
    const sheet = sheetOf(plan);
    const count = plan.segments.length;

    const planned = totalsOf(plan.segments).reduce((sum, n) => sum + n, 0);
    const target = plan.targets.reduce((sum, n) => sum + n, 0);
    const gap = target - planned;
    const gapShare = (gap / target) * 100;
    const versus = ((planned - LAST_PLAN) / LAST_PLAN) * 100;
    const monthly = totalsOf(plan.segments);
    const shortfall = monthly.map((total, m) => Math.max(0, (plan.targets[m] ?? 0) - total));
    const segmentsPlanned = plan.segments.filter(cells =>
        cells.slice(1, MONTHS + 1).every(cell => numberOf(cell) !== null),
    ).length;
    const best = monthly.indexOf(Math.max(...monthly));
    const widest = shortfall.indexOf(Math.max(...shortfall));
    const narrowest = shortfall.indexOf(Math.min(...shortfall));
    const monthsShort = shortfall.filter(n => n > 0).length;
    const toPlan = plan.segments
        .filter(cells => cells.slice(1, MONTHS + 1).some(cell => numberOf(cell) === null))
        .map(cells => cells[0] ?? '');
    const emptyMonths = plan.segments.reduce(
        (sum, cells) =>
            sum + cells.slice(1, MONTHS + 1).filter(cell => numberOf(cell) === null).length,
        0,
    );

    // The segments and the targets are typed; the total and the gap are worked out, so what lands
    // on them is put back. A figure is written as the sheet writes them, so a column keeps one shape.
    const edit = (next: string[][]) => {
        const tidy = (cells: string[]) =>
            cells.map((cell, col) => {
                const n = col >= 1 && col <= MONTHS ? numberOf(cell) : null;
                return n === null ? cell : amount(n);
            });
        const typedTargets = next[count + 1] ?? [];
        setPlans(current => ({
            ...current,
            [scenario]: {
                segments: next.slice(0, count).map(tidy),
                targets: plan.targets.map((old, m) => numberOf(typedTargets[m + 1]) ?? old),
            },
        }));
        setPublished(false);
    };

    return (
        <Frame place="pipeline" trail={['Pipeline', 'Forecast, H1 2027']}>
            {/* The sheet runs longer than the window: the page scrolls, as the app's does. */}
            <div className="min-h-0 flex-1 overflow-y-auto" ref={setPage}>
                <PageContent
                    // On a phone the compact shell's 40, over the inline 96.
                    className="flex flex-col gap-8 px-6 @max-shell-compact/shell:pt-10! pb-16"
                    // The other lists' start: the system's 96 below the header bar's hairline.
                    style={{ paddingTop: TOP }}
                    width="dense"
                >
                    {/* The page head as every screen's: the name and its state, its actions at
                        the right, Publish the one primary. On a phone they go under the words,
                        and Share hides. */}
                    <div className={cn('flex items-end justify-between gap-6', compact.stack)}>
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <div className="flex min-w-0 items-center gap-2">
                                <h1
                                    className={cn(
                                        'truncate font-medium text-2xl text-neutral-950',
                                        compact.wrap,
                                    )}
                                >
                                    Forecast, H1 2027
                                </h1>
                                {published ? (
                                    <Badge tone="success">Published</Badge>
                                ) : (
                                    <Badge tone="warning">Draft</Badge>
                                )}
                            </div>
                            <p className={cn('truncate text-neutral-600 text-sm', compact.wrap)}>
                                Bookings a segment expects a month · saved 2 minutes ago
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <Button className={compact.hidden} variant="secondary">
                                <Share2 {...icon} />
                                Share
                            </Button>
                            <Button disabled={published} onClick={() => setPublished(true)}>
                                {published ? <Check {...icon} /> : <Send {...icon} />}
                                {published ? 'Published' : 'Publish'}
                            </Button>
                        </div>
                    </div>
                    {/* What the sheet comes to, before the sheet, each the same shape: a figure and
                        its change. All three are read off the sheet, so they follow every edit.
                        On a phone they stack, one a row. */}
                    <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
                        <StatCard
                            actions={<Menu label="Planned bookings" />}
                            delta={`${versus >= 0 ? '+' : '−'}${Math.abs(versus).toFixed(1)}%`}
                            facts={[
                                { label: 'November', value: short(LAST_PLAN) },
                                {
                                    label: 'Best month',
                                    value: `${months[best]} ${short(monthly[best] ?? 0)}`,
                                },
                            ]}
                            icon={<CalendarRange />}
                            label="Planned bookings"
                            note={`of ${short(target)} target`}
                            value={short(planned)}
                        />
                        <StatCard
                            actions={<Menu label="Short of target" />}
                            delta={`${gap > 0 ? '−' : '+'}${Math.abs(gapShare).toFixed(1)}%`}
                            facts={[
                                {
                                    label: 'Widest',
                                    value: `${months[widest]} ${short(shortfall[widest] ?? 0)}`,
                                },
                                {
                                    label: 'Narrowest',
                                    value: `${months[narrowest]} ${short(shortfall[narrowest] ?? 0)}`,
                                },
                            ]}
                            icon={<Target />}
                            label={gap > 0 ? 'Short of target' : 'Over target'}
                            note={`${monthsShort} of ${MONTHS} months short`}
                            trend={gap > 0 ? 'down' : 'up'}
                            value={short(Math.abs(gap))}
                        />
                        <StatCard
                            actions={<Menu label="Segments planned" />}
                            delta={`${segmentsPlanned - PLANNED_MONDAY >= 0 ? '+' : '−'}${Math.abs(segmentsPlanned - PLANNED_MONDAY)}`}
                            facts={[
                                { label: 'Monday', value: String(PLANNED_MONDAY) },
                                { label: 'Empty months', value: String(emptyMonths) },
                            ]}
                            icon={<Layers />}
                            label="Segments planned"
                            note={
                                toPlan.length === 0
                                    ? 'every segment planned'
                                    : `${toPlan.join(', ')} to plan`
                            }
                            trend={segmentsPlanned >= PLANNED_MONDAY ? 'up' : 'down'}
                            value={`${segmentsPlanned} of ${count}`}
                        />
                    </div>
                    <DataGrid
                        className={cn('w-full', frozen)}
                        columns={[
                            { label: 'Segment', width: phone ? 160 : 176 },
                            ...months.map(month => ({
                                label: month,
                                width: 88,
                                align: 'right' as const,
                            })),
                            { label: 'Note', width: 176 },
                        ]}
                        footer={<Summary ranges={ranges} sheet={sheet} />}
                        key={`${scenario}-${phone}`}
                        label={`Forecast, ${scenarioLabels[scenario].toLowerCase()} scenario`}
                        onSelectionChange={(_, __, all) => setRanges(all)}
                        onValuesChange={edit}
                        summaryRows={3}
                        // The sheet's own bar: which plan it is.
                        toolbar={
                            <TableToolbar>
                                <SegmentedControl
                                    aria-label="Scenario"
                                    onValueChange={next => setScenario(next as Scenario)}
                                    value={scenario}
                                >
                                    {(Object.keys(scenarioLabels) as Scenario[]).map(key => (
                                        <SegmentedControlItem key={key} value={key}>
                                            {scenarioLabels[key]}
                                        </SegmentedControlItem>
                                    ))}
                                </SegmentedControl>
                            </TableToolbar>
                        }
                        values={sheet}
                    />
                </PageContent>
            </div>
        </Frame>
    );
};
