'use client';

import {
    Button,
    ColorPicker,
    cn,
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    deltaE,
    HeaderBar,
    HeaderBarActions,
    hexToOklch,
    StatusDot,
    Textarea,
} from 'continuum';
import { Check, ChevronDown, ClipboardPaste, Eye, Palette, Plus, X } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { type ColourSource, capital, hexOf, namesOf, readSource } from './colours';

/*
 * The parts the colour tools share, so a way of working learned in one holds in the next:
 *
 * - SwatchList, the one colour input: each colour a well (the library's ColorPicker; click it to
 *   change the colour) with its name and hex, a cross to remove it, and Add colour at the end.
 * - ToolActions, the row right under a tool's controls where its actions are, the main one last.
 * - ThemeButton and PasteButton, the two ways colours come in from elsewhere: the theme made in the
 *   theme builder, or a list or stylesheet pasted.
 * - ResultFrame, the frame what the tool makes is shown in: a panel with the app preview's own
 *   header bar, saying what it shows, its view settings at the right. Sticky, it stays in view at
 *   the foot of the window while the controls above it are scrolled through.
 */

/** A colour of a tool's set: its hex, and the name it was given (a token's), if any. */
export type Swatch = { hex: string; name?: string };

/** The name each swatch shows: its own, or what its hue is called, no two alike. */
export const swatchNames = (swatches: readonly Swatch[]) => {
    const unnamed = swatches.filter(swatch => !swatch.name);
    const words = namesOf(unnamed.map(swatch => hexToOklch(swatch.hex) ?? { l: 0.5, c: 0, h: 0 }));
    let next = 0;
    return swatches.map(swatch => swatch.name ?? capital(words[next++] ?? ''));
};

/** Colours to add, in turn: the first that is not already close to one in the set. */
const spares = [
    '#e5484d',
    '#f59e0b',
    '#12a594',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#84cc16',
    '#64748b',
    '#0d0d0d',
    '#f8f8f8',
];

const spareFor = (swatches: readonly Swatch[]) => {
    const taken = swatches.flatMap(swatch => {
        const color = hexToOklch(swatch.hex);
        return color ? [color] : [];
    });
    return (
        spares.find(hex => {
            const color = hexToOklch(hex);
            return color && taken.every(other => deltaE(color, other, 'normal') >= 12);
        }) ?? '#64748b'
    );
};

/** The one colour input: a well per colour, its name and hex, remove, and Add colour. */
export const SwatchList = ({
    swatches,
    onChange,
    min = 2,
    max = 12,
    label,
}: {
    swatches: readonly Swatch[];
    onChange: (swatches: Swatch[]) => void;
    min?: number;
    max?: number;
    label?: string;
}) => {
    const names = swatchNames(swatches);
    return (
        <div className="flex min-w-0 flex-col gap-3">
            <p className="text-neutral-600 text-xs">
                {label ? <span className="font-medium text-neutral-950">{label} · </span> : null}
                Click a colour to change it.
            </p>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-3">
                {swatches.map((swatch, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: the colours in order, and they repeat
                    <li className="group/swatch flex min-w-0 items-center gap-2" key={i}>
                        <ColorPicker
                            label={names[i] ?? `Colour ${i + 1}`}
                            onChange={hex =>
                                onChange(
                                    swatches.map((old, j) => (j === i ? { ...old, hex } : old)),
                                )
                            }
                            value={swatch.hex}
                        />
                        <span className="flex min-w-0 flex-col">
                            <span className="truncate text-neutral-950 text-xs">{names[i]}</span>
                            <span className="font-mono text-neutral-600 text-xxs">
                                {swatch.hex}
                            </span>
                        </span>
                        <Button
                            aria-label={`Remove ${names[i]}`}
                            className="pointer-fine:opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover/swatch:opacity-100"
                            disabled={swatches.length <= min}
                            onClick={() => onChange(swatches.filter((_, j) => j !== i))}
                            size="icon-sm"
                            variant="ghost"
                        >
                            <X strokeWidth={2} />
                        </Button>
                    </li>
                ))}
                {swatches.length < max && (
                    <li>
                        <Button
                            onClick={() => onChange([...swatches, { hex: spareFor(swatches) }])}
                            variant="secondary"
                        >
                            <Plus strokeWidth={2} />
                            Add colour
                        </Button>
                    </li>
                )}
            </ul>
        </div>
    );
};

/**
 * A group of a tool: a container with a small label over what it holds, and, where there is more,
 * one "More options" at its foot. What it opens comes in under the group, outside it, so no
 * container is ever put inside another.
 */
export const Group = ({
    label,
    children,
    more,
}: {
    label: string;
    children: ReactNode;
    /** What "More options" opens, under the group. */
    more?: ReactNode;
}) => {
    // Open to start: the page has the room, and the foldout still closes.
    const [open, setOpen] = useState(true);
    return (
        <div className="flex min-w-0 flex-col gap-6">
            <section
                aria-label={label}
                className="flex min-w-0 flex-col rounded-panel border border-neutral-200 bg-neutral-50"
            >
                <h3 className="px-5 pt-4 font-medium text-neutral-600 text-xs">{label}</h3>
                <div className="flex min-w-0 flex-col gap-5 p-5 pt-3">{children}</div>
                {more && (
                    <div className="border-neutral-200 border-t px-2 py-2">
                        <Button
                            aria-expanded={open}
                            onClick={() => setOpen(now => !now)}
                            variant="ghost"
                        >
                            More options
                            <ChevronDown
                                className={cn(
                                    'transition-[rotate] duration-200 ease-out-strong motion-reduce:transition-none',
                                    open && 'rotate-180',
                                )}
                                strokeWidth={2}
                            />
                        </Button>
                    </div>
                )}
            </section>
            {more && open && more}
        </div>
    );
};

