import { BulletChart, type BulletChartProps, ChartFrame } from 'continuum/charts';
import { Target } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

const euro = (value: number) => `€${value}K`;
const percent = (value: number) => `${value.toFixed(1)}%`;
const count = (value: number) => String(value);

/** The quarter's goals, each with the ranges that say how well it is going. */
const goals: BulletChartProps['data'] = [
    { name: 'Revenue', value: 412, target: 450, ranges: [300, 400, 500], format: euro },
    { name: 'New customers', value: 86, target: 120, ranges: [60, 100, 140], format: count },
    { name: 'Expansion', value: 38, target: 30, ranges: [15, 25, 40], format: euro },
    {
        name: 'Churn',
        value: 2.1,
        target: 2.5,
        ranges: [2, 3, 4],
        lowerIsBetter: true,
        format: percent,
    },
    { name: 'NPS', value: 54, target: 50, ranges: [20, 40, 70], format: count },
];

const knobs: Knob[] = [
    {
        id: 'layout',
        label: 'Layout',
        options: [o('above', 'Name above'), o('beside', 'Name beside')],
        default: 'above',
    },
    {
        id: 'fill',
        label: 'Fill',
        options: [o('solid', 'Solid'), o('tint', 'Tint')],
        default: 'solid',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading'), o('empty', 'No data')],
        default: 'ready',
    },
];

/** The quarter's targets in their card: how many are met leads, a line a goal under it. */
const TargetsCard = ({
    layout = 'above',
    fill = 'solid',
    state = 'ready',
    className,
}: {
    layout?: BulletChartProps['layout'];
    fill?: BulletChartProps['fill'];
    state?: string;
    className?: string;
}) => {
    const ready = state === 'ready';
    return (
        <ChartFrame
            className={className}
            loading={state === 'loading'}
            comparison={ready ? 'on target, 41 days left' : undefined}
            icon={<Target />}
            table={{
                columns: ['Goal', 'Value', 'Target'],
                rows: goals.map(goal => {
                    const write = goal.format ?? String;
                    return [
                        goal.name,
                        write(goal.value),
                        `${goal.lowerIsBetter ? '≤ ' : ''}${write(goal.target ?? 0)}`,
                    ];
                }),
            }}
            title="Q4 targets"
            value={ready ? '3 of 5' : '—'}
        >
            <BulletChart
                aria-label="Q4 targets: each goal against its target"
                data={state === 'empty' ? [] : goals}
                fill={fill}
                layout={layout}
                loading={state === 'loading'}
            />
        </ChartFrame>
    );
};

const BulletChartPreview = ({ knobs }: PreviewProps) => (
    <TargetsCard
        className="w-full max-w-3xl"
        fill={knobs.fill as BulletChartProps['fill']}
        layout={knobs.layout as BulletChartProps['layout']}
        state={String(knobs.state)}
    />
);

export const entry: Entry = {
    id: 'bullet-chart',
    name: 'Bullet chart',
    category: 'charts',
    description: 'One measure against its target and the ranges that grade it, a line a goal.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs,
    Preview: BulletChartPreview,
};

const TargetsPage = () => (
    <AppWindow
        description="Where each of this quarter's goals stands against its target."
        place="reports"
        title="Targets"
        trail={['Reports', 'Targets']}
    >
        <TargetsCard layout="beside" />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Targets',
    note: "The quarter's goals, each read against its target in one line; churn is better low.",
    app: true,
    render: () => <TargetsPage />,
};
