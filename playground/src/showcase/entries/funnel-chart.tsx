import {
    Card,
    CardDelta,
    CardFigure,
    CardHeader,
    CardTitle,
    CardValue,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    StatCard,
} from 'continuum';
import { FunnelChart } from 'continuum/charts';
import { AppWindow, type Entry, type InUse } from '../kit';

const FunnelPreview = () => (
    <div className="w-full overflow-x-auto">
        <FunnelChart
            className="min-w-160"
            data={[
                { label: '/cart', value: 8420 },
                { label: '/checkout', value: 5110 },
                { label: '/payment', value: 3240 },
                { label: '/thank-you', value: 2710 },
            ]}
            style={{ height: 180 }}
        />
    </div>
);

export const entry: Entry = {
    id: 'funnel-chart',
    name: 'Funnel chart',
    category: 'charts',
    description: 'Drop-off between the steps of a flow, with the share kept at each step.',
    span: 3,
    Preview: FunnelPreview,
};

const steps = [
    { label: '/cart', value: 8420 },
    { label: '/checkout', value: 5110 },
    { label: '/payment', value: 3240 },
    { label: '/thank-you', value: 2710 },
];

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
        <Card layout="chart">
            <CardHeader>
                <CardTitle>Orders completed</CardTitle>
                <CardFigure>
                    <CardValue size="xl">32.2%</CardValue>
                    <CardDelta trend="down">−5.1% on the 30 days before</CardDelta>
                </CardFigure>
            </CardHeader>
            <FunnelChart data={steps} style={{ height: 220 }} />
        </Card>
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
            <StatCard delta="+3.8%" label="Carts started" value="8,420" />
            <StatCard delta="−2.4%" label="Average order" trend="down" value="€86.40" />
            <StatCard delta="+0.6 pt" label="Payment failures" trend="down" value="4.1%" />
        </div>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Checkout',
    note: 'Each step from cart to thank-you, with the share kept, under the completion rate.',
    app: true,
    render: () => <CheckoutPage />,
};
