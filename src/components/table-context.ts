'use client';

import { cva } from 'class-variance-authority';
import { createContext } from 'react';
import { cn } from '../lib/cn';

/*
 * What the table's parts share: the look they are drawn in, where a row sits in a fold, and the cell
 * styles a head, a cell and a fold's cells have in common. Internal: the parts are the API.
 */

export type TableVariant = 'ruled' | 'rows';

export const TableContext = createContext<TableVariant>('ruled');

/* ---------- Folds ---------- */

export type FoldState = {
    open: boolean;
    setOpen: (open: boolean) => void;
    label?: string;
    /** Whether the line hangs from the open chevron through the rows it shows. */
    guides: boolean;
};

// The fold whose head row this is; reset to none for the rows and panel it shows.
export const FoldContext = createContext<FoldState | null>(null);
// Whether a row was shown by a fold, so it can come in.
export const FoldedContext = createContext(false);

/**
 * Where a row sits in a tree: its level; for each level above, whether that level's line runs on
 * below it; and whether the lines are drawn at all.
 */
export type Tree = {
    depth: number;
    rails: boolean[];
    guides: boolean;
    /** Whether the rows at this depth are a breakdown, their content stepped in a level a column. */
    shift: boolean;
};

export const TreeContext = createContext<Tree>({ depth: 0, rails: [], guides: true, shift: false });

/*
 * A tree's level is one step: the distance from a row's box to its chevron, so a nested row's box
 * and chevron are its parent's pair moved one step in, the same distance apart. With a selection
 * column that is the column's width, 44 (the table sets `--tree-step` when it has one); without, a
 * 20 chevron and the 8 after it, 28. A nested row's box sits under its parent's chevron, its own
 * chevron a step further in, and its name a step further in than its parent's.
 */
export const treeStepVar = 'var(--tree-step, 28px)';
// A cell's inset, and half a 20 control: the first control's centre sits 22 into its cell.
export const cellPad = 12;
export const halfControl = 10;
// How far a guide line stops short of a control above or below it.
export const guideGap = 4;

/* ---------- Cells ---------- */

export type CellAlignProps = {
    align?: 'left' | 'right';
    /** Tabular figures, right aligned. */
    numeric?: boolean;
    /**
     * A column the table can do without (an owner, a last seen): it goes once the frame is under
     * 640, so the essential columns keep their room. Mark the head and every cell of the column.
     */
    optional?: boolean;
};

export const alignClass = ({ align, numeric, optional }: CellAlignProps) =>
    cn(
        numeric && 'tabular-nums',
        optional && '@max-[640px]/table:hidden',
        (align ?? (numeric ? 'right' : 'left')) === 'right' ? 'text-right' : 'text-left',
    );

// A box alone in a cell sits as a block on the cell's middle, 2 over the line above and below, so it
// neither grows the row nor rides the text's baseline: its centre is the row's, as a fold chevron's is.
const boxInCell = '[&>[data-slot=checkbox]]:-my-0.5 [&>[data-slot=checkbox]]:flex';
// A badge (22) is taller than the cell's line (16): it lends 3 of the padding above and below, so a
// row with a status in it is as tall as one without, 41, and rows of a fold match the row they hang from.
const badgeInCell = '[&_[data-slot=badge]]:-my-0.75 [&_[data-slot=badge]]:align-middle';
// A small icon button (28: a row's ellipsis, a copy) lends 6 of the padding above and below the same
// way, so the row stays 41, also when a menu trigger renders it. A larger button is the wrong size for a
// row and still shows as one.
const buttonInCell = '[&_[data-size=icon-sm]]:-my-1.5 [&_[data-size=icon-sm]]:align-middle';

export const tableHeadVariants = cva(['whitespace-nowrap font-normal text-xs', boxInCell], {
    variants: {
        variant: {
            ruled: 'h-table-row border-neutral-200 border-b bg-neutral-100 p-3 text-neutral-600',
            rows: 'px-3 py-0.5 text-neutral-700',
        },
    },
});

// One line a cell: a narrow table scrolls rather than folding its rows into two-line ones. A second
// line of meta under a name still stacks, as a block of its own.
export const tableCellVariants = cva(
    ['whitespace-nowrap text-xs', boxInCell, badgeInCell, buttonInCell],
    {
        variants: {
            variant: {
                ruled: 'h-table-row border-neutral-200 border-b p-3 font-medium text-neutral-900',
                // A translucent fill, so the rows read on the surface and on the canvas alike.
                rows: 'h-control bg-neutral-950/4 px-3 py-2 font-normal text-neutral-600 first:rounded-l-control last:rounded-r-control first:text-neutral-800',
            },
        },
    },
);
