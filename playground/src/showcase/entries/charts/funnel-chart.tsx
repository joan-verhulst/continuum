import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatCard } from 'continuum';
import { ChartFrame, FunnelChart } from 'continuum/charts';
import { ShoppingCart } from 'lucide-react';
import { AppWindow, type Entry, type InUse, type Knob, o, type PreviewProps } from '../../kit';

const steps = [
    { name: '/cart', value: 8420 },
    { name: '/checkout', value: 5110 },
    { name: '/shipping', value: 4020 },
    { name: '/payment', value: 3240 },
    { name: '/thank-you', value: 2710 },
];

const funnelKnobs: Knob[] = [
    {
        id: 'steps',
        label: 'Steps',
        options: [o('3', 'Three'), o('5', 'Five')],
        default: '5',
    },
];

const pick = (count: number) =>
    count === 3 ? [steps[0], steps[1], steps[4]].filter(Boolean) : steps;

/** The checkout in its card: the share that got to the end leads, the funnel under it. */
const OrdersCard = ({
    data,
    className,
}: {
    data: readonly { name: string; value: number }[];
    className?: string;
}) => (
    <ChartFrame
        className={className}
        comparison="on the 30 days before"
        delta="−5.1%"
        icon={<ShoppingCart />}
        table={{
            columns: ['Step', 'Shoppers'],
            rows: data.map(step => [step.name, step.value]),
        }}
        title="Orders completed"
        trend="down"
        value="32.2%"
    >
        <FunnelChart aria-label="Shoppers at each step of the checkout" data={data} />
    </ChartFrame>
);

const FunnelPreview = ({ knobs }: PreviewProps) => (
    <OrdersCard className="w-full max-w-3xl" data={pick(Number(knobs.steps)) as typeof steps} />
);

export const entry: Entry = {
    id: 'funnel-chart',
    name: 'Funnel chart',
    category: 'charts',
    description:
        'Steps in order and what is lost between them, each step’s figure over its column.',
    span: 3,
    stageClassName: 'items-stretch',
    knobs: funnelKnobs,
    Preview: FunnelPreview,
};

const CheckoutPage = () => (
    <AppWindow
        actions={
            <Select defaultValue="30d">
                <SelectTrigger aria-label="Period" className="w-36" size="sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
            </Select>
        }
        description="How shoppers moved from the cart to a paid order."
        nav="top"
        place="reports"
        title="Checkout"
    >
        <OrdersCard data={steps} />
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
            <StatCard delta="+3.8%" label="Carts started" value="8,420" />
            <StatCard delta="−2.4%" label="Average order" trend="down" value="€86.40" />
            <StatCard delta="+0.6%" label="Repeat buyers" value="18.2%" />
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Checkout',
    note: 'The checkout funnel leading its page, with its figures to download.',
    app: true,
    render: () => <CheckoutPage />,
};
