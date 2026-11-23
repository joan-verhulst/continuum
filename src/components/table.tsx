'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Search } from 'lucide-react';
import { type ComponentProps, type ReactNode, useContext } from 'react';
import { cn } from '../lib/cn';
import { useOverflowScroll } from '../lib/overflow-scroll';
import { Input, type InputProps } from './input';
import {
    ColumnMoveContext,
    FoldContext,
    FoldedContext,
    RowMoveContext,
    TableContext,
    type TableMoveHandler,
} from './table-context';

// The frame is its own container, so a table answers the room it is given wherever it sits: under
// 640 a column marked `optional` goes and the bar keeps to one line.
const tableWrapperVariants = cva('@container/table relative w-full', {
    variants: {
        variant: {
            // The control's corner, as the inputs and filters above a table have: a table is
            // data beside them, not a second panel, and a panel's corner made it the steepest thing on the page.
            // The frame clips to its corner; the scroller inside it is square.
            ruled: 'overflow-hidden rounded-control border border-neutral-200 bg-neutral-50 shadow-card',
            rows: '',
        },
    },
    defaultVariants: { variant: 'ruled' },
});

const tableVariants = cva('w-full text-xs', {
    variants: {
        variant: {
            // Only the last row of the last section drops its rule; the wrapper border closes it.
            ruled: 'border-collapse [&>:last-child>tr:last-child>*]:border-b-0',
            rows: 'border-separate border-spacing-y-2',
        },
    },
    defaultVariants: { variant: 'ruled' },
});

export type TableProps = ComponentProps<'table'> &
    VariantProps<typeof tableVariants> & {
        wrapperClassName?: string;
        /** A `TableToolbar`, and under it a `TableConditions` row while any apply, inside the frame above the column head. */
        toolbar?: ReactNode;
    };

/**
 * A data table in two looks. `ruled` is the library table, the email sequencing
 * phases and the invoice lines: hairline rows in a bordered frame. `rows` is the
 * analytics overview's top pages and regions: every row a separate rounded fill.
 */
export const Table = ({ variant, className, wrapperClassName, toolbar, ...props }: TableProps) => {
    const value = variant ?? 'ruled';
    // A table wider than its frame scrolls, and the edge with more fades so the cut-off column
    // reads as cut off. No chevrons: a table is scrolled by hand, not stepped along.
    const { ref, edges, style } = useOverflowScroll<HTMLDivElement>();

    return (
        <TableContext.Provider value={value}>
            <div
                className={cn(tableWrapperVariants({ variant: value }), wrapperClassName)}
                data-slot="table-wrapper"
            >
                {/* The bar stays put in the frame while a wide table scrolls sideways under it. */}
                {toolbar}
                <div
                    className={cn(
                        'w-full overflow-x-auto',
                        // Columns resized to less than the frame leave room at its right: the head's
                        // band and its rule run on to the frame's edge, so the head never stops short.
                        value === 'ruled' &&
                            '[&:has([data-slot=table-resize]):not(:has([data-flex]))]:bg-[linear-gradient(to_bottom,var(--color-neutral-100)_var(--spacing-table-row),var(--color-neutral-200)_var(--spacing-table-row),var(--color-neutral-200)_calc(var(--spacing-table-row)+1px),transparent_calc(var(--spacing-table-row)+1px))]',
                    )}
                    data-slot="table-scroller"
                    ref={ref}
                    style={edges.overflows ? style : undefined}
                >
                    <table
                        className={cn(
                            tableVariants({ variant: value }),
                            // With a selection column, a tree steps by its width: box to chevron.
                            '[&:has([data-slot=table-select-cell])]:[--tree-step:44px]',
                            // A resizable column lays the table out by its columns' widths: as wide
                            // as they add up to, never narrower than the frame, the column without a
                            // width taking what is left. A value wider than its column ends in an ellipsis.
                            'has-data-[slot=table-resize]:w-max has-data-flex:min-w-full has-data-[slot=table-resize]:table-fixed',
                            '[&:has([data-slot=table-resize])_td:not([data-slot=table-tree-cell])]:overflow-hidden [&:has([data-slot=table-resize])_td]:text-ellipsis',
                            className,
                        )}
                        data-slot="table"
                        data-variant={value}
                        {...props}
                    />
                </div>
            </div>
        </TableContext.Provider>
    );
};

