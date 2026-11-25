'use client';

import { Button } from '@contui/ui';
import { ArrowRight, Check } from 'lucide-react';
import { motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { GlassLight, type GlassRect } from '@/components/footer-shader';
import { installUrl } from '@/components/install-button';
import { tunable } from '@/lib/tunable';
import { PRO_LIGHT } from '../pro-light';
import { ease, Reveal, Section } from '../web';

/*
 * Pricing as one offer, played once it comes into view: Continuum is free to use. The card, the
 * section's full width, holds the hero's light: it opens dim and the light comes up from the card's
 * foot while the offer sharpens in on it (the name, Free, what the licence allows, the line, and the
 * one action: Start building, to the install guide). Under the card, on the page, what comes with it
 * as a plain checklist, item by item (the library's leads to it), and the tools in the browser as
 * one quiet row with the secondary action.
 */

/** What comes with Continuum; what the licence allows is said once, under the price. */
const included = [
    'library',
    'Claude Code skills that build and refine UI',
    'MCP server: look up the rules, audit screens',
    'A good-looking screen from the first prompt',
    'Your own theme on every component and chart',
    'Use it in client work and your own products',
];

/** The card's light: the hero's, from under its foot. */
const lightStore = tunable(PRO_LIGHT);

const glassRect = (light: typeof PRO_LIGHT): GlassRect => ({
    x: light.glassX,
    y: light.glassY,
    width: light.glassWidth,
    height: light.glassHeight,
});

/** How dim the card is before the scene plays, as a share of the light's full strength. */
const DIM = 0.04;

/** The scene's timing, in seconds from the moment the card comes into view. */
const TIMING = {
    light: 1.6,
    offer: 0.3,
    list: 0.9,
    stagger: 0.08,
};

/** Each piece sharpens out of a blur as it rises into place, at its own delay. */
const arrive: Variants = {
    hidden: { opacity: 0, y: 24, filter: 'blur(12px)' },
    shown: (delay: number) => ({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.7, ease, delay },
    }),
};

/**
 * @param families The library's component families (their names, each to its page), as the
 * Components section reads them from the sources.
 */
export const Pricing = ({ families }: { families: Record<string, string> }) => {
    const card = useRef<HTMLElement>(null);
    const reduce = useReducedMotion();
    // Once, when half of the card is in view.
    const inView = useInView(card, { once: true, amount: 0.5 });
    const state = reduce || inView ? 'shown' : 'hidden';

    // The card opens dim and its light comes up once the scene plays.
    useEffect(() => {
        if (reduce) {
            lightStore.set({ strength: PRO_LIGHT.strength });
            return;
        }
        if (!inView) {
            lightStore.set({ strength: PRO_LIGHT.strength * DIM });
            return;
        }
        let frame = 0;
        const started = performance.now();
        const step = (now: number) => {
            const t = Math.min(1, (now - started) / (TIMING.light * 1000));
            const eased = 1 - (1 - t) ** 3;
            lightStore.set({ strength: PRO_LIGHT.strength * (DIM + (1 - DIM) * eased) });
            if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [inView, reduce]);

    return (
        // The section's header, as every section of the page has it, then the card and the list.
        <Section
            description="Get a feel for Continuum in the browser, then take it into your codebase when you’re ready to ship."
            id="pricing"
            title="Pricing"
        >
            <div className="flex flex-col items-center gap-10 md:gap-12">
                {/* The card: the light in it, the offer on the light. */}
                <article
                    aria-labelledby="plan-name"
                    className="relative isolate w-full scroll-mt-24 overflow-hidden rounded-panel border border-neutral-200"
                    ref={card}
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 -z-10 bg-neutral-50"
                        data-light-scope=""
                    >
                        {/* Only without WebGL, the spectrum's blurred strip stands in for the light. */}
                        <div className="absolute inset-x-[12%] -bottom-[28%] in-data-unlit:block hidden h-[45%] rounded-full bg-spectrum opacity-30 blur-[96px]" />
                        <GlassLight
                            className="absolute inset-0"
                            glass={glassRect}
                            margin={0.75}
                            store={lightStore}
                        />
                    </div>
                    <motion.div
                        animate={state}
                        className="flex flex-col items-center px-6 py-20 text-center sm:px-12 md:py-32"
                        custom={TIMING.offer}
                        initial="hidden"
                        variants={arrive}
                    >
                        <h3 className="text-base text-neutral-700" id="plan-name">
                            Continuum
                        </h3>
                        <p className="mt-3 font-medium text-[64px] text-neutral-950 leading-none tracking-[-0.04em] md:text-[96px]">
                            Free
                        </p>
                        <p className="mt-4 text-neutral-700 text-sm">
                            For any product, commercial or not
                        </p>
                        <p className="mt-4 max-w-[520px] text-base text-neutral-800 leading-[1.6]">
                            Bring Continuum into the product you’re building and give your coding
                            agent the same design rules.
                        </p>
                        {/* What it costs is just above, so the action says what comes next. */}
                        <Button
                            className="mt-8"
                            render={props => <a {...props} href={installUrl} />}
                            size="lg"
                        >
                            Start building
                            <ArrowRight strokeWidth={2} />
                        </Button>
                    </motion.div>
                </article>

                {/* What comes with it, on the page under the card, item by item. */}
                <ul
                    aria-label="Included in Continuum"
                    className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {included.map((item, index) => (
                        <motion.li
                            animate={state}
                            className="flex items-start gap-3 rounded-card border border-neutral-200 bg-neutral-50 px-5 py-4 text-base text-neutral-900 leading-6"
                            custom={TIMING.list + index * TIMING.stagger}
                            initial="hidden"
                            key={item}
                            variants={arrive}
                        >
                            {/* A bare check, no box (a box reads as a checkbox), on the first line of the text. */}
                            <span
                                aria-hidden
                                className="flex h-6 shrink-0 items-center text-neutral-500"
                            >
                                <Check className="size-4" strokeWidth={2} />
                            </span>
                            {item === 'library' ? (
                                <Link
                                    className="rounded-chip underline decoration-neutral-400 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-neutral-950 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
                                    href="/components"
                                >
                                    React library: {Object.keys(families).length} families and
                                    charts
                                </Link>
                            ) : (
                                item
                            )}
                        </motion.li>
                    ))}
                </ul>

                {/* The way in without installing: one quiet row under the card, no light, the secondary action. */}
                <Reveal className="w-full">
                    <article
                        aria-labelledby="plan-free"
                        className="flex w-full flex-col gap-6 rounded-panel border border-neutral-200 p-6 sm:p-8 md:flex-row md:items-center md:justify-between"
                    >
                        <div className="flex flex-col gap-2">
                            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span
                                    className="font-medium text-base text-neutral-950"
                                    id="plan-free"
                                >
                                    Free tools
                                </span>
                                <span className="text-neutral-600 text-sm">
                                    In the browser · No account needed
                                </span>
                            </p>
                            <p className="text-base text-neutral-600 leading-[1.6]">
                                Try your theme on real screens in the browser.
                            </p>
                        </div>
                        <Button
                            className="shrink-0"
                            render={props => <a {...props} href="/tools" />}
                            size="lg"
                            variant="secondary"
                        >
                            Explore the tools
                        </Button>
                    </article>
                </Reveal>
            </div>
        </Section>
    );
};
