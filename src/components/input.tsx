'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { useFieldControl } from './field';

/*
 * The wrapper carries the border so icons sit inside the box; the native input
 * is borderless and the wrapper shows the focus ring when it is focused.
 */
export const inputVariants = cva(
    [
        'group/input flex w-full min-w-0 items-center gap-2 border transition-[border-color] duration-150',
        'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-focus has-[input:focus-visible]:outline-offset-2',
        '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
    ],
    {
        variants: {
            size: {
                // The control row (level with a button) and the field row (level with a large one).
                sm: 'h-control rounded-control px-3',
                md: 'h-control-lg rounded-control px-3',
            },
            variant: {
                outline: '',
                /*
                 * No box: the search inside a container (a table's bar, a menu) is an icon and the
                 * text. It keeps the shared ring round where the box would be, so a keyboard still
                 * sees where it is.
                 */
                plain: 'border-transparent px-0',
            },
            invalid: {
                true: 'border-error-500 [&_svg]:text-error-500',
                false: '',
            },
            disabled: {
                // As every control: the whole box at half strength, its colours and border kept.
                true: 'cursor-not-allowed opacity-50',
                false: '',
            },
        },
        compoundVariants: [
            {
                variant: 'outline',
                invalid: false,
                disabled: false,
                className:
                    'border-neutral-200 hover:border-neutral-300 has-[input:focus]:border-neutral-300 [&_svg]:text-neutral-600',
            },
            {
                variant: 'outline',
                invalid: false,
                disabled: true,
                className: 'border-neutral-200 [&_svg]:text-neutral-600',
            },
            { variant: 'plain', invalid: false, className: '[&_svg]:text-neutral-600' },
        ],
        defaultVariants: {
            size: 'md',
            variant: 'outline',
            invalid: false,
            disabled: false,
        },
    },
);

/*
 * Value and placeholder colours shared with Textarea. The library's "selected"
 * state is the value in neutral-900. Disabled keeps these colours: the box around
 * them is dimmed to half strength, as every disabled control is.
 */
export const inputTextClass = [
    'font-medium text-neutral-900 text-xs placeholder:text-neutral-600',
    'aria-invalid:placeholder:text-error-300',
    'disabled:cursor-not-allowed',
];

export type InputProps = Omit<ComponentProps<'input'>, 'size'> &
    Omit<VariantProps<typeof inputVariants>, 'invalid' | 'disabled'> & {
        leadingIcon?: ReactNode;
        trailing?: ReactNode;
        /** Classes for the native input; `className` goes on the bordered box. */
        inputClassName?: string;
    };

/** Inputs from the library ("input small/medium") and the report-generator forms. */
export const Input = ({
    size,
    variant,
    leadingIcon,
    trailing,
    className,
    inputClassName,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: InputProps) => {
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });
    const isDisabled = Boolean(control.disabled);

    return (
        <div
            className={cn(
                inputVariants({ size, variant, invalid, disabled: isDisabled }),
                className,
            )}
            data-disabled={isDisabled || undefined}
            data-invalid={invalid || undefined}
            data-slot="input"
        >
            {leadingIcon}
            <input
                className={cn(
                    'h-full min-w-0 flex-1 bg-transparent outline-none',
                    inputTextClass,
                    !invalid && !isDisabled && 'group-hover/input:placeholder:text-neutral-700',
                    inputClassName,
                )}
                data-slot="input-control"
                {...control}
                {...props}
            />
            {trailing}
        </div>
    );
};
