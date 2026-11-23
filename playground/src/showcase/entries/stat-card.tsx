import {
    BarList,
    BarListItem,
    Button,
    Card,
    SegmentedControl,
    SegmentedControlItem,
    StatCard,
} from 'continuum';
import { Sparkline } from 'continuum/charts';
import { Clock, Ellipsis, MousePointerClick, ShoppingBag, Undo2, Users } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../kit';

const statCardKnobs: Knob[] = [
    {
        id: 'shape',
        label: 'Trend',
        options: [o('none', 'None'), o('area', 'Area'), o('bar', 'Bars')],
        default: 'none',
    },
    {
        id: 'trend',
        label: 'Change of the second',
        options: [o('up', 'Up'), o('down', 'Down'), o('neutral', 'Flat')],
        default: 'down',
    },
    { id: 'delta', label: 'Change', switch: true, default: true },
    { id: 'head', label: 'Icon and menu', switch: true, default: false },
    { id: 'facts', label: 'Facts', switch: true, default: false },
    { id: 'forecast', label: 'Forecast', switch: true, default: false },
    { id: 'note', label: 'Secondary figure', switch: true, default: false },
];

const deltas = { up: '−3.1%', down: '+3.1%', neutral: '0.0%' } as const;

/** Twelve weeks, the last of them this one, then four weeks ahead when there is a forecast. */
const sessions = [9.1, 9.6, 9.4, 10.2, 10.8, 10.1, 10.9, 11.6, 11.2, 11.9, 11.1, 12.5];
const sessionsAhead = [12.7, 13.1, 13.0, 13.6];
const bounce = [44.1, 43.2, 43.8, 42.6, 41.9, 42.4, 40.8, 40.1, 39.6, 38.9, 38.9, 41.2];
const bounceAhead = [40.6, 40.2, 39.8, 39.5];

const weekLabels = (count: number, now: number) => [
    { at: 0, label: '3 Aug' },
    ...(count - 1 > now ? [] : [{ at: now, label: 'This week' }]),
    ...(count - 1 > now ? [{ at: count - 1, label: '14 Dec' }] : []),
];

const Menu = ({ label }: { label: string }) => (
    <Button aria-label={`${label} options`} size="icon-sm" variant="ghost">
        <Ellipsis />
    </Button>
);

const StatCardPreview = ({ knobs }: PreviewProps) => {
    const trend = knobs.trend === 'up' || knobs.trend === 'neutral' ? knobs.trend : 'down';
    const kind = knobs.shape === 'area' || knobs.shape === 'bar' ? knobs.shape : null;
    const forecast = Boolean(knobs.forecast);

    const spark = (data: number[], ahead: number[], label: string) => {
        if (!kind) return undefined;
        const series = forecast ? [...data, ...ahead] : data;
        const now = data.length - 1;
        return (
            <Sparkline
                aria-label={`${label}, the last twelve weeks${forecast ? ' and four ahead' : ''}`}
                current={now}
                data={series}
                kind={kind}
                labels={weekLabels(series.length, now)}
            />
        );
    };

    return (
        <div className="grid w-full max-w-xl grid-cols-2 gap-4">
            <StatCard
                actions={knobs.head ? <Menu label="Sessions" /> : undefined}
                chart={spark(sessions, sessionsAhead, 'Sessions')}
                comparison={knobs.delta && kind ? 'on last week' : undefined}
                delta={knobs.delta ? '+12.4%' : undefined}
                facts={
                    knobs.facts
                        ? [
                              { label: 'Last week', value: '11,104' },
                              { label: 'Visitors', value: '8,930' },
                          ]
                        : undefined
                }
                icon={knobs.head ? <Users /> : undefined}
                label="Sessions"
                note={knobs.note ? 'of 18,200 visitors' : undefined}
                value="12,480"
            />
            <StatCard
                actions={knobs.head ? <Menu label="Bounce rate" /> : undefined}
                chart={spark(bounce, bounceAhead, 'Bounce rate')}
                comparison={knobs.delta && kind ? 'on last week' : undefined}
                delta={knobs.delta ? deltas[trend] : undefined}
                facts={
                    knobs.facts
                        ? [
                              { label: 'Last week', value: '38.9%' },
                              { label: 'Goal', value: '≤ 40%' },
                          ]
                        : undefined
                }
                icon={knobs.head ? <Undo2 /> : undefined}
                label="Bounce rate"
                trend={trend}
                value="41.2%"
            />
        </div>
    );
};

