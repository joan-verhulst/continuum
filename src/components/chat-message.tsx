'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check, CheckCheck, CircleAlert, Clock } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { ChatTypingDots } from './chat-typing';

// Both variants share one layout: a header row across the top, then two columns side by side, the words
// and the time with its tick at the foot of the second, 8 apart, 12 from the right and 10 from the
// bottom, so the words never run under it however long they get. 16 round the content.
export const chatMessageVariants = cva(
    'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-2 rounded-card py-4 pr-3 pl-4 text-neutral-950',
    {
        variants: {
            variant: {
                // The current user's words sit on the theme's tint, at the right and at most two thirds of
                // the thread wide.
                own: 'ml-auto w-fit max-w-2/3 bg-tint',
                // Agents and bots read as a card on the surface, told apart by the hairline alone.
                other: 'border border-neutral-200 bg-neutral-50',
            },
        },
        defaultVariants: {
            variant: 'other',
        },
    },
);

export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

const statuses = {
    sending: { label: 'Sending', glyph: 'clock', className: 'text-neutral-500' },
    sent: { label: 'Sent', glyph: 'tick', className: 'text-neutral-500' },
    delivered: { label: 'Delivered', glyph: 'ticks', className: 'text-neutral-500' },
    // Read is the same double tick, darkened: a quiet change, not a second accent colour.
    read: { label: 'Read', glyph: 'ticks', className: 'text-neutral-950' },
    failed: { label: 'Not sent', glyph: 'alert', className: 'text-error-500' },
} as const;

const glyphs = [
    { id: 'clock', icon: Clock },
    { id: 'tick', icon: Check },
    { id: 'ticks', icon: CheckCheck },
    { id: 'alert', icon: CircleAlert },
] as const;

/**
 * The delivery tick. Every glyph sits stacked in one cell and only the current one shows, so a
 * change of state crossfades (and settles from 80%) instead of snapping; read darkens in place.
 */
const ChatStatusIcon = ({ status, labelled }: { status: ChatMessageStatus; labelled: boolean }) => {
    const state = statuses[status];
    const className = cn(
        'grid place-items-center transition-colors duration-150 *:col-start-1 *:row-start-1 *:transition-[opacity,scale] *:duration-200 *:ease-out-strong motion-reduce:transition-none motion-reduce:*:transition-none',
        state.className,
    );
    const icons = glyphs.map(({ id, icon: Icon }) => (
        <Icon
            aria-hidden
            className={cn('size-3', id !== state.glyph && 'scale-[0.8] opacity-0')}
            key={id}
            strokeWidth={2}
        />
    ));

    return labelled ? (
        <span
            aria-label={state.label}
            className={className}
            data-slot="chat-message-status"
            role="img"
        >
            {icons}
        </span>
    ) : (
        <span aria-hidden className={className} data-slot="chat-message-status">
            {icons}
        </span>
    );
};

export type ChatMessageProps = Omit<ComponentProps<'article'>, 'title'> &
    VariantProps<typeof chatMessageVariants> & {
        /** Who wrote it, e.g. "@Support Bot". Own messages usually leave it out. */
        author?: ReactNode;
        /** Beside the author, usually a soft Badge: "AI", "Admin". */
        badge?: ReactNode;
        /** Before the author, usually a 24px round Avatar. */
        avatar?: ReactNode;
        /** When it was sent, as shown: "2:48 PM". */
        time?: ReactNode;
        /** Machine-readable `time`, set on the <time> element. */
        dateTime?: string;
        /**
         * Delivery state, drawn as a tick after the time; it crossfades as it changes. On a message
         * `status` means delivery; on `ChatAttachment` and `ChatReference` it is a badge node.
         */
        status?: ChatMessageStatus;
        /** Beside "Not sent" on a failed message: a Retry button that calls it. */
        onRetry?: () => void;
        retryLabel?: string;
        /**
         * The reply is still being written (an assistant thinking or streaming): three pulsing dots
         * stand in for the words, or follow them while they stream in.
         */
        pending?: boolean;
        /** What a screen reader hears for a pending message with no words yet. */
        pendingLabel?: string;
    };

