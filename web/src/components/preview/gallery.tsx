'use client';

import { Stage } from '@playground/layout';
import { entries } from '@playground/showcase/entries';
import { type Entry, knobDefaults } from '@playground/showcase/kit';
import { cn, focusRing } from 'continuum';
import { ArrowRight } from 'lucide-react';
import { useInView } from 'motion/react';
import Link from 'next/link';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { DefaultTheme } from '@/components/default-theme';
import { Reveal } from '@/components/landing/web';

/*
 * Every component, live: each a card with its own preview from the playground, drawn at its
 * defaults on a stage and scaled to the card, then its name and one line, the whole card its page.
 * The cards are even: a preview is drawn on a stage of one shape whatever it is, wider for the
 * parts that need the room (a table, a chart, a bar across an app), and scaled down to the card's
 * width, so a segmented control and a candlestick chart sit alike and nothing spills. Popups open
 * inside the stage, so an open menu scales with it. The stage is inert: a picture, not a control.
 */

export type GalleryItem = {
    href: string;
    name: string;
    summary: string;
    /** The showcase entry that draws it; a part without one shows its name instead. */
    entry?: string;
};

const byId = new Map(entries.map(entry => [entry.id, entry]));

/**
 * The stage's shape, the width it is first drawn at for each span the playground gives a part (a
 * card's well is about 340 wide, so a small part is drawn near its own size), and the widest it may
 * grow to fit what it shows.
 */
const RATIO = 10 / 16;
const DRAWN: Record<1 | 2 | 3, number> = { 1: 360, 2: 560, 3: 680 };
const WIDEST: Record<1 | 2 | 3, number> = { 1: 560, 2: 680, 3: 760 };
/** The room kept round what a stage shows when it grows to fit it. */
const ROOM = 24;

