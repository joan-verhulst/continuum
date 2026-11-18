'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { cn } from '../lib/cn';

/*
 * What shows while an assistant thinks or works, in three sizes of wait. All of it moves by opacity
 * and translate alone, so it stays smooth while the page is busy streaming, and every loop slows
 * under reduced motion rather than stop: a still mark would read as stuck, not as thinking.
 */

export const thinkingMarkVariants = cva('inline-grid shrink-0 grid-cols-3', {
    variants: {
        size: {
            // Nine 2 squares 1 apart (8 across), beside 11px type.
            sm: 'gap-px *:size-0.5',
            // Nine 3 squares 1 apart (11 across), beside 13px type.
            md: 'gap-px *:size-[3px]',
        },
    },
    defaultVariants: { size: 'md' },
});

// Each square's diagonal, 0 at the top left to 4 at the bottom right: the wave reaches them in turn.
const squares = Array.from({ length: 9 }, (_, index) => (index % 3) + Math.floor(index / 3));

export type ThinkingMarkProps = Omit<ComponentProps<'span'>, 'children'> &
    VariantProps<typeof thinkingMarkVariants>;

/**
 * Nine small squares in the text colour, in a 3 by 3 grid, with a wave rolling across them from the
 * top left corner to the bottom right: each swells to full and back as it passes (1.4s a wave, 2.8s
 * under reduced motion). Decorative; whatever holds it says what is happening.
 */
export const ThinkingMark = ({ size, className, ...props }: ThinkingMarkProps) => (
    <span
        aria-hidden
        className={cn(
            // The wave's length is set once here and each diagonal starts an eighth of it later.
            '[--think:1.4s] motion-reduce:[--think:2.8s]',
            thinkingMarkVariants({ size }),
            className,
        )}
        data-slot="thinking-mark"
        {...props}
    >
        {squares.map((diagonal, index) => (
            <span
                className="animate-think rounded-[0.5px] bg-current [animation-duration:var(--think)]"
                // biome-ignore lint/suspicious/noArrayIndexKey: the squares are positions.
                key={index}
                // Negative, so the wave is already rolling on the first frame instead of starting dark.
                style={{ animationDelay: `calc(var(--think) * ${diagonal / 8 - 1})` }}
            />
        ))}
    </span>
);

export type ThinkingTextProps = ComponentProps<'span'>;

/**
 * Words that are being worked on: a band of light crosses them, letter by letter, every 2s, from the
 * line's own grey to full ink and back, so the words themselves say the work is going on. Still, in
 * `neutral-600`, under reduced motion.
 */
export const ThinkingText = ({ className, ...props }: ThinkingTextProps) => (
    <span
        className={cn(
            'animate-glint bg-[linear-gradient(90deg,var(--color-neutral-600)_40%,var(--color-neutral-950)_50%,var(--color-neutral-600)_60%)] bg-size-[200%_100%] bg-clip-text text-transparent',
            'motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-neutral-600',
            className,
        )}
        data-slot="thinking-text"
        {...props}
    />
);

export type ThinkingProps = ComponentProps<'output'> &
    VariantProps<typeof thinkingMarkVariants> & {
        /** What it is doing, in a few words; "Thinking" when left out. Announced when it changes. */
        children?: ReactNode;
    };

/**
 * The mark and a few words beside it, in a line ("Thinking", "Searching the docs"): for a short wait
 * with something already on screen to sit beside. A status: its words are read once, and again when
 * they change.
 */
export const Thinking = ({ size, children = 'Thinking', className, ...props }: ThinkingProps) => (
    <output
        aria-atomic
        className={cn(
            'inline-flex min-w-0 items-center text-neutral-600',
            size === 'sm' ? 'gap-1.5 text-xxs' : 'gap-2 text-xs',
            className,
        )}
        data-slot="thinking"
        {...props}
    >
        <ThinkingMark className="text-neutral-950" size={size} />
        <ThinkingText className="min-w-0 truncate">{children}</ThinkingText>
    </output>
);

export type ThinkingCaretProps = Omit<ComponentProps<'span'>, 'children'> & {
    /** Read once when the words start coming; `false` for a message that says it is busy itself. */
    label?: string | false;
};

/**
 * One square at the end of words still coming in, swelling and fading (1.2s each way, 2.4s under
 * reduced motion). It goes after the last word and moves on with the text; take it away when the
 * last word is in.
 */
export const ThinkingCaret = ({ label = 'Writing', className, ...props }: ThinkingCaretProps) => (
    <span className="contents" data-slot="thinking-caret-root">
        <span
            aria-hidden
            className={cn(
                // A 6 square on the baseline, 4 after the last letter: a block, so it never reads as a
                // text caret the reader could type at.
                'ml-1 inline-block size-1.5 animate-breathe rounded-[1px] bg-current align-baseline text-neutral-950 motion-reduce:[animation-duration:2.4s]',
                className,
            )}
            data-slot="thinking-caret"
            {...props}
        />
        {label !== false && <output className="sr-only">{label}</output>}
    </span>
);

/** "42s", "3m 05s", "1h 12m": how long a run has been going, short enough to sit beside its title. */
export const formatThinkingElapsed = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
};

