'use client';

import { ToggleGroup } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { useSingleValue } from '../lib/use-single-value';
import { focusRing } from './button';

export type SegmentedControlProps = Omit<
    ComponentProps<typeof ToggleGroup.Root>,
    'type' | 'value' | 'defaultValue' | 'onValueChange'
> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
};

/**
 * The library's "tab group" (report editor filters, analytics range picker).
 * Always holds one value: clicking the active segment keeps it selected.
 */
export const SegmentedControl = ({
    value,
    defaultValue,
    onValueChange,
    className,
    ...props
}: SegmentedControlProps) => {
    const [current, select] = useSingleValue(value, defaultValue, onValueChange);

    return (
        <ToggleGroup.Root
            className={cn(
                'inline-flex h-[34px] items-center gap-0.5 rounded-item border border-neutral-200 bg-segment-track p-0.5 pl-[3px]',
                className,
            )}
            data-slot="segmented-control"
            onValueChange={select}
            type="single"
            value={current}
            {...props}
        />
    );
};

export type SegmentedControlItemProps = ComponentProps<typeof ToggleGroup.Item>;

export const SegmentedControlItem = ({ className, ...props }: SegmentedControlItemProps) => (
    <ToggleGroup.Item
        className={cn(
            // The track's radius minus its 2px inset, so the curves stay concentric in every theme.
            'inline-flex h-[29px] cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--pds-radius-item)-2px)] border border-transparent px-2.5 font-medium text-neutral-600 text-xs transition-[background-color,border-color,color] duration-150',
            'hover:bg-neutral-950/5 hover:text-neutral-800',
            'data-[state=on]:border-segment-border data-[state=on]:bg-segment data-[state=on]:text-segment-fg data-[state=on]:[box-shadow:var(--pds-segment-shadow)]',
            'disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="segmented-control-item"
        {...props}
    />
);