export const entry: Entry = {
    id: 'stat-card',
    name: 'Stat card',
    category: 'content',
    description:
        'A key figure with its change, growing by parts when the reader needs more of it: its trend, what it is measured against, the figures beside it.',
    knobs: statCardKnobs,
    Preview: StatCardPreview,
};

const weeks = (label: string, data: number[], kind: 'area' | 'bar' = 'area') => (
    <Sparkline
        aria-label={`${label}, the last twelve weeks`}
        data={data}
        kind={kind}
        labels={[
            { at: 0, label: '3 Aug' },
            { at: data.length - 1, label: 'This week' },
        ]}
    />
);

const WeekStats = () => (
    <AppWindow
        actions={
            <SegmentedControl aria-label="Range" defaultValue="7d">
                <SegmentedControlItem value="7d">7 days</SegmentedControlItem>
                <SegmentedControlItem value="30d">30 days</SegmentedControlItem>
                <SegmentedControlItem value="12m">12 months</SegmentedControlItem>
            </SegmentedControl>
        }
        description="Week of 16 November, against the week before."
        nav="rail"
        place="overview"
        title="Overview"
    >
        <div className="grid @max-shell-compact/shell:grid-cols-2 grid-cols-4 gap-4">
            <StatCard
                actions={<Menu label="Sessions" />}
                chart={weeks('Sessions', sessions)}
                delta="+12.4%"
                facts={[
                    { label: 'Visitors', value: '8,930' },
                    { label: 'New', value: '61%' },
                ]}
                icon={<Users />}
                label="Sessions"
                value="12,480"
            />
            <StatCard
                actions={<Menu label="Bounce rate" />}
                chart={weeks('Bounce rate', bounce)}
                delta="+2.3 pt"
                facts={[
                    { label: 'Goal', value: '≤ 40%' },
                    { label: 'Best', value: '38.9%' },
                ]}
                icon={<MousePointerClick />}
                label="Bounce rate"
                trend="down"
                value="41.2%"
            />
            <StatCard
                actions={<Menu label="Avg. duration" />}
                chart={weeks(
                    'Avg. duration',
                    [128, 131, 126, 133, 135, 130, 134, 136, 131, 133, 135, 134],
                )}
                delta="0.0%"
                facts={[
                    { label: 'Median', value: '98s' },
                    { label: 'Pages', value: '3.4' },
                ]}
                icon={<Clock />}
                label="Avg. duration"
                trend="neutral"
                value="2m 14s"
            />
            <StatCard
                actions={<Menu label="Conversions" />}
                chart={weeks(
                    'Conversions',
                    [812, 860, 845, 902, 958, 921, 1004, 1062, 1018, 1096, 1105, 1204],
                    'bar',
                )}
                delta="+8.9%"
                facts={[
                    { label: 'Rate', value: '9.6%' },
                    { label: 'Value', value: '€48.2K' },
                ]}
                icon={<ShoppingBag />}
                label="Conversions"
                value="1,204"
            />
        </div>
        <Card>
            <BarList title="Top pages" valueLabel="Sessions">
                <BarListItem value={4120}>/pricing</BarListItem>
                <BarListItem value={3312}>/</BarListItem>
                <BarListItem value={2840}>/blog/q3-review</BarListItem>
                <BarListItem value={1204}>/contact</BarListItem>
            </BarList>
        </Card>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Overview',
    note: 'The week in four figures at the top of the overview, each with its change, its last twelve weeks and the two figures that stand beside it.',
    app: true,
    render: () => <WeekStats />,
};
