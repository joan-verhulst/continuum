'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Search } from 'lucide-react';
import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { cn } from '../lib/cn';
import { useOverflowScroll } from '../lib/overflow-scroll';
import { Input, type InputProps } from './input';

type TableVariant = 'ruled' | 'rows';

const TableContext = createContext<TableVariant>('ruled');

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
                    className="w-full overflow-x-auto"
                    data-slot="table-scroller"
                    ref={ref}
                    style={edges.overflows ? style : undefined}
                >
                    <table
                        className={cn(tableVariants({ variant: value }), className)}
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

export const TableHeader = ({ className, ...props }: ComponentProps<'thead'>) => (
    <thead className={className} data-slot="table-header" {...props} />
);

export const TableBody = ({ className, ...props }: ComponentProps<'tbody'>) => (
    <tbody className={className} data-slot="table-body" {...props} />
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
            ruled: 'transition-colors duration-150 data-selected:bg-selected data-[state=selected]:bg-selected [tbody>&]:not-data-selected:hover:bg-neutral-950/3',
            rows: '',
        },
    },
});

export const TableRow = ({ className, ...props }: ComponentProps<'tr'>) => {
    const variant = useContext(TableContext);

    return (
        <tr
            className={cn(tableRowVariants({ variant }), className)}
            data-slot="table-row"
            {...props}
        />
    );
};

type CellAlignProps = {
    align?: 'left' | 'right';
    /** Tabular figures, right aligned. */
    numeric?: boolean;
    /**
     * A column the table can do without (an owner, a last seen): it goes once the frame is under
     * 640, so the essential columns keep their room. Mark the head and every cell of the column.
     */
    optional?: boolean;
};

const alignClass = ({ align, numeric, optional }: CellAlignProps) =>
    cn(
        numeric && 'tabular-nums',
        optional && '@max-[640px]/table:hidden',
        (align ?? (numeric ? 'right' : 'left')) === 'right' ? 'text-right' : 'text-left',
    );

const tableHeadVariants = cva('whitespace-nowrap font-normal text-xs', {
    variants: {
        variant: {
            ruled: 'h-table-row border-neutral-200 border-b bg-neutral-100 p-3 text-neutral-600',
            rows: 'px-3 py-0.5 text-neutral-700',
        },
    },
});

export type TableHeadProps = Omit<ComponentProps<'th'>, 'align'> & CellAlignProps;

export const TableHead = ({ align, numeric, optional, className, ...props }: TableHeadProps) => {
    const variant = useContext(TableContext);

    return (
        <th
            className={cn(
                tableHeadVariants({ variant }),
                alignClass({ align, numeric, optional }),
                className,
            )}
            data-slot="table-head"
            scope="col"
            {...props}
        />
    );
};

// One line a cell: a narrow table scrolls rather than folding its rows into two-line ones. A second
// line of meta under a name still stacks, as a block of its own.
const tableCellVariants = cva('whitespace-nowrap text-xs', {
    variants: {
        variant: {
            ruled: 'h-table-row border-neutral-200 border-b p-3 font-medium text-neutral-900',
            // A translucent fill, so the rows read on the surface and on the canvas alike.
            rows: 'h-control bg-neutral-950/4 px-3 py-2 font-normal text-neutral-600 first:rounded-l-control last:rounded-r-control first:text-neutral-800',
        },
    },
});

export type TableCellProps = Omit<ComponentProps<'td'>, 'align'> & CellAlignProps;

export const TableCell = ({ align, numeric, optional, className, ...props }: TableCellProps) => {
    const variant = useContext(TableContext);

    return (
        <td
            className={cn(
                tableCellVariants({ variant }),
                alignClass({ align, numeric, optional }),
                className,
            )}
            data-slot="table-cell"
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
            {children}
            {hint != null && <span className="ml-1 text-neutral-600 text-xxs">({hint})</span>}
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
