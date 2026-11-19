'use client';

import { Stage } from '@playground/layout';
import { entries } from '@playground/showcase/entries';
import { type Entry, knobDefaults } from '@playground/showcase/kit';
import { buttonVariants, cn, focusRing, Theme } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { PRODUCT_THEME } from '../theme';
import { KitchenSinkWall } from '../wall';
import { Reveal, Section } from '../web';
import { Included, Inventory, type Kit } from './inventory';

/*
 * The components, first thing after the screen: what is included, to scan (every family and its
 * components by name, then what comes with them); then what it looks like: the whole kit pinned to
 * one board, the best parts each in a card as it renders, two to a row, and every family as a card
 * with its best part drawn (inventory.tsx); then the docs.
 */

/** Where each component family and showcase entry is documented. */
export type ComponentIndex = {
    families: Record<string, string>;
    /** What comes with the components: the MCP server's tools and the skills. */
    kit: Kit;
    /** Each entry's docs page, by its id. */
    hrefs: Record<string, string>;
};

/** Featured previews with a short description of when to use each one. */
const featured = [
    ['command-menu', 'Find actions and jump between pages from the keyboard.'],
    ['menu', 'Keep less common actions out of the main toolbar.'],
    ['popover-item', 'Build selectable rows for menus and pickers.'],
    ['chat-typing', 'Show when someone is typing a reply.'],
    ['uptime-strip', 'Show service outages in a day-by-day timeline.'],
    ['bullet-chart', 'See how far a metric is from its target.'],
    ['donut-chart', 'Show how a total breaks down by category.'],
    ['rose-chart', 'Spot patterns in data that repeats over time.'],
] as const;

/** The charts, set at the tile's top left rather than its middle. */
const charts = new Set<string>(['uptime-strip', 'bullet-chart', 'donut-chart', 'rose-chart']);

const byId = new Map(entries.map(entry => [entry.id, entry]));
const shown = featured.flatMap(([id, description]) => {
    const entry = byId.get(id);
    return entry ? [{ entry, description }] : [];
});

/** A part in a card as it renders, inert, then its name and a line; the whole card opens its page. */
const Card = ({
    entry,
    description,
    href,
}: {
    entry: Entry;
    description: string;
    href: string;
}) => {
    const { name, knobs, Preview } = entry;
    return (
        <div className="group/tile relative flex min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50 transition-[border-color] duration-150 hover:border-neutral-300">
            <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-[calc(var(--radius-panel)-8px)] sm:aspect-video">
                {/* The playground's own stage: it holds the part's popups. The card is its frame. */}
                <Stage
                    className={cn(
                        'size-full min-h-0 rounded-none border-0 bg-neutral-100 p-6',
                        // An open dialog's scrim would darken the tile; the part shows without it.
                        '[&_[data-slot=dialog-overlay]]:hidden',
                        // A chart as it is, set 24px from the top and left, each as wide as the
                        // tile (the donut and the rose cap themselves narrower than the others).
                        charts.has(entry.id) && 'items-start justify-start *:max-w-none',
                    )}
                    inert
                >
                    <Preview knobs={knobDefaults(knobs)} />
                </Stage>
                {/* The hairline over the part, so what runs to the edge runs under a frame. */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[inherit] border border-neutral-200"
                />
            </div>
            <a
                className={cn(
                    // Padded by the formula: a 14 name over a 13 line, a pair (p-4, gap-1).
                    'flex items-start gap-3 rounded-b-panel p-4 after:absolute after:inset-0 after:rounded-panel after:content-[""]',
                    focusRing,
                )}
                href={href}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="font-medium text-neutral-950 text-sm">{name}</h3>
                    <span className="text-pretty text-neutral-600 text-xs">{description}</span>
                </div>
                <ArrowRight
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/tile:translate-x-0.5 group-hover/tile:text-neutral-950"
                    strokeWidth={2}
                />
            </a>
        </div>
    );
};

export const Components = ({ index }: { index: ComponentIndex }) => (
    <Section
        // The wall runs the page's full width; the section clips 100vw's scrollbar sliver.
        className="overflow-x-clip"
        description="A comprehensive collection of components and design foundations, built around a cohesive visual language. Designed to work together, flexible enough to make every project your own."
        gap="md:gap-32"
        id="components"
        title="Everything works better together."
    >
        {/* The wall and the families are the product: they wear its theme, the accent on the action. */}
        <Theme className="flex flex-col gap-12 md:gap-32" mode="dark" theme={PRODUCT_THEME}>
            <div className="grid gap-4 lg:grid-cols-2">
                {shown.map(({ entry, description }) => (
                    <Card
                        description={description}
                        entry={entry}
                        href={index.hrefs[entry.id] ?? '/components'}
                        key={entry.id}
                    />
                ))}
            </div>
            <Inventory families={index.families} />
            {/* Last, everything at once: the whole kit on one board, what it is made of under it as a
                caption, and the way on to the docs. */}
            <div className="flex flex-col gap-8 md:gap-10">
                <Reveal>
                    <KitchenSinkWall />
                </Reveal>
                <Reveal>
                    <Included kit={index.kit} />
                </Reveal>
                <Reveal className="flex justify-center">
                    <a
                        className={buttonVariants({ variant: 'secondary', size: 'lg' })}
                        href="/components"
                    >
                        View component docs
                        <ArrowRight strokeWidth={2} />
                    </a>
                </Reveal>
            </div>
        </Theme>
    </Section>
);
