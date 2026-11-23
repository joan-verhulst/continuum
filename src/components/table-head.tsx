'use client';

import { ArrowUp, ChevronsUpDown, GripVertical } from 'lucide-react';
import {
    type ComponentProps,
    type KeyboardEvent,
    type PointerEvent,
    type RefObject,
    useContext,
    useRef,
    useState,
} from 'react';
import { flushSync } from 'react-dom';
import { cn } from '../lib/cn';
import { holdPointer, pressToDrag, type ReorderItem, startReorder } from '../lib/reorder';
import { focusRing } from './button';
import {
    alignClass,
    type CellAlignProps,
    ColumnMoveContext,
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
         * The tree's column, in a fold's own head (`TableTreeHead`): it steps in with the rows under
         * it, a step a level, so the head's first label starts where their names do.
         */
        tree?: boolean;
        /** The column's width in px, for a column the reader resizes. */
        width?: number;
        /**
         * Makes the column resizable: a handle on the head's right edge, dragged or moved with the
         * arrow keys (8 a press, 32 with Shift); a double click fits the column to its widest value.
         * A table with a resizable column lays its columns out by their widths. A resizable column
         * with no `width` yet (the name) takes the room the others leave, until it is resized
         * itself; once every column has a width, the table is as wide as they add up to.
         */
        onWidthChange?: (width: number) => void;
        /** The narrowest the column goes; never under its label. 48 by default. */
        minWidth?: number;
        /**
         * Lets the column be dragged to another place along the head row, by the head or by the grip
         * that shows in its left padding under the pointer (← → on the grip move it a place). Needs
         * `onColumnMove` on the `TableHeader`; the place it hands over counts only the movable heads.
         */
        movable?: boolean;
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

/** The cells of the column a head stands over, in every row laid out one cell a column. */
const columnCells = (head: HTMLTableCellElement) => {
    const table = head.closest('table');
    const row = head.parentElement as HTMLTableRowElement | null;
    if (!table || !row) return [head];
    return Array.from(table.rows)
        .filter(each => each.cells.length === row.cells.length)
        .map(each => each.cells[head.cellIndex])
        .filter((cell): cell is HTMLTableCellElement => cell !== undefined);
};

/** The width a head's own label needs, with the cell's padding: a column never goes under it. */
const labelWidth = (head: HTMLTableCellElement) => {
    // The label alone: the grip and the resize handle sit in the padding and the edge.
    let left = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    for (const node of Array.from(head.childNodes)) {
        if (
            node instanceof HTMLElement &&
            (node.dataset.slot === 'table-column-drag' || node.dataset.slot === 'table-resize')
        )
            continue;
        const range = document.createRange();
        range.selectNode(node);
        const box = range.getBoundingClientRect();
        if (box.width === 0) continue;
        left = Math.min(left, box.left);
        right = Math.max(right, box.right);
    }
    const style = getComputedStyle(head);
    return (
        Math.ceil(right > left ? right - left : 0) +
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight)
    );
};

const ResizeHandle = ({
    head,
    width,
    minWidth = 48,
    onWidthChange,
    label,
}: {
    head: RefObject<HTMLTableCellElement | null>;
    width?: number;
    minWidth?: number;
    onWidthChange: (width: number) => void;
    label: string;
}) => {
    const [active, setActive] = useState(false);
    const floor = () => (head.current ? Math.max(minWidth, labelWidth(head.current)) : minWidth);
    // The edge being moved is marked down the whole column, so the reader sees what it is cutting.
    const mark = (on: boolean) => {
        if (!head.current) return;
        for (const cell of columnCells(head.current)) {
            if (on) cell.dataset.resizing = '';
            else delete cell.dataset.resizing;
        }
    };

    const down = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !head.current) return;
        event.preventDefault();
        event.stopPropagation();
        const start = event.clientX;
        const from = head.current.offsetWidth;
        const min = floor();
        const release = holdPointer('col-resize');
        setActive(true);
        mark(true);
        const move = (next: globalThis.PointerEvent) =>
            onWidthChange(Math.max(min, Math.round(from + next.clientX - start)));
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            release();
            setActive(false);
            mark(false);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
    };

    const key = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        event.stopPropagation();
        const step = (event.shiftKey ? 32 : 8) * (event.key === 'ArrowLeft' ? -1 : 1);
        const now = width ?? head.current?.offsetWidth ?? minWidth;
        onWidthChange(Math.max(floor(), now + step));
    };

    // A double click fits the column to the widest thing in it, its label included.
    const fit = () => {
        if (!head.current) return;
        const widest = Math.max(
            ...columnCells(head.current).map(cell =>
                cell === head.current ? labelWidth(cell) : cell.scrollWidth,
            ),
        );
        onWidthChange(Math.max(floor(), Math.ceil(widest)));
    };

    return (
        // biome-ignore lint/a11y/useSemanticElements: a focusable separator is the ARIA pattern for a resize handle; an hr takes no focus.
        <div
            aria-label={`Resize ${label}`}
            aria-orientation="vertical"
            aria-valuemin={minWidth}
            aria-valuenow={width ?? 0}
            className={cn(
                // 8 of target inside the head's right edge; the line drawn on the edge itself.
                'absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none outline-none',
                'after:absolute after:inset-y-3 after:right-0 after:w-px after:bg-neutral-300 after:opacity-0 after:transition-[opacity,background-color,width,top,bottom] after:duration-150 after:content-[""]',
                // Under the pointer the head shows where its edge is; on the edge, or moving it, the
                // accent runs the head's full height and down the column.
                'group-hover/head:after:opacity-100',
                'hover:after:inset-y-0 hover:after:w-0.5 hover:after:bg-primary-500 hover:after:opacity-100',
                'focus-visible:after:inset-y-0 focus-visible:after:w-0.5 focus-visible:after:bg-primary-500 focus-visible:after:opacity-100',
                active && 'after:inset-y-0 after:w-0.5 after:bg-primary-500 after:opacity-100',
            )}
            data-slot="table-resize"
            onDoubleClick={fit}
            onKeyDown={key}
            onPointerDown={down}
            role="separator"
            tabIndex={0}
        />
    );
};

