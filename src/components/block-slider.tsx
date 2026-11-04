'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { type ReactNode, useId, useState } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { useField, useFieldControl } from './field';

/** Base UI hands back a bare number for one knob; callers always get an array. */
const toArray = (value: number | readonly number[]): number[] =>
    typeof value === 'number' ? [value] : [...value];

/** The box height, and a grip line that keeps the same share of it. */
const sizes = {
    // Level with a button, and with a large one or a field-row input.
    sm: { box: 'h-[34px]', grip: 'after:h-3.5' },
    md: { box: 'h-[38px]', grip: 'after:h-4' },
    lg: { box: 'h-12', grip: 'after:h-5' },
} as const;

type BlockSliderProps = Omit<
    WithClassName<SliderPrimitive.Root.Props<readonly number[]>>,
    'value' | 'defaultValue' | 'onValueChange' | 'onValueCommitted'
> & {
    /** One entry per grip, so a range is two values. */
    value?: readonly number[];
    defaultValue?: readonly number[];
    onValueChange?: (value: number[], details: SliderPrimitive.Root.ChangeEventDetails) => void;
    onValueCommitted?: (value: number[], details: SliderPrimitive.Root.CommitEventDetails) => void;
    /** Written inside the box on the left, with the value on the right. Names the slider too. */
    label?: ReactNode;
    /** How the value reads on the right; a range joins its ends with a dash by default. */
    format?: (value: number[]) => ReactNode;
    /** sm 34px and md 38px sit in a row of controls; lg 48px stands on its own. */
    size?: keyof typeof sizes;
    /** A divider every this many units, counted from min, to show what the value lines up with. */
    marks?: number;
    /** Moves the value from divider to divider only, by dragging and by keyboard alike. */
    snap?: boolean;
};

/**
 * A slider as a box (34, 38 or 48px): a hairline container, 2px of padding, and a
 * grey fill with nested corners growing inside it. The whole box takes the
 * pointer; the grip line shows on hover, while dragging and on focus. With a
 * label, the box reads the setting on the left and its value on the right.
 */
export const BlockSlider = ({
    className,
    id,
    disabled,
    value,
    defaultValue,
    onValueChange,
    onValueCommitted,
    label,
    format = values => values.join(' – '),
    size = 'lg',
    min = 0,
    max = 100,
    step,
    marks,
    snap = false,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: BlockSliderProps) => {
    const field = useField();
    const labelId = useId();
    const { invalid: _invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });
    // Kept here as well so the value on the right follows an uncontrolled slider.
    const [uncontrolled, setUncontrolled] = useState(() => toArray(defaultValue ?? [0]));
    const current = value ?? uncontrolled;
    const thumbs = current.length;
    // The dividers between the ends; the ends are the box itself.
    const dividers: number[] = [];
    if (marks && marks > 0) {
        for (let at = min + marks; at < max; at += marks) {
            dividers.push(((at - min) / (max - min)) * 100);
        }
    }

    return (
        <SliderPrimitive.Root
            className={cn(
                'group/block-slider w-full data-disabled:cursor-not-allowed data-disabled:opacity-50',
                className,
            )}
            data-slot="block-slider"
            defaultValue={defaultValue}
            disabled={control.disabled}
            id={control.id}
            max={max}
            min={min}
            step={snap && marks ? marks : step}
            // The grips are the focusable inputs, so a label reaches them through the root.
            aria-labelledby={
                labelledBy ?? (ariaLabel ? undefined : label ? labelId : field?.labelId)
            }
            aria-invalid={control['aria-invalid']}
            // Centred on the value, so an empty slider shows no fill and a full one fills the box.
            thumbAlignment="center"
            value={value}
            onValueChange={(next, details) => {
                setUncontrolled(toArray(next));
                onValueChange?.(toArray(next), details);
            }}
            onValueCommitted={
                onValueCommitted && ((next, details) => onValueCommitted(toArray(next), details))
            }
            {...props}
        >
            {/* The control is the box, so a press anywhere in it, padding included, moves the value. */}
            <SliderPrimitive.Control
                className={cn(
                    'relative flex w-full cursor-pointer touch-none select-none rounded-control border border-neutral-200 p-0.5 transition-[border-color] duration-150 hover:border-neutral-300 group-data-disabled/block-slider:cursor-not-allowed group-data-disabled/block-slider:hover:border-neutral-200',
                    sizes[size].box,
                )}
                data-size={size}
                data-slot="block-slider-control"
            >
                <SliderPrimitive.Track
                    className="relative h-full grow"
                    data-slot="block-slider-track"
                >
                    {dividers.map(at => (
                        <span
                            aria-hidden
                            // A notch in the box's bottom hairline: it crosses the padding to meet the
                            // border, shares its colour and hover, and sits under the fill.
                            className="pointer-events-none absolute -bottom-0.5 h-2 w-px -translate-x-1/2 bg-neutral-200 transition-[background-color] duration-150 group-hover/block-slider:bg-neutral-300 group-data-disabled/block-slider:bg-neutral-200"
                            data-slot="block-slider-mark"
                            key={at}
                            style={{ left: `${at}%` }}
                        />
                    ))}
                    <SliderPrimitive.Indicator
                        className="h-full rounded-[calc(var(--radius-control)-2px)] bg-neutral-200"
                        data-slot="block-slider-range"
                    />

                    {label !== undefined && (
                        <div
                            className="pointer-events-none absolute inset-0 flex items-center justify-between gap-3 px-2.5 text-xs"
                            data-slot="block-slider-info"
                        >
                            <span className="truncate text-neutral-600" id={labelId}>
                                {label}
                            </span>
                            <span className="shrink-0 text-neutral-950 tabular-nums">
                                {format([...current])}
                            </span>
                        </div>
                    )}
                    {Array.from({ length: thumbs }, (_, index) => (
                        <SliderPrimitive.Thumb
                            // A label on the slider names each grip's input, which is what takes focus.
                            aria-describedby={control['aria-describedby']}
                            aria-label={ariaLabel}
                            className={cn(
                                // A 12px hit area round a 2px grip line at the edge of the fill.
                                'flex h-full w-3 cursor-grab items-center justify-center rounded-xs active:cursor-grabbing data-dragging:cursor-grabbing',
                                sizes[size].grip,
                                'after:w-0.5 after:rounded-full after:bg-neutral-500 after:opacity-0 after:transition-[opacity,background-color] after:duration-150',
                                'group-hover/block-slider:after:opacity-100 has-focus-visible:after:opacity-100 data-dragging:after:bg-neutral-950 data-dragging:after:opacity-100',
                                'group-data-disabled/block-slider:after:opacity-0',
                                // Focus lands on the hidden input inside the grip, so the ring follows it.
                                'outline-none has-focus-visible:outline-2 has-focus-visible:outline-focus has-focus-visible:outline-solid has-focus-visible:outline-offset-2',
                            )}
                            data-slot="block-slider-thumb"
                            index={index}
                            // biome-ignore lint/suspicious/noArrayIndexKey: one grip per value, in order
                            key={index}
                        />
                    ))}
                </SliderPrimitive.Track>
            </SliderPrimitive.Control>
        </SliderPrimitive.Root>
    );
};
