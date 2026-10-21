'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown } from 'lucide-react';
import { Select as SelectPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { useFieldControl } from './field';
import { ThemeScope } from './theme';

export const Select = (props: ComponentProps<typeof SelectPrimitive.Root>) => (
    <SelectPrimitive.Root data-slot="select" {...props} />
);

export const SelectGroup = (props: ComponentProps<typeof SelectPrimitive.Group>) => (
    <SelectPrimitive.Group data-slot="select-group" {...props} />
);

export const SelectValue = (props: ComponentProps<typeof SelectPrimitive.Value>) => (
    <SelectPrimitive.Value data-slot="select-value" {...props} />
);

export const selectTriggerVariants = cva(
    [
        'inline-flex shrink-0 cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-control border font-medium text-neutral-950 text-sm transition-[border-color,color] duration-150',
        'data-placeholder:text-neutral-500 data-placeholder:hover:text-neutral-700',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
        focusRing,
    ],
    {
        variants: {
            size: {
                sm: 'h-[34px] px-curve [--curve-base:9px] [--curve-radius:var(--pds-radius-control)] [--curve-height:34px]',
                md: 'h-[38px] px-curve [--curve-base:9px] [--curve-radius:var(--pds-radius-control)] [--curve-height:38px]',
            },
            invalid: {
                true: 'border-error-500',
                false: 'border-neutral-200 hover:border-neutral-300 data-[state=open]:border-neutral-200',
            },
        },
        defaultVariants: {
            size: 'md',
            invalid: false,
        },
    },
);

export type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> &
    Omit<VariantProps<typeof selectTriggerVariants>, 'invalid'> & {
        leadingIcon?: ReactNode;
    };

/** The library's "select input small/medium"; also the rows-per-page picker in tables. */
export const SelectTrigger = ({
    size,
    leadingIcon,
    className,
    children,
    id,
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: SelectTriggerProps) => {
    const { invalid, ...control } = useFieldControl({
        id,
        disabled,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
    });

    return (
        <SelectPrimitive.Trigger
            className={cn(selectTriggerVariants({ size, invalid }), className)}
            data-slot="select-trigger"
            {...control}
            {...props}
        >
            {leadingIcon && <span className="flex text-neutral-600">{leadingIcon}</span>}
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDown className="ml-auto text-neutral-600" strokeWidth={1.5} />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
};

/** The library's "dropdown": a raised list on the surface colour, at least as wide as its trigger. */
export const SelectContent = ({
    className,
    children,
    position = 'popper',
    sideOffset = 4,
    ...props
}: ComponentProps<typeof SelectPrimitive.Content>) => (
    <SelectPrimitive.Portal>
        <ThemeScope>
            <SelectPrimitive.Content
                className={cn(
                    'relative z-50 overflow-hidden rounded-item border border-neutral-200 bg-neutral-50 shadow-float',
                    'origin-(--radix-select-content-transform-origin) starting:scale-95 starting:opacity-0 transition-[opacity,scale] duration-200 ease-out-strong motion-reduce:transition-none',
                    position === 'popper' &&
                        'max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width)',
                    className,
                )}
                data-slot="select-content"
                position={position}
                sideOffset={sideOffset}
                {...props}
            >
                <SelectPrimitive.Viewport className="flex flex-col gap-1 p-1">
                    {children}
                </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
        </ThemeScope>
    </SelectPrimitive.Portal>
);

export const SelectLabel = ({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.Label>) => (
    <SelectPrimitive.Label
        className={cn('px-2 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs', className)}
        data-slot="select-label"
        {...props}
    />
);

export const SelectItem = ({
    className,
    children,
    ...props
}: ComponentProps<typeof SelectPrimitive.Item>) => (
    <SelectPrimitive.Item
        className={cn(
            'relative flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-item px-curve font-medium text-neutral-700 text-xs outline-none [--curve-base:5.5px] [--curve-height:32px] [--curve-radius:var(--pds-radius-item)] [&_svg]:text-neutral-600',
            'data-highlighted:bg-neutral-950/5 data-highlighted:text-neutral-800',
            'data-[state=checked]:bg-neutral-100 data-[state=checked]:text-neutral-950',
            'data-disabled:pointer-events-none data-disabled:opacity-50',
            '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            className,
        )}
        data-slot="select-item"
        {...props}
    >
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        <SelectPrimitive.ItemIndicator className="ml-auto flex">
            <Check strokeWidth={1.5} />
        </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
);

export const SelectSeparator = ({
    className,
    ...props
}: ComponentProps<typeof SelectPrimitive.Separator>) => (
    <SelectPrimitive.Separator
        className={cn('-mx-1 h-px bg-neutral-200', className)}
        data-slot="select-separator"
        {...props}
    />
);
