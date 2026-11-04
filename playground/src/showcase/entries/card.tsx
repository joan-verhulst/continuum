import {
    Avatar,
    Button,
    Card,
    CardDelta,
    CardFigure,
    CardHeader,
    CardTitle,
    CardValue,
} from 'continuum';
import { ArrowRight, CalendarDays, ChevronDown } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon } from '../kit';

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

const headline = [
    {
        title: 'Revenue',
        value: '€48,210',
        delta: '+6.2%',
        trend: 'up',
        fact: '38 of 44 invoices paid',
    },
    {
        title: 'Outstanding',
        value: '€12,940',
        delta: '−8.1%',
        trend: 'down',
        fact: '6 invoices, 2 overdue',
    },
    {
        title: 'Returning customers',
        value: '86%',
        delta: '+1.4%',
        trend: 'up',
        fact: '112 of 130 renewed',
    },
] as const;

const largest = [
    { name: 'Northwind Traders', initials: 'NT', plan: 'Enterprise', revenue: '€14,400' },
    { name: 'Umbrella Health', initials: 'UH', plan: 'Enterprise', revenue: '€9,600' },
    { name: 'Stark Logistics', initials: 'SL', plan: 'Enterprise', revenue: '€7,250' },
];

const Overview = () => (
    <AppWindow
        actions={
            <Button variant="secondary">
                <CalendarDays {...icon} /> October 2026 <ChevronDown {...icon} />
            </Button>
        }
        description="October so far, against the same days in September."
        place="overview"
        title="Overview"
        trail={['Overview']}
    >
        <div className="grid grid-cols-3 gap-4">
            {headline.map(card => (
                <Card className="gap-6 p-5" key={card.title}>
                    <CardHeader className="gap-1">
                        <CardTitle>{card.title}</CardTitle>
                        <CardFigure>
                            <CardValue size="lg">{card.value}</CardValue>
                            <CardDelta trend={card.trend}>{card.delta}</CardDelta>
                        </CardFigure>
                    </CardHeader>
                    <p className="text-neutral-600 text-xs">{card.fact}</p>
                </Card>
            ))}
        </div>
        <Card className="gap-4 p-5">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Largest customers this month</CardTitle>
                <Button variant="ghost">
                    All customers <ArrowRight {...icon} />
                </Button>
            </CardHeader>
            <ul className="flex flex-col gap-3">
                {largest.map(customer => (
                    <li className="flex items-center gap-3 text-xs" key={customer.name}>
                        <Avatar fallback={customer.initials} size={24} />
                        <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                            {customer.name}
                        </span>
                        <span className="text-neutral-600">{customer.plan}</span>
                        <span className="w-20 text-right text-neutral-950 tabular-nums">
                            {customer.revenue}
                        </span>
                    </li>
                ))}
            </ul>
        </Card>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Overview',
    note: 'The month’s headline figures, each a card with its value, change and one fact, over a card of the largest customers.',
    app: true,
    render: () => <Overview />,
};
