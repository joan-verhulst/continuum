'use client';

import { Stage } from '@playground/layout';
import { entries } from '@playground/showcase/entries';
import { type Entry, knobDefaults } from '@playground/showcase/kit';
import { buttonVariants, cn, focusRing } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { useInView } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { KitchenSinkWall } from '../wall';
import { Reveal, Section } from '../web';

/*
 * The components, first thing after the screen: the whole kit pinned to one board, full width, then
 * a grid of cards to scan, each a component live in an even tile with its name and a line, and one
 * way on to the rest.
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

/** The cards, picked so the rows read as a product's parts: inputs, figures, feedback, navigation. */
const featured = [
    'select',
    'date-picker',
    'command-menu',
    'stat-card',
    'area-chart',
    'segmented',
    'bar-list',
    'tabs',
    'chat-composer',
    'combobox',
    'badge',
    'switch',
] as const;

/**
 * Previews too big for a tile even scaled with it: drawn smaller still, pinned to the top left and
 * left to run off the tile's right and foot, so they read as a crop of something larger.
 */
const cropped = new Set<string>(['area-chart']);

const byId = new Map(entries.map(entry => [entry.id, entry]));
const shown: Entry[] = featured.flatMap(id => byId.get(id) ?? []);

/** A name as letters and digits only, so "Segmented control" meets "SegmentedControl". */
const plain = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/** The stage every preview is drawn on, in px; the card scales it to its own width. */
const STAGE = { width: 400, height: 260 };

/** Scales a box drawn at STAGE's size to the width it is given, keeping its proportions. */
const ScaledStage = ({ children }: { children: ReactNode }) => {
    const box = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    useEffect(() => {
        const node = box.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => {
            if (entry) setScale(entry.contentRect.width / STAGE.width);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    return (
        <div
            className="relative w-full overflow-hidden"
            ref={box}
            style={{ aspectRatio: `${STAGE.width} / ${STAGE.height}` }}
        >
            <div
                className="absolute top-0 left-0 origin-top-left"
                style={{ width: STAGE.width, height: STAGE.height, transform: `scale(${scale})` }}
            >
                {children}
            </div>
        </div>
    );
};

/**
 * A component, live: its preview on the canvas inset in the card, then its name and a line. The
 * stage is inert, so the preview draws itself as a picture, and the whole card opens its page.
 */
const Card = ({ entry, href, index }: { entry: Entry; href: string; index: number }) => {
    const { id, name, description, stageClassName, knobs, Preview } = entry;
    // A preview mounts once its card is mostly on screen: the open ones (the select, the command
    // menu) scroll their chosen row into view as they mount, which would otherwise move the page.
    const tile = useRef<HTMLDivElement>(null);
    const seen = useInView(tile, { once: true, amount: 0.6 });
    return (
        <Reveal
            className="group/tile relative flex min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50 transition-[border-color] duration-150 hover:border-neutral-300"
            delay={index % 3}
        >
            <div
                className="m-2 mb-0 overflow-hidden rounded-[calc(var(--radius-panel)-8px)] bg-neutral-100"
                ref={tile}
            >
                <ScaledStage>
                    <Stage
                        className={cn(
                            'size-full min-h-0 overflow-hidden bg-neutral-100 p-6',
                            stageClassName,
                        )}
                        inert
                    >
                        {seen &&
                            (cropped.has(id) ? (
                                <div className="absolute top-6 left-6 w-[560px] origin-top-left scale-[0.8]">
                                    <Preview knobs={knobDefaults(knobs)} />
                                </div>
                            ) : (
                                <Preview knobs={knobDefaults(knobs)} />
                            ))}
                    </Stage>
                </ScaledStage>
            </div>
            <a
                className={cn(
                    'flex items-start gap-3 rounded-b-panel px-4 pt-3 pb-4 after:absolute after:inset-0 after:rounded-panel after:content-[""]',
                    focusRing,
                )}
                href={href}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="font-medium text-neutral-950 text-sm">{name}</h3>
                    <span className="line-clamp-2 min-h-8 text-pretty text-neutral-600 text-xs">
                        {description}
                    </span>
                </div>
                <ArrowRight
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/tile:translate-x-0.5 group-hover/tile:text-neutral-950"
                    strokeWidth={2}
                />
            </a>
        </Reveal>
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
            id="components"
            title="Everything works better together."
        >
            <div className="flex flex-col gap-12 md:gap-32">
                <Reveal>
                    <KitchenSinkWall />
                </Reveal>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {shown.map((entry, position) => (
                        <Card
                            entry={entry}
                            href={hrefs.get(plain(entry.name)) ?? '/components'}
                            index={position}
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
            </div>
        </Section>
    );
};