/** Scales a box drawn `width` wide (at the stage's shape) to the width it is given. */
export const Scaled = ({
    width,
    children,
    inner,
}: {
    width: number;
    children: ReactNode;
    inner?: React.Ref<HTMLDivElement>;
}) => {
    const box = useRef<HTMLDivElement>(null);
    const [room, setRoom] = useState(0);
    useEffect(() => {
        const node = box.current;
        if (!node) return;
        const observer = new ResizeObserver(([item]) => {
            if (item) setRoom(item.contentRect.width);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    return (
        <div className="relative size-full overflow-hidden" ref={box}>
            {room > 0 && (
                <div
                    className="absolute top-0 left-0 origin-top-left"
                    ref={inner}
                    style={{
                        width,
                        height: Math.round(width * RATIO),
                        transform: `scale(${room / width})`,
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

/**
 * How big the stage must be drawn to hold what it shows: the preview and any popup open in it (an
 * open select's list, a dialog), in the stage's own pixels. A layer that spans the stage (a scrim,
 * a sheet's full height) says nothing about that side, so it is left out of it.
 */
const needed = (stage: HTMLElement) => {
    const box = stage.getBoundingClientRect();
    const scale = box.width / stage.offsetWidth;
    if (!scale) return undefined;
    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;
    const parts = [...stage.children, ...stage.querySelectorAll('[data-side]')];
    for (const part of parts) {
        const rect = part.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        // A layer laid exactly over the stage (a scrim, a sheet's full height) spans it on that side.
        const spansAcross =
            Math.abs(rect.left - box.left) < 2 && Math.abs(rect.right - box.right) < 2;
        const spansDown =
            Math.abs(rect.top - box.top) < 2 && Math.abs(rect.bottom - box.bottom) < 2;
        if (!spansAcross) {
            left = Math.min(left, rect.left);
            right = Math.max(right, rect.right);
        }
        if (!spansDown) {
            top = Math.min(top, rect.top);
            bottom = Math.max(bottom, rect.bottom);
        }
    }
    const width = right > left ? (right - left) / scale + 2 * ROOM : 0;
    const height = bottom > top ? (bottom - top) / scale + 2 * ROOM : 0;
    return { width, height };
};

/** A part with no preview of its own: its name, set large on the canvas. */
const NameOnly = ({ name }: { name: string }) => (
    <div className="flex size-full items-center justify-center p-6">
        <span className="font-mono text-neutral-500 text-sm">{`<${name.replace(/\s+/g, '')} />`}</span>
    </div>
);

/**
 * A preview on its stage, scaled to the card. The stage starts at its span's width and grows (at
 * its shape, never past WIDEST) until the preview and its open popups fit with room round them;
 * what still does not fit is cropped as the playground's own tiles crop it.
 */
export const Preview = ({
    entry,
}: {
    /** What draws it: a showcase entry, or anything with a preview and its knobs (a foundation's stage). */
    entry: Pick<Entry, 'Preview' | 'knobs' | 'span' | 'stageClassName'>;
}) => {
    const { Preview: Draw, knobs, stageClassName, span } = entry;
    const base = DRAWN[span ?? 1];
    const widest = WIDEST[span ?? 1];
    const [width, setWidth] = useState(base);
    const inner = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let tries = 0;
        let timer: ReturnType<typeof setTimeout>;
        // Popups place themselves a frame or two after they mount, and move when the stage grows,
        // so the stage is measured a few times, only ever growing.
        const measure = () => {
            const stage = inner.current?.querySelector<HTMLElement>('[data-gallery-stage]');
            const need = stage && needed(stage);
            if (need) {
                const fit = Math.max(need.width, need.height / RATIO);
                setWidth(current => Math.min(widest, Math.max(current, Math.ceil(fit))));
            }
            tries += 1;
            if (tries < 4) timer = setTimeout(measure, 140);
        };
        timer = setTimeout(measure, 80);
        return () => clearTimeout(timer);
    }, [widest]);
    return (
        <Scaled inner={inner} width={width}>
            <DefaultTheme className="size-full">
                <Stage
                    className={cn(
                        'size-full min-h-0 rounded-none border-0 bg-neutral-100 p-8',
                        stageClassName,
                    )}
                    data-gallery-stage=""
                    inert
                >
                    <Draw knobs={knobDefaults(knobs)} />
                </Stage>
            </DefaultTheme>
        </Scaled>
    );
};

const Tile = ({ item, index }: { item: GalleryItem; index: number }) => {
    const entry = item.entry ? byId.get(item.entry) : undefined;
    // A preview mounts once its card is mostly on screen: the open ones (a select, the command menu)
    // scroll their chosen row into view as they mount, which would move the page if it were off it.
    const well = useRef<HTMLDivElement>(null);
    const seen = useInView(well, { once: true, amount: 0.6 });
    return (
        <li className="flex min-w-0">
            <Reveal
                className="group/tile relative flex w-full min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50 transition-[border-color] duration-150 hover:border-neutral-300"
                delay={index % 3}
            >
                <div
                    className="m-2 mb-0 aspect-[16/10] overflow-hidden rounded-[calc(var(--radius-panel)-8px)] bg-neutral-100"
                    ref={well}
                >
                    {entry ? seen && <Preview entry={entry} /> : <NameOnly name={item.name} />}
                </div>
                <Link
                    className={cn(
                        'flex items-start gap-3 rounded-b-panel px-4 pt-3 pb-4 after:absolute after:inset-0 after:rounded-panel after:content-[""]',
                        focusRing,
                    )}
                    href={item.href}
                >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="font-medium text-base text-neutral-950 leading-snug">
                            {item.name}
                        </span>
                        <span className="line-clamp-2 text-pretty text-neutral-600 text-sm leading-[1.55]">
                            {item.summary}
                        </span>
                    </span>
                    <ArrowRight
                        aria-hidden
                        className="mt-1 size-4 shrink-0 text-neutral-400 transition-[color,translate] duration-150 group-hover/tile:translate-x-0.5 group-hover/tile:text-neutral-950"
                        strokeWidth={2}
                    />
                </Link>
            </Reveal>
        </li>
    );
};

/** A family's parts as live cards, three across from lg, two from sm. */
export const PreviewGrid = ({
    items,
    columns = 3,
    className,
}: {
    items: readonly GalleryItem[];
    /** Three across on the gallery; two in a docs page's reading column. */
    columns?: 2 | 3;
    className?: string;
}) => (
    <ul
        className={cn(
            'grid grid-cols-1 gap-4 sm:grid-cols-2',
            columns === 3 && 'lg:grid-cols-3',
            className,
        )}
    >
        {items.map((item, index) => (
            <Tile index={index} item={item} key={item.href} />
        ))}
    </ul>
);
