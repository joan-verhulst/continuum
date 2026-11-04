import { Card, CardDelta, CardFigure, CardHeader, CardTitle, CardValue } from 'continuum';
import { FunnelChart } from 'continuum/charts';
import type { Entry, InUse } from '../kit';

const FunnelPreview = () => (
    <div className="w-full overflow-x-auto">
        <FunnelChart
            className="min-w-[640px]"
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

const FunnelCard = () => (
    <Card className="w-full gap-4">
        <CardHeader>
            <CardTitle>Checkout funnel</CardTitle>
            <CardFigure>
                <CardValue size="lg">32%</CardValue>
                <CardDelta trend="down">−5.1% completion</CardDelta>
            </CardFigure>
        </CardHeader>
        <div className="w-full overflow-x-auto">
            <FunnelChart
                className="min-w-[640px]"
                data={[
                    { label: '/cart', value: 8420 },
                    { label: '/checkout', value: 5110 },
                    { label: '/payment', value: 3240 },
                    { label: '/thank-you', value: 2710 },
                ]}
                style={{ height: 200 }}
            />
        </div>
    </Card>
);

export const inUse: InUse = {
    title: 'Checkout funnel',
    note: 'The steps as the chart, the completion rate as the figure.',
    canvas: true,
    render: () => <FunnelCard />,
};
