import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/**
 * A quiet placeholder at the real element's size while its data loads: the 5% wash that sits on
 * the canvas and the surface alike, with a band of light crossing it. One band crosses every
 * skeleton on the page at once, so they read as one surface loading. Size it with classes (`h-control w-40`, `size-8`)
 * and give the region that loads `aria-busy`; the blocks themselves are hidden from screen readers.
 */
export const Skeleton = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        aria-hidden
        className={cn('skeleton rounded-item', className)}
        data-slot="skeleton"
        {...props}
    />
);

/** Widths that read as a paragraph: full lines, then a short last one. */
const lineWidths = ['100%', '94%', '88%', '97%', '62%'];

export type SkeletonTextProps = ComponentProps<'div'> & {
    /** How many lines; the last one is always short. */
    lines?: number;
};

/**
 * Lines of text as 10px bars on the 13px text's rhythm, the last one short. The gap and padding are
 * read from the text's line height, so the block is as tall as the lines it stands in for at any
 * type size or spacing unit.
 */
export const SkeletonText = ({ lines = 3, className, ...props }: SkeletonTextProps) => (
    <div
        aria-hidden
        className={cn(
            // The bar is 10px at 13px type and follows the type size; the gaps take the rest of each line.
            'flex flex-col gap-[calc(var(--text-xs--line-height)-var(--bar))] py-[calc((var(--text-xs--line-height)-var(--bar))/2)] [--bar:round(nearest,calc(var(--text-xs)*0.77),1px)]',
            className,
        )}
        data-slot="skeleton-text"
        {...props}
    >
        {Array.from({ length: lines }, (_, i) => (
            <Skeleton
                className="h-(--bar) rounded-chip"
                // biome-ignore lint/suspicious/noArrayIndexKey: the lines never reorder
                key={i}
                style={{
                    width:
                        i === lines - 1 && lines > 1
                            ? '62%'
                            : lineWidths[i % (lineWidths.length - 1)],
                }}
            />
        ))}
    </div>
);
