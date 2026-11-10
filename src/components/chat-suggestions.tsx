'use client';

import { type ComponentProps, type ReactNode, useContext, useId, useState } from 'react';
import { cn } from '../lib/cn';
import { hasContent, SuggestionsContext } from './chat-shared';
import { PopoverItem, type PopoverItemProps } from './popover-item';

export type ChatTriggerMatch = {
    /** The character that started it: "#", "@". */
    trigger: string;
    /** What follows the trigger up to the caret: "a" for "#a". */
    query: string;
    /** Where the trigger stands in the text. */
    start: number;
    /** Where the query ends: the caret. */
    end: number;
};

const blank = /\s/;

/**
 * The reference being typed: the last `trigger` before the caret, at the start of the text or after
 * a space, followed by no space. "Also, I noticed #a" gives `{ query: 'a', start: 16, end: 18 }`;
 * "a#b" and "#a b" give nothing.
 */
export const findChatTrigger = (
    text: string,
    caret: number = text.length,
    trigger = '#',
): ChatTriggerMatch | null => {
    const before = text.slice(0, caret);
    const start = before.lastIndexOf(trigger);

    if (start === -1) return null;
    if (start > 0 && !blank.test(before.charAt(start - 1))) return null;
    const query = before.slice(start + trigger.length);
    if (blank.test(query)) return null;
    return { trigger, query, start, end: caret };
};

export type UseChatTriggerOptions = {
    /** The character that opens the suggestions; "#" by default. */
    trigger?: string;
    /** Where the caret is; the end of the text by default. */
    caret?: number;
};

/**
 * Watches the composer's draft for a reference being typed after `trigger` ("#a", "@ma"). `open`
 * is whether to show the suggestions, `query` what to filter them by, `insert(token)` the draft with
 * the typed reference replaced by the picked one and a space, and `dismiss` closes them (Escape)
 * until a new trigger is typed.
 */
export const useChatTrigger = (
    value: string,
    { trigger = '#', caret }: UseChatTriggerOptions = {},
) => {
    const match = findChatTrigger(value, caret, trigger);
    const [dismissed, setDismissed] = useState<number | null>(null);

    // A dismissal holds for the trigger it closed; once that one is gone, the next opens again.
    if (dismissed !== null && match?.start !== dismissed) setDismissed(null);

    const open = match != null && match.start !== dismissed;

    return {
        open,
        match: open ? match : null,
        query: open ? match.query : '',
        dismiss: () => {
            if (match) setDismissed(match.start);
        },
        insert: (token: string) => {
            if (!match) return value;
            const rest = value.slice(match.end).replace(/^\s+/, '');
            return `${value.slice(0, match.start)}${token} ${rest}`;
        },
    };
};

export type ChatSuggestionsProps = ComponentProps<'div'> & {
    /** Heads the list: "Recent applications". Also the list's accessible name. */
    title?: ReactNode;
    /** Shown in place of the rows while there are none: "No applications match". */
    empty?: ReactNode;
};

/**
 * The records a reference being typed could mean, in the composer's `suggestions` slot: a card the
 * box's width just above it, a title, then the rows. The composer's arrows move through them and
 * Enter picks one, while the caret stays in the text.
 */
export const ChatSuggestions = ({
    title,
    empty,
    className,
    children,
    ...props
}: ChatSuggestionsProps) => {
    const context = useContext(SuggestionsContext);
    const titleId = useId();
    const hasRows = hasContent(children);

    return (
        <div
            className={cn(
                // The box's corner and width, so the two read as one shape stacked at every corner
                // scale; it rises 4 as it opens.
                'flex flex-col gap-1 rounded-[min(calc(var(--radius-item)+4px),calc(var(--radius-item)*100))] border border-neutral-200 bg-neutral-50 p-1 shadow-float',
                'starting:translate-y-1 starting:opacity-0 transition-[opacity,translate] duration-150 ease-out-strong motion-reduce:transition-none',
                className,
            )}
            data-slot="chat-suggestions"
            {...props}
        >
            {title != null && (
                <div
                    className="px-3 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs"
                    data-slot="chat-suggestions-title"
                    id={titleId}
                >
                    {title}
                </div>
            )}
            <div
                aria-labelledby={title != null ? titleId : undefined}
                className="flex max-h-60 flex-col gap-1 overflow-y-auto"
                data-slot="chat-suggestions-list"
                id={context?.listId}
                role="listbox"
            >
                {hasRows ? (
                    children
                ) : (
                    <div className="px-3 py-2.5 text-neutral-600 text-xs" role="presentation">
                        {empty ?? 'Nothing matches'}
                    </div>
                )}
            </div>
        </div>
    );
};

export type ChatSuggestionProps = Omit<PopoverItemProps, 'render' | 'onSelect'> & {
    /** Picks it, by Enter in the composer or a click: insert the reference, link the record. */
    onSelect: () => void;
    disabled?: boolean;
};

/**
 * One row of `ChatSuggestions`, a popup row: a 16 icon in `leading`, the label, a quieter `meta`.
 * The composer's active one takes the hover wash.
 */
export const ChatSuggestion = ({
    onSelect,
    disabled = false,
    id: idProp,
    className,
    ...props
}: ChatSuggestionProps) => {
    const context = useContext(SuggestionsContext);
    const autoId = useId();
    const id = idProp ?? autoId;
    const active = context?.activeId === id;

    return (
        <PopoverItem
            aria-disabled={disabled || undefined}
            aria-selected={active}
            // Concentric inside the panel: its corner (the item's and 4) less its 4 inset and 1 hairline.
            className={cn('rounded-[max(0px,calc(var(--radius-item)-1px))]', className)}
            data-disabled={disabled ? '' : undefined}
            data-highlighted={active ? '' : undefined}
            data-slot="chat-suggestion"
            id={id}
            // The caret stays in the text: a press on a row must not take focus from it.
            onClick={() => {
                if (!disabled) onSelect();
            }}
            onMouseDown={event => event.preventDefault()}
            onMouseMove={() => {
                if (!active && !disabled) context?.setActiveId(id);
            }}
            role="option"
            {...props}
        />
    );
};