// The time since `from`, every second; nothing until it has mounted, so a server render matches.
const useElapsed = (from: number | Date | undefined) => {
    const start = from instanceof Date ? from.getTime() : from;
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        if (start == null) return;
        setNow(Date.now());
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [start]);

    return start == null || now == null ? null : now - start;
};

export type ThinkingStep = {
    label: ReactNode;
    /** Done, being worked on now, or still to come. */
    state: 'done' | 'active' | 'waiting';
};

export type ThinkingRunProps = Omit<ComponentProps<'div'>, 'title'> & {
    /**
     * The run's steps, when it knows them: listed under the title, the finished ones with a check, the
     * one it is on with the mark and its words lit, the ones to come faint. Takes the place of the
     * step line.
     */
    steps?: ThinkingStep[];
    /** What the run is doing as a whole: "Reconciling March invoices". */
    title: ReactNode;
    /** The step it is on now, in a line: "Reading invoices.csv". Announced as it changes. */
    children?: ReactNode;
    /** When the run began; the time since counts up beside the title, every second. */
    startedAt?: number | Date;
    /** At the end of the row, usually a secondary "Stop" button. */
    action?: ReactNode;
};

/**
 * A run that takes a while (tens of seconds to minutes): a card with the mark, what the run is doing
 * and the step it is on, how long it has been going, and a way to stop it; a light runs along its
 * bottom edge, so it reads as working even while the step stays the same.
 */
export const ThinkingRun = ({
    title,
    children,
    steps,
    startedAt,
    action,
    className,
    ...props
}: ThinkingRunProps) => {
    const elapsed = useElapsed(startedAt);
    const active = steps?.find(step => step.state === 'active');

    return (
        <div
            aria-busy
            className={cn(
                'relative flex min-w-0 flex-col gap-3 rounded-card border border-neutral-200 bg-neutral-50 py-3 pr-3 pl-4',
                className,
            )}
            data-slot="thinking-run"
            {...props}
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex min-w-0 flex-1 gap-3">
                    <span className="flex h-lh w-[11px] shrink-0 items-center text-neutral-950 text-xs">
                        <ThinkingMark />
                    </span>
                    {/* Only the words are live: the clock beside them would be read every second. */}
                    <output aria-atomic className="flex min-w-0 flex-col text-xs">
                        <span className="truncate font-medium text-neutral-950">{title}</span>
                        {steps === undefined && children != null && children !== false && (
                            <ThinkingText className="truncate" data-slot="thinking-run-step">
                                {children}
                            </ThinkingText>
                        )}
                        {active && <span className="sr-only">{active.label}</span>}
                    </output>
                </div>
                {elapsed != null && (
                    <span
                        className="shrink-0 text-neutral-600 text-xxs tabular-nums"
                        data-slot="thinking-run-elapsed"
                    >
                        {formatThinkingElapsed(elapsed)}
                    </span>
                )}
                {action}
            </div>
            {steps && (
                // The steps, under the title and on its text edge: the mark's 11 slot, then 12.
                <ol
                    aria-hidden
                    className="flex flex-col gap-2 pl-[23px] text-xs"
                    data-slot="thinking-run-steps"
                >
                    {steps.map((step, index) => (
                        <li
                            className="flex min-w-0 items-center gap-3"
                            data-state={step.state}
                            // biome-ignore lint/suspicious/noArrayIndexKey: steps are in order.
                            key={index}
                        >
                            <span className="flex w-[11px] shrink-0 justify-center">
                                {step.state === 'done' && (
                                    <Check className="size-3 text-neutral-500" strokeWidth={2.5} />
                                )}
                                {step.state === 'active' && (
                                    <ThinkingMark className="text-neutral-950" size="sm" />
                                )}
                                {step.state === 'waiting' && (
                                    <span className="size-1 rounded-[1px] bg-neutral-300" />
                                )}
                            </span>
                            {step.state === 'active' ? (
                                <ThinkingText className="truncate">{step.label}</ThinkingText>
                            ) : (
                                <span
                                    className={cn(
                                        'truncate',
                                        step.state === 'done'
                                            ? 'text-neutral-600'
                                            : 'text-neutral-400',
                                    )}
                                >
                                    {step.label}
                                </span>
                            )}
                        </li>
                    ))}
                </ol>
            )}
            {/*
             * The light on the bottom hairline: a segment a quarter of the width, soft at both ends,
             * crossing in 2.4s and resting off the edges between passes. Its own clip, a pixel out over
             * the border and on the card's corners, so it runs on the hairline itself and fades round
             * the bend. Under reduced motion it stops crossing and the whole hairline swells instead.
             */}
            <span
                aria-hidden
                className="pointer-events-none absolute -inset-px overflow-hidden rounded-[inherit]"
            >
                <span className="absolute inset-x-0 bottom-0 h-px">
                    <span className="absolute inset-y-0 left-0 w-1/4 animate-sweep bg-linear-to-r from-transparent via-neutral-950 to-transparent motion-reduce:w-full motion-reduce:animate-breathe motion-reduce:via-neutral-400 motion-reduce:[animation-duration:2.4s]" />
                </span>
            </span>
        </div>
    );
};
