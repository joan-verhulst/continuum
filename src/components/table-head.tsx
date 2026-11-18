'use client';

import { ArrowUp, ChevronsUpDown } from 'lucide-react';
import { type ComponentProps, useContext } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import {
    alignClass,
    type CellAlignProps,
    TableContext,
    TreeContext,
    tableHeadVariants,
    treeStepVar,
} from './table-context';

/** A column's order: `none` is the order the rows came in. */
export type TableSort = 'ascending' | 'descending' | 'none';

export type TableHeadProps = Omit<ComponentProps<'th'>, 'align'> &
    CellAlignProps & {
        /** The column's order now. Only read on a sortable head (one with `onSortChange`). */
        sort?: TableSort;
        /**
         * Makes the head sortable: its label becomes a button that steps the order on, from off to
         * `sortFirst`, to the other way, and back to off. Sort the rows yourself.
         */
        onSortChange?: (sort: TableSort) => void;
        /**
         * The order of the first click. Numbers go `descending` (the largest first, which is what a
         * number is sorted for), text `ascending` (A to Z).
         */
        sortFirst?: Exclude<TableSort, 'none'>;
        /**
         * The tree's column, in a fold's own head (`TableFoldHead`): it steps in with the rows under
         * it, a step a level, so the head's first label starts where their names do.
         */
        tree?: boolean;
    };

const nextSort = (sort: TableSort, first: Exclude<TableSort, 'none'>): TableSort => {
    if (sort === 'none') return first;
    if (sort === first) return first === 'ascending' ? 'descending' : 'ascending';
    return 'none';
};

/**
 * The order's mark, 14 after the label: an arrow up for ascending that turns down for descending,
 * and, while the column is unsorted, a quiet up-down mark that shows only under the pointer or focus
 * (always on a touch screen), so a head row of sortable columns stays as plain as any other.
 */
const SortMark = ({ sort }: { sort: TableSort }) => (
    <span
        aria-hidden
        className="grid size-3.5 shrink-0 place-items-center *:col-start-1 *:row-start-1 *:size-3.5 *:transition-[opacity,rotate] *:duration-150 *:ease-out-strong motion-reduce:*:transition-none"
    >
        <ChevronsUpDown
            className={cn(
                'text-neutral-500',
                sort === 'none'
                    ? 'opacity-0 pointer-coarse:opacity-100 group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100'
                    : 'opacity-0',
            )}
            strokeWidth={2}
        />
        <ArrowUp
            className={cn(
                'text-neutral-900',
                sort === 'none' && 'opacity-0',
                sort === 'descending' && 'rotate-180',
            )}
            strokeWidth={2}
        />
    </span>
);

export const TableHead = ({
    align,
    numeric,
    optional,
    sort = 'none',
    onSortChange,
    sortFirst,
    tree,
    className,
    style,
    children,
    ...props
}: TableHeadProps) => {
    const variant = useContext(TableContext);
    const { depth } = useContext(TreeContext);
    const sortable = onSortChange !== undefined;
    const right = (align ?? (numeric ? 'right' : 'left')) === 'right';

    return (
        <th
            aria-sort={sortable ? sort : undefined}
            className={cn(
                tableHeadVariants({ variant }),
                alignClass({ align, numeric, optional }),
                className,
            )}
            data-slot="table-head"
            data-sorted={(sortable && sort !== 'none') || undefined}
            scope="col"
            style={
                tree && depth > 0
                    ? {
                          paddingLeft: `calc(var(--spacing) * 3 + ${depth} * ${treeStepVar})`,
                          ...style,
                      }
                    : style
            }
            {...props}
        >
            {sortable ? (
                <button
                    className={cn(
                        'group/sort -mx-1 inline-flex cursor-pointer items-center gap-1 rounded-chip px-1 align-top text-inherit transition-colors duration-150 hover:text-neutral-900',
                        // The sorted column's label darkens with its arrow, so the order is found at a glance.
                        sort !== 'none' && 'text-neutral-900',
                        // On a right-aligned column the mark goes before the label, so the label stays
                        // flush with the figures under it.
                        right && 'flex-row-reverse',
                        focusRing,
                    )}
                    data-slot="table-sort"
                    onClick={() =>
                        onSortChange(
                            nextSort(sort, sortFirst ?? (numeric ? 'descending' : 'ascending')),
                        )
                    }
                    type="button"
                >
                    {children}
                    <SortMark sort={sort} />
                </button>
            ) : (
                children
            )}
        </th>
    );
};

// One line a cell: a narrow table scrolls rather than folding its rows into two-line ones. A second
// line of meta under a name still stacks, as a block of its own.