/**
 * The table's own bar, inside its frame above the column head: what narrows this table sits on
 * this table. The control row's 34 in 6px of room, ruled off like the head; it wraps when its
 * filters outgrow one line, and the head below never moves. Pass it to `Table`'s `toolbar`.
 * In a frame under 640 it keeps to one line, the search taking what the end group leaves; fewer
 * controls there (the selects folded into the one Filter button) is the page's call.
 */
export const TableToolbar = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex min-h-tab flex-wrap items-center gap-x-3 gap-y-2 border-neutral-200 border-b px-1.5 py-1.5',
            '@max-[640px]/table:flex-nowrap',
            className,
        )}
        data-slot="table-toolbar"
        {...props}
    />
);

export type TableSearchProps = Omit<InputProps, 'size' | 'variant' | 'leadingIcon'>;

/**
 * The table's search: a small outlined input with a leading 16px search icon.
 * 256 wide, and it gives way before the filters do.
 */
export const TableSearch = ({ className, ...props }: TableSearchProps) => (
    <Input
        // In a narrow frame it fills the row beside the end group rather than holding its 256.
        className={cn(
            '@max-[640px]/table:w-auto w-search @max-[640px]/table:min-w-0 @max-[640px]/table:flex-1 shrink',
            className,
        )}
        leadingIcon={<Search strokeWidth={2} />}
        size="sm"
        {...props}
    />
);

/**
 * The applied conditions, in a row of their own under the bar, so narrowing reads apart from
 * finding. Only while a condition applies, and then the button that adds one sits at its right end;
 * with none, that button waits in the bar. Ruled off like the bar, and it wraps when the conditions
 * outgrow one line. In a frame under 640 the conditions wrap among themselves and the add button
 * keeps the first line's end, rather than dropping to a line of its own under them; with only one
 * condition, Clear all goes, since the condition's own × does the same.
 */
export const TableConditions = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex min-h-tab flex-wrap items-center gap-2 border-neutral-200 border-b px-1.5 py-1.5',
            '@max-[640px]/table:flex-nowrap @max-[640px]/table:items-start @max-[640px]/table:[&>[data-slot=filter-conditions]]:flex-1',
            // With one condition, its own × does what Clear all would, so the narrow row drops it.
            '@max-[640px]/table:[&:not(:has([data-slot=filter-condition]~[data-slot=filter-condition]))_[data-slot=filter-conditions-clear]]:hidden',
            className,
        )}
        data-slot="table-conditions"
        {...props}
    />
);

/** The far end of the bar or the conditions row: the selects, a filter menu, or the button that adds a condition. */
export const TableToolbarEnd = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2',
            // In a narrow frame it holds its controls whole on one line, beside the search.
            '@max-[640px]/table:shrink-0 @max-[640px]/table:flex-nowrap',
            className,
        )}
        data-slot="table-toolbar-end"
        {...props}
    />
);

export type TableHeaderProps = ComponentProps<'thead'> & {
    /**
     * Lets the reader reorder the columns whose heads are `movable`: called at the drop with the
     * column's place before and after, counted among the movable heads. Reorder your columns
     * (`moveItem` does it for a list).
     */
    onColumnMove?: TableMoveHandler;
};

export const TableHeader = ({ onColumnMove, className, ...props }: TableHeaderProps) => (
    <ColumnMoveContext.Provider value={onColumnMove ?? null}>
        <thead className={className} data-slot="table-header" {...props} />
    </ColumnMoveContext.Provider>
);

