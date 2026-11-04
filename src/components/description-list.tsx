import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Key/value table from the invoice editor: two equal columns in a bordered box. */
export const DescriptionList = ({ className, ...props }: ComponentProps<'dl'>) => (
    <dl
        className={cn(
            'overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50',
            className,
        )}
        data-slot="description-list"
        {...props}
    />
);

export type DescriptionItemProps = ComponentProps<'div'> & {
    term: ReactNode;
};

/**
 * One row: `term` on the left, children as the value. Every one-line row is 41px, the ruled table
 * row, whether its value is text, a badge or an avatar: 40px cells over a 1px rule, centring what
 * they hold rather than padding round it. A value that wraps grows the row; the term stays on top.
 */
export const DescriptionItem = ({ term, className, children, ...props }: DescriptionItemProps) => (
    <div
        className={cn(
            'grid grid-cols-2 items-start border-neutral-200 border-b font-medium text-xs last:border-b-0',
            className,
        )}
        data-slot="description-item"
        {...props}
    >
        <dt className="flex min-h-10 min-w-0 items-center px-3 py-2 text-neutral-900">{term}</dt>
        <dd className="flex min-h-10 min-w-0 flex-wrap items-center gap-2.5 px-3 py-2 text-neutral-950">
            {children}
        </dd>
    </div>
);
