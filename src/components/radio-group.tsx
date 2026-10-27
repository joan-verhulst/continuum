'use client';

import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { cn, type WithClassName } from '../lib/cn';
import { focusRing } from './button';
import { FieldContext, useField, useFieldControl } from './field';

/** A stack of radios; inside a Field it is named by the FieldLabel and described by the helper. */
export const RadioGroup = <Value,>({
    className,
    disabled,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: WithClassName<RadioGroupPrimitive.Props<Value>>) => {
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
        // The group has used its Field; items must not take that Field's id, or its label would name
        // the first radio. An item only answers to a Field nested inside the group (one per option).
        <FieldContext.Provider value={null}>
            <RadioGroupPrimitive<Value>
                aria-labelledby={labelledBy ?? (props['aria-label'] ? undefined : field?.labelId)}
                className={cn('flex flex-col gap-2', className)}
                data-slot="radio-group"
                {...control}
                {...props}
            />
        </FieldContext.Provider>
    );
};

/** The library radiobutton: a hairline ring with a 14px action dot, as in the report generator. */
export const RadioGroupItem = <Value,>({
    className,
    id,
    'aria-describedby': describedBy,
    ...props
}: WithClassName<RadioPrimitive.Root.Props<Value>>) => {
    // A radio in its own Field (label beside each option) takes that Field's id, so the
    // label's for= names it and a click on the label selects it, as with Checkbox and Switch.
    const field = useField();
    const control = useFieldControl({ id, 'aria-describedby': describedBy });

    return (
        <RadioPrimitive.Root<Value>
            className={cn(
                'inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-transparent transition-[border-color] duration-150',
                // The root is a span, not a button, so the disabled state comes from its data attribute.
                'hover:border-neutral-500 data-disabled:cursor-not-allowed data-disabled:opacity-50',
                '[[aria-invalid=true]_&]:border-error-500',
                focusRing,
                className,
            )}
            data-slot="radio-group-item"
            id={control.id}
            aria-describedby={field ? control['aria-describedby'] : describedBy}
            {...props}
        >
            <RadioPrimitive.Indicator
                className="size-3.5 rounded-full bg-action [background-image:var(--action-gradient)]"
                data-slot="radio-group-indicator"
            />
        </RadioPrimitive.Root>
    );
};
