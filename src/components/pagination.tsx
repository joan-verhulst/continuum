'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

export type PaginationButtonProps = ComponentProps<'button'> & {
    /** Marks the current page (aria-current="page"). */
    current?: boolean;
};

/** A 32px square page button from the library; the current page only darkens its label. */
export const PaginationButton = ({
    current,
    className,
    type = 'button',
    ...props
}: PaginationButtonProps) => (
    <button
        aria-current={current ? 'page' : undefined}
        className={cn(
            'inline-flex size-8 shrink-0 cursor-pointer select-none items-center justify-center rounded-[8px] border border-neutral-200 font-medium text-neutral-600 text-sm tabular-nums transition-[border-color,color] duration-150',
            'hover:border-neutral-300 hover:text-neutral-950 aria-[current=page]:text-neutral-950',
            'disabled:pointer-events-none disabled:text-neutral-200 [&_svg]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="pagination-button"
        type={type}
        {...props}
    />
);

export const PaginationPrevious = ({
    'aria-label': label = 'Previous page',
    ...props
}: ComponentProps<'button'>) => (
    <PaginationButton aria-label={label} {...props}>
        <ChevronLeft strokeWidth={1.5} />
    </PaginationButton>
);

export const PaginationNext = ({
    'aria-label': label = 'Next page',
    ...props
}: ComponentProps<'button'>) => (
    <PaginationButton aria-label={label} {...props}>
        <ChevronRight strokeWidth={1.5} />
    </PaginationButton>
);

type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

/**
 * Always the same number of slots (first, last, the current page with its
 * siblings, and an ellipsis on either side), so the row never changes width.
 */
export const getPageItems = (page: number, pageCount: number, siblings = 1): PageItem[] => {
    const slots = siblings * 2 + 5;
    if (pageCount <= slots) return Array.from({ length: pageCount }, (_, i) => i + 1);

    const range = (from: number, to: number) =>
        Array.from({ length: to - from + 1 }, (_, i) => from + i);
    const inner = siblings * 2 + 3;

    if (page <= siblings + 3) return [...range(1, inner), 'end-ellipsis', pageCount];
    if (page >= pageCount - siblings - 2)
        return [1, 'start-ellipsis', ...range(pageCount - inner + 1, pageCount)];

    return [
        1,
        'start-ellipsis',
        ...range(page - siblings, page + siblings),
        'end-ellipsis',
        pageCount,
    ];
};

export type PaginationProps = Omit<ComponentProps<'nav'>, 'children'> & {
    /** Current page, starting at 1. */
    page: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    /** Pages shown either side of the current one. */
    siblings?: number;
    /** Left slot, e.g. "Results: 1 - 10 of 96". */
    results?: ReactNode;
    /** Right slot, e.g. a rows-per-page select. */
    end?: ReactNode;
};

/** The library's pagination bar: results on the left, pages centred, an optional right slot. */
export const Pagination = ({
    page,
    pageCount,
    onPageChange,
    siblings = 1,
    results,
    end,
    className,
    'aria-label': label = 'Pagination',
    ...props
}: PaginationProps) => {
    const count = Math.max(1, pageCount);
    const current = Math.min(Math.max(1, page), count);

    return (
        <nav
            aria-label={label}
            className={cn('grid grid-cols-[1fr_auto_1fr] items-center gap-12', className)}
            data-slot="pagination"
            {...props}
        >
            <div className="min-w-0 font-medium text-neutral-800 text-xs">{results}</div>
            <div className="flex items-center gap-2">
                <PaginationPrevious
                    disabled={current <= 1}
                    onClick={() => onPageChange(current - 1)}
                />
                {getPageItems(current, count, siblings).map(item =>
                    typeof item === 'number' ? (
                        <PaginationButton
                            current={item === current}
                            key={item}
                            onClick={() => onPageChange(item)}
                        >
                            {item}
                        </PaginationButton>
                    ) : (
                        <span
                            aria-hidden
                            className="inline-flex size-8 items-center justify-center font-medium text-neutral-600 text-sm"
                            key={item}
                        >
                            …
                        </span>
                    ),
                )}
                <PaginationNext
                    disabled={current >= count}
                    onClick={() => onPageChange(current + 1)}
                />
            </div>
            <div className="flex min-w-0 items-center justify-end">{end}</div>
        </nav>
    );
};
