import {
    Badge,
    Button,
    Card,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    MetaItem,
    MetaList,
    Meter,
    OptionRow,
    RadioGroup,
    RadioGroupItem,
    SettingGroup,
    SettingRow,
    Switch,
} from 'continuum';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const icon = { strokeWidth: 2 } as const;

type PlanId = 'starter' | 'pro' | 'business';

const plans: Record<PlanId, { name: string; price: number; credits: number; seats: number }> = {
    starter: { name: 'Starter', price: 19, credits: 2500, seats: 1 },
    pro: { name: 'Pro', price: 49, credits: 10000, seats: 5 },
    business: { name: 'Business', price: 129, credits: 40000, seats: 20 },
};

type PackId = 'small' | 'medium' | 'large';

const packs: Record<PackId, { credits: number; price: number }> = {
    small: { credits: 1000, price: 12 },
    medium: { credits: 5000, price: 50 },
    large: { credits: 20000, price: 160 },
};

const creditsUsed = 2450;
const number = new Intl.NumberFormat('en-GB');
const seats = (count: number) => `${count} ${count === 1 ? 'seat' : 'seats'}`;

/** Billing panel: the current plan, this month's credits, and how to get more of them. */
const PlansPricing = () => {
    const [plan, setPlan] = useState<PlanId>('pro');
    const [draftPlan, setDraftPlan] = useState<PlanId>('pro');
    const [planOpen, setPlanOpen] = useState(false);

    // Credits bought this month on top of the plan; they lapse with the plan's own at the reset.
    const [extra, setExtra] = useState(0);
    const [pack, setPack] = useState<PackId>('medium');
    const [creditsOpen, setCreditsOpen] = useState(false);

    const [autoTopUp, setAutoTopUp] = useState(false);

    const current = plans[plan];
    const total = current.credits + extra;
    const remaining = Math.max(total - creditsUsed, 0);
    // Below a tenth left the bar turns to a warning, the only point where colour carries meaning here.
    const low = remaining < total * 0.1;

    return (
        <section
            aria-labelledby="plans-pricing-title"
            className="flex w-full max-w-[640px] flex-col gap-8"
        >
            {/* The docs section above already shows this title, so it is kept for screen readers only. */}
            <header className="sr-only">
                <h2 className="font-medium text-neutral-950 text-sm" id="plans-pricing-title">
                    Plans and pricing
                </h2>
                <p className="text-neutral-600 text-xs">
                    Your plan, this month’s credits and how to top them up.
                </p>
            </header>

            <Card className="flex-row flex-wrap items-center justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-neutral-950 text-sm">
                            {current.name} plan
                        </p>
                        <Badge tone="success">Active</Badge>
                    </div>
                    <MetaList separated>
                        <MetaItem>${current.price} / month</MetaItem>
                        <MetaItem>Renews 5 Nov 2026</MetaItem>
                        <MetaItem>{seats(current.seats)}</MetaItem>
                    </MetaList>
                </div>

                <Dialog
                    onOpenChange={open => {
                        // Each visit starts from the plan in force, not from an abandoned choice.
                        if (open) setDraftPlan(plan);
                        setPlanOpen(open);
                    }}
                    open={planOpen}
                >
                    <DialogTrigger render={<Button variant="secondary" />}>
                        Change plan
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Change plan</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <DialogDescription>
                                The new plan starts today. Unused credits carry over until the reset
                                on 5 Nov.
                            </DialogDescription>
                            <RadioGroup
                                aria-label="Plan"
                                onValueChange={value => setDraftPlan(value as PlanId)}
                                value={draftPlan}
                            >
                                {(Object.keys(plans) as PlanId[]).map(id => (
                                    <OptionRow
                                        control={<RadioGroupItem value={id} />}
                                        description={`$${plans[id].price} / month · ${number.format(plans[id].credits)} credits · ${seats(plans[id].seats)}`}
                                        key={id}
                                        label={
                                            id === plan
                                                ? `${plans[id].name} (current)`
                                                : plans[id].name
                                        }
                                    />
                                ))}
                            </RadioGroup>
                        </DialogBody>
                        <DialogFooter>
                            <DialogClose render={<Button variant="secondary" />}>
                                Cancel
                            </DialogClose>
                            <Button
                                disabled={draftPlan === plan}
                                onClick={() => {
                                    setPlan(draftPlan);
                                    setPlanOpen(false);
                                }}
                            >
                                Switch to {plans[draftPlan].name}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Card>

            {/* One figure, said once: the meter carries what is used of what there is, the line
                under it what is left and when it resets. Boxes for used, left and total said it thrice. */}
            <div className="flex flex-col gap-2">
                <Meter
                    caption={`${number.format(creditsUsed)} of ${number.format(total)}`}
                    getAriaValueText={(_, value) =>
                        `${number.format(value)} of ${number.format(total)} credits used`
                    }
                    label="Credit usage"
                    max={total}
                    tone={low ? 'warning' : 'chart'}
                    value={creditsUsed}
                />
                <p className="text-neutral-600 text-xs tabular-nums">
                    {number.format(remaining)} left
                    {extra > 0 && `, ${number.format(extra)} of them bought`} · resets in 10 days
                </p>
            </div>

            <SettingGroup>
                <SettingRow
                    control={
                        <Dialog onOpenChange={setCreditsOpen} open={creditsOpen}>
                            <DialogTrigger render={<Button />}>
                                <Plus {...icon} /> Add credits
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add credits</DialogTitle>
                                </DialogHeader>
                                <DialogBody>
                                    <DialogDescription>
                                        Charged to the card on file. Bought credits last until the
                                        next reset.
                                    </DialogDescription>
                                    <RadioGroup
                                        aria-label="Credit pack"
                                        onValueChange={value => setPack(value as PackId)}
                                        value={pack}
                                    >
                                        {(Object.keys(packs) as PackId[]).map(id => (
                                            <OptionRow
                                                control={<RadioGroupItem value={id} />}
                                                description={`$${packs[id].price}`}
                                                key={id}
                                                label={`${number.format(packs[id].credits)} credits`}
                                            />
                                        ))}
                                    </RadioGroup>
                                </DialogBody>
                                <DialogFooter>
                                    <DialogClose render={<Button variant="secondary" />}>
                                        Cancel
                                    </DialogClose>
                                    <Button
                                        onClick={() => {
                                            setExtra(value => value + packs[pack].credits);
                                            setCreditsOpen(false);
                                        }}
                                    >
                                        Pay ${packs[pack].price}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    }
                    description="Purchase additional credits anytime"
                    labelControl={false}
                    title="Add extra credits"
                />
                <SettingRow
                    control={<Switch checked={autoTopUp} onCheckedChange={setAutoTopUp} />}
                    description={
                        autoTopUp
                            ? 'Buys 1,000 credits for $12 when fewer than 500 remain'
                            : 'Top up automatically when you run low'
                    }
                    title="Auto top-up"
                />
            </SettingGroup>
        </section>
    );
};

export const plansPricingExample = () => <PlansPricing />;
