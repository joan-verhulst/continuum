'use client';

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { useField, useFieldControl } from './field';

/** A stack of radios; inside a Field it is named by the FieldLabel and described by the helper. */
export const RadioGroup = ({
    className,
    disabled,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) => {
    const field = useField();
    // The group is a div, so a <label for> cannot name it; the id stays on the label.
    const {
        id: _id,
        invalid: _invalid,
        ...control
    } = useFieldControl({
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });

    return (
        <RadioGroupPrimitive.Root
            aria-labelledby={labelledBy ?? (props['aria-label'] ? undefined : field?.labelId)}
            className={cn('flex flex-col gap-2', className)}
            data-slot="radio-group"
            {...control}
            {...props}
        />
    );
};

/** The library radiobutton: a hairline ring with a 14px action dot, as in the report generator. */
export const RadioGroupItem = ({
    className,
    ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) => (
    <RadioGroupPrimitive.Item
        className={cn(
            'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-transparent transition-[border-color] duration-150',
            'hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50',
            '[[aria-invalid=true]_&]:border-error-500',
            focusRing,
            className,
        )}
        data-slot="radio-group-item"
        {...props}
    >
        <RadioGroupPrimitive.Indicator className="size-3.5 rounded-full bg-action [background-image:var(--pds-action-gradient)]" />
    </RadioGroupPrimitive.Item>
);
