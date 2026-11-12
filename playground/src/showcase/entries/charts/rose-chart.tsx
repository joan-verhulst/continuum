import { ChartFrame, ChartKey, RoseChart } from 'continuum/charts';
import { CalendarDays, Clock } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

/** Tickets opened in each hour of the day, by the channel they came in on: a working day's shape. */
const EMAIL = [
    6, 4, 3, 2, 2, 3, 8, 22, 46, 64, 70, 66, 52, 58, 62, 60, 54, 44, 30, 22, 16, 12, 9, 7,
];
const CHAT = [2, 1, 1, 0, 1, 1, 4, 12, 30, 44, 50, 48, 40, 46, 52, 48, 40, 30, 18, 12, 8, 6, 4, 3];

const hours = EMAIL.map((email, hour) => ({
    hour: String(hour).padStart(2, '0'),
    email,
    chat: CHAT[hour] ?? 0,
}));

/** Orders by month: a year with its summer lull and its December. */
const months = [
    { month: 'Jan', web: 820, store: 310 },
    { month: 'Feb', web: 760, store: 280 },
    { month: 'Mar', web: 910, store: 340 },
    { month: 'Apr', web: 980, store: 360 },
    { month: 'May', web: 1040, store: 390 },
    { month: 'Jun', web: 870, store: 330 },
    { month: 'Jul', web: 640, store: 240 },
    { month: 'Aug', web: 590, store: 210 },
    { month: 'Sep', web: 930, store: 350 },
    { month: 'Oct', web: 1120, store: 420 },
    { month: 'Nov', web: 1480, store: 560 },
    { month: 'Dec', web: 1760, store: 690 },
];

const channels = [
    { key: 'email', name: 'Email' },
    { key: 'chat', name: 'Chat' },
];
const stores = [
    { key: 'web', name: 'Web shop' },
    { key: 'store', name: 'In store' },
];

type Kind = 'hours' | 'months';

const roseKnobs: Knob[] = [
    {
        id: 'kind',
        label: 'Goes round',
        options: [o('hours', 'Hours of a day'), o('months', 'Months of a year')],
        default: 'hours',
    },
    { id: 'stacked', label: 'Two series, stacked', switch: true, default: false },
    {
        id: 'fill',
        label: 'Fill',
        options: [o('tint', 'Tint'), o('solid', 'Solid')],
        default: 'tint',
    },
];

const sum = (rows: readonly Record<string, string | number>[], keys: readonly string[]) =>
    rows.reduce((all, row) => all + keys.reduce((part, key) => part + Number(row[key] ?? 0), 0), 0);

/** Tickets by hour, or orders by month, in one card; stacked, the key names the two. */
const RoseCard = ({
    kind = 'hours',
    stacked = false,
    fill,
    height = 320,
    className,
}: {
    height?: number;
    kind?: Kind;
    stacked?: boolean;
    fill?: 'tint' | 'solid';
    className?: string;
}) => {
    const byHour = kind === 'hours';
    const all = byHour ? channels : stores;
    const series = stacked
        ? all
        : [{ key: all[0]?.key ?? '', name: byHour ? 'Tickets' : 'Orders' }];
    const data: Record<string, string | number>[] = byHour
        ? hours.map(row => ({ ...row, ...(stacked ? {} : { email: row.email + row.chat }) }))
        : months.map(row => ({ ...row, ...(stacked ? {} : { web: row.web + row.store }) }));
    const x = byHour ? 'hour' : 'month';
    return (
        <ChartFrame
            className={className}
            comparison={byHour ? 'on last week' : 'on last year'}
            delta={byHour ? '−4.1%' : '+8.6%'}
            icon={byHour ? <Clock /> : <CalendarDays />}
            legend={stacked ? <ChartKey series={series} /> : undefined}
            table={{
                columns: [byHour ? 'Hour' : 'Month', ...all.map(line => line.name)],
                rows: byHour
                    ? hours.map(row => [row.hour, row.email, row.chat])
                    : months.map(row => [row.month, row.web, row.store]),
            }}
            title={byHour ? 'Tickets by hour of day' : 'Orders by month'}
            trend={byHour ? 'up' : undefined}
            value={sum(
                byHour ? hours : months,
                all.map(line => line.key),
            ).toLocaleString('en-GB')}
        >
            <RoseChart
                aria-label={byHour ? 'Tickets opened by hour of the day' : 'Orders by month'}
                data={data}
                fill={fill}
                height={height}
                series={series}
                x={x}
            />
        </ChartFrame>
    );
};

const RosePreview = ({ knobs }: PreviewProps) => (
    <RoseCard
        className="w-full max-w-lg"
        fill={knobs.fill as 'tint' | 'solid'}
        kind={knobs.kind as Kind}
        stacked={knobs.stacked === true}
    />
);

export const entry: Entry = {
    id: 'rose-chart',
    name: 'Rose diagram',
    category: 'charts',
    description:
        'Amounts round a clock or a year, each wedge as large in area as its value; point at one to read it.',
    span: 2,
    stageClassName: 'items-center',
    knobs: roseKnobs,
    Preview: RosePreview,
};

const SupportPage = () => (
    <AppWindow
        description="When the tickets of the last seven days were opened, hour by hour."
        place="reports"
        title="Support"
        trail={['Reports', 'Support']}
    >
        <RoseCard className="max-w-lg" height={224} stacked />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Support',
    note: 'A week of tickets round the clock, email and chat stacked: the working day stands out.',
    app: true,
    render: () => <SupportPage />,
};
