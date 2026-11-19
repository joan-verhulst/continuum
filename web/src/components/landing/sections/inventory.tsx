'use client';

import { Stage } from '@playground/layout';
import { entries } from '@playground/showcase/entries';
import { type Category, categories, knobDefaults, knobStates } from '@playground/showcase/kit';
import { cn, focusRing } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Reveal } from '../web';

/** The counts the server reads; the states are counted here, from the entries' knobs. */
export type InventoryTotals = {
    /** Parts and charts together. */
    components: number;
    charts: number;
    tools: number;
    skills: number;
};

const count = new Intl.NumberFormat('en');

/** The components: the showcase's parts and charts, without the interaction patterns. */
const parts = entries.filter(entry => entry.category !== 'interaction');

const byId = new Map(parts.map(entry => [entry.id, entry]));

/** What a family's card draws: its one part, and how much smaller (or larger) than life. */
type Drawing = {
    id: string;
    /** Knobs set other than their defaults, so the part shows at its best at this size. */
    knobs?: Record<string, string | boolean>;
    /** Other than SCALE: smaller for a part that needs the room, larger for a small one. */
    scale?: number;
    /** Classes for the stage, such as letting a chart run its full width. */
    stage?: string;
    /**
     * A stage of this size (in px, before scaling) rather than one as large as the well: for a part
     * that fits itself to the room it is given (a dialog, a table), so it is drawn at its own size and
     * the well crops it, instead of squeezing to fit. Centred in the well, or from its top left.
     */
    room?: { width: number; height: number; from?: 'centre' | 'start' };
};

/**
 * The one part each family's card draws, picked by eye from the family as drawn: the part that is
 * whole on its own, reads at a thumbnail's size and says what the family is for.
 */
const drawn: Partial<Record<Category, Drawing>> = {
    // Framed, and without the shortcut keys, which crowd the rows' ends at this size.
    frame: {
        id: 'sidebar',
        scale: 0.75,
        stage: 'items-start pt-4',
        knobs: { border: true, shortcuts: false },
    },
    navigation: { id: 'command-menu' },
    actions: { id: 'toolbar' },
    inputs: { id: 'drop-zone' },
    forms: { id: 'option-row', scale: 0.9 },
    filtering: { id: 'filter-menu' },
    // At its own 420 wide, on a stage roomier than the card, so it never narrows to fit.
    overlays: { id: 'dialog', scale: 0.75, room: { width: 560, height: 440 } },
    // At its fullest (every bar, column, fold and the footer) and its own width, from the top left
    // so its bar shows first; the card crops the rest.
    content: {
        id: 'table',
        scale: 0.7,
        room: { width: 1040, height: 520, from: 'start' },
        stage: 'items-start justify-start p-6',
        knobs: {
            search: true,
            select: true,
            conditions: true,
            sorting: true,
            copy: true,
            editable: true,
            fold: 'lines',
            selection: true,
            footer: true,
        },
    },
    // A small part drawn large, so it is the subject of its card rather than a dot in it.
    labels: { id: 'avatar', scale: 2.4 },
    status: { id: 'checklist', scale: 0.7 },
    messages: { id: 'alert', scale: 0.7 },
    // At its own size, never stretched to the card: set at the top left and cropped by the well.
    charts: { id: 'area-chart', stage: 'items-start justify-start p-6 *:max-w-none *:shrink-0' },
    ai: { id: 'chat-typing' },
};

const descriptions: Partial<Record<Category, string>> = {
    frame: 'Give each page a consistent home in your app.',
    navigation: 'Help people find their way around and jump between views.',
    actions: 'Keep the main action easy to spot.',
    inputs: 'Collect everything from a date to an uploaded file.',
    forms: 'Give settings a layout people can scan.',
    filtering: 'Help users narrow down a long list.',
    overlays: 'Open a form or a quick action in place.',
    content: 'Make dense records easier to read and compare.',
    labels: 'Show who owns an item or where it stands.',
    status: 'Show what’s in progress and what’s left.',
    messages: 'Explain what happened and what to do next.',
    charts: 'Show trends and comparisons in your own theme.',
    ai: 'Build conversations into your app.',
};

/** The families whose card takes two columns on wide screens, for what they draw needs the room. */
const wide: Partial<Record<Category, string>> = {
    content: 'lg:col-span-2',
    charts: 'sm:col-span-2',
};

/** Each family in the playground's order, its parts and the states they show. */
const families = categories
    .map(category => {
        const items = parts.filter(entry => entry.category === category.id);
        return {
            id: category.id,
            label: category.label,
            components: items.length,
            states: items.reduce((sum, entry) => sum + knobStates(entry.knobs), 0),
            drawing: drawn[category.id] ?? { id: items[0]?.id ?? '' },
            description: descriptions[category.id],
            names: items.map(entry => entry.name),
        };
    })
    .filter(family => family.components > 0);

const states = families.reduce((sum, family) => sum + family.states, 0);

/** What a thumbnail draws at: the parts a step smaller than life, so a family fits its card. */
const SCALE = 0.8;

/**
 * A family's part, live and inert, on a stage as large as the well at SCALE, drawn down to it.
 * Mounted once the card is mostly in view: an open part (a select's list) scrolls its chosen row
 * into view as it mounts, which would move the page were it off screen.
 */
