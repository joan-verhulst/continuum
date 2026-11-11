import { BarList, BarListItem, Button, Card, CardTitle, cn, InfoTip, Meter } from 'continuum';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useStageContainer } from '../../layout';
import { AppScene, type Entry, type InUse, icon } from '../kit';

const InfoTipPreview = () => {
    const stage = useStageContainer();

    return (
        <span
            className={cn(
                'flex items-center gap-1.5 font-medium text-neutral-950 text-xs',
                stage && 'pt-14',
            )}
        >
            How should this campaign start?
            <InfoTip
                container={stage}
                content="A set date starts everyone at once; a trigger starts each recipient on their own action."
                open={stage ? true : undefined}
            />
        </span>
    );
};

export const entry: Entry = {
    id: 'info-tip',
    name: 'Info tip',
    category: 'overlays',
    description: 'An info icon that explains a title in a tooltip.',
    Preview: InfoTipPreview,
};

const creditUse = [
    { feature: 'AI summaries', credits: 1420 },
    { feature: 'Exports', credits: 610 },
    { feature: 'Scheduled reports', credits: 290 },
    { feature: 'Data enrichment', credits: 130 },
];

// The title of a usage card, with the tip held open beside the one term that needs it.
const CreditsCard = () => {
    const stage = useStageContainer();

    return (
        <Card className="gap-4">
            <span className="flex items-center gap-1.5">
                <CardTitle>Credits left</CardTitle>
                <InfoTip
                    container={stage}
                    content="One credit is one AI summary or one export. Unused credits roll over for a month."
                    open
                />
            </span>
            <p className="font-medium text-lg text-neutral-950 tabular-nums">7,550</p>
            <Meter
                caption="Resets 14 Nov"
                label="2,450 used"
                max={10000}
                tone="chart"
                value={2450}
            />
        </Card>
    );
};

const BillingPage = () => (
    <AppScene
        page={{
            place: 'settings',
            trail: ['Settings', 'Billing'],
            title: 'Billing',
            description: 'Your plan, what it includes and what you have used this month.',
            actions: (
                <>
                    <Button variant="secondary">
                        Compare plans <ArrowUpRight {...icon} />
                    </Button>
                    <Button>
                        <Plus {...icon} /> Add credits
                    </Button>
                </>
            ),
            children: (
                <>
                    {/* Room above the cards for the open tip, so it never sits on the page's description. */}
                    <div className="mt-10 grid @max-shell-compact/shell:grid-cols-1 grid-cols-3 gap-4">
                        <Card className="gap-4">
                            <CardTitle>Plan</CardTitle>
                            <p className="font-medium text-lg text-neutral-950">Pro</p>
                            <p className="text-neutral-600 text-xs">
                                €49 a month, billed yearly. Renews 2 March 2027.
                            </p>
                        </Card>
                        <CreditsCard />
                        <Card className="gap-4">
                            <CardTitle>Seats</CardTitle>
                            <p className="font-medium text-lg text-neutral-950 tabular-nums">
                                8 of 10
                            </p>
                            <Meter
                                caption="2 free"
                                label="In use"
                                max={10}
                                tone="chart"
                                value={8}
                            />
                        </Card>
                    </div>
                    <Card layout="list">
                        <BarList title="Credits by feature" valueLabel="This month">
                            {creditUse.map(row => (
                                <BarListItem
                                    displayValue={row.credits.toLocaleString('en-GB')}
                                    key={row.feature}
                                    value={row.credits}
                                >
                                    {row.feature}
                                </BarListItem>
                            ))}
                        </BarList>
                    </Card>
                </>
            ),
        }}
    />
);

export const inUse: InUse = {
    title: 'Billing',
    note: 'The one term on the billing page that needs explaining, explained beside it.',
    bare: true,
    render: () => <BillingPage />,
};