/** The row under a tool's controls, where its actions are: a note at the left, the main one last. */
export const ToolActions = ({ note, children }: { note?: ReactNode; children: ReactNode }) => (
    <div className="flex min-h-control flex-wrap items-center justify-end gap-2">
        {note && <p className="mr-auto min-w-0 text-neutral-600 text-xs">{note}</p>}
        {children}
    </div>
);

/**
 * Opens and closes the previews. A toggle, not a link: a preview opens in place under its tool's
 * controls and the page stays where it is. Floating, it is a pill with the shadow of what floats,
 * for a corner of the window.
 */
export const PreviewToggle = ({
    open,
    onOpenChange,
    floating = false,
    controls,
}: {
    /** The id of what it opens. */
    controls?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    floating?: boolean;
}) => (
    <Button
        aria-controls={controls}
        aria-expanded={open}
        className={cn(
            floating && 'shadow-float',
            open && 'border-transparent bg-tint text-tint-fg hover:bg-tint',
        )}
        shape={floating ? 'pill' : 'default'}
        onClick={() => onOpenChange(!open)}
        variant="secondary"
    >
        <Eye strokeWidth={2} />
        Preview
    </Button>
);

/**
 * What a closed preview's checks found, in a word, beside its toggle: how many pairs miss their
 * contrast, or that the chart colours want labels, or that all is clear.
 */
export const ChecksLine = ({ hard, soft }: { hard: number; soft: number }) => (
    <span className="flex min-w-0 items-center gap-2 text-neutral-600 text-xs">
        <StatusDot tone={hard ? 'error' : soft ? 'warning' : 'success'} />
        <span className="truncate">
            {hard
                ? `${hard} contrast ${hard === 1 ? 'issue' : 'issues'}`
                : soft
                  ? 'Chart colours want labels'
                  : 'No contrast issues'}
        </span>
    </span>
);

/** Fills a tool from the theme made in the theme builder, and says so while it does. */
export const ThemeButton = ({ linked, onUse }: { linked: boolean; onUse: () => void }) => (
    <Button aria-pressed={linked} onClick={onUse} variant="secondary">
        {linked ? <Check strokeWidth={2} /> : <Palette strokeWidth={2} />}
        {linked ? 'Using my theme' : 'Use my theme'}
    </Button>
);

/** Colours in from elsewhere: a list in any CSS form, or a stylesheet with --color-* properties. */
export const PasteButton = ({ onPaste }: { onPaste: (source: ColourSource) => void }) => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const source = useMemo(() => readSource(text), [text]);
    return (
        <>
            <Button onClick={() => setOpen(true)} variant="secondary">
                <ClipboardPaste strokeWidth={2} />
                Paste colours
            </Button>
            <Dialog onOpenChange={setOpen} open={open}>
                <DialogContent className="w-[min(480px,calc(100vw-32px))]">
                    <DialogHeader>
                        <DialogTitle>Paste colours</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <DialogDescription>
                            A list in any CSS form (hex, rgb(), hsl(), oklch() or names), or a whole
                            stylesheet such as your app.css: its --color-* properties are read by
                            name.
                        </DialogDescription>
                        <Textarea
                            autoFocus
                            className="h-40 font-mono text-xs"
                            onChange={event => setText(event.target.value)}
                            placeholder={
                                '#f8f8f8, #676767, oklch(62% 0.2 260)\n\nor\n\n--color-primary-500: #3939e5;'
                            }
                            spellCheck={false}
                            value={text}
                        />
                        <p className="text-neutral-600 text-xs">
                            {source.light.length === 0
                                ? 'No colours read yet.'
                                : `${source.light.length} ${source.light.length === 1 ? 'colour' : 'colours'} read${source.named ? ' by name' : ''}.`}
                        </p>
                    </DialogBody>
                    <DialogFooter>
                        <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
                        <Button
                            disabled={source.light.length === 0}
                            onClick={() => {
                                onPaste(source);
                                setOpen(false);
                                setText('');
                            }}
                        >
                            Use these colours
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

/** The frame a tool's result is shown in: the app preview's header bar over the result. */
export const ResultFrame = ({
    title,
    tools,
    sticky = false,
    className,
    children,
    label,
}: {
    /** What the frame shows, at the left of its bar; none for a panel with a bar of its own. */
    title?: ReactNode;
    /** Its view settings, at the right of the bar. */
    tools?: ReactNode;
    /** Stays in view at the foot of the window while the controls above it scroll. */
    sticky?: boolean;
    className?: string;
    children: ReactNode;
    /** Names the frame for a screen reader, when it has no title. */
    label?: string;
}) => (
    <section
        aria-label={label ?? (typeof title === 'string' ? title : undefined)}
        className={cn(
            'flex min-w-0 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50',
            sticky && 'sticky bottom-4 z-10 shadow-float',
            className,
        )}
    >
        {title !== undefined && (
            <HeaderBar sidebarToggle={false}>
                <span className="min-w-0 truncate text-neutral-600">{title}</span>
                {tools && <HeaderBarActions>{tools}</HeaderBarActions>}
            </HeaderBar>
        )}
        {children}
    </section>
);

/** Colours a source gives, as swatches: by their own names where it named them. */
export const swatchesOf = (source: ColourSource, max: number): Swatch[] =>
    source.light.slice(0, max).map(colour => ({
        hex: hexOf(colour.color),
        name: source.named ? colour.name : undefined,
    }));
