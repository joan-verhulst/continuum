'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown, Pencil } from 'lucide-react';
import { type HTMLAttributes, type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { Select, SelectContent, type SelectContentProps, SelectItem } from './select';
import { TableCell, type TableCellProps } from './table-cell';

export type TableEditOption = { value: string; label: ReactNode };

export type TableEditCellProps = Omit<
    TableCellProps,
    'children' | 'onChange' | 'copy' | 'copyLabel'
> & {
    value: string;
    /** Called once, with the new value, when an edit is saved (Enter, a click away, or a pick). */
    onValueChange: (value: string) => void;
    /** What the cell is, for its name: "Quantity of Design review". */
    label: string;
    /** How the value reads while it is not being edited; the value itself by default. */
    children?: ReactNode;
    /** Picks from a set instead of typing: the cell opens a list under it. */
    options?: readonly TableEditOption[];
    /** Where the list is portalled; the body by default. */
    container?: SelectContentProps['container'];
    placeholder?: string;
    inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
};

// The read state's button covers the whole cell, padding and all, so the cell is the target.
const stretched = "after:absolute after:inset-0 after:content-['']";

// The hint that a cell can change: a 14 mark in `neutral-500` at the cell's end, shown under the pointer
// and on focus (always on a touch screen, which has no pointer to show it); a pick's is a chevron, a
// typed value's a pencil.
const hint =
    'pointer-coarse:opacity-100 size-3.5 shrink-0 text-neutral-500 opacity-0 transition-opacity duration-150 group-hover/edit:opacity-100 group-focus-visible/edit:opacity-100 group-data-popup-open/edit:opacity-100';

/**
 * A cell that reads as its value and is edited where it sits. Under the pointer it shows the pointer
 * cursor, since a click is what starts the edit. A click (or Enter on it) turns it into a borderless
 * input on the tint wash, the text exactly where it was, so the row keeps its 41, and rings the cell
 * inside its edges in the accent (`primary-500`, 2), so the cell being edited is plain to see. A 20 check at
 * the field's end saves (before the figures in a right-aligned cell); Enter or a click away saves
 * too, Escape puts the value back. With `options`, it opens a list instead
 * and the pick saves. Under the pointer or on focus an editable cell shows a 14 mark at its end, a
 * pencil for a typed value and a chevron for a pick: the one hint that it can change, kept off until
 * asked for so the table still reads as values.
 */
export const TableEditCell = ({
    value,
    onValueChange,
    label,
    children,
    options,
    container,
    placeholder,
    inputMode,
    className,
    ...props
}: TableEditCellProps) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const input = useRef<HTMLInputElement>(null);
    const read = useRef<HTMLButtonElement>(null);
    // Set when an edit ends from the keyboard, so focus goes back to the cell it left.
    const refocus = useRef(false);
    // Ending removes the input, which may blur it again; the edit ends only once.
    const ended = useRef(false);
    const right = (props.align ?? (props.numeric ? 'right' : 'left')) === 'right';

    useEffect(() => {
        if (editing) {
            input.current?.focus();
            input.current?.select();
        } else if (refocus.current) {
            refocus.current = false;
            read.current?.focus();
        }
    }, [editing]);

    const start = () => {
        ended.current = false;
        setDraft(value);
        setEditing(true);
    };

    const end = (save: boolean, fromKeyboard: boolean) => {
        if (ended.current) return;
        ended.current = true;
        if (save && draft !== value) onValueChange(draft);
        refocus.current = fromKeyboard;
        setEditing(false);
    };

    const cell = cn(
        // The cell is the target: its button stretches over it. The tint wash while it is edited or its
        // list is open.
        'relative [&:has([data-popup-open])]:bg-tint',
        // Focus on the cell's button rings the whole cell, inside its edges.
        '[&:has(>[data-slot=table-edit-read]:focus-visible)]:outline-2 [&:has(>[data-slot=table-edit-read]:focus-visible)]:outline-focus [&:has(>[data-slot=table-edit-read]:focus-visible)]:outline-solid [&:has(>[data-slot=table-edit-read]:focus-visible)]:-outline-offset-2',
        // The cell being edited: the wash, and the accent's ring inside its edges.
        editing && 'bg-tint outline-2 outline-primary-500 outline-solid -outline-offset-2',
        className,
    );
    const shown = children ?? (value === '' ? placeholder : value);

    if (options) {
        const picked = options.find(option => option.value === value);

        return (
            <TableCell className={cn(cell, 'cursor-pointer')} data-editable="" {...props}>
                <Select
                    items={options as TableEditOption[]}
                    onValueChange={next => onValueChange(String(next))}
                    value={value}
                >
                    <SelectPrimitive.Trigger
                        aria-label={label}
                        className={cn(
                            'group/edit flex w-full cursor-pointer items-center gap-1 text-left outline-none',
                            stretched,
                        )}
                        data-slot="table-edit-read"
                    >
                        <span className="min-w-0 flex-1 truncate">{children ?? picked?.label}</span>
                        {/* The small chevron that tells a pick from a field; shown with the hint. */}
                        <ChevronDown className={hint} strokeWidth={2} />
                    </SelectPrimitive.Trigger>
                    {/* Under the cell, its left edge on the cell's. */}
                    <SelectContent alignOffset={-12} container={container} sideOffset={16}>
                        {options.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>
        );
    }

    return (
        <TableCell
            className={cn(cell, !editing && 'cursor-pointer')}
            data-editable=""
            data-editing={editing || undefined}
            {...props}
        >
            {editing ? (
                <span className={cn('flex items-center gap-2', right && 'flex-row-reverse')}>
                    <input
                        aria-label={label}
                        className={cn(
                            // The value's own type and line, so nothing moves between reading and editing.
                            'block h-lh w-full min-w-0 bg-transparent p-0 text-inherit outline-none placeholder:font-normal placeholder:text-neutral-500',
                            right && 'text-right',
                        )}
                        data-slot="table-edit-input"
                        inputMode={inputMode}
                        onBlur={() => end(true, false)}
                        onChange={event => setDraft(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                end(true, true);
                            } else if (event.key === 'Escape') {
                                event.preventDefault();
                                end(false, true);
                            }
                        }}
                        placeholder={placeholder}
                        ref={input}
                        value={draft}
                    />
                    <button
                        aria-label={`Save ${label}`}
                        className="-my-0.5 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-chip text-neutral-600 transition-colors duration-150 hover:bg-neutral-950/5 hover:text-neutral-950"
                        data-slot="table-edit-save"
                        // Keep focus in the field, so the click saves once rather than the blur first.
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => end(true, false)}
                        tabIndex={-1}
                        title="Save (Enter)"
                        type="button"
                    >
                        <Check className="size-3.5" strokeWidth={2} />
                    </button>
                </span>
            ) : (
                <button
                    aria-label={`${label}: ${value === '' ? 'empty' : value}`}
                    className={cn(
                        'group/edit flex w-full cursor-pointer items-center gap-1 text-left outline-none',
                        // On a right-aligned cell the pencil goes first, so the figures stay flush.
                        right && 'flex-row-reverse text-right',
                        stretched,
                    )}
                    data-slot="table-edit-read"
                    onClick={start}
                    ref={read}
                    type="button"
                >
                    <span
                        className={cn(
                            'min-w-0 flex-1 truncate',
                            value === '' && 'font-normal text-neutral-500',
                        )}
                    >
                        {shown}
                    </span>
                    {/* The pencil that says the value can be typed over, where a pick shows its chevron. */}
                    <Pencil className={hint} strokeWidth={2} />
                </button>
            )}
        </TableCell>
    );
};
