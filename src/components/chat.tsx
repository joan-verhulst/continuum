'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowRight, Check, CheckCheck, CircleAlert, Clock, Plus } from 'lucide-react';
import {
    Children,
    type ComponentProps,
    type KeyboardEvent,
    type ReactNode,
    type Ref,
    type RefCallback,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { Button, focusRing } from './button';

const assignRef = <T,>(ref: Ref<T> | undefined, node: T | null) => {
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
};

/* -------------------------------------------------------------------------------------------------
 * Thread
 * -----------------------------------------------------------------------------------------------*/

// Within this distance of the end the reader counts as following along, so a new message pulls them down.
const STICK_THRESHOLD = 48;

export type ChatThreadProps = ComponentProps<'div'> & {
    /** Shown in place of the messages while the thread has none. */
    empty?: ReactNode;
};

/**
 * The scrolling column of a conversation. It opens at the latest message and follows new ones while
 * the reader is at the end, but leaves them where they are once they have scrolled back to read.
 */
export const ChatThread = ({
    empty,
    className,
    children,
    ref,
    onScroll,
    'aria-label': ariaLabel = 'Messages',
    ...props
}: ChatThreadProps) => {
    const nodeRef = useRef<HTMLDivElement | null>(null);
    const stuck = useRef(true);
    const count = Children.count(children);

    const setRef = useCallback<RefCallback<HTMLDivElement>>(
        node => {
            nodeRef.current = node;
            assignRef(ref, node);
        },
        [ref],
    );

    // Layout effect, so the jump to the end lands before paint and the thread never flashes at the top.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs when a message is added, which count stands for.
    useLayoutEffect(() => {
        const node = nodeRef.current;

        if (!node) return;
        if (stuck.current) node.scrollTop = node.scrollHeight;

        // A message can also grow in place (a streamed reply, an image that loads), which fires no
        // scroll and changes no count, so the children are watched for size while the reader follows.
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            if (stuck.current) node.scrollTop = node.scrollHeight;
        });
        for (const child of Array.from(node.children)) observer.observe(child);
        return () => observer.disconnect();
    }, [count]);

    return (
        <div
            aria-label={ariaLabel}
            aria-live="polite"
            aria-relevant="additions"
            className={cn(
                'flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain p-4',
                focusRing,
                'focus-visible:-outline-offset-2',
                className,
            )}
            data-empty={count === 0 || undefined}
            data-slot="chat-thread"
            onScroll={event => {
                const node = event.currentTarget;

                stuck.current =
                    node.scrollHeight - node.scrollTop - node.clientHeight < STICK_THRESHOLD;
                onScroll?.(event);
            }}
            ref={setRef}
            role="log"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region has to take focus, or keyboard users cannot scroll it.
            tabIndex={0}
            {...props}
        >
            {count === 0 && empty != null ? (
                <div
                    className="m-auto max-w-72 text-balance text-center text-neutral-500 text-xs"
                    data-slot="chat-thread-empty"
                >
                    {empty}
                </div>
            ) : (
                children
            )}
        </div>
    );
};

/* -------------------------------------------------------------------------------------------------
 * Message
 * -----------------------------------------------------------------------------------------------*/

