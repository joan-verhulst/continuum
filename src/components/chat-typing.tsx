'use client';

import { type ComponentProps, type ReactNode, useRef } from 'react';
import { cn } from '../lib/cn';
import { Avatar } from './avatar';

/** Three dots in the text's grey, pulsing one after another; still under reduced motion. */
export const ChatTypingDots = ({
    className,
    ...props
}: Omit<ComponentProps<'span'>, 'children'>) => (
    <span
        aria-hidden
        className={cn('inline-flex h-lh items-center gap-1 align-top text-neutral-600', className)}
        data-slot="chat-typing-dots"
        {...props}
    >
        {[0, 160, 320].map(delay => (
            <span
                className="size-1.5 rounded-full bg-current motion-safe:animate-pulse motion-safe:[animation-duration:1.2s]"
                key={delay}
                style={{ animationDelay: `${delay}ms` }}
            />
        ))}
    </span>
);

export type ChatTypingLabelOptions = {
    /** From this many people on, the line counts them instead of naming them; five by default. */
    many?: number;
};

/**
 * Who is typing, in a line: "Maya is typing", "Maya and Liam are typing", "Maya, Liam and Noor are
 * typing", "Maya, Liam and 2 others are typing", then "5 people are typing". Empty for nobody.
 */
export const chatTypingLabel = (
    names: readonly string[],
    { many = 5 }: ChatTypingLabelOptions = {},
) => {
    const [first, second, third] = names;
    const n = names.length;

    if (n === 0) return '';
    if (n >= many) return `${n} people are typing`;
    if (n === 1) return `${first} is typing`;
    if (n === 2) return `${first} and ${second} are typing`;
    if (n === 3) return `${first}, ${second} and ${third} are typing`;
    return `${first}, ${second} and ${n - 2} others are typing`;
};

const initialsOf = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');

export type ChatTypingProps = Omit<ComponentProps<'div'>, 'children'> & {
    /** Who is typing now, in the order they started; empty, the row fades away. */
    names: readonly string[];
    /**
     * Their avatars before the dots, 24px and round, up to three overlapping, in the same order:
     * `true` draws their initials, or pass the avatars. Left out, the row is the dots alone.
     */
    avatars?: readonly ReactNode[] | boolean;
    /** Replaces the English line: a string, or a function of the names. */
    text?: string | ((names: readonly string[]) => string);
    /** @deprecated Use `text`; `label` means an accessible name elsewhere in the chat parts. */
    label?: string | ((names: readonly string[]) => string);
    /** Shows who is typing after the dots; `false` keeps the line for screen readers only. */
    showLabel?: boolean;
};

/**
 * Who is typing, in a row above the composer: their avatars, overlapping, who it is ("Maya is
 * typing"), then three pulsing dots in a small pill. It belongs in the composer's `typing` slot,
 * which keeps its height whether anyone types or not, so the composer never moves. Keep it rendered
 * and pass the names: it fades in when someone starts and out when they stop. The line is announced
 * once per change, never per dot.
 */
export const ChatTyping = ({
    names,
    avatars,
    text: textProp,
    label: legacyLabel,
    showLabel = true,
    className,
    ...props
}: ChatTypingProps) => {
    const label = textProp ?? legacyLabel;
    const active = names.length > 0;
    // The last people seen typing stay on the line while it folds away, so it never empties mid-fade.
    const kept = useRef(names);
    if (active) kept.current = names;
    const shown = kept.current;

    const text =
        typeof label === 'function'
            ? label(shown)
            : typeof label === 'string'
              ? label
              : chatTypingLabel(shown);
    // Avatars passed in are kept the same way, so a stack built from the names does not vanish mid-fade.
    const keptAvatars = useRef(avatars);
    if (active) keptAvatars.current = avatars;
    const given = keptAvatars.current;
    const faces =
        given === true
            ? shown.map(name => (
                  <Avatar fallback={initialsOf(name)} key={name} shape="round" size={24} />
              ))
            : given || [];

    return (
        <div
            className={cn(
                // It only fades and settles 4px: its slot keeps the height, so nothing around it moves.
                'flex min-w-0 items-center transition-[opacity,translate] duration-200 ease-out-strong motion-reduce:transition-none',
                active ? 'opacity-100' : 'pointer-events-none translate-y-1 opacity-0',
                className,
            )}
            data-slot="chat-typing"
            data-state={active ? 'open' : 'closed'}
            {...props}
        >
            <div aria-hidden className="flex h-6 min-w-0 items-center gap-2">
                {faces.length > 0 && (
                    // Up to three, each over the last by 10 and ringed in a 10% line, not the surface.
                    <div
                        className="flex shrink-0 items-center *:not-first:ml-[-10px] *:border-0 *:ring-1 *:ring-neutral-950/10"
                        data-slot="chat-typing-avatars"
                    >
                        {faces.slice(0, 3)}
                    </div>
                )}
                {showLabel && (
                    <span className="min-w-0 truncate text-neutral-600 text-xs">{text}</span>
                )}
                <span
                    className="inline-flex h-6 shrink-0 items-center rounded-full border border-neutral-200 bg-neutral-50 px-2"
                    data-slot="chat-typing-bubble"
                >
                    {/* Smaller than a pending message's 6 dots 4 apart: 4 dots 2 apart, to fit the 24 pill. */}
                    <ChatTypingDots className="h-auto gap-0.5 *:size-1" />
                </span>
            </div>
            {/* Its own live region, holding only the words: they change when people do, not per dot. */}
            <span aria-atomic aria-live="polite" className="sr-only">
                {active ? text : ''}
            </span>
        </div>
    );
};
