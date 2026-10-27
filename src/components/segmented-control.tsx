'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { cn } from '../lib/cn';
import { radioToggleRender } from '../lib/radio-toggle-render';
import { useSingleValue } from '../lib/use-single-value';
import { focusRing } from './button';

// Base UI holds a group's value as an array that may go empty; the public API stays a single string.
export type SegmentedControlProps = Omit<
    ToggleGroup.Props,
    'className' | 'multiple' | 'value' | 'defaultValue' | 'onValueChange'
> & {
    className?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Shares the full width out evenly between the items, instead of hugging them. */
    fill?: boolean;
};

/**
 * The library's "tab group" (report editor filters, analytics range picker).
 * Always holds one value: clicking the active segment keeps it selected.
 */
export const SegmentedControl = ({
    fill,
    value,
    defaultValue,
    onValueChange,
    className,
    ...props
}: SegmentedControlProps) => {
    const [current, select] = useSingleValue(value, defaultValue, onValueChange);

    return (
        <ToggleGroup
            className={cn(
                // Hugs its items even in a stretching flex column, and never outgrows its parent.
                'flex h-[34px] max-w-full items-center rounded-item border border-neutral-200 bg-segment-track p-0.5',
                fill ? 'w-full [&>*]:flex-1' : 'w-fit',
                className,
            )}
            data-slot="segmented-control"
            role="radiogroup"
            {...props}
            // Clicking the pressed item hands back an empty array, which `select` ignores.
            onValueChange={values => select(values[0] ?? '')}
            value={current ? [current] : []}
        />
    );
};

export type SegmentedControlItemProps = Omit<Toggle.Props, 'className'> & { className?: string };

export const SegmentedControlItem = ({ className, ...props }: SegmentedControlItemProps) => (
    <Toggle
        className={cn(
            // The track's radius minus its 2px inset and 1px border, so the curves stay concentric in every theme.
            'inline-flex h-[29px] min-w-0 cursor-pointer select-none items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[calc(var(--radius-item)-3px)] px-2.5 font-medium text-neutral-600 text-xs transition-[background-color,color,box-shadow] duration-150',
            'hover:bg-neutral-950/5 hover:text-neutral-800',
            // An inset ring, not a border, so a raised segment's outline adds no width.
            'data-pressed:bg-segment data-pressed:text-segment-fg data-pressed:[box-shadow:inset_0_0_0_1px_var(--color-segment-border),var(--shadow-segment)]',
            'data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="segmented-control-item"
        render={radioToggleRender}
        {...props}
    />
);
