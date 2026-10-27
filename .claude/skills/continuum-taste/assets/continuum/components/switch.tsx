'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import type { ComponentProps } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { focusRing } from './button';
import { useFieldControl } from './field';

/**
 * The library toggle (48x25 track, 21px knob). The knob takes the on-action
 * colour when checked so it stays visible on a light action track in dark mode.
 */
export const Switch = ({
    className,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: WithClassName<ComponentProps<typeof SwitchPrimitive.Root>>) => {
    const { invalid: _invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });

    return (
        <SwitchPrimitive.Root
            className={cn(
                'inline-flex h-[25px] w-12 shrink-0 cursor-pointer items-center rounded-full bg-neutral-300 p-0.5 transition-[background-color] duration-150',
                'data-checked:bg-action data-checked:shadow-action data-checked:[background-image:var(--action-gradient)]',
                // The root is a span, not a button, so the disabled state comes from its data attribute.
                'data-disabled:cursor-not-allowed data-disabled:opacity-50',
                focusRing,
                className,
            )}
            data-slot="switch"
            {...control}
            {...props}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    'pointer-events-none block size-[21px] rounded-full bg-neutral-50 transition-[translate,background-color] duration-200 ease-out-strong motion-reduce:transition-none',
                    'data-checked:translate-x-[23px] data-checked:bg-on-action',
                )}
                data-slot="switch-thumb"
            />
        </SwitchPrimitive.Root>
    );
};