/** One message: `own` for the current user on the tint, `other` for agents and bots as a card. */
export const ChatMessage = ({
    variant,
    author,
    badge,
    avatar,
    time,
    dateTime,
    status,
    onRetry,
    retryLabel = 'Retry',
    pending = false,
    pendingLabel = 'Writing a reply',
    className,
    children,
    ...props
}: ChatMessageProps) => {
    const own = variant === 'own';
    const state = status ? statuses[status] : undefined;
    const failed = status === 'failed';
    const hasHeader = author != null || badge != null || avatar != null;
    const hasBody = children != null && children !== false && children !== '';
    const hasMeta = time != null || status != null;
    // Only the time and its tick fit beside the words; anything more takes its own row.
    const metaBeside = hasMeta && !failed;

    return (
        <article
            aria-busy={pending || undefined}
            className={cn(chatMessageVariants({ variant }), className)}
            data-pending={pending || undefined}
            data-slot="chat-message"
            data-status={status}
            data-variant={variant ?? 'other'}
            {...props}
        >
            {hasHeader ? (
                <header
                    className="col-span-2 flex min-w-0 items-center gap-2"
                    data-slot="chat-message-header"
                >
                    {avatar}
                    {author != null && (
                        <span
                            className="min-w-0 truncate font-medium text-neutral-950 text-xs"
                            data-slot="chat-message-author"
                        >
                            {author}
                        </span>
                    )}
                    {badge}
                </header>
            ) : (
                // Without a name the reader would hear the words but not whose they are.
                own && <span className="sr-only">You:</span>
            )}
            <div
                // Anywhere, so a run of emoji or a long id breaks inside the bubble instead of widening it.
                className={cn(
                    'wrap-anywhere min-w-0 whitespace-pre-wrap text-xs',
                    // Words with nothing beside them (no time, or a failed footer on its own row) span both
                    // columns and keep 16 on the right.
                    !metaBeside && 'col-span-2 pr-1',
                )}
                data-slot="chat-message-body"
            >
                {children}
                {pending && (
                    <>
                        <ChatTypingDots className={hasBody ? 'ml-1.5' : undefined} />
                        {!hasBody && <span className="sr-only">{pendingLabel}</span>}
                    </>
                )}
            </div>
            {hasMeta && (
                <footer
                    className={cn(
                        // The second column's foot, 10 from the bottom where the words keep 16.
                        '-mb-1.5 flex shrink-0 items-center justify-end gap-1 self-end text-neutral-600 text-xxs tabular-nums',
                        // "Not sent · Retry · time" is too wide to sit beside the words, so it takes its own row.
                        !metaBeside && 'col-span-2',
                    )}
                    data-slot="chat-message-meta"
                >
                    {/* A failed message says so in words, so its icon is not named twice. */}
                    {status && <ChatStatusIcon labelled={!failed} status={status} />}
                    {failed && state && (
                        <span className="text-error-600" data-slot="chat-message-failed">
                            {state.label}
                        </span>
                    )}
                    {failed && onRetry && (
                        <>
                            <span aria-hidden>·</span>
                            <button
                                className={cn(
                                    'cursor-pointer rounded-chip font-medium text-neutral-950 underline-offset-2 hover:underline',
                                    focusRing,
                                )}
                                data-slot="chat-message-retry"
                                onClick={onRetry}
                                type="button"
                            >
                                {retryLabel}
                            </button>
                        </>
                    )}
                    {failed && time != null && <span aria-hidden>·</span>}
                    {time != null && (
                        <time data-slot="chat-message-time" dateTime={dateTime}>
                            {time}
                        </time>
                    )}
                </footer>
            )}
        </article>
    );
};
