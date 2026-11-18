'use client';

import { ChevronRight } from 'lucide-react';
import {
    Children,
    type ComponentProps,
    isValidElement,
    type ReactNode,
    useContext,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { focusRing, touchTarget } from './button';
import {
    cellPad,
    FoldContext,
    FoldedContext,
    guideGap,
    halfControl,
    treeStepVar as step,
    TableContext,
    type Tree,
    TreeContext,
    tableCellVariants,
} from './table-context';

/* ---------- The guide line ---------- */

type GuidePart = 'full' | 'top' | 'below' | 'toBox' | 'fromBox' | 'beside';

// Where a piece starts and ends, as top and bottom: a control's edge plus the gap is 14 from the middle.
const offControl = `calc(50% + ${halfControl + guideGap}px)`;

/**
 * A piece of a guide line in one row, centred on `x`: through the row (`full`); from its top to its
 * middle (`top`, the last child with nothing at the line's x); from 4 under the row's own chevron to its
 * foot (`below`, shown only while the rows a fold shows follow it); from the top to 4 over the row's box
 * (`toBox`) and from 4 under it to the foot (`fromBox`), when the box sits on the line.
 */
const Guide = ({ x, part }: { x: string; part: GuidePart }) => (
    <span
        aria-hidden
        className={cn(
            'pointer-events-none absolute w-px bg-neutral-200',
            (part === 'full' || part === 'top' || part === 'toBox') && '-top-px',
            (part === 'full' || part === 'below' || part === 'fromBox') && '-bottom-px',
            part === 'top' && 'bottom-1/2',
            // Beside a panel, down to 16 over its foot: the line ends with its content, not at its middle.
            part === 'beside' && '-top-px bottom-4',
            part === 'below' && 'hidden [tr:has(+tr[data-folded])>td>&]:block',
        )}
        data-slot="table-guide"
        style={{
            left: `calc(${x} - 0.5px)`,
            top: part === 'below' || part === 'fromBox' ? offControl : undefined,
            bottom: part === 'toBox' ? offControl : undefined,
        }}
    />
);

/** The centre of a level's chevron, from the fold column's edge: 22, then a step (`step`) a level. */
const chevronAt = (level: number) => `calc(${cellPad + halfControl}px + ${level} * ${step})`;

/** The piece of level `level`'s line a row at `depth` draws: the lines above pass by, its parent's ends at the last child. */
const guidePart = ({ depth, rails }: Tree, level: number): 'full' | 'top' | null => {
    if (level >= depth) return null;
    if (level < depth - 1) return rails[level] ? 'full' : null;
    return rails[level] ? 'full' : 'top';
};

/* ---------- The fold ---------- */

export type TableFoldProps = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** What it opens, for its chevron's name: "Instalments of INV-0142". */
    label?: string;
    /**
     * The guide line from the open chevron down through the rows it shows, threading between their
     * boxes. On by default; off, the boxes moved under the chevron show the level alone.
     */
    guides?: boolean;
    /** The row it hangs from (with a `TableFoldCell`), then a `TableFoldRows`. */
    children: ReactNode;
};

/**
 * A row that opens to what is under it. Wraps the row and what it shows, adding nothing to the
 * table itself: put it in a `TableBody` in place of the row.
 */
export const TableFold = ({
    open,
    defaultOpen = false,
    onOpenChange,
    label,
    guides = true,
    children,
}: TableFoldProps) => {
    const [own, setOwn] = useState(defaultOpen);
    const isOpen = open ?? own;
    const setOpen = (next: boolean) => {
        setOwn(next);
        onOpenChange?.(next);
    };
    return (
        <FoldContext.Provider value={{ open: isOpen, setOpen, label, guides }}>
            <FoldedContext.Provider value={false}>{children}</FoldedContext.Provider>
        </FoldContext.Provider>
    );
};

export type TableFoldTriggerProps = Omit<ComponentProps<'button'>, 'children'> & {
    /** What it opens, for its name; the fold's `label` by default. */
    label?: string;
};

/**
 * The fold's chevron: a 20 ghost button, right closed and down open. `TableFoldCell` places it; use
 * it alone only in a layout of your own. Outside a `TableFold` it renders nothing.
 */
