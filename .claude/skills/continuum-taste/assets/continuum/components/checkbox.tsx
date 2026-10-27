'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check, Minus } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { focusRing } from './button';
import { useFieldControl } from './field';

type CheckboxProps = Omit<
    WithClassName<ComponentProps<typeof CheckboxPrimitive.Root>>,
    'checked'
> & {
    /**
     * `'indeterminate'` is still accepted so call sites written for a tri-state
     * checked keep working; it maps to Base UI's separate `indeterminate` prop.
     */
    checked?: boolean | 'indeterminate';
};

/**
 * The library checkbox (22px, chip radius), used in table header/body cells and
 * the report-generator option rows. Checked fills with the action colour but
 * keeps its hairline, as drawn; it has no lit ring like the primary button.
 */
export const Checkbox = ({
    className,
    id,
    disabled,
    checked,
    indeterminate,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: CheckboxProps) => {
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });
    const mixed = indeterminate ?? checked === 'indeterminate';

    return (
        <CheckboxPrimitive.Root
            // A mixed box reads as unticked underneath, so a click ticks it, as it did before.
            checked={checked === 'indeterminate' ? false : checked}
            className={cn(
                'group/checkbox inline-flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-chip border bg-transparent text-on-action transition-[background-color,border-color] duration-150',
                invalid ? 'border-error-500' : 'border-neutral-300 hover:border-neutral-500',
                'data-checked:bg-action data-indeterminate:bg-action',
                'data-checked:[background-image:var(--action-gradient)] data-indeterminate:[background-image:var(--action-gradient)]',
                // The root is a span, not a button, so the disabled state comes from its data attribute.
                'data-disabled:cursor-not-allowed data-disabled:opacity-50',
                focusRing,
                className,
            )}
            data-slot="checkbox"
            indeterminate={mixed}
            {...control}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                className="flex items-center justify-center"
                data-slot="checkbox-indicator"
            >
                <Check
                    className="hidden size-4 group-data-checked/checkbox:block"
                    strokeWidth={2}
                />
                <Minus
                    className="hidden size-4 group-data-indeterminate/checkbox:block"
                    strokeWidth={2}
                />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
};