export const chatMessageVariants = cva(
    'flex min-w-0 flex-col gap-2 rounded-card px-4 py-3 text-neutral-950',
    {
        variants: {
            variant: {
                // The current user's words sit on the theme's tint: a grey wash in eyes, a blue one in electric.
                own: 'bg-tint',
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
    sending: { label: 'Sending', icon: Clock, className: 'text-neutral-500' },
    sent: { label: 'Sent', icon: Check, className: 'text-neutral-500' },
    delivered: { label: 'Delivered', icon: CheckCheck, className: 'text-neutral-500' },
    // Read is the same double tick, darkened: a quiet change, not a second accent colour.
    read: { label: 'Read', icon: CheckCheck, className: 'text-neutral-950' },
    failed: { label: 'Not sent', icon: CircleAlert, className: 'text-error-500' },
} as const;

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
        /** Delivery state, drawn as a tick after the time. */
        status?: ChatMessageStatus;
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
    className,
    children,
    ...props
}: ChatMessageProps) => {
    const own = variant === 'own';
    const state = status ? statuses[status] : undefined;
    const StatusIcon = state?.icon;
    const hasHeader = author != null || badge != null || avatar != null;

    return (
        <article
            className={cn(chatMessageVariants({ variant }), className)}
            data-slot="chat-message"
            data-status={status}
            data-variant={variant ?? 'other'}
            {...props}
        >
            {hasHeader ? (
                <header className="flex min-w-0 items-center gap-2" data-slot="chat-message-header">
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
            <div className="whitespace-pre-wrap break-words text-xs" data-slot="chat-message-body">
                {children}
            </div>
            {(time != null || state) && (
                <footer
                    className="-mt-1 flex items-center justify-end gap-1 text-neutral-500 text-xxs tabular-nums"
                    data-slot="chat-message-meta"
                >
                    {StatusIcon && state && (
                        <span
                            className={cn('inline-flex', state.className)}
                            data-slot="chat-message-status"
                            role="img"
                            aria-label={state.label}
                        >
                            <StatusIcon aria-hidden className="size-3" strokeWidth={2} />
                        </span>
                    )}
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

/* -------------------------------------------------------------------------------------------------
 * Event
 * -----------------------------------------------------------------------------------------------*/

export type ChatEventProps = ComponentProps<'p'> & {
    time?: ReactNode;
    dateTime?: string;
};

/** A quiet, centred system line between messages: "Joan has closed the ticket". */
export const ChatEvent = ({ time, dateTime, className, children, ...props }: ChatEventProps) => (
    // The extra block padding stands the event apart from the messages without drawing a line.
    <p
        className={cn(
            'flex items-center justify-center gap-1.5 py-3 text-center text-neutral-500 text-xs [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            className,
        )}
        data-slot="chat-event"
        {...props}
    >
        <span className="min-w-0 text-balance" data-slot="chat-event-text">
            {children}
        </span>
        {time != null && (
            <>
                <span aria-hidden>·</span>
                <time className="tabular-nums" data-slot="chat-event-time" dateTime={dateTime}>
                    {time}
                </time>
            </>
        )}
    </p>
);

/* -------------------------------------------------------------------------------------------------
 * Token and reference
 * -----------------------------------------------------------------------------------------------*/

export const chatTokenVariants = cva(
    // Inline in body copy as well as in a reference, so it breaks rather than overflow a narrow bubble.
    'inline max-w-full rounded-chip px-1.5 py-0.5 font-mono font-normal text-xxs [box-decoration-break:clone] [overflow-wrap:anywhere]',
    {
        variants: {
            tone: {
                primary: 'bg-primary-500/20 text-primary-700',
                neutral: 'bg-neutral-500/20 text-neutral-700',
            },
        },
        defaultVariants: {
            tone: 'primary',
        },
    },
);

export type ChatTokenProps = ComponentProps<'code'> & VariantProps<typeof chatTokenVariants>;

/** An identifier in mono on a tinted chip, such as an invoice or ticket number, inline in a message. */
export const ChatToken = ({ tone, className, ...props }: ChatTokenProps) => (
    <code
        className={cn(chatTokenVariants({ tone }), className)}
        data-slot="chat-token"
        {...props}
    />
);

export type ChatReferenceProps = useRender.ComponentProps<'div'> & {
    /** The identifier, shown as a ChatToken. */
    token: ReactNode;
    /** Trailing slot, usually a soft Badge: "Pending", "Paid". */
    status?: ReactNode;
};

/**
 * An attachment or record dropped into the thread: its token, one fact and its status. Pass
 * `render={<a href="…" />}` to make it open the record.
 */
export const ChatReference = ({
    token,
    status,
    render,
    ref,
    className,
    children,
    ...props
}: ChatReferenceProps) =>
    useRender({
        defaultTagName: 'div',
        render,
        ref,
        state: { slot: 'chat-reference' },
        props: mergeProps<'div'>(
            {
                className: cn(
                    // The field row's 38px, with the control's corner to match.
                    'flex min-h-[38px] min-w-0 items-center gap-3 rounded-control border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-950 text-xs transition-[border-color] duration-150',
                    // Only a link or button reacts; a plain record stays still under the pointer.
                    '[a&]:hover:border-neutral-300 [button&]:hover:border-neutral-300',
                    focusRing,
                    className,
                ),
                children: (
                    <>
                        <ChatToken className="min-w-0 truncate" data-slot="chat-reference-token">
                            {token}
                        </ChatToken>
                        {/* The fact is the figure the reader came for, so the long token gives way first. */}
                        {children != null && (
                            <span
                                className="ml-auto shrink-0 whitespace-nowrap tabular-nums"
                                data-slot="chat-reference-fact"
                            >
                                {children}
                            </span>
                        )}
                        {status != null && (
                            <span
                                className={cn('flex shrink-0', children == null && 'ml-auto')}
                                data-slot="chat-reference-status"
                            >
                                {status}
                            </span>
                        )}
                    </>
                ),
            },
            props,
        ),
    });

/* -------------------------------------------------------------------------------------------------
 * Composer
 * -----------------------------------------------------------------------------------------------*/

export type ChatComposerProps = Omit<ComponentProps<'form'>, 'onSubmit' | 'children'> & {
    /** Controlled draft. */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /**
     * Called with the trimmed draft on Enter or the send button. The draft clears afterwards
     * unless this returns `false`, e.g. when the message could not be queued.
     */
    onSend?: (text: string) => unknown;
    /** Draws the leading add button; leave it out for no button. */
    onAdd?: () => void;
    /** Replaces the add button, e.g. with a DropdownMenu trigger for attachment types. */
    start?: ReactNode;
    placeholder?: string;
    disabled?: boolean;
    /** Accessible name of the text box. */
    label?: string;
    name?: string;
    maxLength?: number;
    textareaRef?: Ref<HTMLTextAreaElement>;
};

/**
 * Where the current user writes: an add button, a text box that grows with the draft and a send
 * button that wakes once there is something to send. Enter sends; Shift+Enter starts a new line.
 */
export const ChatComposer = ({
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onSend,
    onAdd,
    start,
    placeholder = 'Write a message',
    disabled = false,
    label = 'Message',
    name,
    maxLength,
    textareaRef,
    className,
    ...props
}: ChatComposerProps) => {
    const [uncontrolled, setUncontrolled] = useState(defaultValue);
    const controlled = valueProp !== undefined;
    const value = controlled ? valueProp : uncontrolled;
    const canSend = !disabled && value.trim().length > 0;
    const nodeRef = useRef<HTMLTextAreaElement | null>(null);

    const setValue = (next: string) => {
        if (!controlled) setUncontrolled(next);
        onValueChange?.(next);
    };

    const setRef = useCallback<RefCallback<HTMLTextAreaElement>>(
        node => {
            nodeRef.current = node;
            assignRef(textareaRef, node);
        },
        [textareaRef],
    );

    // Grow with the draft up to max-h, then scroll; field-sizing is not in every browser yet.
    // biome-ignore lint/correctness/useExhaustiveDependencies: the height follows the value.
    useLayoutEffect(() => {
        const node = nodeRef.current;

        if (!node) return;
        node.style.height = 'auto';
        node.style.height = `${node.scrollHeight}px`;
    }, [value]);

    const send = () => {
        if (!canSend) return;
        if (onSend?.(value.trim()) !== false) setValue('');
        nodeRef.current?.focus();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter during IME composition picks a candidate; it must not send half a word.
        if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
        event.preventDefault();
        send();
    };

    const leading =
        start ??
        (onAdd && (
            <Button
                aria-label="Add attachment"
                data-slot="chat-composer-add"
                disabled={disabled}
                onClick={onAdd}
                size="icon"
                variant="ghost"
            >
                <Plus aria-hidden strokeWidth={2} />
            </Button>
        ));

    return (
        <form
            className={cn(
                // The buttons keep their own corner; the frame adds the 3px inset so the two stay concentric.
                'flex items-end gap-1 rounded-[calc(var(--radius-control)+3px)] border border-neutral-200 bg-neutral-50 p-[3px] transition-[border-color] duration-150',
                'has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-focus has-[textarea:focus-visible]:outline-solid has-[textarea:focus-visible]:outline-offset-2',
                // The buttons dim themselves when disabled; dimming the frame too would halve them again.
                !disabled && 'hover:border-neutral-300 has-[textarea:focus]:border-neutral-300',
                className,
            )}
            data-disabled={disabled || undefined}
            data-slot="chat-composer"
            onSubmit={event => {
                event.preventDefault();
                send();
            }}
            {...props}
        >
            {leading}
            <textarea
                aria-label={label}
                className={cn(
                    // One line is the 34px of the buttons beside it: text-xs's 16.25px line and 8.875px either side.
                    'block max-h-40 min-h-[34px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-[8.875px] text-neutral-900 text-xs outline-none placeholder:text-neutral-500',
                    'disabled:cursor-not-allowed disabled:text-neutral-400 disabled:placeholder:text-neutral-300',
                    leading ? 'px-1' : 'px-2.5',
                )}
                data-slot="chat-composer-input"
                disabled={disabled}
                maxLength={maxLength}
                name={name}
                onChange={event => setValue(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                ref={setRef}
                rows={1}
                value={value}
            />
            <Button
                aria-label="Send message"
                data-slot="chat-composer-send"
                disabled={!canSend}
                size="icon"
                type="submit"
                variant="primary"
            >
                <ArrowRight aria-hidden strokeWidth={2} />
            </Button>
        </form>
    );
};
