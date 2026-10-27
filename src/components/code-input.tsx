'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import {
    type ClipboardEvent,
    type ComponentProps,
    type FormEvent,
    type KeyboardEvent,
    type MouseEvent,
    type InputEvent as ReactInputEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { useFieldControl } from './field';

/*
 * One box per character. Boxes take the Input's border, radius and states so a
 * code field sits beside ordinary inputs without looking like another family;
 * md is the input's measured 38px, lg a step up for a code that is the page's
 * only task (verify email, two-factor).
 */
export const codeInputSlotVariants = cva(
    [
        // grow: a row given a width (w-full) shares it out; in the default w-fit row each box keeps its own.
        'relative flex grow items-center justify-center border bg-neutral-50 font-medium tabular-nums',
        'transition-[border-color,color] duration-150',
    ],
    {
        variants: {
            size: {
                md: 'h-[38px] w-[38px] rounded-control text-sm',
                lg: 'h-[52px] w-[48px] rounded-control text-lg',
            },
            invalid: {
                true: 'border-error-500 text-error-500',
                false: '',
            },
            disabled: {
                true: 'border-neutral-200 text-neutral-400',
                false: '',
            },
            active: {
                // The real input is focused, so the box it writes into carries the ring.
                true: 'outline-solid outline-2 outline-focus outline-offset-2',
                false: '',
            },
        },
        compoundVariants: [
            {
                invalid: false,
                disabled: false,
                className:
                    'border-neutral-200 text-neutral-900 group-hover/code-input:border-neutral-300',
            },
            { invalid: false, disabled: false, active: true, className: 'border-neutral-300' },
        ],
        defaultVariants: {
            size: 'md',
            invalid: false,
            disabled: false,
            active: false,
        },
    },
);

const gapBySize = { md: 'gap-2', lg: 'gap-2.5' } as const;

const charsets = {
    numeric: { test: /\d/, pattern: '\\d', inputMode: 'numeric' },
    alphanumeric: { test: /[a-z\d]/i, pattern: '[A-Za-z0-9]', inputMode: 'text' },
} as const;

/*
 * A short horizontal shake, kept under the 250ms ceiling. It runs through the Web
 * Animations API so it needs no keyframes in the stylesheet and can be replayed.
 */
const shakeKeyframes: Keyframe[] = [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(-3px)' },
    { transform: 'translateX(2px)' },
    { transform: 'translateX(0)' },
];

export type CodeInputProps = Omit<
    ComponentProps<'input'>,
    'size' | 'value' | 'defaultValue' | 'onChange' | 'maxLength' | 'type' | 'pattern' | 'inputMode'
> &
    Pick<VariantProps<typeof codeInputSlotVariants>, 'size'> & {
        /** Number of characters; 6 by default. */
        length?: number;
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
        /** Called once the last box is filled by the user, with the full code. */
        onComplete?: (value: string) => void;
        /** Which characters are accepted; letters are upper-cased. */
        charset?: keyof typeof charsets;
        /** Shake the boxes once when the field turns invalid. Skipped under reduced motion. */
        shake?: boolean;
        /** Show dots instead of the characters, for codes that should not be read over a shoulder. */
        mask?: boolean;
        /** Classes for the native input that drives the boxes; `className` goes on the row. */
        inputClassName?: string;
    };

