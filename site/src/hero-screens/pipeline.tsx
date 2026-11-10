import {
    Avatar,
    Badge,
    BottomBar,
    Button,
    Dock,
    DockAction,
    DockItem,
    Progress,
    SegmentedControl,
    SegmentedControlItem,
} from 'continuum';
import { CalendarDays, Columns3, ListFilter, Plus, Rows3 } from 'lucide-react';
import { Frame, formatCompact, formatEuro, icon, PageHead, Person } from './shell';

/*
 * Sales: the quarter's pipeline as a board. Each stage a column on the muted fill with its count
 * and its total; each deal a card with its company, amount, owner, close date and the next step.
 * The views of the pipeline are in the dock, with the page's one primary action beside it.
 */

type Deal = {
    company: string;
    initials: string;
    title: string;
    amount: number;
    owner: string;
    close: string;
    /** What happens next, the line a rep reads first. */
    next: string;
    flag?: { label: string; tone: 'warning' | 'error' | 'success' | 'primary' };
};

type Stage = { id: string; label: string; probability: number; deals: Deal[]; more: number };

const stages: Stage[] = [
    {
        id: 'qualified',
        label: 'Qualified',
        probability: 10,
        more: 6,
        deals: [
            {
                company: 'Hooli',
                initials: 'HO',
                title: 'Platform, 120 seats',
                amount: 86000,
                owner: 'LO',
                close: 'Dec 18',
                next: 'Discovery call Thu',
            },
            {
                company: 'Wayne Studio',
                initials: 'WS',
                title: 'Team plan upgrade',
                amount: 14400,
                owner: 'NP',
                close: 'Nov 29',
                next: 'Send case study',
            },
            {
                company: 'Pied Piper',
                initials: 'PP',
                title: 'Compression analytics',
                amount: 52000,
                owner: 'SK',
                close: 'Jan 12',
                next: 'Intro with CTO',
                flag: { label: 'Inbound', tone: 'primary' },
            },
            {
                company: 'Vandelay',
                initials: 'VA',
                title: 'Import tracking pilot',
                amount: 9800,
                owner: 'MC',
                close: 'Dec 04',
                next: 'Qualify budget',
            },
        ],
    },
    {
        id: 'discovery',
        label: 'Discovery',
        probability: 25,
        more: 4,
        deals: [
            {
                company: 'Initech',
                initials: 'IN',
                title: 'Finance suite, EU',
                amount: 124000,
                owner: 'SK',
                close: 'Dec 12',
                next: 'Security review',
                flag: { label: 'Champion left', tone: 'warning' },
            },
            {
                company: 'Soylent Labs',
                initials: 'SL',
                title: 'Data residency add-on',
                amount: 38500,
                owner: 'NP',
                close: 'Nov 30',
                next: 'Demo for ops team',
            },
            {
                company: 'Massive Dynamic',
                initials: 'MD',
                title: 'Global rollout, phase 1',
                amount: 210000,
                owner: 'MC',
                close: 'Jan 20',
                next: 'Map stakeholders',
            },
        ],
    },
    {
        id: 'proposal',
        label: 'Proposal',
        probability: 50,
        more: 3,
        deals: [
            {
                company: 'Umbrella Health',
                initials: 'UH',
                title: 'Renewal + 40 seats',
                amount: 148800,
                owner: 'MC',
                close: 'Nov 22',
                next: 'Pricing call Mon',
                flag: { label: 'Renewal', tone: 'primary' },
            },
            {
                company: 'Globex',
                initials: 'GX',
                title: 'Analytics, 3 regions',
                amount: 64000,
                owner: 'LO',
                close: 'Dec 01',
                next: 'Revise proposal',
            },
            {
                company: 'Tyrell & Co',
                initials: 'TC',
                title: 'Starter to Business',
                amount: 18200,
                owner: 'MC',
                close: 'Nov 26',
                next: 'Waiting on legal',
                flag: { label: 'Stalled 9d', tone: 'warning' },
            },
        ],
    },
    {
        id: 'negotiation',
        label: 'Negotiation',
        probability: 75,
        more: 2,
        deals: [
            {
                company: 'Stark Logistics',
                initials: 'SK',
                title: 'Fleet visibility, 3 yrs',
                amount: 312000,
                owner: 'SK',
                close: 'Nov 15',
                next: 'Redlines back Wed',
                flag: { label: 'Closing soon', tone: 'success' },
            },
            {
                company: 'Northwind Traders',
                initials: 'NT',
                title: 'Enterprise expansion',
                amount: 96000,
                owner: 'LO',
                close: 'Nov 28',
                next: 'Procurement signoff',
            },
            {
                company: 'Oscorp',
                initials: 'OS',
                title: 'Lab data platform',
                amount: 58000,
                owner: 'NP',
                close: 'Dec 09',
                next: 'Final terms call',
                flag: { label: 'Discount asked', tone: 'warning' },
            },
        ],
    },
    {
        id: 'won',
        label: 'Closed won',
        probability: 100,
        more: 7,
        deals: [
            {
                company: 'Cyberdyne',
                initials: 'CY',
                title: 'Win-back, Business',
                amount: 42000,
                owner: 'NP',
                close: 'Nov 03',
                next: 'Kickoff scheduled',
            },
            {
                company: 'Acme Corp',
                initials: 'AC',
                title: 'API platform',
                amount: 76500,
                owner: 'MC',
                close: 'Nov 01',
                next: 'Handed to success',
            },
        ],
    },
];

