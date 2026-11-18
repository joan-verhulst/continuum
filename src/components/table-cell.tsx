'use client';

import { type ComponentProps, useContext } from 'react';
import { cn } from '../lib/cn';
import { CopyButton } from './copy-button';
import {
    alignClass,
    type CellAlignProps,
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
 * to that row's `TableFoldCell` as `select`).
 */
export const TableSelectCell = ({ children, ...props }: TableCellProps) => {
    const { depth } = useContext(TreeContext);

    return (
        <TableCell data-slot="table-select-cell" {...props}>
            {depth === 0 ? children : null}
        </TableCell>
    );
};