export const TableFoldTrigger = ({ label, className, ...props }: TableFoldTriggerProps) => {
    const fold = useContext(FoldContext);
    if (!fold) return null;

    return (
        <button
            aria-expanded={fold.open}
            aria-label={label ?? fold.label}
            className={cn(
                touchTarget,
                'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-chip text-neutral-600 transition-colors duration-150 hover:bg-neutral-950/5 hover:text-neutral-950',
                focusRing,
                className,
            )}
            data-open={fold.open || undefined}
            data-slot="table-fold-trigger"
            onClick={() => fold.setOpen(!fold.open)}
            type="button"
            {...props}
        >
            <ChevronRight
                className={cn(
                    'size-4 transition-[rotate] duration-150 ease-out-strong motion-reduce:transition-none',
                    fold.open && 'rotate-90',
                )}
                strokeWidth={2}
            />
        </button>
    );
};

export type TableFoldRowsProps = {
    /**
     * The rows are a breakdown of the row above (a payout by source, a source by plan), not more of
     * the same kind: their content steps in a level (28) in every column, so no value sits under its
     * parent's and reads as a peer of it. Left-aligned content steps right, right-aligned figures step
     * left, in from the column's edge. Rows under these inherit it.
     */
    shift?: boolean;
    children: ReactNode;
};

/**
 * The rows a fold shows while open: rows of the table, at the same height, each with its own box when
 * rows are selected. A nested row's box moves into the fold column, under its parent's chevron; its
 * name (`tree` cell) steps in 28. Rows of the same kind as the row above keep every other value under
 * its head; a breakdown (`shift`) steps every column in. A nested row can fold in turn.
 */
export const TableFoldRows = ({ shift, children }: TableFoldRowsProps) => {
    const fold = useContext(FoldContext);
    const parent = useContext(TreeContext);
    if (!fold?.open) return null;
    const rows = Children.toArray(children);
    const guides = fold.guides;

    return (
        <FoldContext.Provider value={null}>
            <FoldedContext.Provider value>
                {rows.map((row, index) => (
                    <TreeContext.Provider
                        key={isValidElement(row) && row.key != null ? row.key : index}
                        value={{
                            depth: parent.depth + 1,
                            // The parent's line runs on below every child but the last.
                            rails: [...parent.rails, index < rows.length - 1],
                            guides,
                            shift: shift ?? parent.shift,
                        }}
                    >
                        {row}
                    </TreeContext.Provider>
                ))}
            </FoldedContext.Provider>
        </FoldContext.Provider>
    );
};

export type TableFoldHeadProps = ComponentProps<'tr'>;

/**
 * The head of rows that are not the same kind as the row above (an invoice's lines under the invoice):
 * the table's own head row again, as the first of the rows a fold shows, naming what each column
 * holds for the rows under it. The rows then sit on the table's columns and read against these
 * labels, not the table's. Put it first in a `TableFoldRows`, with the row's empty action cells
 * (`TableSelectCell`, `TableFoldCell`, which carries the guide line) and a `TableHead` per column, the
 * first one `tree`; a column the rows leave empty keeps an empty head.
 */
export const TableFoldHead = ({ className, ...props }: TableFoldHeadProps) => (
    <tr
        className={cn(
            // The table's head, again: its fill on every cell of the row, the action cells too.
            '[&>td]:bg-neutral-100 [&>th]:bg-neutral-100',
            'starting:opacity-0 transition-opacity duration-200 ease-out-strong',
            className,
        )}
        data-folded=""
        data-slot="table-fold-head"
        {...props}
    />
);

export type TableFoldCellProps = Omit<ComponentProps<'td'>, 'children'> & {
    /**
     * The row's selection box. A top-level row's box stays in the selection column (`TableSelectCell`);
     * a nested row's sits here, under its parent's chevron.
     */
    select?: ReactNode;
    /** Set by `TableFoldPanel`: the parent's line runs down beside the panel, not to its middle. */
    panel?: boolean;
};

/**
 * The fold column's cell: an action column after the selection column, with an empty head. A top-level
 * row shows its chevron here, 22 in, or keeps the slot empty when it does not fold. A nested row shows
 * its box here under its parent's chevron and, when it folds, its own chevron a step further in, so
 * the column grows a step a level and fits the deepest level shown. Box and chevron share the row's
 * middle. The guide line hangs from an open chevron at its centre, threads between the boxes under it
 * (4 clear of each) and ends at the last child.
 */
