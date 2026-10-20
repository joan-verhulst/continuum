'use client';

import { ToggleGroup } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
import { useSingleValue } from '../lib/use-single-value';
import { focusRing } from './button';
import type { SegmentedControlProps } from './segmented-control';

export type DockProps = SegmentedControlProps;

/**
 * The analytics screens' floating bottom pill nav. Like a segmented control
 * it always keeps one section selected.
 */
export const Dock = ({ value, defaultValue, onValueChange, className, ...props }: DockProps) => {
    const [current, select] = useSingleValue(value, defaultValue, onValueChange);

    return (
        <ToggleGroup.Root
            className={cn(
                'inline-flex h-10 items-center gap-0.5 rounded-full border border-neutral-100 bg-neutral-50 p-1 shadow-float',
                className,
            )}
            data-slot="dock"
            onValueChange={select}
            type="single"
            value={current}
            {...props}
        />
    );
};

export const DockItem = ({ className, ...props }: ComponentProps<typeof ToggleGroup.Item>) => (
    <ToggleGroup.Item
        className={cn(
            'inline-flex h-8 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-full py-1 pr-3 pl-2 font-medium text-neutral-600 text-xs transition-[background-color,color] duration-150',
            'hover:text-neutral-950',
            'data-[state=on]:bg-action data-[state=on]:text-on-action data-[state=on]:shadow-action data-[state=on]:[background-image:var(--pds-action-gradient)]',
            'disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="dock-item"
        {...props}
    />
);

/** The dark pill that floats beside the dock, e.g. a filter icon with "(6)". */
export const DockAction = ({ className, type = 'button', ...props }: ComponentProps<'button'>) => (
    <button
        className={cn(
            'inline-flex h-10 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-full bg-action px-3 font-medium text-on-action text-xs shadow-action transition-colors duration-150 [background-image:var(--pds-action-gradient)]',
            'hover:bg-action-hover hover:[background-image:none]',
            'disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="dock-action"
        type={type}
        {...props}
    />
);
