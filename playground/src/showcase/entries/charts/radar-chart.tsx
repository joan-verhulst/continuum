import { ChartFrame, ChartKey, RadarChart } from 'continuum/charts';
import { ClipboardList } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

const months = [
    { month: 'Jan', product: 78, dining: 30 },
    { month: 'Feb', product: 84, dining: 42 },
    { month: 'Mar', product: 72, dining: 28 },
    { month: 'Apr', product: 64, dining: 96 },
    { month: 'May', product: 52, dining: 34 },
    { month: 'Jun', product: 60, dining: 88 },
    { month: 'Jul', product: 70, dining: 46 },
];

const both = [
    { key: 'product', name: 'Product' },
    { key: 'dining', name: 'Restaurants and bars' },
];

const radarKnobs: Knob[] = [
    {
        id: 'texture',
        label: 'Second series',
        options: [o('stripes', 'Stripes'), o('dots', 'Dots'), o('none', 'Plain')],
        default: 'stripes',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading')],
        default: 'ready',
    },
];

/** Two kinds of spending in one card, the second told apart by its texture. */
const SpendingCard = ({
    texture,
    loading = false,
    className,
}: {
    texture?: 'stripes' | 'dots' | 'none';
    loading?: boolean;
    className?: string;
}) => (
    <ChartFrame
        className={className}
        comparison="on the half-year before"
        delta="+3.2%"
        icon={<ClipboardList />}
        legend={<ChartKey series={both} />}
        loading={loading}
        table={{
            columns: ['Month', 'Product', 'Restaurants and bars'],
            rows: months.map(row => [row.month, row.product, row.dining]),
        }}
        title="Spending by month"
        value="€844"
    >
        <RadarChart
            aria-label="Spending on products and on eating out, by month"
            data={months}
            height={300}
            loading={loading}
            series={both}
            texture={texture}
            x="month"
        />
    </ChartFrame>
);

const RadarPreview = ({ knobs }: PreviewProps) => (
    <SpendingCard
        className="w-full max-w-lg"
        loading={knobs.state === 'loading'}
        texture={knobs.texture as 'stripes' | 'dots' | 'none'}
    />
);

export const entry: Entry = {
    id: 'radar-chart',
    name: 'Radar chart',
    category: 'charts',
    description: 'Several measures of one thing as a shape; a second series takes a texture.',
    span: 2,
    stageClassName: 'items-center',
    knobs: radarKnobs,
    Preview: RadarPreview,
};

const StatisticsPage = () => (
    <AppWindow
        description="What each kind of spending came to, month by month."
        place="reports"
        title="Statistics"
        trail={['Reports', 'Statistics']}
    >
        <SpendingCard />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Statistics',
    note: 'Two kinds of spending over seven months, overlapping, told apart by texture.',
    app: true,
    render: () => <StatisticsPage />,
};
