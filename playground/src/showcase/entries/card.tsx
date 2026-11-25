import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, StatCard } from '@contui/ui';
import { ArrowRight, CalendarDays, ChevronDown } from 'lucide-react';
import { AppWindow, type Entry, type InUse, icon, type Knob, o, type PreviewProps } from '../kit';

const cardKnobs: Knob[] = [
    {
        id: 'layout',
        label: 'Layout',
        options: [o('default', 'Default · 16'), o('list', 'List · 20')],
        default: 'list',
    },
    { id: 'action', label: 'Action in the head', switch: true, default: true },
];

const team = [
    { name: 'Maya Chen', initials: 'MC', role: 'Owner' },
    { name: 'Liam Ortiz', initials: 'LO', role: 'Finance' },
    { name: 'Sara Kim', initials: 'SK', role: 'Accountant' },
];

// A card is the unit, not a figure: a title over what it holds. A key figure is a StatCard.
const CardPreview = ({ knobs }: PreviewProps) => (
    <Card className="w-80" layout={knobs.layout as 'default' | 'list'}>
        <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Team</CardTitle>
            {knobs.action && <Button variant="ghost">Invite</Button>}
        </CardHeader>
        <CardContent>
            <ul className="flex flex-col gap-3">
                {team.map(person => (
                    <li className="flex items-center gap-3 text-xs" key={person.name}>
                        <Avatar fallback={person.initials} size={24} />
                        <span className="min-w-0 flex-1 truncate font-medium text-neutral-950">
                            {person.name}
                        </span>
                        <span className="text-neutral-600">{person.role}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);

export const entry: Entry = {
    id: 'card',
    name: 'Card',
    category: 'content',
    description:
        'A self-contained unit: a title over what it holds, told apart by the hairline alone. A key figure is a Stat card.',
    knobs: cardKnobs,
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
        <div className="grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
            {headline.map(card => (
                <StatCard
                    delta={card.delta}
                    key={card.title}
                    label={card.title}
                    note={card.fact}
                    trend={card.trend}
                    value={card.value}
                />
            ))}
        </div>
        <Card layout="list">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Largest customers this month</CardTitle>
                <Button variant="ghost">
                    All customers <ArrowRight {...icon} />
                </Button>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    </AppWindow>
);

export const inUse: InUse = {
    title: 'Overview',
    note: 'The month’s headline figures as stat cards, over a card holding the largest customers: the card is the unit, the figure is a stat card.',
    app: true,
    render: () => <Overview />,
};
