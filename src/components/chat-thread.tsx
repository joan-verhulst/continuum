'use client';

import { ArrowDown } from 'lucide-react';
import {
    Children,
    type ComponentProps,
    cloneElement,
    Fragment,
    isValidElement,
    type ReactElement,
    type ReactNode,
    type RefCallback,
    useCallback,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { Button, focusRing } from './button';
import { assignRef } from './chat-shared';
import { Skeleton, SkeletonText } from './skeleton';
import { Spinner } from './spinner';

// Within this distance of the end the reader counts as following along, so a new message pulls them down.
const STICK_THRESHOLD = 48;

export type ChatThreadProps = ComponentProps<'div'> & {
    /** Shown in place of the messages while the thread has none. */
    empty?: ReactNode;
    /** The first messages are loading: a skeleton of message rows stands in for them. */
    loading?: boolean;
    /** Replaces the default `ChatThreadSkeleton` while `loading`. */
    skeleton?: ReactNode;
    /** Earlier messages are loading: a quiet spinner row heads the thread. */
    loadingEarlier?: boolean;
    loadingEarlierLabel?: ReactNode;
    /** Called once each time the reader scrolls to within 48px of the top: fetch earlier messages. */
    onReachStart?: () => void;
    /** The jump button's label for the messages that arrived while the reader was scrolled back. */
    jumpLabel?: (count: number) => string;
};

const defaultJumpLabel = (count: number) =>
    count === 1 ? '1 new message' : `${count} new messages`;

type Keyed = ReactElement<Record<string, unknown>>;

const isMessage = (node: ReactNode): node is Keyed => isValidElement(node);

/**
 * One's own message, read from its props rather than its type, so a wrapper round `ChatMessage`
 * counts too: `variant="own"` (forwarded to the message) or a `data-own` marker. A wrapper must also
 * pass the `data-enter` the thread gives it on to the message, or a new one will not rise in.
 */
const isOwn = (node: Keyed) => {
    const own = node.props['data-own'];
    return node.props.variant === 'own' || (own != null && own !== false && own !== 'false');
};

/**
 * The scrolling column of a conversation. It opens at the latest message and follows new ones while
 * the reader is at the end, but leaves them where they are once they have scrolled back to read,
 * and counts what arrives meanwhile on a button that takes them back down. A message added after
 * the thread has loaded rises in from the composer's side; the history it opened with stays still.
 */
export const ChatThread = ({
    empty,
    loading = false,
    skeleton,
    loadingEarlier = false,
    loadingEarlierLabel,
    onReachStart,
    jumpLabel = defaultJumpLabel,
    className,
    children,
    ref,
    onScroll,
    'aria-label': ariaLabel = 'Messages',
    ...props
}: ChatThreadProps) => {
    const nodeRef = useRef<HTMLDivElement | null>(null);
    const stuck = useRef(true);
    const atStart = useRef(false);
    const height = useRef(0);
    // Whether the thread has shown its loaded messages once: only what comes after that enters.
    const settled = useRef(false);
    const committed = useRef<{ keys: readonly string[]; signature: string } | null>(null);
    const entered = useRef(new Set<string>());
    const [unread, setUnread] = useState(0);

    const items = Children.toArray(children);
    const messages = items.filter(isMessage);
    const keys = messages.map(item => String(item.key));
    const signature = keys.join('\u0000');
    const count = items.length;

    // What changed since the last commit: messages added after the first one kept are appended (they
    // enter and count as unread), messages added before it are earlier history (the view holds still).
    let appended: string[] = [];
    let prepended = false;
    const previous = committed.current;

    if (previous && previous.signature !== signature && settled.current && !loading) {
        const before = new Set(previous.keys);
        const firstKept = keys.findIndex(key => before.has(key));

        if (previous.keys.length === 0) appended = keys;
        else if (firstKept !== -1) {
            appended = keys.filter((key, i) => i > firstKept && !before.has(key));
            prepended = firstKept > 0;
        }
    }

    const sentOwn = messages.some(item => appended.includes(String(item.key)) && isOwn(item));

    const setRef = useCallback<RefCallback<HTMLDivElement>>(
        node => {
            nodeRef.current = node;
            assignRef(ref, node);
        },
        [ref],
    );

    // Layout effect, so the jump to the end lands before paint and the thread never flashes at the top.
    // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the messages change, which the signature stands for.
    useLayoutEffect(() => {
        const node = nodeRef.current;

        if (!node) return;

        // Strict mode runs this twice for one commit; the diff is applied once.
        if (committed.current?.signature !== signature) {
            // Earlier history went in above the reader: move by its height, so what they read stays put.
            if (prepended && !stuck.current) {
                node.scrollTop += node.scrollHeight - height.current;
            }
            // The reader's own message always takes them to the end, wherever they had scrolled.
            if (sentOwn) stuck.current = true;
            if (appended.length > 0 && !stuck.current) setUnread(n => n + appended.length);
            for (const key of appended) entered.current.add(key);
            committed.current = { keys, signature };
        }
        if (!loading) settled.current = true;

        if (stuck.current) node.scrollTop = node.scrollHeight;
        height.current = node.scrollHeight;

        // A message can also grow in place (a streamed reply, an image that loads),
        // which fires no scroll and changes no count, so the children are watched for size.
        if (typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => {
            if (stuck.current) node.scrollTop = node.scrollHeight;
            height.current = node.scrollHeight;
        });
        for (const child of Array.from(node.children)) observer.observe(child);
        return () => observer.disconnect();
    }, [signature, loading, loadingEarlier]);

    const jump = () => {
        const node = nodeRef.current;
        if (!node) return;
        const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        node.scrollTo({ top: node.scrollHeight, behavior: still ? 'auto' : 'smooth' });
    };

    const rendered = items.map(item =>
        isMessage(item) &&
        item.type !== Fragment &&
        (appended.includes(String(item.key)) || entered.current.has(String(item.key)))
            ? cloneElement(item, { 'data-enter': '' })
            : item,
    );

    return (
        <div
            aria-busy={loading || undefined}
            aria-label={ariaLabel}
            aria-live="polite"
            aria-relevant="additions"
            className={cn(
                // Scroll anchoring is done by hand (see the effect), so the browser's own is off.
                'flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain p-4 [overflow-anchor:none]',
                // A message's attachments hang 4 under it, not a message's 12 apart.
                '*:data-[slot=chat-attachments]:-mt-2',
                // A message added after load rises 8px into place as it fades in; reduced motion turns it off.
                '*:data-enter:starting:translate-y-2 *:data-enter:starting:opacity-0 *:data-enter:transition-[opacity,translate,border-color] *:data-enter:duration-200 *:data-enter:ease-out-strong motion-reduce:*:data-enter:transition-none',
                focusRing,
                'focus-visible:-outline-offset-2',
                className,
            )}
            data-empty={(!loading && count === 0) || undefined}
            data-loading={loading || undefined}
            data-slot="chat-thread"
            onScroll={event => {
                const node = event.currentTarget;

                stuck.current =
                    node.scrollHeight - node.scrollTop - node.clientHeight < STICK_THRESHOLD;
                if (stuck.current) setUnread(0);

                const nearStart = node.scrollTop < STICK_THRESHOLD;
                if (nearStart && !atStart.current && !loading && !loadingEarlier) {
                    onReachStart?.();
                }
                atStart.current = nearStart;
                onScroll?.(event);
            }}
            ref={setRef}
            role="log"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region has to take focus, or keyboard users cannot scroll it.
            tabIndex={0}
            {...props}
        >
            {loadingEarlier && !loading && (
                <ChatLoadingEarlier>{loadingEarlierLabel}</ChatLoadingEarlier>
            )}
            {loading ? (
                (skeleton ?? <ChatThreadSkeleton />)
            ) : count === 0 && empty != null ? (
                <>
                    <div
                        className="m-auto max-w-measure-narrow text-balance text-center text-neutral-600 text-xs"
                        data-slot="chat-thread-empty"
                    >
                        {empty}
                    </div>
                    {rendered}
                </>
            ) : (
                rendered
            )}
            {unread > 0 && (
                // Pinned to the foot of the view at no height, so it floats over the messages; the
                // negative margin takes back the gap it would otherwise add after the last one. The
                // messages are announced themselves, so the button and its count are kept out of the log.
                <div
                    aria-live="off"
                    className="sticky bottom-0 -mt-3 h-0 shrink-0"
                    data-slot="chat-thread-jump"
                >
                    <Button
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 starting:translate-y-1 starting:opacity-0 shadow-float transition-[background-color,border-color,color,opacity,translate,scale] motion-reduce:starting:translate-y-0"
                        onClick={jump}
                        shape="pill"
                        variant="secondary"
                    >
                        <ArrowDown aria-hidden strokeWidth={2} />
                        {jumpLabel(unread)}
                    </Button>
                </div>
            )}
        </div>
    );
};

export type ChatThreadSkeletonProps = ComponentProps<'div'> & {
    /** How many message rows; they alternate as a conversation does. */
    rows?: number;
};

// Another person's message with a header and two lines, a short reply of one's own, then a longer one.
const skeletonRows = [
    { own: false, lines: 2 },
    { own: true, lines: 1 },
    { own: false, lines: 3 },
    { own: true, lines: 2 },
] as const;

/**
 * The thread's first messages while they load: rows drawn as the messages are (the card with its
 * avatar and name for others, the tint for one's own), sitting at the foot as the thread opens there.
 */
export const ChatThreadSkeleton = ({ rows = 3, className, ...props }: ChatThreadSkeletonProps) => (
    <div
        aria-hidden
        className={cn('mt-auto flex flex-col gap-3', className)}
        data-slot="chat-thread-skeleton"
        {...props}
    >
        {Array.from({ length: rows }, (_, i) => {
            const row = skeletonRows[i % skeletonRows.length] ?? skeletonRows[0];

            return (
                <div
                    className={cn(
                        // The message's own padding, so a row is as tall as the message that replaces it.
                        'flex flex-col gap-2 rounded-card py-4 pr-3 pl-4',
                        row.own
                            ? 'ml-auto w-2/3 bg-tint'
                            : 'border border-neutral-200 bg-neutral-50',
                    )}
                    // biome-ignore lint/suspicious/noArrayIndexKey: the rows never reorder
                    key={i}
                >
                    {!row.own && (
                        <div className="flex items-center gap-2">
                            <Skeleton className="size-6 rounded-full" />
                            <Skeleton className="h-2.5 w-20 rounded-chip" />
                        </div>
                    )}
                    <SkeletonText className={row.own ? 'w-3/4' : undefined} lines={row.lines} />
                </div>
            );
        })}
    </div>
);

/** The quiet row at the head of the thread while earlier messages load. */
export const ChatLoadingEarlier = ({ className, children, ...props }: ComponentProps<'output'>) => (
    // An <output> is a polite status region, so the row is announced once as it appears.
    <output
        className={cn(
            'flex shrink-0 items-center justify-center gap-2 py-1 text-neutral-600 text-xs',
            className,
        )}
        data-slot="chat-loading-earlier"
        {...props}
    >
        <Spinner className="text-neutral-500" size="sm" />
        {children ?? 'Loading earlier messages'}
    </output>
);

/**
 * A hairline across the thread with a label, above the first message the reader has not seen. The
 * label is read as text where it stands, so the reader hears where the new messages begin.
 */
export const ChatUnreadDivider = ({
    className,
    children = 'New messages',
    ...props
}: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex shrink-0 items-center gap-3 font-medium text-neutral-950 text-xxs',
            className,
        )}
        data-slot="chat-unread-divider"
        {...props}
    >
        <span aria-hidden className="h-px flex-1 bg-neutral-300" />
        <span className="shrink-0">{children}</span>
        <span aria-hidden className="h-px flex-1 bg-neutral-300" />
    </div>
);
