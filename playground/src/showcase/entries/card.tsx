import { Card, CardDelta, CardFigure, CardHeader, CardTitle, CardValue } from 'continuum';
import type { Entry, InUse } from '../kit';

const CardPreview = () => (
    <Card className="w-64">
        <CardHeader>
            <CardTitle>Returning visitors</CardTitle>
            <CardFigure>
                <CardValue size="xl">38%</CardValue>
                <CardDelta trend="down">−2.4%</CardDelta>
            </CardFigure>
        </CardHeader>
    </Card>
);

export const entry: Entry = {
    id: 'card',
    name: 'Card',
    category: 'content',
    description: 'Title, figure and delta; told apart by the hairline alone.',
    Preview: CardPreview,
};

const RevenueCards = () => (
    <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Revenue this month</CardTitle>
                <CardFigure>
                    <CardValue size="xl">€48,210</CardValue>
                    <CardDelta>+6.2%</CardDelta>
                </CardFigure>
            </CardHeader>
            <div className="flex items-center justify-between gap-4 rounded-panel border border-neutral-200 p-4 font-normal text-xs">
                <span className="text-neutral-500">Invoices paid</span>
                <span className="text-neutral-950">38 of 44</span>
            </div>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Returning visitors</CardTitle>
                <CardFigure>
                    <CardValue size="xl">38%</CardValue>
                    <CardDelta trend="down">−2.4%</CardDelta>
                </CardFigure>
            </CardHeader>
            <div className="flex items-center justify-between gap-4 rounded-panel border border-neutral-200 p-4 font-normal text-xs">
                <span className="text-neutral-500">Compared to</span>
                <span className="text-neutral-950">September</span>
            </div>
        </Card>
    </div>
);

export const inUse: InUse = {
    title: 'Headline figures',
    note: 'A title, a value with its change, and one fact under it.',
    canvas: true,
    render: () => <RevenueCards />,
};
