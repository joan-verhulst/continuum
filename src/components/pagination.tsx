'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

export type PaginationButtonProps = ComponentProps<'button'> & {
    /** Marks the current page (aria-current="page"). */
    current?: boolean;
};

/** A square page button on the control row's 34px; the current page only darkens its label. */
export const PaginationButton = ({
    current,
    className,
    type = 'button',
    ...props
}: PaginationButtonProps) => (
    <button
        aria-current={current ? 'page' : undefined}
        className={cn(
            'inline-flex size-control shrink-0 cursor-pointer select-none items-center justify-center rounded-control border border-neutral-200 font-medium text-neutral-600 text-sm tabular-nums transition-[border-color,color] duration-150',
            'hover:border-neutral-300 hover:text-neutral-950 aria-[current=page]:text-neutral-950',
            // Disabled as every control is: half strength, no pointer.
            'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
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
        <ChevronLeft strokeWidth={2} />
    </PaginationButton>
);

export const PaginationNext = ({
    'aria-label': label = 'Next page',
    ...props
}: ComponentProps<'button'>) => (
    <PaginationButton aria-label={label} {...props}>
        <ChevronRight strokeWidth={2} />
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

// `results` is also a legacy attribute of <nav>, so it is dropped before the slot is typed.
export type PaginationProps = Omit<ComponentProps<'nav'>, 'children' | 'results'> & {
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
    /** The previous button's accessible name; "Previous page" by default. */
    previousLabel?: string;
    /** The next button's accessible name; "Next page" by default. */
    nextLabel?: string;
};

/** The library's pagination bar: results on the left, pages centred, an optional right slot. */
export const Pagination = ({
    page,
    pageCount,
    onPageChange,
    siblings = 1,
    results,
    end,
    previousLabel,
    nextLabel,
    className,
    'aria-label': label = 'Pagination',
    ...props
}: PaginationProps) => {
    const count = Math.max(1, pageCount);
    const current = Math.min(Math.max(1, page), count);

    // Its own container, so it answers the room it is given wherever it sits. Under 720 the results
    // line goes and the pages fold into "‹ 3 of 25 ›": the way along cannot go, so it gets smaller.
    return (
        <nav
            aria-label={label}
            className={cn('@container/pagination', className)}
            data-slot="pagination"
            {...props}
        >
            {/* Narrow, a row: the pages centred on their own, or at the start with the end slot at the end. */}
            <div className="@max-[720px]/pagination:flex grid grid-cols-[1fr_auto_1fr] items-center @max-[720px]/pagination:justify-center @max-[720px]/pagination:gap-3 gap-12">
                <div
                    className="@max-[720px]/pagination:hidden min-w-0 whitespace-nowrap font-medium text-neutral-800 text-xs"
                    data-slot="pagination-results"
                >
                    {results}
                </div>
                <div className="flex items-center gap-2">
                    <PaginationPrevious
                        aria-label={previousLabel}
                        disabled={current <= 1}
                        onClick={() => onPageChange(current - 1)}
                    />
                    <div
                        className="flex @max-[720px]/pagination:hidden items-center gap-2"
                        data-slot="pagination-pages"
                    >
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
                                    className="inline-flex size-control items-center justify-center font-medium text-neutral-600 text-sm"
                                    key={item}
                                >
                                    …
                                </span>
                            ),
                        )}
                    </div>
                    <span
                        className="@max-[720px]/pagination:inline-flex hidden min-w-control justify-center whitespace-nowrap px-1 font-medium text-neutral-800 text-xs tabular-nums"
                        data-slot="pagination-position"
                    >
                        <span className="sr-only">Page </span>
                        {current} of {count}
                    </span>
                    <PaginationNext
                        aria-label={nextLabel}
                        disabled={current >= count}
                        onClick={() => onPageChange(current + 1)}
                    />
                </div>
                <div className="@max-[720px]/pagination:ml-auto flex min-w-0 items-center justify-end @max-[720px]/pagination:empty:hidden">
                    {end}
                </div>
            </div>
        </nav>
    );
};