export const TableFoldCell = ({ select, panel, className, ...props }: TableFoldCellProps) => {
    const variant = useContext(TableContext);
    const place = useContext(TreeContext);
    const fold = useContext(FoldContext);
    const { depth } = place;
    const box = depth > 0 && select != null;
    // The controls start a step a level in, less the box's step when the box leads them: a nested
    // row's box and chevron are its parent's pair moved one step in, the same distance apart.
    const inset = depth - (box ? 1 : 0);

    return (
        <td
            className={cn(tableCellVariants({ variant }), 'relative w-11', className)}
            data-slot="table-fold-cell"
            {...props}
        >
            {place.guides &&
                place.rails.map((_, level) => {
                    const x = chevronAt(level);
                    // The parent's line meets this row's box, so it stops above it and starts again below.
                    if (box && level === depth - 1) {
                        return (
                            // biome-ignore lint/suspicious/noArrayIndexKey: one line a level.
                            <span key={level}>
                                <Guide part="toBox" x={x} />
                                {place.rails[level] && <Guide part="fromBox" x={x} />}
                            </span>
                        );
                    }
                    const found = guidePart(place, level);
                    const part = panel && found === 'top' ? 'beside' : found;
                    // biome-ignore lint/suspicious/noArrayIndexKey: one line a level.
                    return part && <Guide key={level} part={part} x={x} />;
                })}
            {fold?.open && fold.guides && <Guide part="below" x={chevronAt(depth)} />}
            <span
                className="-my-0.5 flex items-center"
                style={{
                    gap: `calc(${step} - ${halfControl * 2}px)`,
                    marginLeft: inset > 0 ? `calc(${inset} * ${step})` : undefined,
                }}
            >
                {box && select}
                {fold ? <TableFoldTrigger /> : depth === 0 && <span className="size-5 shrink-0" />}
            </span>
        </td>
    );
};

/* ---------- Anything else: a panel ---------- */

export type TableFoldPanelProps = Omit<ComponentProps<'td'>, 'colSpan'> & {
    /** The table has a selection column: the panel leaves its cell empty, as a nested row does. */
    selection?: boolean;
    /**
     * What the content is, in the table's leading columns: a title, who and when, an action. The panel
     * then splits on a column's edge, the way the table does, and the content takes the columns after.
     */
    aside?: ReactNode;
    /** The data columns the aside spans, from the first: 1 by default. */
    asideSpan?: number;
    /** Columns the content spans after the aside (or the fold column); more than the table has is harmless. */
    colSpan?: number;
};

/**
 * What folds out when it is not rows at all: a history, a diff, a form, any component. One row under
 * the open one, in a `TableFoldRows` like any other: its action cells empty and the parent's line
 * running down beside it. With an `aside`, it splits on a column's edge like the table it sits in:
 * what the content is in the leading columns, starting a step in where a child's name would, and the
 * content itself in the columns after, on their edge. Without one, the content takes every data column,
 * a step in. It grows to what it holds, 16 above and below, both sides from the top; text wraps.
 */
export const TableFoldPanel = ({
    selection,
    aside,
    asideSpan = 1,
    colSpan = 100,
    className,
    style,
    ...props
}: TableFoldPanelProps) => {
    const variant = useContext(TableContext);
    const { depth } = useContext(TreeContext);
    const cell = cn(
        tableCellVariants({ variant }),
        'h-auto whitespace-normal py-4 align-top font-normal',
    );
    const indent = { paddingLeft: `calc(var(--spacing) * 3 + ${depth} * ${step})` };

    return (
        <tr
            className="starting:opacity-0 transition-opacity duration-200 ease-out-strong"
            data-folded=""
            data-slot="table-fold-panel"
        >
            {selection && <td aria-hidden className={tableCellVariants({ variant })} />}
            <TableFoldCell panel />
            {aside !== undefined && (
                <td
                    className={cn(cell, 'text-neutral-600')}
                    colSpan={asideSpan}
                    data-slot="table-fold-aside"
                    style={indent}
                >
                    {aside}
                </td>
            )}
            <td
                className={cn(cell, 'text-neutral-800', className)}
                colSpan={colSpan}
                style={aside === undefined ? { ...indent, ...style } : style}
                {...props}
            />
        </tr>
    );
};