const total = (stage: Stage) =>
    stage.deals.reduce((sum, deal) => sum + deal.amount, 0) * (1 + stage.more * 0.35);

const DealCard = ({ deal }: { deal: Deal }) => (
    <article
        className="flex flex-col gap-3 rounded-item border border-neutral-200 bg-neutral-50 p-3"
        data-slot="deal-card"
    >
        <div className="flex items-center gap-2">
            <Avatar fallback={deal.initials} size={24} />
            <span className="min-w-0 flex-1 truncate font-medium text-neutral-950 text-xs">
                {deal.company}
            </span>
            <Person initials={deal.owner} />
        </div>
        <div className="flex flex-col gap-0.5">
            <span className="truncate text-neutral-700 text-xs">{deal.title}</span>
            <span className="font-medium text-neutral-950 text-sm tabular-nums">
                {formatEuro(deal.amount)}
            </span>
        </div>
        <div className="flex items-center gap-2 text-neutral-600 text-xxs">
            <CalendarDays className="size-3 shrink-0" {...icon} />
            <span className="tabular-nums">{deal.close}</span>
            <span className="min-w-0 flex-1 truncate">· {deal.next}</span>
        </div>
        {deal.flag && (
            <Badge className="self-start" tone={deal.flag.tone} variant="dot">
                {deal.flag.label}
            </Badge>
        )}
    </article>
);

const StageColumn = ({ stage }: { stage: Stage }) => (
    <section
        aria-label={stage.label}
        className="flex w-60 shrink-0 flex-col gap-2 rounded-card bg-neutral-100 p-2"
        data-slot="board-column"
    >
        <header className="flex flex-col gap-2 px-1 pt-1 pb-1">
            <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-950 text-xs">{stage.label}</span>
                <Badge variant="count" className="min-w-0">
                    {stage.deals.length + stage.more}
                </Badge>
                <span className="ml-auto font-medium text-neutral-950 text-xs tabular-nums">
                    {formatCompact(total(stage))}
                </span>
            </div>
            <Progress
                aria-label={`${stage.label}: ${stage.probability}% probability`}
                tone={stage.probability === 100 ? 'success' : undefined}
                value={stage.probability}
            />
        </header>
        {stage.deals.map(deal => (
            <DealCard deal={deal} key={deal.company} />
        ))}
    </section>
);

export const PipelineScreen = () => (
    <Frame
        bar={
            <BottomBar floating>
                <Dock aria-label="Views" defaultValue="all">
                    <DockItem value="all">
                        All deals <span className="font-normal tabular-nums opacity-70">37</span>
                    </DockItem>
                    <DockItem value="mine">
                        Mine <span className="font-normal tabular-nums opacity-70">12</span>
                    </DockItem>
                    <DockItem value="closing">
                        Closing this month{' '}
                        <span className="font-normal tabular-nums opacity-70">9</span>
                    </DockItem>
                    <DockItem value="stalled">
                        Stalled <span className="font-normal tabular-nums opacity-70">4</span>
                    </DockItem>
                </Dock>
                <DockAction>
                    <Plus {...icon} />
                    New deal
                </DockAction>
            </BottomBar>
        }
        place="pipeline"
        trail={['Pipeline', 'Q4 2026']}
    >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden pt-10">
            <div className="px-8">
                <PageHead
                    description="€2.66M open across 28 deals · €1.10M weighted · 69% of the €1.6M target"
                    title="Q4 pipeline"
                >
                    <SegmentedControl aria-label="Layout" defaultValue="board">
                        <SegmentedControlItem value="board">
                            <Columns3 {...icon} />
                            Board
                        </SegmentedControlItem>
                        <SegmentedControlItem value="list">
                            <Rows3 {...icon} />
                            List
                        </SegmentedControlItem>
                    </SegmentedControl>
                    <Button variant="secondary">
                        <ListFilter {...icon} />
                        Filter
                    </Button>
                </PageHead>
            </div>
            <div className="flex min-h-0 flex-1 items-start gap-3 overflow-hidden px-8">
                {stages.map(stage => (
                    <StageColumn key={stage.id} stage={stage} />
                ))}
            </div>
        </div>
    </Frame>
);
