'use client';

import { Stage } from '@playground/layout';
import { entries } from '@playground/showcase/entries';
import { type Entry, knobDefaults } from '@playground/showcase/kit';
import { buttonVariants, cn, focusRing, Theme } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { PRODUCT_THEME } from '../theme';
import { KitchenSinkWall } from '../wall';
import { Reveal, Section } from '../web';

/*
 * The components, first thing after the screen: the whole kit pinned to one board, full width, then
 * a few of its parts, each in a card as it renders, two to a row, and one way on to the rest.
 */

/** The docs' families, as the server reads them: their pages give each card its link. */
export type ComponentIndex = {
    /** The components in components.md, the figure the docs give. */
    total: number;
    groups: {
        name: string;
        slug: string;
        items: { name: string; href: string }[];
    }[];
};

/** The cards, two to a row: four parts, then four charts. */
const featured = [
    'command-menu',
    'menu',
    'popover-item',
    'chat-typing',
    'uptime-strip',
    'bullet-chart',
    'donut-chart',
    'rose-chart',
] as const;

/** The charts, set at the tile's top left rather than its middle. */
const charts = new Set<string>(['uptime-strip', 'bullet-chart', 'donut-chart', 'rose-chart']);

const byId = new Map(entries.map(entry => [entry.id, entry]));
const shown: Entry[] = featured.flatMap(id => byId.get(id) ?? []);

/** A name as letters and digits only, so "Segmented control" meets "SegmentedControl". */
const plain = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/** A part in a card as it renders, inert, then its name and a line; the whole card opens its page. */
const Card = ({ entry, href }: { entry: Entry; href: string }) => {
    const { name, description, knobs, Preview } = entry;
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

export const Components = ({ index }: { index: ComponentIndex }) => {
    // Each card links to its docs page, found by name among the docs' own families.
    const hrefs = new Map(
        index.groups.flatMap(group => group.items.map(item => [plain(item.name), item.href])),
    );
    return (
        <Section
            // The wall runs the page's full width; the section clips 100vw's scrollbar sliver.
            className="overflow-x-clip"
            description="A comprehensive collection of components and design foundations, built around a cohesive visual language. Designed to work together, flexible enough to make every project your own."
            eyebrow={`${index.total} components`}
            gap="md:gap-32"
            id="components"
            title="Everything works better together."
        >
            {/* The wall and the cards are the product: they wear its theme, the accent on the action. */}
            <Theme className="flex flex-col gap-12 md:gap-32" mode="dark" theme={PRODUCT_THEME}>
                <Reveal>
                    <KitchenSinkWall />
                </Reveal>
                <div className="grid gap-4 lg:grid-cols-2">
                    {shown.map(entry => (
                        <Card
                            entry={entry}
                            href={hrefs.get(plain(entry.name)) ?? '/components'}
                            key={entry.id}
                        />
                    ))}
                </div>
                <Reveal className="flex justify-center">
                    <a
                        className={buttonVariants({ variant: 'secondary', size: 'lg' })}
                        href="/components"
                    >
                        Browse all {index.total} components
                        <ArrowRight strokeWidth={2} />
                    </a>
                </Reveal>
            </Theme>
        </Section>
    );
};
