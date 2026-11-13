import { ChartFrame, ChartKey, type ChartSeries, HorizontalBarChart } from 'continuum/charts';
import { MousePointerClick } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

/** A week of visits by where they came from, Monday first. */
const visits = [
    { day: 'Mon', direct: 320, email: 120, affiliate: 220, video: 150, search: 820 },
    { day: 'Tue', direct: 302, email: 132, affiliate: 182, video: 212, search: 832 },
    { day: 'Wed', direct: 301, email: 101, affiliate: 191, video: 201, search: 901 },
    { day: 'Thu', direct: 334, email: 134, affiliate: 234, video: 154, search: 934 },
    { day: 'Fri', direct: 390, email: 90, affiliate: 290, video: 190, search: 1290 },
    { day: 'Sat', direct: 330, email: 230, affiliate: 330, video: 330, search: 1330 },
    { day: 'Sun', direct: 320, email: 210, affiliate: 310, video: 410, search: 1320 },
];

const sources: ChartSeries[] = [
    { key: 'direct', name: 'Direct' },
    { key: 'email', name: 'Email' },
    { key: 'affiliate', name: 'Affiliate' },
    { key: 'video', name: 'Video' },
    { key: 'search', name: 'Search' },
];
const searchOnly: ChartSeries[] = [{ key: 'search', name: 'Search' }];

const weekTotal = visits.reduce(
    (sum, row) => sum + row.direct + row.email + row.affiliate + row.video + row.search,
    0,
);

const formatVisits = (value: number) => value.toLocaleString('en-GB');

const knobs: Knob[] = [
    {
        id: 'layout',
        label: 'Series',
        options: [o('stacked', 'Stacked'), o('one', 'One'), o('grouped', 'Side by side')],
        default: 'stacked',
    },
    { id: 'labels', label: 'Figures', switch: true, default: true },
    { id: 'total', label: 'Total', switch: true, default: false },
    {
        id: 'tint',
        label: 'Tint',
        options: [o('none', 'None'), o('one', 'One series')],
        default: 'none',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading'), o('empty', 'No data')],
        default: 'ready',
    },
];

/** The series with the last one drawn as a tint, striped. */
const tintLast = (series: readonly ChartSeries[]): ChartSeries[] =>
    series.map((line, i) =>
        i === series.length - 1 ? { ...line, fill: 'tint', texture: 'stripes' } : line,
    );

/** The week's visits in their card: the total leads, the bars split each day by source. */
const VisitsCard = ({
    series = sources,
    stacked = true,
    labels = true,
    total = false,
    state = 'ready',
    height,
    className,
}: {
    height?: number;
    series?: readonly ChartSeries[];
    stacked?: boolean;
    labels?: boolean;
    total?: boolean;
    state?: string;
    className?: string;
}) => {
    const ready = state === 'ready';
    return (
        <ChartFrame
            className={className}
            loading={state === 'loading'}
            comparison="on last week"
            delta={ready ? '+6.2%' : undefined}
            icon={<MousePointerClick />}
            legend={series.length > 1 ? <ChartKey series={series} /> : undefined}
            table={{
                columns: ['Day', ...series.map(line => line.name ?? line.key)],
                rows: visits.map(row => [
                    row.day,
                    ...series.map(line => row[line.key as keyof typeof row]),
                ]),
            }}
            title="Visits by source"
            value={ready ? formatVisits(weekTotal) : '—'}
        >
            <HorizontalBarChart
                aria-label="Visits by source, this week"
                data={state === 'empty' ? [] : visits}
                formatValue={formatVisits}
                height={height}
                labels={labels}
                loading={state === 'loading'}
                series={series}
                stacked={stacked}
                total={total}
                x="day"
            />
        </ChartFrame>
    );
};

const HorizontalBarChartPreview = ({ knobs }: PreviewProps) => {
    const base =
        knobs.layout === 'one'
            ? searchOnly
            : knobs.layout === 'grouped'
              ? sources.slice(2)
              : sources;
    return (
        <VisitsCard
            className="w-full max-w-3xl"
            labels={Boolean(knobs.labels)}
            series={knobs.tint === 'one' ? tintLast(base) : base}
            stacked={knobs.layout !== 'grouped'}
            state={String(knobs.state)}
            total={Boolean(knobs.total)}
        />
    );
};

export const entry: Entry = {
    id: 'horizontal-bar-chart',
    name: 'Horizontal bar chart',
    category: 'charts',
    description:
        'The bar chart on its side: categories down the left, each bar carrying its own figures.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs,
    Preview: HorizontalBarChartPreview,
};

const AcquisitionPage = () => (
    <AppWindow
        description="Where this week's visits came from, day by day."
        place="reports"
        title="Acquisition"
        trail={['Reports', 'Acquisition']}
    >
        <VisitsCard height={216} />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Acquisition',
    note: 'A week of visits split by source, each day one bar with its parts written in.',
    app: true,
    render: () => <AcquisitionPage />,
};
