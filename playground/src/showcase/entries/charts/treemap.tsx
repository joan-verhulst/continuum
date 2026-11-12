import { ChartFrame, Treemap } from 'continuum/charts';
import { ArrowLeftRight, Clapperboard, HeartPulse, Package, Repeat, Wallet } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, type PreviewProps } from '../../kit';

const spending = [
    { name: 'Transfers', value: 56, delta: '+2.6%', icon: <ArrowLeftRight /> },
    { name: 'Subscriptions', value: 16, delta: '+12%', icon: <Repeat /> },
    { name: 'Media', value: 10, delta: '−0.2%', icon: <Clapperboard /> },
    { name: 'Health', value: 10, delta: '+0.1%', icon: <HeartPulse /> },
    { name: 'Products', value: 8, delta: '−1.2%', icon: <Package /> },
];

const treemapKnobs: Knob[] = [
    {
        id: 'icons',
        label: 'Icons',
        switch: true,
        default: true,
    },
];

type Spend = Omit<(typeof spending)[number], 'icon'> & { icon?: (typeof spending)[number]['icon'] };

/** The month's spending in its card: the total leads, the tiles share it out. */
const SpendingCard = ({
    data,
    height = 300,
    className,
}: {
    data: readonly Spend[];
    height?: number;
    className?: string;
}) => (
    <ChartFrame
        className={className}
        comparison="on September"
        delta="+4.1%"
        icon={<Wallet />}
        table={{
            columns: ['Category', 'Share (%)', 'Change'],
            rows: data.map(item => [item.name, item.value, item.delta]),
        }}
        title="Spending by category"
        value="€14,820"
    >
        <Treemap aria-label="Spending by category this month" data={data} height={height} />
    </ChartFrame>
);

const TreemapPreview = ({ knobs }: PreviewProps) => (
    <SpendingCard
        className="w-full max-w-3xl"
        data={spending.map(item => (knobs.icons ? item : { ...item, icon: undefined }))}
        height={260}
    />
);

export const entry: Entry = {
    id: 'treemap',
    name: 'Treemap',
    category: 'charts',
    description:
        'Parts of a whole as tiles, each as large as its share and as square as it can be.',
    span: 2,
    stageClassName: 'items-stretch',
    knobs: treemapKnobs,
    Preview: TreemapPreview,
};

const WalletPage = () => (
    <AppWindow
        description="Where the money went in October."
        place="reports"
        title="Spending"
        trail={['Reports', 'Spending']}
    >
        <SpendingCard data={spending} />
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Spending',
    note: 'A month of spending split by category, the largest share the largest tile.',
    app: true,
    render: () => <WalletPage />,
};
