import { cva, type VariantProps } from 'class-variance-authority';
import { Children, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export const metaListVariants = cva('min-w-0 font-normal text-neutral-700 text-xs', {
    variants: {
        layout: {
            row: 'flex flex-wrap items-center gap-x-3 gap-y-1.5',
            // Two equal columns, so a device and a browser line up under a city and an OS.
            grid: 'grid grid-cols-2 gap-x-4 gap-y-1.5',
        },
        separated: {
            // The list gap before the dot, and the item's own gap plus a 2px margin after it, put 8px either side.
            // The empty alternative text keeps a screen reader from reading the dot out between facts.
            true: [
                'gap-x-2',
                "[&>[data-slot=meta-item]:not(:first-child)]:before:me-0.5 [&>[data-slot=meta-item]:not(:first-child)]:before:text-neutral-500 [&>[data-slot=meta-item]:not(:first-child)]:before:content-['·'_/_'']",
            ],
            false: '',
        },
    },
    defaultVariants: {
        layout: 'row',
        separated: false,
    },
});

export type MetaListProps = ComponentProps<'ul'> & VariantProps<typeof metaListVariants>;

/**
 * Icon and text facts about a thing (place, browser, plan, seats) wrapping in a row or a two-column grid;
 * `separated` draws a middle dot between them instead. Renders nothing when it has no items.
 */
export const MetaList = ({ layout, separated, className, children, ...props }: MetaListProps) => {
    if (Children.toArray(children).length === 0) return null;

    // A dot-separated line is one sentence of facts, so it never splits into columns.
    const resolvedLayout = separated ? 'row' : (layout ?? 'row');

    return (
        <ul
            className={cn(metaListVariants({ layout: resolvedLayout, separated }), className)}
            data-layout={resolvedLayout}
            data-separated={separated || undefined}
            data-slot="meta-list"
            {...props}
        >
            {children}
        </ul>
    );
};

export type MetaItemProps = ComponentProps<'li'> & {
    /** A 16px lucide icon, a flag or a small avatar; it takes neutral-600 unless it brings its own colour. */
    icon?: ReactNode;
    /** Read before the text by screen readers only, e.g. "Browser" for a Chrome icon and "Chrome". */
    label?: string;
};

/** One fact in a MetaList: its icon and its text, truncating when the row runs out of room. */
export const MetaItem = ({ icon, label, className, children, title, ...props }: MetaItemProps) => (
    <li
        className={cn(
            'flex min-w-0 max-w-full items-center gap-1.5',
            '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0 [&_svg]:text-neutral-600',
            className,
        )}
        data-slot="meta-item"
        // A truncated city or plan name stays readable on hover.
        title={title ?? (typeof children === 'string' ? children : undefined)}
        {...props}
    >
        {icon && (
            <span aria-hidden className="flex shrink-0 items-center" data-slot="meta-item-icon">
                {icon}
            </span>
        )}
        <span className="min-w-0 truncate" data-slot="meta-item-text">
            {label && <span className="sr-only">{label}: </span>}
            {children}
        </span>
    </li>
);