export type TableBodyProps = ComponentProps<'tbody'> & {
    /**
     * Lets the reader reorder the rows by the grip in each (`TableDragCell`): called at the drop
     * with the row's place before and after, counted among the rows with a grip. Reorder your rows
     * (`moveItem` does it for a list).
     */
    onRowMove?: TableMoveHandler;
};

export const TableBody = ({ onRowMove, className, ...props }: TableBodyProps) => (
    <RowMoveContext.Provider value={onRowMove ?? null}>
        <tbody className={className} data-slot="table-body" {...props} />
    </RowMoveContext.Provider>
);

/**
 * The sums under the lines: an optional head row of `TableHead`s naming the columns they sit in (a
 * slimmer band of the header's fill), then a row per sum on the surface with no rules between them,
 * the label muted. The total comes last, its cells given a top hairline by the caller.
 */
export const TableFooter = ({ className, ...props }: ComponentProps<'tfoot'>) => (
    <tfoot
        className={cn(
            '[&_td]:border-b-0 [&_th]:h-auto [&_th]:py-2',
            '[&_td:first-child]:text-neutral-700',
            className,
        )}
        data-slot="table-footer"
        {...props}
    />
);

const tableRowVariants = cva('', {
    variants: {
        variant: {
            // A plain <tr>, so the caller marks selection: data-selected, or data-state="selected" as
            // before the move to Base UI and in shadcn tables. Both keep working. Selection is the
            // selected wash, and hover leaves a selected row as it is rather than paling it.
            ruled: 'transition-colors duration-150 data-selected:bg-selected data-[state=selected]:bg-selected [tbody>&]:not-data-selected:hover:bg-neutral-950/3 data-dragging:relative data-dragging:z-10 data-dragging:bg-neutral-50 data-dragging:shadow-[0_0_0_1px_var(--color-neutral-200),var(--shadow-float)]',
            rows: '',
        },
    },
});

export const TableRow = ({ className, ...props }: ComponentProps<'tr'>) => {
    const variant = useContext(TableContext);
    // The row a fold hangs from, or a row a fold has just shown.
    const fold = useContext(FoldContext);
    const folded = useContext(FoldedContext);

    return (
        <tr
            className={cn(
                tableRowVariants({ variant }),
                // Rows a fold shows fade in, so they read as come from the row above.
                folded &&
                    'starting:opacity-0 transition-[background-color,opacity] duration-200 ease-out-strong',
                className,
            )}
            data-folded={folded || undefined}
            data-open={fold?.open || undefined}
            data-slot="table-row"
            {...props}
        />
    );
};

export type TableGroupRowProps = ComponentProps<'tr'> & {
    /** Columns the header spans; more than the table has is harmless. */
    colSpan?: number;
    /** Muted note after the title, wrapped in parentheses. */
    hint?: ReactNode;
};

/** Phase header from the email sequencing table: a muted full-width row above its steps. */
export const TableGroupRow = ({
    colSpan = 100,
    hint,
    className,
    children,
    ...props
}: TableGroupRowProps) => (
    <tr className={className} data-slot="table-group-row" {...props}>
        <td
            className="h-control border-neutral-200 border-b bg-neutral-100 px-3 py-2 text-left font-normal text-neutral-700 text-xs"
            colSpan={colSpan}
        >
            {/* One centred line: a title with an icon and the smaller hint beside it share a middle. */}
            <span className="flex items-center gap-1">
                {children}
                {hint != null && <span className="text-neutral-600 text-xxs">({hint})</span>}
            </span>
        </td>
    </tr>
);

export const TableCaption = ({ className, ...props }: ComponentProps<'caption'>) => (
    <caption
        className={cn('caption-bottom px-3 py-2 text-left text-neutral-600 text-xs', className)}
        data-slot="table-caption"
        {...props}
    />
);
