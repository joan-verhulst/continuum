import {
    ChartFrame,
    ChartKey,
    chartColor,
    UptimeStrip,
    type UptimeStripProps,
} from 'continuum/charts';
import { Activity } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

type Service = UptimeStripProps['services'][number];
type Day = Service['days'][number];

const DAYS = 90;
/** The 90 days up to Thursday 12 November 2026. */
const dates = Array.from(
    { length: DAYS },
    (_, index) => new Date(2026, 10, 12 - (DAYS - 1 - index)),
);

type Incident = Omit<Day, 'date'>;

/** A service's quarter: operational unless an incident says otherwise. */
const quarter = (incidents: Record<number, Incident>, from = 0): Day[] =>
    dates.map((date, index) =>
        index < from
            ? { date, state: 'none' }
            : { date, state: 'operational', downtime: 0, ...incidents[index] },
    );

const services: Service[] = [
    {
        name: 'API',
        days: quarter({
            23: { state: 'degraded', downtime: 12, note: 'Slow responses from the EU region.' },
            61: { state: 'outage', downtime: 47, note: 'The primary database failed over.' },
            62: { state: 'degraded', downtime: 8, note: 'Read replicas catching up.' },
        }),
    },
    {
        name: 'Dashboard',
        days: quarter({
            40: { state: 'degraded', downtime: 5, note: 'Charts loaded slowly after a release.' },
            77: {
                state: 'degraded',
                downtime: 15,
                note: 'Sign-in redirects looped for some users.',
            },
        }),
    },
    {
        name: 'Webhooks',
        days: quarter({
            61: {
                state: 'degraded',
                downtime: 34,
                note: 'Deliveries queued behind the API outage.',
            },
            84: { state: 'degraded', downtime: 6, note: 'Retries delayed by a slow consumer.' },
        }),
    },
    {
        name: 'Email',
        days: quarter(
            { 50: { state: 'degraded', downtime: 22, note: 'The provider throttled sending.' } },
            14,
        ),
    },
];

const STATES = [
    {
        key: 'operational',
        name: 'Operational',
        color: `color-mix(in oklab, ${chartColor('success')} 45%, transparent)`,
    },
    { key: 'degraded', name: 'Degraded', color: chartColor('warning') },
    { key: 'outage', name: 'Outage', color: chartColor('error') },
    { key: 'none', name: 'No data', color: 'var(--color-neutral-200)' },
];

/** The share of the counted days each service was up, as the strip works it out. */
const uptimeOf = (service: Service, days: number) => {
    const counted = service.days.slice(-days).filter(day => day.state !== 'none');
    const down = counted.reduce((sum, day) => sum + (day.downtime ?? 0), 0);
    return 1 - down / (counted.length * 24 * 60);
};

const percent = (share: number) => `${(share * 100).toFixed(2)}%`;

const StatusCard = ({
    days = DAYS,
    count = services.length,
    loading = false,
    className,
}: {
    days?: number;
    count?: number;
    loading?: boolean;
    className?: string;
}) => {
    const shown = services.slice(0, count);
    const overall = shown.reduce((sum, service) => sum + uptimeOf(service, days), 0) / shown.length;
    return (
        <ChartFrame
            className={className}
            comparison={`over ${days} days`}
            icon={<Activity />}
            loading={loading}
            legend={<ChartKey series={STATES} />}
            table={{
                columns: ['Service', 'Uptime (%)', 'Days degraded', 'Days with an outage'],
                rows: shown.map(service => {
                    const recent = service.days.slice(-days);
                    return [
                        service.name,
                        Number((uptimeOf(service, days) * 100).toFixed(3)),
                        recent.filter(day => day.state === 'degraded').length,
                        recent.filter(day => day.state === 'outage').length,
                    ];
                }),
            }}
            title="Uptime"
            value={percent(overall)}
        >
            <UptimeStrip
                aria-label={`Uptime of each service over the last ${days} days`}
                days={days}
                loading={loading}
                services={shown}
            />
        </ChartFrame>
    );
};

const uptimeKnobs: Knob[] = [
    { id: 'days', label: 'Days', options: [o('30'), o('60'), o('90')], default: '90' },
    { id: 'services', label: 'Services', options: [o('1'), o('4')], default: '4' },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading')],
        default: 'ready',
    },
];

const UptimePreview = ({ knobs }: PreviewProps) => (
    <StatusCard
        className="w-full max-w-3xl"
        count={Number(knobs.services)}
        days={Number(knobs.days)}
        loading={knobs.state === 'loading'}
    />
);

export const entry: Entry = {
    id: 'uptime-strip',
    name: 'Uptime strip',
    category: 'charts',
    description:
        'A block for each day of each service, coloured by how it went, with the uptime at the end.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs: uptimeKnobs,
    Preview: UptimePreview,
};

const StatusPage = () => (
    <AppWindow
        description="How each service held up over the last 90 days."
        place="settings"
        title="Status"
        trail={['Settings', 'Status']}
    >
        <StatusCard />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Status',
    note: 'Four services over a quarter: a few degraded days, one outage on the API that held the webhooks up with it.',
    app: true,
    render: () => <StatusPage />,
};
