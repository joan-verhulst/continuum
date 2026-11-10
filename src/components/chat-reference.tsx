'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

export const chatTokenVariants = cva(
    // Inline in body copy as well as in a reference, so it breaks rather than overflow a narrow bubble.
    'inline max-w-full rounded-chip px-1.5 py-0.5 font-mono font-normal text-xxs [box-decoration-break:clone] [overflow-wrap:anywhere]',
    {
        variants: {
            tone: {
                primary: 'bg-primary-500/20 text-primary-800',
                neutral: 'bg-neutral-500/20 text-neutral-800',
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
                    'flex min-h-control-lg min-w-0 items-center gap-3 rounded-control border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-neutral-950 text-xs transition-[border-color] duration-150',
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