/** A one-time-code field: N boxes driven by one real input, so paste, SMS autofill and backspace work. */
export const CodeInput = ({
    length = 6,
    value: valueProp,
    defaultValue,
    onValueChange,
    onComplete,
    charset = 'numeric',
    shake = false,
    mask = false,
    size = 'md',
    className,
    inputClassName,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    onFocus,
    onBlur,
    onKeyDown,
    onPaste,
    onSelect,
    onMouseDown,
    onBeforeInput,
    ref,
    ...props
}: CodeInputProps) => {
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });
    const isDisabled = Boolean(control.disabled);
    const set = charsets[charset];

    const sanitise = (raw: string) => {
        let next = '';
        for (const char of raw) {
            if (set.test.test(char)) next += char;
            if (next.length === length) break;
        }
        return charset === 'alphanumeric' ? next.toUpperCase() : next;
    };

    const [uncontrolled, setUncontrolled] = useState(() => sanitise(defaultValue ?? ''));
    const value = valueProp === undefined ? uncontrolled : sanitise(valueProp);

    const inputRef = useRef<HTMLInputElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);
    const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
    // Where the caret should land after the next render, once React has written the value.
    const pendingCaret = useRef<number | null>(null);
    const [focused, setFocused] = useState(false);
    const [selection, setSelection] = useState<[number, number]>([0, 0]);

    /*
     * Overwrite mode: a collapsed caret in front of a character becomes a
     * selection of that character, so typing replaces the box rather than
     * pushing the rest of the code to the right.
     */
    const placeCaret = (index: number, current = value) => {
        const input = inputRef.current;
        if (!input) return;
        const start = Math.max(0, Math.min(index, current.length, length - 1));
        const end = start < current.length ? start + 1 : start;
        input.setSelectionRange(start, end);
        setSelection([start, end]);
    };

    const commit = (next: string, caret: number) => {
        pendingCaret.current = caret;
        if (next === value) {
            // Nothing re-renders, and React writes the old value back after this event, so wait a frame.
            requestAnimationFrame(() => placeCaret(caret));
            pendingCaret.current = null;
            return;
        }
        if (valueProp === undefined) setUncontrolled(next);
        onValueChange?.(next);
        if (next.length === length) onComplete?.(next);
    };

    useLayoutEffect(() => {
        if (pendingCaret.current === null || document.activeElement !== inputRef.current) return;
        placeCaret(pendingCaret.current);
        pendingCaret.current = null;
    });

    // Shake on the change into invalid only, not on every render while it stays so.
    const wasInvalid = useRef(invalid);
    useEffect(() => {
        const row = rowRef.current;
        if (shake && invalid && !wasInvalid.current && row?.animate) {
            const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            if (!reduced) row.animate(shakeKeyframes, { duration: 240, easing: 'ease-out' });
        }
        wasInvalid.current = invalid;
    }, [invalid, shake]);

    const handleChange = (event: FormEvent<HTMLInputElement>) => {
        // Typing, autofill and IME all arrive here; the raw value may hold spaces or dashes.
        const target = event.currentTarget;
        const next = sanitise(target.value);
        const caret = Math.min(target.selectionStart ?? next.length, next.length);
        commit(next, next.length === length && caret >= length ? length - 1 : caret);
    };

    const handleBeforeInput = (event: ReactInputEvent<HTMLInputElement>) => {
        onBeforeInput?.(event);
        const data = event.data;
        // Refuse a stray letter before it reaches the value, so the caret never jumps.
        if (data && ![...data].some(char => set.test.test(char))) event.preventDefault();
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        onPaste?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        const pasted = sanitise(event.clipboardData.getData('text'));
        if (!pasted) return;
        const [start, end] = selection;
        // A whole code replaces what is there; a fragment goes in at the caret.
        const next =
            pasted.length >= length
                ? pasted
                : sanitise(value.slice(0, start) + pasted + value.slice(end));
        commit(next, Math.min(start + pasted.length, length - 1));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
        const [start, end] = selection;
        const single = end - start <= 1;

        if (event.key === 'ArrowLeft' && !event.shiftKey) {
            event.preventDefault();
            placeCaret(start - 1);
        } else if (event.key === 'ArrowRight' && !event.shiftKey) {
            event.preventDefault();
            placeCaret(start + 1);
        } else if ((event.key === 'ArrowUp' || event.key === 'Home') && !event.shiftKey) {
            event.preventDefault();
            placeCaret(0);
        } else if ((event.key === 'ArrowDown' || event.key === 'End') && !event.shiftKey) {
            event.preventDefault();
            placeCaret(value.length);
        } else if (event.key === 'Backspace' && single) {
            /*
             * Backspace clears the box under the caret and steps back; on an
             * empty box it clears the one before, as the boxes suggest.
             */
            event.preventDefault();
            const index = start < value.length ? start : start - 1;
            if (index < 0) return;
            commit(value.slice(0, index) + value.slice(index + 1), Math.max(0, start - 1));
        } else if (event.key === 'Delete' && single) {
            event.preventDefault();
            if (start >= value.length) return;
            commit(value.slice(0, start) + value.slice(start + 1), start);
        }
    };

    const handleSelect = (event: FormEvent<HTMLInputElement>) => {
        onSelect?.(event);
        const input = event.currentTarget;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? start;
        if (start === end && start < value.length) {
            input.setSelectionRange(start, start + 1);
            setSelection([start, start + 1]);
        } else {
            setSelection([start, end]);
        }
    };

    /*
     * The input's own characters are invisible and do not line up with the boxes,
     * so a click is mapped to the box under the pointer. It cannot land past the
     * first empty box: a code has no gaps.
     */
    const handleMouseDown = (event: MouseEvent<HTMLInputElement>) => {
        onMouseDown?.(event);
        if (event.defaultPrevented || isDisabled || event.button !== 0) return;
        event.preventDefault();
        const hit = slotRefs.current.findIndex(slot => {
            const rect = slot?.getBoundingClientRect();
            return rect ? event.clientX <= rect.right : false;
        });
        inputRef.current?.focus();
        placeCaret(hit === -1 ? length - 1 : hit);
    };

    const [selStart, selEnd] = selection;
    // With the code full and the caret parked after it, the last box stays the active one.
    const activeStart = selStart === selEnd && selStart >= length ? length - 1 : selStart;
    const activeEnd = Math.max(selEnd, activeStart + 1);

    return (
        <div
            className={cn(
                'group/code-input relative inline-flex w-fit',
                gapBySize[size ?? 'md'],
                isDisabled && 'cursor-not-allowed',
                className,
            )}
            data-complete={value.length === length || undefined}
            data-disabled={isDisabled || undefined}
            data-invalid={invalid || undefined}
            data-slot="code-input"
            ref={rowRef}
        >
            {Array.from({ length }, (_, index) => {
                const char = value[index];
                const active = focused && !isDisabled && index >= activeStart && index < activeEnd;
                // The empty box the next character goes into shows a caret.
                const caret = active && char === undefined && selStart === selEnd;

                return (
                    <div
                        aria-hidden
                        className={codeInputSlotVariants({
                            size,
                            invalid,
                            disabled: isDisabled,
                            active,
                        })}
                        data-active={active || undefined}
                        data-filled={char !== undefined || undefined}
                        data-slot="code-input-slot"
                        // biome-ignore lint/suspicious/noArrayIndexKey: the boxes are positions, not items.
                        key={index}
                        ref={node => {
                            slotRefs.current[index] = node;
                        }}
                    >
                        {char !== undefined && (mask ? '•' : char)}
                        {caret && (
                            <span
                                className="h-4 w-px animate-pulse bg-neutral-900 motion-reduce:animate-none"
                                data-slot="code-input-caret"
                            />
                        )}
                    </div>
                );
            })}
            <input
                autoComplete="one-time-code"
                autoCorrect="off"
                className={cn(
                    // Covers the row so every box is a click target, but draws nothing itself.
                    'absolute inset-0 h-full w-full bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent',
                    // 16px keeps iOS Safari from zooming in when the field takes focus.
                    'text-[16px]',
                    'disabled:cursor-not-allowed',
                    inputClassName,
                )}
                data-slot="code-input-control"
                inputMode={set.inputMode}
                // No maxLength: the browser would cut an autofilled "123-456" to "123-45" before
                // sanitise drops the dash; sanitise caps the length itself.
                onBeforeInput={handleBeforeInput}
                onBlur={event => {
                    setFocused(false);
                    onBlur?.(event);
                }}
                onChange={handleChange}
                onFocus={event => {
                    setFocused(true);
                    // Keyboard focus lands on the first empty box, where the code continues.
                    placeCaret(value.length);
                    onFocus?.(event);
                }}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                onPaste={handlePaste}
                onSelect={handleSelect}
                pattern={`${set.pattern}{${length}}`}
                ref={node => {
                    inputRef.current = node;
                    if (typeof ref === 'function') return ref(node);
                    if (ref) ref.current = node;
                }}
                spellCheck={false}
                // A masked code is a password to assistive tech too, so a screen reader does not read it out.
                type={mask ? 'password' : 'text'}
                value={value}
                {...control}
                {...props}
            />
        </div>
    );
};
