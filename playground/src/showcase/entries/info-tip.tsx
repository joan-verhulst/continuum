import { Button, Card, cn, InfoTip, Meter } from 'continuum';
import { Plus } from 'lucide-react';
import { useStageContainer } from '../../layout';
import { type Entry, type InUse, icon, scene } from '../kit';

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

const CreditsTip = () => {
    const stage = useStageContainer();

    return (
        <Card className="mt-16 w-full max-w-sm gap-4">
            <span className="flex items-center gap-1.5 font-medium text-neutral-950 text-xs">
                Credits
                <InfoTip
                    container={stage}
                    content="One credit is one AI summary or one export. Unused credits roll over for a month."
                    open
                />
            </span>
            <p className="font-medium text-2xl text-neutral-950 tabular-nums">7,550</p>
            <Meter
                caption="Resets in 10 days"
                label="Used this month"
                max={10000}
                tone="chart"
                value={2450}
            />
            <Button className="self-start" variant="secondary">
                <Plus {...icon} /> Add credits
            </Button>
        </Card>
    );
};

export const inUse: InUse = {
    title: 'Credits',
    note: 'A term explained where it is used.',
    bare: true,
    render: scene(<CreditsTip />),
};
