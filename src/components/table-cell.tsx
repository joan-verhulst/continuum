'use client';

import { GripVertical } from 'lucide-react';
import { type ComponentProps, type KeyboardEvent, type PointerEvent, useContext } from 'react';
import { flushSync } from 'react-dom';
import { cn } from '../lib/cn';
import { pressToDrag, startReorder } from '../lib/reorder';
import { focusRing } from './button';
import { CopyButton } from './copy-button';
import {
    alignClass,
    type CellAlignProps,
    RowMoveContext,
    TableContext,
    TreeContext,
    tableCellVariants,
    treeStepVar,
} from './table-context';

export type TableCellProps = Omit<ComponentProps<'td'>, 'align'> &
    CellAlignProps & {
        /**
         * The tree's column, the first data cell of a table whose rows fold out into rows of the same
         * kind. A nested row's cell steps in 28 a level, its name in the regular weight in
         * `neutral-700`, so it is set back from its parent's and the parents stay the list's spine.
         * Only this cell steps in: its values are the same kind, so the columns after it stay under
         * their heads.
         */
        tree?: boolean;
        /**
         * A value the reader copies (an ID, an email, a key, a hash): a 24 copy button 8 after the
         * content, shown while the cell is under the pointer or the button has focus.
         */
        copy?: string;
        /** The copy button's name; "Copy" and the value by default. */
        copyLabel?: string;
    };

export const TableCell = ({
    align,
    numeric,
    optional,
    tree,
    copy,
    copyLabel,
    className,
    style,
    children,
    ...props
}: TableCellProps) => {
    const variant = useContext(TableContext);
    const { depth, shift } = useContext(TreeContext);
    const right = (align ?? (numeric ? 'right' : 'left')) === 'right';
    const nested = tree && depth > 0;
    // A breakdown's rows step every column in a level: by offset, not padding, so the columns keep
    // their widths. The tree cell steps by its padding already, and the selection cell stays put.
    const step =
        shift &&
        depth > 0 &&
        !tree &&
        (props as Record<string, unknown>)['data-slot'] !== 'table-select-cell'
            ? depth
            : 0;
    const content = (
        <CellContent copy={copy} copyLabel={copyLabel} right={right}>
            {children}
        </CellContent>
    );

    return (
        <td
            className={cn(
                tableCellVariants({ variant }),
                alignClass({ align, numeric, optional }),
                nested && 'font-normal text-neutral-700',
                copy !== undefined && 'group/cell',
                className,
            )}
            data-slot="table-cell"
            style={
                nested
                    ? {
                          paddingLeft: `calc(var(--spacing) * 3 + ${depth} * ${treeStepVar})`,
                          ...style,
                      }
                    : style
            }
            {...props}
        >
            {step > 0 ? (
                <span
                    className="relative block"
                    style={
                        right
                            ? { right: `calc(${step} * ${treeStepVar})` }
                            : { left: `calc(${step} * ${treeStepVar})` }
                    }
                >
                    {content}
                </span>
            ) : (
                content
            )}
        </td>
    );
};

const CellContent = ({
    copy,
    copyLabel,
    right,
    children,
}: Pick<TableCellProps, 'copy' | 'copyLabel' | 'children'> & { right: boolean }) =>
    copy === undefined ? (
        children
    ) : (
        // The button keeps its room while hidden, so nothing moves when it shows; on a
        // right-aligned cell it goes first, so the figures stay flush with the column.
        <span
            className={cn(
                // 8 between the value and the button, so the button reads as a control beside it.
                'inline-flex max-w-full items-center gap-2 align-top',
                right && 'flex-row-reverse',
            )}
        >
            <span className="min-w-0 truncate">{children}</span>
            <CopyButton
                aria-label={copyLabel ?? `Copy ${copy}`}
                className="-my-1 opacity-0 pointer-coarse:opacity-100 focus-visible:opacity-100 group-hover/cell:opacity-100 data-copied:opacity-100"
                text={copy}
            />
        </span>
    );