export const TableHead = ({
    align,
    numeric,
    optional,
    sort = 'none',
    onSortChange,
    sortFirst,
    tree,
    width,
    onWidthChange,
    minWidth,
    movable,
    className,
    style,
    children,
    ...props
}: TableHeadProps) => {
    const variant = useContext(TableContext);
    const { depth } = useContext(TreeContext);
    const onColumnMove = useContext(ColumnMoveContext);
    const ref = useRef<HTMLTableCellElement>(null);
    const sortable = onSortChange !== undefined;
    const moves = movable === true && onColumnMove !== null;
    const right = (align ?? (numeric ? 'right' : 'left')) === 'right';
    const name = typeof children === 'string' ? children : 'column';

    // The movable heads of this head row, in order.
    const movableHeads = () => {
        const row = ref.current?.parentElement;
        if (!row) return [];
        return Array.from(row.children).filter(
            (cell): cell is HTMLTableCellElement =>
                cell instanceof HTMLTableCellElement && cell.dataset.movable !== undefined,
        );
    };

    const drag = (event: PointerEvent<HTMLTableCellElement>) => {
        if (!onColumnMove || event.button !== 0 || !ref.current) return;
        if ((event.target as HTMLElement).closest('[data-slot=table-resize]')) return;
        const heads = movableHeads();
        const index = heads.indexOf(ref.current);
        pressToDrag(event, 'x', from => {
            const items: ReorderItem[] = heads.map(head => {
                const box = head.getBoundingClientRect();
                return { nodes: columnCells(head), start: box.left, size: box.width };
            });
            startReorder({ axis: 'x', items, index, from, onMove: onColumnMove });
        });
    };

    // ← → on the grip move the column a place, as ↑ ↓ on a row's grip move the row.
    const key = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!onColumnMove || !ref.current) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        const heads = movableHeads();
        const index = heads.indexOf(ref.current);
        const to = index + (event.key === 'ArrowLeft' ? -1 : 1);
        if (to < 0 || to >= heads.length) return;
        event.preventDefault();
        const grip = event.currentTarget;
        flushSync(() => onColumnMove(index, to));
        // The head may have been taken out and put back, which drops focus: it stays on the grip.
        grip.focus();
    };

    return (
        <th
            aria-sort={sortable ? sort : undefined}
            className={cn(
                tableHeadVariants({ variant }),
                alignClass({ align, numeric, optional }),
                (onWidthChange || moves) && 'group/head relative',
                // The head is what is picked up: the grab hand over it (a sortable label keeps the
                // pointer, since a click there sorts).
                moves && 'cursor-grab select-none',
                className,
            )}
            // The column without a width yet: it takes the room the others leave.
            data-flex={(onWidthChange && width === undefined) || undefined}
            data-movable={moves || undefined}
            data-slot="table-head"
            data-sorted={(sortable && sort !== 'none') || undefined}
            onPointerDown={moves ? drag : undefined}
            ref={ref}
            scope="col"
            style={{
                ...(width !== undefined && { width }),
                ...(tree &&
                    depth > 0 && {
                        paddingLeft: `calc(var(--spacing) * 3 + ${depth} * ${treeStepVar})`,
                    }),
                ...style,
            }}
            {...props}
        >
            {moves && (
                <button
                    aria-label={`Move ${name}`}
                    className={cn(
                        // In the head's left padding, so the label never moves: a 14 grip on a 12
                        // by 28 target, its dots 3 to 7 in from the edge, 5 clear of the label.
                        'absolute inset-y-0 -left-0.5 my-auto flex h-7 w-3 cursor-grab touch-none items-center justify-center rounded-chip text-neutral-500 transition-[opacity,color] duration-150',
                        'opacity-0 pointer-coarse:opacity-100 focus-visible:opacity-100 group-hover/head:opacity-100 group-data-dragging/head:opacity-100',
                        'hover:text-neutral-900 group-data-dragging/head:text-neutral-900',
                        focusRing,
                        'focus-visible:outline-offset-0',
                    )}
                    data-slot="table-column-drag"
                    onKeyDown={key}
                    title="Drag, or ← → to move"
                    type="button"
                >
                    <GripVertical className="size-3.5 shrink-0" strokeWidth={2} />
                </button>
            )}
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
            {onWidthChange && (
                <ResizeHandle
                    head={ref}
                    label={name}
                    minWidth={minWidth}
                    onWidthChange={onWidthChange}
                    width={width}
                />
            )}
        </th>
    );
};

// One line a cell: a narrow table scrolls rather than folding its rows into two-line ones. A second
// line of meta under a name still stacks, as a block of its own.
