'use client';

import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing, touchTarget } from './button';
import { CopyButton, type CopyButtonProps } from './copy-button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export type AssistantAnswerProps = Omit<ComponentProps<'article'>, 'title'> & {
    /**
     * Above the answer, what the assistant did to reach it: `Thinking` while it works, then
     * `AssistantAnswerStep`s for what it did ("12 sources used"), one to a line.
     */
    work?: ReactNode;
    /**
     * Under the answer, once it is written: `AssistantAnswerCopy` and `AssistantAnswerAction`s (copy,
     * try again, good, bad). Held back while `pending`, as there is nothing whole yet to act on.
     */
    actions?: ReactNode;
    /** The answer is still being worked out or written: it is busy, and its actions wait. */
    pending?: boolean;
};

/**
 * An assistant's answer to a question: not a message but the page's own content, open in the
 * column with no card, avatar or time, so it can hold what the product shows elsewhere (stat cards,
 * a chart, a table) at the column's full width. From the top: what it did, the answer as blocks 16
 * apart, then what can be done with it. The question before it is one's own `ChatMessage`.
 */
export const AssistantAnswer = ({
    work,
    actions,
    pending = false,
    className,
    children,
    ...props
}: AssistantAnswerProps) => {
    const hasBody = children != null && children !== false && children !== '';

    return (
        <article
            aria-busy={pending || undefined}
            className={cn('flex min-w-0 flex-col gap-4 text-neutral-950 text-xs', className)}
            data-pending={pending || undefined}
            data-slot="assistant-answer"
            {...props}
        >
            {work != null && (
                <div
                    className="flex min-w-0 flex-col items-start gap-2"
                    data-slot="assistant-answer-work"
                >
                    {work}
                </div>
            )}
            {hasBody && (
                <div
                    className={cn(
                        'wrap-break-word flex min-w-0 flex-col gap-4',
                        // Lists written in the answer keep their markers inside the column's text edge.
                        '[&_li+li]:mt-1 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-medium [&_ul]:list-disc [&_ul]:pl-5',
                    )}
                    data-slot="assistant-answer-body"
                >
                    {children}
                </div>
            )}
            {actions != null && !pending && (
                // 8 under the answer, the first icon on the text's edge rather than its square.
                <div
                    className="-mt-2 -ml-1.5 flex items-center gap-0.5"
                    data-slot="assistant-answer-actions"
                >
                    {actions}
                </div>
            )}
        </article>
    );
};

export type AssistantAnswerStepProps = Omit<ComponentProps<'button'>, 'type'> & {
    /** A 16 icon before the words, in `neutral-500`. */
    icon?: ReactNode;
};

/**
 * One thing the assistant did, in its `work`: a 16 icon and the words, 13 `neutral-600`. With an
 * `onClick` it opens what it names (the sources it read) and darkens on hover; without one it is a
 * plain line.
 */
export const AssistantAnswerStep = ({
    icon,
    onClick,
    className,
    children,
    ...props
}: AssistantAnswerStepProps) => {
    const classes = cn(
        'inline-flex min-w-0 max-w-full items-center gap-2 rounded-chip text-neutral-600 text-xs [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-500',
        className,
    );
    const content = (
        <>
            {icon}
            <span className="min-w-0 truncate">{children}</span>
        </>
    );

    return onClick ? (
        <button
            {...props}
            className={cn(
                classes,
                'cursor-pointer transition-colors duration-150 ease-out-strong hover:text-neutral-950 [&_svg]:transition-colors hover:[&_svg]:text-neutral-950',
                focusRing,
            )}
            data-slot="assistant-answer-step"
            onClick={onClick}
            type="button"
        >
            {content}
        </button>
    ) : (
        <p className={classes} data-slot="assistant-answer-step">
            {content}
        </p>
    );
};

export type AssistantAnswerActionProps = Omit<ComponentProps<'button'>, 'type' | 'children'> & {
    /** Its name and tooltip: "Try again", "Good answer". */
    label: string;
    /** The 14 icon. */
    icon: ReactNode;
    /** For a toggle (good, bad): on, it stays dark and says so. */
    pressed?: boolean;
};

/**
 * One action under an answer: a 24 square ghost button with a 14 icon and its name in a tooltip,
 * the size of `AssistantAnswerCopy` so the two sit in one row. A pressed toggle stays `neutral-950`.
 */
export const AssistantAnswerAction = ({
    label,
    icon,
    pressed,
    className,
    ...props
}: AssistantAnswerActionProps) => (
    <Tooltip>
        <TooltipTrigger
            render={
                <button
                    {...props}
                    aria-label={label}
                    aria-pressed={pressed}
                    className={cn(
                        'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-chip text-neutral-600 transition-[background-color,color] duration-150 ease-out-strong hover:bg-neutral-950/5 hover:text-neutral-950 aria-pressed:text-neutral-950 [&_svg]:size-3.5',
                        touchTarget,
                        focusRing,
                        className,
                    )}
                    data-slot="assistant-answer-action"
                    type="button"
                />
            }
        >
            {icon}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
    </Tooltip>
);

export type AssistantAnswerCopyProps = CopyButtonProps;

/**
 * The first action under an answer: copies `text` (the answer's words) and, for 1.5s, crossfades
 * to a tick and says "Copied"; named "Copy answer".
 */
export const AssistantAnswerCopy = ({
    label = 'Copy answer',
    ...props
}: AssistantAnswerCopyProps) => (
    <CopyButton data-slot="assistant-answer-copy" label={label} {...props} />
);