/**
 * The selection column's cell: the row's box, on the row's middle. A row nested under a fold leaves
 * it empty, since its box moves into the fold column under its parent's chevron (pass the same box
 * to that row's `TableTreeCell` as `select`).
 */
export const TableSelectCell = ({ children, ...props }: TableCellProps) => {
    const { depth } = useContext(TreeContext);

    return (
        <TableCell data-slot="table-select-cell" {...props}>
            {depth === 0 ? children : null}
        </TableCell>
    );
};

export type TableDragCellProps = Omit<TableCellProps, 'children'> & {
    /** The grip's name: "Move" and the row's name, so a screen reader knows which row it moves. */
    label?: string;
};

/** The rows of a body that can be moved, in order: the ones with a grip. */
const gripRows = (body: HTMLTableSectionElement) =>
    Array.from(body.rows).filter(row => row.querySelector('[data-slot=table-drag]'));

/**
 * The grip column's cell: a 14 grip in `neutral-500` that shows under the pointer or focus (always on
 * touch), so a list that can be reordered reads as plain as one that cannot. Pressed, the row lifts
 * and follows the pointer, and the rows it passes step aside; ↑ ↓ with focus on the grip move it a
 * place. Needs `onRowMove` on the `TableBody`. A row nested under a fold has none: it moves with
 * its parent.
 */
export const TableDragCell = ({ label = 'Move row', className, ...props }: TableDragCellProps) => {
    const onRowMove = useContext(RowMoveContext);
    const { depth } = useContext(TreeContext);

    const placeOf = (grip: HTMLElement) => {
        const row = grip.closest('tr');
        const body = row?.parentElement;
        if (!row || !(body instanceof HTMLTableSectionElement)) return null;
        const rows = gripRows(body);
        return { row, rows, index: rows.indexOf(row) };
    };

    const down = (event: PointerEvent<HTMLButtonElement>) => {
        if (!onRowMove || event.button !== 0) return;
        const place = placeOf(event.currentTarget);
        if (!place) return;
        event.preventDefault();
        // The row lifts once the pointer has moved, so a press that stays put lifts nothing.
        pressToDrag(
            event,
            'y',
            from =>
                startReorder({
                    axis: 'y',
                    items: place.rows.map(row => {
                        const box = row.getBoundingClientRect();
                        return { nodes: [row], start: box.top, size: box.height };
                    }),
                    index: place.index,
                    from,
                    onMove: onRowMove,
                }),
            3,
        );
    };

    const key = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!onRowMove || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
        const place = placeOf(event.currentTarget);
        if (!place) return;
        const to = place.index + (event.key === 'ArrowUp' ? -1 : 1);
        if (to < 0 || to >= place.rows.length) return;
        event.preventDefault();
        const grip = event.currentTarget;
        flushSync(() => onRowMove(place.index, to));
        // The row may have been taken out and put back, which drops focus: it stays on the grip.
        grip.focus();
    };

    return (
        <TableCell className={cn('w-11', className)} data-slot="table-drag-cell" {...props}>
            {depth === 0 && onRowMove && (
                <button
                    aria-label={label}
                    className={cn(
                        // A 20 by 28 target, lending 6 of the padding above and below like the row's
                        // ellipsis, so the row stays 41.
                        '-my-1.5 -ml-1 flex h-7 w-5 cursor-grab touch-none items-center justify-center rounded-chip text-neutral-500 transition-[opacity,color,background-color] duration-150',
                        'opacity-0 pointer-coarse:opacity-100 focus-visible:opacity-100 [tr:hover_&]:opacity-100 [tr[data-dragging]_&]:opacity-100',
                        'hover:bg-neutral-950/5 hover:text-neutral-900 [tr[data-dragging]_&]:cursor-grabbing [tr[data-dragging]_&]:text-neutral-900',
                        focusRing,
                    )}
                    data-slot="table-drag"
                    onKeyDown={key}
                    onPointerDown={down}
                    title="Drag, or ↑ ↓ to move"
                    type="button"
                >
                    <GripVertical className="size-3.5" strokeWidth={2} />
                </button>
            )}
        </TableCell>
    );
};
