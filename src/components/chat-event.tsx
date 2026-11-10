'use client';

import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type ChatEventProps = ComponentProps<'p'> & {
    time?: ReactNode;
    dateTime?: string;
};

/** A quiet, centred system line between messages: "Joan has closed the ticket". */
export const ChatEvent = ({ time, dateTime, className, children, ...props }: ChatEventProps) => (
    // The extra block padding stands the event apart from the messages without drawing a line.
    <p
        className={cn(
            'flex items-center justify-center gap-1.5 py-3 text-center text-neutral-600 text-xs [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
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
