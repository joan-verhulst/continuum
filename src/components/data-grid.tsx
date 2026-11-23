'use client';

import {
    type ClipboardEvent,
    type ComponentProps,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { holdPointer } from '../lib/reorder';

/*
 * A grid of values worked on cell by cell, the way a spreadsheet is: where a Table is a list of
 * objects read a row at a time, here every cell is its own value, and the reader selects a range of
 * them, types over them, pastes into them and drags a fill down them.
 */

export type DataGridColumn = {
    /** The column's name; a letter (A, B, …) when left out. */
    label?: string;
    /** Its width in px, 112 by default; the reader resizes it from the head's right edge. */
    width?: number;
    /** Left by default; a cell that holds a number goes right on its own. */
    align?: 'left' | 'right';
};

/** A block of cells, by row and column index, both ends included. */
export type DataGridRange = { top: number; left: number; bottom: number; right: number };

type Cell = { row: number; col: number };
type Selection = { anchor: Cell; focus: Cell };
type Edit = Cell & { draft: string; mode: 'replace' | 'edit' };

export type DataGridProps = Omit<ComponentProps<'div'>, 'children' | 'onChange'> & {
    /** The grid's name, for a screen reader. */
    label: string;
    /** The values, a row at a time. */
    values: string[][];
    /** Makes the grid editable: called with the whole grid after each edit, paste, fill or undo. */
    onValuesChange?: (values: string[][]) => void;
    /** The columns; left out, as many lettered columns as the widest row has values. */
    columns?: DataGridColumn[];
    /** Called as the selection changes, with its range and the cell it started from. */
    /**
     * Called as the selection changes, with the block being made, the cell it started from, and
     * every selected block (those added with Ctrl or ⌘ first, this one last).
     */
    onSelectionChange?: (range: DataGridRange, active: Cell, ranges: DataGridRange[]) => void;
    /** Inside the frame under the grid, ruled off: a sum of the selection, a count. */
    footer?: ReactNode;
    /**
     * Inside the frame over the column heads, ruled off: what works on this grid (a scenario, a
     * view, where it stands), as a `TableToolbar` on a table. It stays put while the grid scrolls.
     */
    toolbar?: ReactNode;
    /**
     * The last rows are the sheet's summary (a total, a target, a gap): set apart from the rows they
     * sum by a firmer rule over the first, and written in 500, as a spreadsheet writes its totals.
     */
    summaryRows?: number;
};

const ROW_HEAD = 44;
const COLUMN_WIDTH = 112;
const MIN_WIDTH = 40;

const letter = (index: number): string =>
    index < 26
        ? String.fromCharCode(65 + index)
        : letter(Math.floor(index / 26) - 1) + letter(index % 26);

const rangeOf = ({ anchor, focus }: Selection): DataGridRange => ({
    top: Math.min(anchor.row, focus.row),
    bottom: Math.max(anchor.row, focus.row),
    left: Math.min(anchor.col, focus.col),
    right: Math.max(anchor.col, focus.col),
});

const within = (range: DataGridRange, row: number, col: number) =>
    row >= range.top && row <= range.bottom && col >= range.left && col <= range.right;

/** A plain number ("12", "-3.5", "1,250", "€ 40", "12%"): set right and in tabular figures. */
const looksNumeric = (value: string) => /^[-+]?[€$£]?\s?\d[\d.,]*\s?%?$/.test(value.trim());

/** A value a series can run on: a bare number. */
const asNumber = (value: string) => {
    const trimmed = value.trim();
    return /^[-+]?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : null;
};

const decimals = (value: string) => value.trim().split('.')[1]?.length ?? 0;

/**
 * The values a fill writes at `offset` steps from the start of its source (negative before it): a
 * run of two or more numbers a constant step apart carries on as a series, anything else repeats.
 */
const fillValue = (source: string[], offset: number) => {
    const numbers = source.map(asNumber);
    if (source.length >= 2 && numbers.every(n => n !== null)) {
        const list = numbers as number[];
        const step = (list[1] ?? 0) - (list[0] ?? 0);
        const even = list.every(
            (n, i) => i === 0 || Math.abs(n - (list[i - 1] ?? 0) - step) < 1e-9,
        );
        if (even) {
            const places = Math.max(...source.map(decimals));
            return ((list[0] ?? 0) + offset * step).toFixed(places);
        }
    }
    const n = source.length;
    return source[((offset % n) + n) % n] ?? '';
};

/** Text from a clipboard as rows of cells: tab between cells, a line a row. */
const parseClipboard = (text: string) => {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    if (lines.length > 1 && lines.at(-1) === '') lines.pop();
    return lines.map(line => line.split('\t'));
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const DataGrid = ({
    label,
    values,
    onValuesChange,
    columns,
    onSelectionChange,
    footer,
    toolbar,
    summaryRows = 0,
    className,
    ...props
}: DataGridProps) => {
    const id = useId();
    const rows = values.length;
    const cols = columns?.length ?? Math.max(0, ...values.map(row => row.length));
    const editable = onValuesChange !== undefined;

    const [widths, setWidths] = useState(() =>
        Array.from({ length: cols }, (_, i) => columns?.[i]?.width ?? COLUMN_WIDTH),
    );
    // A row without a height of its own is the cell height, so it follows the theme's size.
    const [heights, setHeights] = useState<(number | undefined)[]>([]);
    const [selection, setSelectionState] = useState<Selection>({
        anchor: { row: 0, col: 0 },
        focus: { row: 0, col: 0 },
    });
    // Blocks added with Ctrl or ⌘ before the one being made now.
    const [extra, setExtra] = useState<DataGridRange[]>([]);
    const [edit, setEdit] = useState<Edit | null>(null);
    // The cells a fill handle drag will write, while it is dragged.
    const [fill, setFill] = useState<DataGridRange | null>(null);
    const history = useRef<{ past: string[][][]; future: string[][][] }>({ past: [], future: [] });

    const table = useRef<HTMLTableElement>(null);
    const grid = useRef<HTMLDivElement>(null);
    const ended = useRef(false);
    const rangeBox = useRef<HTMLDivElement>(null);
    const activeBox = useRef<HTMLDivElement>(null);
    const fillBox = useRef<HTMLDivElement>(null);
    const editor = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const scroller = useRef<HTMLDivElement>(null);

    // The width the grid has to fill: the columns never end short of the frame (see `shown`).
    const [room, setRoom] = useState(0);
    useLayoutEffect(() => {
        const node = scroller.current;
        if (!node) return;
        const measure = () => setRoom(node.clientWidth);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // Columns added later take the default width.
    if (widths.length < cols)
        setWidths(current => [
            ...current,
            ...Array.from(
                { length: cols - current.length },
                (_, i) => columns?.[current.length + i]?.width ?? COLUMN_WIDTH,
            ),
        ]);

    const range = rangeOf(selection);
    const active = selection.anchor;
    const many = range.top !== range.bottom || range.left !== range.right;
    const valueAt = (row: number, col: number) => values[row]?.[col] ?? '';

    // Picking a selection; the blocks added before it with Ctrl or ⌘ stay unless told otherwise.
    const setSelection = (next: Selection, others: DataGridRange[] = extra) => {
        setSelectionState(next);
        setExtra(others);
        onSelectionChange?.(rangeOf(next), next.anchor, [...others, rangeOf(next)]);
    };
    const selected = (row: number, col: number) =>
        within(range, row, col) || extra.some(block => within(block, row, col));
    // More than the one cell: a block, or blocks added to it.
    const multi = many || extra.length > 0;

    const cellNode = (row: number, col: number) =>
        grid.current?.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`) ?? null;

    /** A range's box in the grid, its edges on the grid lines around it. */
    const boxOf = (block: DataGridRange) => {
        const first = cellNode(block.top, block.left);
        const last = cellNode(block.bottom, block.right);
        const frame = grid.current?.getBoundingClientRect();
        if (!first || !last || !frame) return null;
        const a = first.getBoundingClientRect();
        const b = last.getBoundingClientRect();
        // A cell's own rule is on its right and bottom: the box starts on the rule before it.
        return {
            left: a.left - frame.left - 1,
            top: a.top - frame.top - 1,
            width: b.right - a.left + 1,
            height: b.bottom - a.top + 1,
        };
    };

    // The selection's marks are drawn over the cells, from where the cells really are.
    useLayoutEffect(() => {
        const place = (node: HTMLElement | null, block: DataGridRange | null) => {
            if (!node) return;
            const box = block && boxOf(block);
            node.style.display = box ? '' : 'none';
            if (!box) return;
            node.style.left = `${box.left}px`;
            node.style.top = `${box.top}px`;
            node.style.width = `${box.width}px`;
            node.style.height = `${box.height}px`;
        };
        const one = { top: active.row, bottom: active.row, left: active.col, right: active.col };
        place(rangeBox.current, many ? range : null);
        grid.current
            ?.querySelectorAll<HTMLElement>('[data-slot=data-grid-extra]')
            .forEach((node, i) => {
                place(node, extra[i] ?? null);
            });
        place(activeBox.current, rows && cols ? one : null);
        place(fillBox.current, fill);
        place(editor.current, edit ? one : null);
    });

    /* ---------- Changing values ---------- */

    const commit = (next: string[][]) => {
        if (!onValuesChange) return;
        history.current.past.push(values);
        history.current.future = [];
        onValuesChange(next);
    };

    const write = (changes: { row: number; col: number; value: string }[]) => {
        const next = values.map(row => [...row]);
        let changed = false;
        for (const { row, col, value } of changes) {
            if (row >= rows || col >= cols) continue;
            const line = next[row] ?? [];
            if ((line[col] ?? '') === value) continue;
            while (line.length < col) line.push('');
            line[col] = value;
            next[row] = line;
            changed = true;
        }
        if (changed) commit(next);
    };

    const cellsOf = (block: DataGridRange) => {
        const list: Cell[] = [];
        for (let row = block.top; row <= block.bottom; row++)
            for (let col = block.left; col <= block.right; col++) list.push({ row, col });
        return list;
    };

    const undo = (redo: boolean) => {
        if (!onValuesChange) return;
        const { past, future } = history.current;
        const from = redo ? future : past;
        const to = redo ? past : future;
        const snapshot = from.pop();
        if (!snapshot) return;
        to.push(values);
        onValuesChange(snapshot);
    };

    /* ---------- Moving the selection ---------- */

    /** Moves the selection from the keyboard; the added blocks go unless `keep` (Shift extending). */
    const select = (anchor: Cell, focus: Cell = anchor, keep = false) => {
        const fit = (cell: Cell) => ({
            row: clamp(cell.row, 0, rows - 1),
            col: clamp(cell.col, 0, cols - 1),
        });
        const next = { anchor: fit(anchor), focus: fit(focus) };
        setSelection(next, keep ? extra : []);
        requestAnimationFrame(() =>
            cellNode(next.focus.row, next.focus.col)?.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
            }),
        );
    };

    const startEdit = (mode: Edit['mode'], draft?: string) => {
        if (!editable) return;
        ended.current = false;
        setEdit({ ...active, draft: draft ?? valueAt(active.row, active.col), mode });
    };

    const endEdit = (save: boolean, move?: { row: number; col: number }) => {
        // Ending takes focus off the field, which blurs it: the edit ends once.
        if (!edit || ended.current) return;
        ended.current = true;
        if (save) write([{ row: edit.row, col: edit.col, value: edit.draft }]);
        setEdit(null);
        if (move) select({ row: edit.row + move.row, col: edit.col + move.col });
        table.current?.focus({ preventScroll: true });
    };

    // The field takes focus as it opens, the caret after what is in it.
    const openField = (node: HTMLInputElement | null) => {
        if (node && node !== input.current) {
            node.focus({ preventScroll: true });
            node.setSelectionRange(node.value.length, node.value.length);
        }
        input.current = node;
    };

    /* ---------- Pointer ---------- */

    // Which cell is under the pointer, while a drag runs across the grid.
    const cellAt = (x: number, y: number) => {
        const node = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-row]');
        if (!node || !grid.current?.contains(node)) return null;
        return { row: Number(node.dataset.row), col: Number(node.dataset.col) };
    };

    const track = (onMove: (event: globalThis.PointerEvent) => void, onUp?: () => void) => {
        const up = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', up);
            onUp?.();
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', up);
    };

    const pressCell = (event: PointerEvent<HTMLElement>, cell: Cell) => {
        if (event.button !== 0) return;
        event.preventDefault();
        if (edit) endEdit(true);
        table.current?.focus({ preventScroll: true });
        // Ctrl or ⌘ keeps what is selected and starts another block beside it; Shift stretches the
        // block being made; a plain press starts over.
        const adding = event.ctrlKey || event.metaKey;
        const others = adding ? [...extra, range] : event.shiftKey ? extra : [];
        const anchor = event.shiftKey && !adding ? selection.anchor : cell;
        setSelection({ anchor, focus: cell }, others);
        track(move => {
            const over = cellAt(move.clientX, move.clientY);
            if (over) setSelection({ anchor, focus: over }, others);
        });
    };

    // A head selects its whole column (or row); dragged along the heads, the columns it passes.
    const pressHead = (event: PointerEvent<HTMLElement>, axis: 'col' | 'row', index: number) => {
        if (event.button !== 0) return;
        event.preventDefault();
        if (edit) endEdit(true);
        table.current?.focus({ preventScroll: true });
        const whole = (from: number, to: number): Selection =>
            axis === 'col'
                ? { anchor: { row: 0, col: from }, focus: { row: rows - 1, col: to } }
                : { anchor: { row: from, col: 0 }, focus: { row: to, col: cols - 1 } };
        const adding = event.ctrlKey || event.metaKey;
        const others = adding ? [...extra, range] : event.shiftKey ? extra : [];
        const from =
            event.shiftKey && !adding
                ? axis === 'col'
                    ? selection.anchor.col
                    : selection.anchor.row
                : index;
        setSelection(whole(from, index), others);
        track(move => {
            const node = document
                .elementFromPoint(move.clientX, move.clientY)
                ?.closest<HTMLElement>(axis === 'col' ? '[data-col]' : '[data-row]');
            if (!node || !grid.current?.contains(node)) return;
            const at = Number(axis === 'col' ? node.dataset.col : node.dataset.row);
            if (!Number.isNaN(at)) setSelection(whole(from, at), others);
        });
    };

    const pressFill = (event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const source = range;
        let target: DataGridRange | null = null;
        track(
            move => {
                const over = cellAt(move.clientX, move.clientY);
                if (!over) return;
                // The fill runs along the axis the pointer has gone further out on.
                const down = over.row > source.bottom ? over.row - source.bottom : 0;
                const up = over.row < source.top ? source.top - over.row : 0;
                const right = over.col > source.right ? over.col - source.right : 0;
                const left = over.col < source.left ? source.left - over.col : 0;
                const vertical = Math.max(down, up) >= Math.max(right, left);
                if (vertical && (down || up))
                    target = down
                        ? { ...source, top: source.bottom + 1, bottom: over.row }
                        : { ...source, top: over.row, bottom: source.top - 1 };
                else if (!vertical && (right || left))
                    target = right
                        ? { ...source, left: source.right + 1, right: over.col }
                        : { ...source, left: over.col, right: source.left - 1 };
                else target = null;
                setFill(target);
            },
            () => {
                setFill(null);
                if (!target) return;
                const block: DataGridRange = target;
                const vertical = block.left === source.left && block.right === source.right;
                const changes = cellsOf(block).map(({ row, col }) => {
                    const line = vertical
                        ? Array.from({ length: source.bottom - source.top + 1 }, (_, i) =>
                              valueAt(source.top + i, col),
                          )
                        : Array.from({ length: source.right - source.left + 1 }, (_, i) =>
                              valueAt(row, source.left + i),
                          );
                    const offset = vertical ? row - source.top : col - source.left;
                    return { row, col, value: fillValue(line, offset) };
                });
                write(changes);
                select(
                    {
                        row: Math.min(source.top, block.top),
                        col: Math.min(source.left, block.left),
                    },
                    {
                        row: Math.max(source.bottom, block.bottom),
                        col: Math.max(source.right, block.right),
                    },
                );
            },
        );
    };

    const resize = (event: PointerEvent<HTMLElement>, axis: 'col' | 'row', index: number) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const start = axis === 'col' ? event.clientX : event.clientY;
        const head = event.currentTarget.parentElement;
        const from = axis === 'col' ? (widths[index] ?? COLUMN_WIDTH) : (head?.offsetHeight ?? 32);
        // A row never goes under the cell height it started at: taller, for a value that wraps, not shorter.
        const cell = table.current
            ? Number.parseFloat(
                  getComputedStyle(table.current).getPropertyValue('--spacing-cell'),
              ) || 32
            : 32;
        const release = holdPointer(axis === 'col' ? 'col-resize' : 'row-resize');
        track(move => {
            const size = Math.round(from + (axis === 'col' ? move.clientX : move.clientY) - start);
            if (axis === 'col')
                setWidths(current =>
                    current.map((w, i) => (i === index ? Math.max(MIN_WIDTH, size) : w)),
                );
            else
                setHeights(current => {
                    const next = [...current];
                    next[index] = Math.max(cell, size);
                    return next;
                });
        }, release);
    };

    /* ---------- Keyboard and clipboard ---------- */

    const key = (event: KeyboardEvent<HTMLDivElement>) => {
        if (edit || event.target !== table.current || !rows || !cols) return;
        const mod = event.metaKey || event.ctrlKey;
        const step: Record<string, Cell> = {
            ArrowUp: { row: -1, col: 0 },
            ArrowDown: { row: 1, col: 0 },
            ArrowLeft: { row: 0, col: -1 },
            ArrowRight: { row: 0, col: 1 },
        };
        const delta = step[event.key];
        if (delta) {
            event.preventDefault();
            const from = event.shiftKey ? selection.focus : selection.anchor;
            // With Ctrl or ⌘ the move runs to the grid's edge.
            const to = mod
                ? {
                      row: delta.row ? (delta.row < 0 ? 0 : rows - 1) : from.row,
                      col: delta.col ? (delta.col < 0 ? 0 : cols - 1) : from.col,
                  }
                : { row: from.row + delta.row, col: from.col + delta.col };
            if (event.shiftKey) select(selection.anchor, to, true);
            else select(to);
            return;
        }
        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const col = event.key === 'Home' ? 0 : cols - 1;
            const row = mod ? (event.key === 'Home' ? 0 : rows - 1) : active.row;
            select({ row, col });
            return;
        }
        if (mod && event.key.toLowerCase() === 'a') {
            event.preventDefault();
            setSelection(
                { anchor: { row: 0, col: 0 }, focus: { row: rows - 1, col: cols - 1 } },
                [],
            );
            return;
        }
        if (mod && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            undo(event.shiftKey);
            return;
        }
        if (mod && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            undo(true);
            return;
        }
        if (event.key === 'Escape' && multi) {
            event.preventDefault();
            select(active);
            return;
        }
        if (!editable) return;
        if (event.key === 'Enter' || event.key === 'F2') {
            event.preventDefault();
            startEdit('edit');
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            // Every selected block is cleared, the added ones too.
            write([...extra, range].flatMap(cellsOf).map(cell => ({ ...cell, value: '' })));
        } else if (event.key.length === 1 && !mod && !event.altKey) {
            // Typing over a cell replaces its value, starting with the key typed.
            event.preventDefault();
            startEdit('replace', event.key);
        }
    };

    const tsv = (block: DataGridRange) =>
        Array.from({ length: block.bottom - block.top + 1 }, (_, r) =>
            Array.from({ length: block.right - block.left + 1 }, (_, c) =>
                valueAt(block.top + r, block.left + c),
            ).join('\t'),
        ).join('\n');

    const copy = (event: ClipboardEvent<HTMLDivElement>, cut: boolean) => {
        if (edit || event.target !== table.current) return;
        event.preventDefault();
        event.clipboardData.setData('text/plain', tsv(range));
        if (cut && editable) write(cellsOf(range).map(cell => ({ ...cell, value: '' })));
    };

    const paste = (event: ClipboardEvent<HTMLDivElement>) => {
        if (edit || !editable || event.target !== table.current) return;
        event.preventDefault();
        const block = parseClipboard(event.clipboardData.getData('text/plain'));
        const single = block.length === 1 && block[0]?.length === 1;
        // One value fills the whole selection; a block lands with its corner on the selection's.
        if (single) {
            write(cellsOf(range).map(cell => ({ ...cell, value: block[0]?.[0] ?? '' })));
            return;
        }
        write(
            block.flatMap((line, r) =>
                line.map((value, c) => ({ row: range.top + r, col: range.left + c, value })),
            ),
        );
        select(
            { row: range.top, col: range.left },
            {
                row: range.top + block.length - 1,
                col: range.left + Math.max(...block.map(line => line.length)) - 1,
            },
        );
    };

    const editKey = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!edit) return;
        const moves: Record<string, Cell> = {
            Enter: { row: event.shiftKey ? -1 : 1, col: 0 },
            Tab: { row: 0, col: event.shiftKey ? -1 : 1 },
        };
        // Typed straight over a cell, the arrows leave it, as they would have without the edit;
        // opened with Enter or F2 they move through the text.
        if (edit.mode === 'replace') {
            moves.ArrowUp = { row: -1, col: 0 };
            moves.ArrowDown = { row: 1, col: 0 };
            moves.ArrowLeft = { row: 0, col: -1 };
            moves.ArrowRight = { row: 0, col: 1 };
        }
        const move = moves[event.key];
        if (move) {
            event.preventDefault();
            endEdit(true, move);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            endEdit(false);
        }
    };

    /* ---------- Drawing ---------- */

    const align = (col: number, value: string) =>
        (columns?.[col]?.align ?? (looksNumeric(value) ? 'right' : 'left')) === 'right';

    // The columns as drawn: their own widths, and when those end short of the frame, the last column
    // takes the room that is left, as a table's name column does, so the grid always fills its frame
    // and never leaves an empty band beside the last rule. Wider than the frame, it scrolls.
    const shown = widths.slice(0, cols);
    const own = ROW_HEAD + shown.reduce((sum, w) => sum + w, 0);
    if (cols > 0 && room > own) shown[cols - 1] = (shown[cols - 1] ?? COLUMN_WIDTH) + room - own;
    const total = ROW_HEAD + shown.reduce((sum, w) => sum + w, 0);

    const headCell =
        'relative border-neutral-200 border-r border-b bg-neutral-100 p-0 font-normal text-neutral-600 text-xs tabular-nums select-none transition-colors duration-150';
    // A head over the selection darkens, and its edge facing the cells takes the accent, so the
    // selected block is read from the heads as well as in the grid.
    const headOn = 'bg-neutral-200 text-neutral-900';
    const everything =
        many &&
        range.top === 0 &&
        range.left === 0 &&
        range.bottom === rows - 1 &&
        range.right === cols - 1;

    return (
        <div
            className={cn(
                'group/grid flex min-h-0 flex-col overflow-hidden rounded-control border border-neutral-200 bg-neutral-50 shadow-card',
                className,
            )}
            data-slot="data-grid"
            {...props}
        >
            {toolbar}
            <div
                className="min-h-0 flex-1 overflow-auto"
                data-slot="data-grid-scroller"
                ref={scroller}
            >
                <div className="relative w-max" ref={grid}>
                    {/* biome-ignore lint/a11y/useSemanticElements: it is the table element already; the role adds the grid's keyboard. */}
                    <table
                        aria-activedescendant={
                            rows && cols ? `${id}-${active.row}-${active.col}` : undefined
                        }
                        aria-label={label}
                        aria-multiselectable
                        className="table-fixed border-separate border-spacing-0 text-xs outline-none"
                        data-slot="data-grid-table"
                        onCopy={event => copy(event, false)}
                        onCut={event => copy(event, true)}
                        onKeyDown={key}
                        onPaste={paste}
                        ref={table}
                        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the ARIA grid pattern on a real table, whose cells are worked on, not only read.
                        role="grid"
                        style={{ width: total }}
                        tabIndex={0}
                    >
                        <colgroup>
                            <col style={{ width: ROW_HEAD }} />
                            {shown.map((width, col) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: columns are places, not items.
                                <col key={col} style={{ width }} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr className="h-cell">
                                {/* The corner selects every cell. */}
                                <th
                                    aria-label="Select all"
                                    className={cn(
                                        headCell,
                                        'sticky top-0 left-0 z-30 cursor-pointer',
                                        everything && headOn,
                                    )}
                                    data-slot="data-grid-corner"
                                    onPointerDown={event => {
                                        event.preventDefault();
                                        table.current?.focus({ preventScroll: true });
                                        setSelection({
                                            anchor: { row: 0, col: 0 },
                                            focus: { row: rows - 1, col: cols - 1 },
                                        });
                                    }}
                                    scope="col"
                                />
                                {widths.slice(0, cols).map((_, col) => {
                                    const name = columns?.[col]?.label;
                                    const on = [...extra, range].some(
                                        block => col >= block.left && col <= block.right,
                                    );
                                    return (
                                        <th
                                            className={cn(
                                                headCell,
                                                'sticky top-0 z-20 cursor-default px-3',
                                                name
                                                    ? columns?.[col]?.align === 'right'
                                                        ? 'text-right'
                                                        : 'text-left'
                                                    : 'text-center',
                                                on && [
                                                    headOn,
                                                    'shadow-[inset_0_-2px_0_var(--color-neutral-400)] group-focus-within/grid:shadow-[inset_0_-2px_0_var(--color-primary-500)]',
                                                ],
                                            )}
                                            data-col={col}
                                            data-slot="data-grid-column"
                                            // biome-ignore lint/suspicious/noArrayIndexKey: columns are places, not items.
                                            key={col}
                                            onPointerDown={event => pressHead(event, 'col', col)}
                                            scope="col"
                                        >
                                            <span className="block truncate">
                                                {name ?? letter(col)}
                                            </span>
                                            <span
                                                aria-hidden
                                                // The last column's edge stays inside the grid, so it never makes the grid scroll.
                                                className={cn(
                                                    'absolute inset-y-0 z-10 w-2 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-[3px] after:w-0.5 after:bg-primary-500 after:opacity-0 after:transition-opacity after:duration-150 after:content-[""] hover:after:opacity-100',
                                                    col === cols - 1 ? 'right-0' : '-right-1',
                                                )}
                                                data-slot="data-grid-resize"
                                                onDoubleClick={() =>
                                                    setWidths(current =>
                                                        current.map((w, i) =>
                                                            i === col
                                                                ? (columns?.[col]?.width ??
                                                                  COLUMN_WIDTH)
                                                                : w,
                                                        ),
                                                    )
                                                }
                                                onPointerDown={event => resize(event, 'col', col)}
                                            />
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {values.slice(0, rows).map((line, row) => {
                                // The summary's rows, and its first, which takes the rule over it.
                                const summary = row >= rows - summaryRows;
                                const summaryStart = summaryRows > 0 && row === rows - summaryRows;
                                const rowOn = [...extra, range].some(
                                    block => row >= block.top && row <= block.bottom,
                                );
                                return (
                                    <tr
                                        className="h-cell"
                                        // biome-ignore lint/suspicious/noArrayIndexKey: rows are places, not items.
                                        key={row}
                                        style={
                                            heights[row] !== undefined
                                                ? { height: heights[row] }
                                                : undefined
                                        }
                                    >
                                        <th
                                            className={cn(
                                                headCell,
                                                'sticky left-0 z-10 cursor-default text-center',
                                                summaryStart &&
                                                    'shadow-[inset_0_1px_0_var(--color-neutral-400)]',
                                                rowOn && [
                                                    headOn,
                                                    'shadow-[inset_-2px_0_0_var(--color-neutral-400)] group-focus-within/grid:shadow-[inset_-2px_0_0_var(--color-primary-500)]',
                                                ],
                                            )}
                                            data-row-head={row}
                                            data-slot="data-grid-row"
                                            onPointerDown={event => pressHead(event, 'row', row)}
                                            scope="row"
                                        >
                                            {row + 1}
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'absolute inset-x-0 z-10 h-2 cursor-row-resize touch-none after:absolute after:inset-x-0 after:top-[3px] after:h-0.5 after:bg-primary-500 after:opacity-0 after:transition-opacity after:duration-150 after:content-[""] hover:after:opacity-100',
                                                    row === rows - 1 ? 'bottom-0' : '-bottom-1',
                                                )}
                                                data-slot="data-grid-resize"
                                                onDoubleClick={() =>
                                                    setHeights(current => {
                                                        const next = [...current];
                                                        next[row] = undefined;
                                                        return next;
                                                    })
                                                }
                                                onPointerDown={event => resize(event, 'row', row)}
                                            />
                                        </th>
                                        {widths.slice(0, cols).map((_, col) => {
                                            const value = line[col] ?? '';
                                            const right = align(col, value);
                                            const isActive =
                                                row === active.row && col === active.col;
                                            return (
                                                // biome-ignore lint/a11y/useAriaPropsSupportedByRole: a cell of a table whose role is grid is a gridcell, which takes aria-selected.
                                                <td
                                                    aria-selected={selected(row, col)}
                                                    className={cn(
                                                        'cursor-cell select-none overflow-hidden text-ellipsis whitespace-nowrap border-neutral-200 border-r border-b px-3 text-neutral-900',
                                                        // The first column names the row, as a table's first column does: in 500.
                                                        col === 0 && 'font-medium',
                                                        summary && 'font-medium text-neutral-950',
                                                        // A shortfall in a total is the sheet's problem: in the error ink.
                                                        summary &&
                                                            /^\s*[-−]/.test(value) &&
                                                            'text-error-600',
                                                        summaryStart &&
                                                            'shadow-[inset_0_1px_0_var(--color-neutral-400)]',
                                                        'scroll-mt-cell scroll-ml-11',
                                                        right && 'text-right tabular-nums',
                                                        // The selected block is washed, the cell
                                                        // it started from left clear in its ring.
                                                        multi &&
                                                            !isActive &&
                                                            selected(row, col) &&
                                                            'bg-neutral-950/5 group-focus-within/grid:bg-primary-500/10',
                                                    )}
                                                    data-col={col}
                                                    data-row={row}
                                                    data-slot="data-grid-cell"
                                                    id={`${id}-${row}-${col}`}
                                                    // biome-ignore lint/suspicious/noArrayIndexKey: cells are places, not items.
                                                    key={col}
                                                    onDoubleClick={() => startEdit('edit')}
                                                    onPointerDown={event =>
                                                        pressCell(event, { row, col })
                                                    }
                                                >
                                                    {value}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {/* The marks over the cells: the block, the cell it started from, the fill. */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute z-5 border border-neutral-500 group-focus-within/grid:border-primary-500"
                        data-slot="data-grid-range"
                        ref={rangeBox}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute z-6 border-2 border-neutral-500 group-focus-within/grid:border-primary-500"
                        data-slot="data-grid-active"
                        ref={activeBox}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute z-6 border border-primary-500 border-dashed bg-primary-500/5"
                        data-slot="data-grid-fill"
                        ref={fillBox}
                    />
                    {/* The blocks added with Ctrl or ⌘, outlined as the one being made is. */}
                    {extra.map((_, i) => (
                        <div
                            aria-hidden
                            className="pointer-events-none absolute z-5 border border-neutral-500 group-focus-within/grid:border-primary-500"
                            data-slot="data-grid-extra"
                            // biome-ignore lint/suspicious/noArrayIndexKey: the blocks are places in a list that only grows.
                            key={i}
                        />
                    ))}
                    {/* A fill runs from one block; with several selected there is no handle. */}
                    {editable && !edit && extra.length === 0 && rows > 0 && cols > 0 && (
                        <FillHandle box={boxOf} onPointerDown={pressFill} range={range} />
                    )}
                    {edit && (
                        <div
                            className="absolute z-7 flex bg-neutral-50 outline-2 outline-primary-500 outline-solid -outline-offset-1"
                            data-slot="data-grid-editor"
                            ref={editor}
                        >
                            <input
                                aria-label={`${columns?.[edit.col]?.label ?? letter(edit.col)} ${edit.row + 1}`}
                                className={cn(
                                    'h-full w-full min-w-0 bg-tint pr-3 pl-[calc(var(--spacing)*3+1px)] text-neutral-900 text-xs outline-none',
                                    align(edit.col, edit.draft) && 'text-right tabular-nums',
                                    edit.col === 0 && 'font-medium',
                                )}
                                onBlur={() => endEdit(true)}
                                onChange={event => setEdit({ ...edit, draft: event.target.value })}
                                onKeyDown={editKey}
                                ref={openField}
                                value={edit.draft}
                            />
                        </div>
                    )}
                </div>
            </div>
            {footer != null && (
                <div
                    className="flex min-h-cell shrink-0 items-center gap-4 border-neutral-200 border-t bg-neutral-100 px-3 text-neutral-600 text-xs tabular-nums"
                    data-slot="data-grid-footer"
                >
                    {footer}
                </div>
            )}
        </div>
    );
};

/** The square at the selection's corner that drags a fill out of it. */
const FillHandle = ({
    range,
    box,
    onPointerDown,
}: {
    range: DataGridRange;
    box: (
        range: DataGridRange,
    ) => { left: number; top: number; width: number; height: number } | null;
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) => {
    const handle = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const at = box(range);
        if (!handle.current || !at) return;
        handle.current.style.left = `${at.left + at.width - 4}px`;
        handle.current.style.top = `${at.top + at.height - 4}px`;
    });
    return (
        <div
            aria-hidden
            className="absolute z-8 size-2 cursor-crosshair touch-none border border-neutral-50 bg-neutral-500 group-focus-within/grid:bg-primary-500"
            data-slot="data-grid-fill-handle"
            onPointerDown={onPointerDown}
            ref={handle}
            title="Drag to fill"
        />
    );
};
