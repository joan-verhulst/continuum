import { Skeleton } from 'continuum';
import { ChartFrame, ChartLegend, DonutChart } from 'continuum/charts';
import { Globe, Monitor } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

const devices = [
    { name: 'Desktop', value: 7688 },
    { name: 'Mobile', value: 3844 },
    { name: 'Tablet', value: 868 },
    { name: 'TV', value: 212 },
    { name: 'Watch', value: 96 },
    { name: 'Console', value: 41 },
];

const browsers = [
    { name: 'Chrome', value: 6820 },
    { name: 'Safari', value: 3410 },
    { name: 'Firefox', value: 1120 },
    { name: 'Edge', value: 790 },
    { name: 'Other', value: 260 },
];

type Share = { name: string; value: number };

/** Past five the rest are one, as the ring folds them, so the key and the ring agree. */
const folded = (data: readonly Share[]): Share[] =>
    data.length > 5
        ? [
              ...data.slice(0, 4),
              { name: 'Other', value: data.slice(4).reduce((sum, item) => sum + item.value, 0) },
          ]
        : [...data];

/** The key's rows while the shares load: a swatch, a name and a figure, each a short bar. */
const LegendSkeleton = () => (
    <ul aria-hidden className="flex min-w-0 flex-1 flex-col gap-3 text-xs">
        {[64, 48, 56, 40].map(width => (
            <li className="flex min-w-0 items-center gap-2" key={width}>
                {/* The line's own height, so the rows stand as tall as the names will. */}
                <span className="invisible w-0">0</span>
                <Skeleton className="h-3 w-0.75 shrink-0 rounded-full" />
                <Skeleton className="h-2.5 rounded-chip" style={{ width }} />
                <Skeleton className="ml-auto h-2.5 w-7 shrink-0 rounded-chip" />
            </li>
        ))}
    </ul>
);

/** A breakdown in its card: the total at its head, the ring and its key with the shares. */
const ShareCard = ({
    title,
    icon,
    data,
    delta,
    what,
    half = false,
    loading = false,
    className,
}: {
    title: string;
    icon: ReactNode;
    data: readonly Share[];
    delta: string;
    what: string;
    half?: boolean;
    loading?: boolean;
    className?: string;
}) => {
    const sum = data.reduce((all, item) => all + item.value, 0);
    return (
        <ChartFrame
            className={className}
            comparison="on September"
            delta={delta}
            icon={icon}
            loading={loading}
            table={{
                columns: [what, 'Sessions'],
                rows: data.map(item => [item.name, item.value]),
            }}
            title={title}
            value={sum.toLocaleString('en-GB')}
        >
            <div className="flex items-center gap-4">
                <DonutChart
                    aria-label={`Sessions by ${what.toLowerCase()}`}
                    data={data}
                    half={half}
                    loading={loading}
                    size={half ? 184 : 132}
                    total={false}
                />
                {loading ? (
                    <LegendSkeleton />
                ) : (
                    <ChartLegend
                        className="min-w-0 flex-1"
                        items={folded(data).map(item => ({
                            name: item.name,
                            value: `${Math.round((item.value / sum) * 100)}%`,
                        }))}
                        layout="list"
                    />
                )}
            </div>
        </ChartFrame>
    );
};

const donutKnobs: Knob[] = [
    {
        id: 'slices',
        label: 'Slices',
        options: [o('3', 'Three'), o('6', 'Six · the rest as Other')],
        default: '3',
    },
    {
        id: 'shape',
        label: 'Shape',
        options: [o('ring', 'Ring'), o('half', 'Half')],
        default: 'ring',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading')],
        default: 'ready',
    },
];

const DonutPreview = ({ knobs }: PreviewProps) => (
    <ShareCard
        className="w-full max-w-lg"
        data={devices.slice(0, Number(knobs.slices))}
        delta="+6.2%"
        half={knobs.shape === 'half'}
        icon={<Monitor />}
        loading={knobs.state === 'loading'}
        title="Devices"
        what="Device"
    />
);

export const entry: Entry = {
    id: 'donut-chart',
    name: 'Donut chart',
    category: 'charts',
    description:
        'Shares of a whole as a ring or half of one; point at a slice to read its own figure.',
    knobs: donutKnobs,
    Preview: DonutPreview,
};

const DevicesPage = () => (
    <AppWindow
        description="Where this month's sessions came from."
        place="reports"
        title="Audience"
        trail={['Reports', 'Audience']}
    >
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-2 gap-4">
            <ShareCard
                data={devices.slice(0, 3)}
                delta="+6.2%"
                icon={<Monitor />}
                title="Devices"
                what="Device"
            />
            <ShareCard
                data={browsers}
                delta="+6.2%"
                icon={<Globe />}
                title="Browsers"
                what="Browser"
            />
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Audience',
    note: 'Sessions by device as a ring beside its key, in a card of its own.',
    app: true,
    render: () => <DevicesPage />,
};
