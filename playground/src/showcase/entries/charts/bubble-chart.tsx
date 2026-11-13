import { BubbleChart, ChartFrame, ChartKey } from 'continuum/charts';
import { Users } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

type Plan = 'starter' | 'team' | 'business' | 'enterprise';

/** Accounts with their seats, their monthly revenue in euros and their hours of use a month. */
const accounts: { name: string; plan: Plan; seats: number; revenue: number; usage: number }[] = [
    { name: 'Halden Studio', plan: 'starter', seats: 3, revenue: 45, usage: 42 },
    { name: 'Fernway', plan: 'starter', seats: 5, revenue: 48, usage: 120 },
    { name: 'Pip & Co', plan: 'starter', seats: 2, revenue: 29, usage: 18 },
    { name: 'Morrow Bakes', plan: 'starter', seats: 8, revenue: 118, usage: 64 },
    { name: 'Lumen Yoga', plan: 'starter', seats: 6, revenue: 54, usage: 150 },
    { name: 'Quayside', plan: 'starter', seats: 11, revenue: 96, usage: 96 },
    { name: 'Oak Lane', plan: 'starter', seats: 4, revenue: 62, usage: 30 },
    { name: 'Brightwell', plan: 'team', seats: 14, revenue: 260, usage: 380 },
    { name: 'Corvid Labs', plan: 'team', seats: 22, revenue: 690, usage: 720 },
    { name: 'Tessel', plan: 'team', seats: 18, revenue: 330, usage: 260 },
    { name: 'Marlowe', plan: 'team', seats: 30, revenue: 610, usage: 540 },
    { name: 'Kestrel Print', plan: 'team', seats: 9, revenue: 310, usage: 120 },
    { name: 'Saltmarsh', plan: 'team', seats: 26, revenue: 880, usage: 900 },
    { name: 'Ondine', plan: 'team', seats: 38, revenue: 720, usage: 610 },
    { name: 'Rook & Rye', plan: 'team', seats: 20, revenue: 420, usage: 330 },
    { name: 'Northwind', plan: 'business', seats: 64, revenue: 2980, usage: 2100 },
    { name: 'Calder', plan: 'business', seats: 48, revenue: 1350, usage: 980 },
    { name: 'Ashgrove', plan: 'business', seats: 90, revenue: 4900, usage: 2900 },
    { name: 'Veritas Legal', plan: 'business', seats: 35, revenue: 2050, usage: 1400 },
    { name: 'Plinth', plan: 'business', seats: 72, revenue: 2240, usage: 1250 },
    { name: 'Harbour Health', plan: 'business', seats: 120, revenue: 3900, usage: 3600 },
    { name: 'Sable', plan: 'business', seats: 40, revenue: 1980, usage: 1900 },
    { name: 'Greywater', plan: 'business', seats: 84, revenue: 3100, usage: 1700 },
    { name: 'Meridian Group', plan: 'enterprise', seats: 240, revenue: 16800, usage: 9800 },
    { name: 'Atlas Freight', plan: 'enterprise', seats: 180, revenue: 8200, usage: 5200 },
    { name: 'Orchard Bank', plan: 'enterprise', seats: 320, revenue: 13900, usage: 7400 },
    { name: 'Polaris', plan: 'enterprise', seats: 110, revenue: 8800, usage: 6800 },
    { name: 'Kingfisher', plan: 'enterprise', seats: 210, revenue: 12400, usage: 4100 },
    { name: 'Vantage Retail', plan: 'enterprise', seats: 280, revenue: 19600, usage: 11200 },
    { name: 'Halcyon', plan: 'enterprise', seats: 140, revenue: 6100, usage: 3000 },
];

const plans = [
    { key: 'starter', name: 'Starter' },
    { key: 'team', name: 'Team' },
    { key: 'business', name: 'Business' },
    { key: 'enterprise', name: 'Enterprise' },
];

const euro = (value: number) => `€${value.toLocaleString('en-GB')}`;
const hours = (value: number) => `${value.toLocaleString('en-GB')} h`;

const bubbleKnobs: Knob[] = [
    {
        id: 'scale',
        label: 'Axes',
        options: [o('log', 'Log · powers of ten'), o('linear', 'Linear')],
        default: 'log',
    },
    { id: 'group', label: 'Colour by plan', switch: true, default: true },
    { id: 'sizeKey', label: 'Size key', switch: true, default: true },
    {
        id: 'labels',
        label: 'Names',
        options: [o('0', 'None'), o('3', 'Three largest'), o('6', 'Six largest')],
        default: '3',
    },
    {
        id: 'state',
        label: 'State',
        options: [o('ready', 'Ready'), o('loading', 'Loading')],
        default: 'ready',
    },
];

/** Every account by its seats and its revenue, sized by how much it is used. */
const AccountsCard = ({
    scale = 'log',
    grouped = true,
    sizeKey = true,
    labels = 3,
    height = 340,
    loading = false,
    className,
}: {
    scale?: 'log' | 'linear';
    grouped?: boolean;
    sizeKey?: boolean;
    labels?: number;
    height?: number;
    loading?: boolean;
    className?: string;
}) => (
    <ChartFrame
        className={className}
        comparison="on September"
        delta="+5.4%"
        icon={<Users />}
        legend={grouped ? <ChartKey series={plans} /> : undefined}
        loading={loading}
        table={{
            columns: ['Account', 'Plan', 'Seats', 'Revenue a month', 'Hours of use'],
            rows: accounts.map(row => [
                row.name,
                plans.find(plan => plan.key === row.plan)?.name ?? row.plan,
                row.seats,
                row.revenue,
                row.usage,
            ]),
        }}
        title="Accounts by seats and revenue"
        value={euro(accounts.reduce((sum, row) => sum + row.revenue, 0))}
    >
        <BubbleChart
            aria-label="Accounts by seats and monthly revenue, sized by hours of use"
            data={accounts}
            formatSize={hours}
            formatY={euro}
            group={grouped ? 'plan' : undefined}
            groups={grouped ? plans : undefined}
            height={height}
            labels={labels}
            loading={loading}
            name="name"
            size="usage"
            sizeKey={sizeKey}
            sizeLabel="Use"
            x="seats"
            xLabel="Seats"
            xScale={scale}
            y="revenue"
            yLabel="Revenue a month"
            yScale={scale}
        />
    </ChartFrame>
);

const BubblePreview = ({ knobs }: PreviewProps) => (
    <AccountsCard
        className="w-full max-w-3xl"
        grouped={knobs.group === true}
        labels={Number(knobs.labels)}
        loading={knobs.state === 'loading'}
        scale={knobs.scale as 'log' | 'linear'}
        sizeKey={knobs.sizeKey === true}
    />
);

export const entry: Entry = {
    id: 'bubble-chart',
    name: 'Bubble chart',
    category: 'charts',
    description:
        'Three measures of each thing: one across, one up, and one in the area of its bubble; point at one to read it.',
    span: 2,
    stageClassName: 'items-center',
    knobs: bubbleKnobs,
    Preview: BubblePreview,
};

const CustomersPage = () => (
    <AppWindow
        description="Every paying account, by what it pays and how much it is used."
        place="customers"
        title="Accounts"
        trail={['Customers', 'Accounts']}
    >
        <AccountsCard height={210} sizeKey={false} />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Accounts',
    note: 'Thirty accounts by seats and revenue, sized by use and coloured by plan.',
    app: true,
    render: () => <CustomersPage />,
};
