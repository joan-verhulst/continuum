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

/** One row: `term` on the left, children as the value. Multi-line values align to the top. */
export const DescriptionItem = ({ term, className, children, ...props }: DescriptionItemProps) => (
    <div
        className={cn(
            'grid min-h-[41px] grid-cols-2 items-start border-neutral-200 border-b font-medium text-xs last:border-b-0',
            className,
        )}
        data-slot="description-item"
        {...props}
    >
        <dt className="min-w-0 p-3 text-neutral-900">{term}</dt>
        <dd className="flex min-w-0 flex-wrap items-center gap-2.5 p-3 text-neutral-950">
            {children}
        </dd>
    </div>
);
