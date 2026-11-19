'use client';

import { Button, cn, Input } from 'continuum';
import { Check } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useState } from 'react';
import { joinEarlyAccess } from '@/lib/early-access';
import { proLaunchPriceEUR } from '@/lib/site';
import { RimLight } from '../rim-light';
import { Reveal, Section } from '../web';

/*
 * Pricing as a shape: three columns in one ruled panel, so they read as one decision rather than
 * three adverts. The rows line up across the columns (what it is, the action, what is in it), and
 * only Pro's early-access button takes the action colour: one primary in the view.
 */

type Plan = {
    id: string;
    name: string;
    price: string;
    priceNote: string;
    line: string;
    action: ReactNode;
    includes: string[];
    /** The column the page wants you to look at: lit round its edge, two thirds wide. */
    lead?: boolean;
};

const EarlyAccessForm = ({
    plan,
    label = 'Join the Pro waitlist',
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
        name: 'Free tools',
        price: '€0',
        priceNote: 'No account needed',
        line: 'Try your theme on real screens in the browser.',
        action: (
            <Button
                className="w-full"
                render={props => <a {...props} href="/tools" />}
                size="lg"
                variant="secondary"
            >
                Explore the tools
            </Button>
        ),
        includes: [
            'Build a colour palette',
            'Check contrast in light and dark mode',
            'Preview colour blindness simulations',
            'Export Tailwind CSS and a design brief for your agent',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: `€${proLaunchPriceEUR}`,
        priceNote: 'One-time payment at launch',
        line: 'Bring Continuum into the product you’re building and give your coding agent the same design rules.',
        action: (
            <div className="flex flex-col gap-2">
                <EarlyAccessForm plan="pro" />
                <p className="text-neutral-600 text-sm">No payment is taken when you sign up.</p>
            </div>
        ),
        includes: [
            'Commercial licence for one developer',
            'React component library and chart kit for production use',
            'Claude Code skills for building and refining UI',
            'MCP tools for looking up design rules and auditing existing screens',
        ],
        lead: true,
    },
];

/** Spans the grid's three rows, so a card's parts line up with its neighbour's. */
const subgrid = 'grid grid-cols-1 gap-y-6 lg:row-span-3 lg:grid-rows-subgrid';
const face = cn(subgrid, 'rounded-panel p-6 sm:p-8');
const card = cn(face, 'border border-neutral-200');

const PlanColumn = ({ plan }: { plan: Plan }) => {
    const titleId = `plan-${plan.id}`;

    const parts = (
        <>
            <div className="flex flex-col">
                <div className="flex h-6 items-center gap-2">
                    <h3 className="text-base text-neutral-600" id={titleId}>
                        {plan.name}
                    </h3>
                </div>
                <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-medium text-4xl text-neutral-950 tabular-nums leading-[1.15] tracking-[-0.02em]">
                        {plan.price}
                    </span>
                    <span className="text-neutral-600 text-sm">{plan.priceNote}</span>
                </p>
                <p className="mt-3 max-w-[440px] text-base text-neutral-600 leading-[1.6]">
                    {plan.line}
                </p>
            </div>
            <div>{plan.action}</div>
            <ul aria-label={`Included in ${plan.name}`} className="flex flex-col gap-3">
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
        </>
    );

    // The lead card wears the hero's light: the spectrum flowing slowly round its edge, quietly, in
    // place of the border. The face is opaque in the page's own colour, so it reads as the Free card
    // does and the halo stays outside. Every layer between the grid and the parts stays a subgrid,
    // so the rows still line up.
    return plan.lead ? (
        <article
            aria-labelledby={titleId}
            className={cn(subgrid, 'scroll-mt-24 lg:col-span-2')}
            id="pro-early-access"
        >
            <RimLight
                className={cn(subgrid, 'rounded-panel [--rim-strength:0.45]')}
                faceClassName={cn(face, 'bg-neutral-50')}
                glow={0.25}
                haloBlur={12}
                lap={24}
                loop
                ring
            >
                {parts}
            </RimLight>
        </article>
    ) : (
        <article aria-labelledby={titleId} className={card}>
            {parts}
        </article>
    );
};

export const Pricing = () => (
    <Section
        description="Get a feel for Continuum in the browser, then take it into your codebase when you’re ready to ship."
        id="pricing"
        title="Pricing"
    >
        <div className="flex flex-col gap-6">
            <Reveal delay={1}>
                <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr]">
                    {plans.map(plan => (
                        <PlanColumn key={plan.id} plan={plan} />
                    ))}
                </div>
            </Reveal>
        </div>
    </Section>
);
