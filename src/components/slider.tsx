'use client';

import { Slider as SliderPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { useFieldControl } from './field';

/**
 * A range on Radix Slider: a 4px track in the hairline colour, filled with the
 * action colour up to a 16px knob on the surface colour. One knob per value.
 */
export const Slider = ({
    className,
    id,
    disabled,
    value,
    defaultValue,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: ComponentProps<typeof SliderPrimitive.Root>) => {
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
                'relative flex h-5 w-full touch-none select-none items-center',
                'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                className,
            )}
            data-slot="slider"
            defaultValue={defaultValue}
            value={value}
            {...control}
            {...props}
        >
            <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-neutral-200">
                <SliderPrimitive.Range className="absolute h-full bg-action [background-image:var(--pds-action-gradient)]" />
            </SliderPrimitive.Track>
            {Array.from({ length: thumbs }, (_, index) => (
                <SliderPrimitive.Thumb
                    className={cn(
                        'block size-4 cursor-grab rounded-full border border-neutral-300 bg-neutral-50 shadow-float transition-[border-color] duration-150 hover:border-neutral-500 active:cursor-grabbing',
                        focusRing,
                    )}
                    data-slot="slider-thumb"
                    // biome-ignore lint/suspicious/noArrayIndexKey: one knob per value, in order
                    key={index}
                />
            ))}
        </SliderPrimitive.Root>
    );
};