const Thumbnail = ({ drawing }: { drawing: Drawing }) => {
    const one = byId.get(drawing.id);
    const scale = drawing.scale ?? SCALE;
    const box = useRef<HTMLDivElement>(null);
    const seen = useInView(box, { once: true, amount: 0.5 });
    const [size, setSize] = useState<{ width: number; height: number }>();
    useEffect(() => {
        const node = box.current;
        if (!node) return;
        const observer = new ResizeObserver(([item]) => {
            if (item) setSize({ width: item.contentRect.width, height: item.contentRect.height });
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    return (
        <div className="relative size-full overflow-hidden" ref={box}>
            {seen && size && (
                <div
                    className="absolute top-0 left-0 origin-top-left"
                    style={
                        drawing.room
                            ? {
                                  width: drawing.room.width,
                                  height: drawing.room.height,
                                  transform: `translate(${
                                      drawing.room.from === 'start'
                                          ? 0
                                          : (size.width - drawing.room.width * scale) / 2
                                  }px, ${
                                      drawing.room.from === 'start'
                                          ? 0
                                          : (size.height - drawing.room.height * scale) / 2
                                  }px) scale(${scale})`,
                              }
                            : {
                                  width: size.width / scale,
                                  height: size.height / scale,
                                  transform: `scale(${scale})`,
                              }
                    }
                >
                    <Stage
                        className={cn(
                            'size-full min-h-0 rounded-none border-0 bg-neutral-100 p-8',
                            // An open dialog's scrim would darken the tile; the part shows without it.
                            '[&_[data-slot=dialog-overlay]]:hidden',
                            one?.stageClassName,
                            drawing.stage,
                        )}
                        inert
                    >
                        {one && (
                            <one.Preview knobs={{ ...knobDefaults(one.knobs), ...drawing.knobs }} />
                        )}
                    </Stage>
                </div>
            )}
        </div>
    );
};

/** A family as a card: its best part drawn, its name, what it does for a product, its counts. */
const FamilyCard = ({ family, href }: { family: (typeof families)[number]; href: string }) => (
    <div
        className={cn(
            'group/tile relative flex min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50 transition-[border-color] duration-150 hover:border-neutral-300',
            wide[family.id],
        )}
    >
        <div className="relative m-2 mb-0 h-52 overflow-hidden rounded-[calc(var(--radius-panel)-8px)] bg-neutral-100">
            <Thumbnail drawing={family.drawing} />
            {/* The hairline over the parts, so what runs to the edge runs under a frame. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[inherit] border border-neutral-200"
            />
        </div>
        <a
            className={cn(
                // Padded as the cards above: a 14 name over a 13 line, a pair (p-4, gap-1).
                'flex items-start gap-3 rounded-b-panel p-4 after:absolute after:inset-0 after:rounded-panel after:content-[""]',
                focusRing,
            )}
            href={href}
        >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h4 className="font-medium text-neutral-950 text-sm">{family.label}</h4>
                {family.description && (
                    <p className="text-pretty text-neutral-600 text-sm">{family.description}</p>
                )}
            </div>
            <ArrowRight
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/tile:translate-x-0.5 group-hover/tile:text-neutral-950"
                strokeWidth={2}
            />
        </a>
    </div>
);

export const Inventory = ({ families: hrefs }: { families: Record<string, string> }) => (
    <div className="flex flex-col gap-12 md:gap-16" data-inventory>
        <Reveal className="mx-auto flex max-w-160 flex-col items-center gap-4 text-center">
            <h3 className="text-balance font-medium text-3xl text-neutral-950 leading-[1.1] tracking-[-0.02em] md:text-4xl">
                Find the pieces for your next screen
            </h3>
        </Reveal>
        <div className="grid grid-flow-row-dense gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {families.map(family => (
                <FamilyCard
                    family={family}
                    href={hrefs[family.label] ?? '/components'}
                    key={family.id}
                />
            ))}
        </div>
    </div>
);

/** What comes with the components, as the server reads it: the MCP server's tools, the skills. */
export type Kit = { tools: number; skills: string[] };

/** How many components a family holds, by its id, as the entries count them. */
const sizeOf = (id: Category) => families.find(family => family.id === id)?.components ?? 0;

/**
 * What you get, in one line: the parts people know by name, each with its family's count, and that
 * they are ready in React.
 */
export const Included = (_props: { kit: Kit }) => (
    // A plain line at the lead's size: a fact, not a headline. Only the figures a step brighter.
    <p
        className="mx-auto max-w-160 text-pretty text-center text-base text-neutral-600 leading-[1.6] md:text-lg"
        data-included
    >
        <Count value={families.reduce((sum, family) => sum + family.components, 0)} /> React
        components, including <Count value={sizeOf('content')} /> for tables and content,{' '}
        <Count value={sizeOf('navigation')} /> for navigation, <Count value={sizeOf('ai')} /> for
        chat and <Count value={sizeOf('charts')} /> charts.
    </p>
);

/** A figure in the line, a step brighter than the words around it. */
const Count = ({ value }: { value: number }) => (
    <span className="text-neutral-950 tabular-nums">{value}</span>
);

/** The totals in a line, for a page's eyebrow: components, charts and states. */
export const InventoryCount = ({ totals }: { totals: InventoryTotals }) => (
    <>
        {totals.components} components · {totals.charts} charts · {count.format(states)} states
    </>
);
