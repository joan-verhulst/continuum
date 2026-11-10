import { Badge, Button, cn, Input } from 'continuum';
import { Check } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useState } from 'react';
import { Reveal, Section } from '../web';

/*
 * Pricing as a shape: three columns in one ruled panel, so they read as one decision rather than
 * three adverts. The rows line up across the columns (what it is, the action, what is in it), and
 * only Pro's early-access button takes the action colour: one primary in the view.
 */

type Plan = {
    id: string;
    name: string;
    badge?: string;
    /** Where a price would sit; a word until a price is set. */
    figure: string;
    line: string;
    action: ReactNode;
    includes: string[];
    /** The column the page wants you to look at: a step up from the surface. */
    lead?: boolean;
};

/**
 * Where an early-access address goes. Until the list exists the form only confirms, so the page
 * can be read and tried before launch.
 */
const joinEarlyAccess = async (_email: string, _plan: string) => {};

const EarlyAccessForm = ({
    plan,
    label = 'Get early access',
    variant = 'primary',
}: {
    plan: string;
    label?: string;
    /** One primary in the view: any other column's form takes the secondary button. */
    variant?: 'primary' | 'secondary';
}) => {
    const id = useId();
    const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const email = new FormData(event.currentTarget).get('email');
        if (typeof email !== 'string' || !email) return;
        setState('sending');
        await joinEarlyAccess(email, plan);
        setState('sent');
    };

    return (
        <div aria-live="polite" className="@container">
            {state === 'sent' ? (
                <p className="flex h-control-lg items-center gap-2 text-base text-neutral-950">
                    <Check aria-hidden className="size-4 text-neutral-600" strokeWidth={2} />
                    You're on the list.
                </p>
            ) : (
                <form className="flex @min-[18rem]:flex-row flex-col gap-2" onSubmit={submit}>
                    <label className="sr-only" htmlFor={`${id}-email`}>
                        Email address
                    </label>
                    <Input
                        autoComplete="email"
                        className="@min-[18rem]:flex-1"
                        id={`${id}-email`}
                        name="email"
                        placeholder="you@company.com"
                        required
                        type="email"
                    />
                    <Button loading={state === 'sending'} size="lg" type="submit" variant={variant}>
                        {label}
                    </Button>
                </form>
            )}
        </div>
    );
};

const plans: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        figure: '€0',
        line: 'Open, and free for good. No account: your themes stay in your browser.',
        action: (
            <Button
                className="w-full"
                render={props => <a {...props} href="/docs#view=projects&mode=dark" />}
                size="lg"
                variant="secondary"
            >
                Open the theme builder
            </Button>
        ),
        includes: [
            'The component library, on Base UI and Tailwind v4',
            'The chart kit',
            'The theme builder, with its contrast checks',
            'Your theme as app.css, in light and dark',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        badge: 'Soon',
        figure: 'Early access',
        line: 'Per person, priced at launch. Leave your email and we write once, when Pro opens.',
        action: <EarlyAccessForm plan="pro" />,
        includes: [
            'The skill, so your agent designs in Continuum',
            'An MCP connection for each project',
            'Theme sync: one source of truth across projects',
            'Page recipes for dashboards, lists, forms and settings',
        ],
        lead: true,
    },
];

const PlanColumn = ({ plan }: { plan: Plan }) => {
    const titleId = `plan-${plan.id}`;

    return (
        // A card of its own; it spans the grid's three rows, so its parts line up with its neighbour's.
        <article
            aria-labelledby={titleId}
            className={cn(
                'grid grid-cols-1 gap-y-6 rounded-panel border border-neutral-200 p-6 sm:p-8 lg:row-span-3 lg:grid-rows-subgrid',
                plan.lead && 'bg-neutral-100',
            )}
        >
            <div className="flex flex-col">
                <div className="flex h-6 items-center gap-2">
                    <h3 className="text-base text-neutral-600" id={titleId}>
                        {plan.name}
                    </h3>
                    {plan.badge && <Badge tone="neutral">{plan.badge}</Badge>}
                </div>
                <p className="mt-3 font-medium text-3xl text-neutral-950 tabular-nums leading-[1.15] tracking-[-0.02em]">
                    {plan.figure}
                </p>
                <p className="mt-3 max-w-[320px] text-base text-neutral-600 leading-[1.6]">
                    {plan.line}
                </p>
            </div>
            <div>{plan.action}</div>
            <ul aria-label={`In ${plan.name}`} className="flex flex-col gap-3">
                {plan.includes.map(item => (
                    <li className="flex gap-3 text-base text-neutral-800 leading-[1.5]" key={item}>
                        <Check
                            aria-hidden
                            className="mt-1 size-4 shrink-0 text-neutral-500"
                            strokeWidth={2}
                        />
                        {item}
                    </li>
                ))}
            </ul>
        </article>
    );
};

/** Pricing: what is free for good, and what Pro adds. */
export const Pricing = () => (
    <Section
        description="The components and the theme builder are open and free. Pro gives your agent the skill and keeps every project on one theme."
        eyebrow="Pricing"
        id="pricing"
        title="Free to build with. Pro to keep it whole."
    >
        <div className="flex flex-col gap-6">
            <Reveal delay={1}>
                <div className="grid gap-4 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr]">
                    {plans.map(plan => (
                        <PlanColumn key={plan.id} plan={plan} />
                    ))}
                </div>
            </Reveal>
        </div>
    </Section>
);
