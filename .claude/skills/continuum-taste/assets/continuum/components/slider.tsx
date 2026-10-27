'use client';

import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { cn, type WithClassName } from '../lib/cn';
import { useField, useFieldControl } from './field';

/** Base UI hands back a bare number for one knob; callers always get an array. */
const toArray = (value: number | readonly number[]): number[] =>
    typeof value === 'number' ? [value] : [...value];

type SliderProps = Omit<
    WithClassName<SliderPrimitive.Root.Props<readonly number[]>>,
    'value' | 'defaultValue' | 'onValueChange' | 'onValueCommitted'
> & {
    /** One entry per knob, so a range is two values. */
    value?: readonly number[];
    defaultValue?: readonly number[];
    onValueChange?: (value: number[], details: SliderPrimitive.Root.ChangeEventDetails) => void;
    onValueCommitted?: (value: number[], details: SliderPrimitive.Root.CommitEventDetails) => void;
};

/**
 * A range on Base UI Slider: a 4px track in the hairline colour, filled with the
 * action colour up to a 16px knob on the surface colour. One knob per value.
 */
export const Slider = ({
    className,
    id,
    disabled,
    value,
    defaultValue,
    onValueChange,
    onValueCommitted,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: SliderProps) => {
    const field = useField();
    const { invalid: _invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });
    const thumbs = (value ?? defaultValue ?? [0]).length;

    return (
        <SliderPrimitive.Root
            className={cn(
                'w-full data-disabled:cursor-not-allowed data-disabled:opacity-50',
                className,
            )}
            data-slot="slider"
            defaultValue={defaultValue}
            disabled={control.disabled}
            id={control.id}
            // The knobs are the focusable inputs, so the field label reaches them through the root.
            aria-labelledby={labelledBy ?? (ariaLabel ? undefined : field?.labelId)}
            aria-invalid={control['aria-invalid']}
            // Edge alignment keeps the knob inside the track at min and max, as before.
            thumbAlignment="edge"
            value={value}
            onValueChange={
                onValueChange && ((next, details) => onValueChange(toArray(next), details))
            }
            onValueCommitted={
                onValueCommitted && ((next, details) => onValueCommitted(toArray(next), details))
            }
            {...props}
        >
            <SliderPrimitive.Control
                className="relative flex h-5 w-full touch-none select-none items-center"
                data-slot="slider-control"
            >
                <SliderPrimitive.Track
                    className="relative h-1 grow overflow-hidden rounded-full bg-neutral-200"
                    data-slot="slider-track"
                >
                    <SliderPrimitive.Indicator
                        className="h-full bg-action [background-image:var(--action-gradient)]"
                        data-slot="slider-range"
                    />
                </SliderPrimitive.Track>
                {Array.from({ length: thumbs }, (_, index) => (
                    <SliderPrimitive.Thumb
                        // A label on the slider names each knob's input, which is what takes focus.
                        aria-describedby={control['aria-describedby']}
                        aria-label={ariaLabel}
                        className={cn(
                            'block size-4 cursor-grab rounded-full border border-neutral-300 bg-neutral-50 shadow-float transition-[border-color] duration-150 hover:border-neutral-500 active:cursor-grabbing data-dragging:cursor-grabbing',
                            // Focus lands on the hidden input inside the knob, so the ring follows it.
                            'outline-none has-focus-visible:outline-2 has-focus-visible:outline-focus has-focus-visible:outline-solid has-focus-visible:outline-offset-2',
                        )}
                        data-slot="slider-thumb"
                        index={index}
                        // biome-ignore lint/suspicious/noArrayIndexKey: one knob per value, in order
                        key={index}
                    />
                ))}
            </SliderPrimitive.Control>
        </SliderPrimitive.Root>
    );
};
