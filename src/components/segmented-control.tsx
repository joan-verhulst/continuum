'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
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

type Thumb = { left: number; width: number; moved: boolean };

/**
 * Picks one value that reshapes the same content: a view (List · Grid), a range (7d · 30d), a filter.
 * To switch between panels with content of their own, use Tabs instead.
 * Always holds one value: clicking the active segment keeps it selected. The raised segment is one
 * thumb under the items, so it slides from the old value to the new one.
 */
export const SegmentedControl = ({
    fill,
    value,
    defaultValue,
    onValueChange,
    className,
    children,
    ...props
}: SegmentedControlProps) => {
    const [current, select] = useSingleValue(value, defaultValue, onValueChange);
    const ref = useRef<HTMLDivElement>(null);
    const [thumb, setThumb] = useState<Thumb>();

    // Measured before paint, so the thumb lands on the first value without sliding to it; it only
    // slides once it has a place to slide from, and follows a resize (a font loading, `fill`) the same way.
    // biome-ignore lint/correctness/useExhaustiveDependencies: the pressed item is read from the DOM, so a new value re-measures
    useLayoutEffect(() => {
        const group = ref.current;
        if (!group) return;
        const measure = () => {
            const item = group.querySelector<HTMLElement>(
                ':scope > [data-slot=segmented-control-item][data-pressed]',
            );
            setThumb(previous =>
                item
                    ? {
                          left: item.offsetLeft,
                          width: item.offsetWidth,
                          moved: previous !== undefined,
                      }
                    : undefined,
            );
        };
        measure();
        const observer = new ResizeObserver(() => measure());
        observer.observe(group);
        return () => observer.disconnect();
    }, [current]);

    return (
        <ToggleGroup
            className={cn(
                // Hugs its items even in a stretching flex column, and never outgrows its parent.
                'relative isolate flex h-[34px] max-w-full items-center rounded-item border border-neutral-200 bg-segment-track p-0.5',
                fill ? 'w-full [&>[data-slot=segmented-control-item]]:flex-1' : 'w-fit',
                className,
            )}
            data-slot="segmented-control"
            ref={ref}
            role="radiogroup"
            {...props}
            // Clicking the pressed item hands back an empty array, which `select` ignores.
            onValueChange={values => select(values[0] ?? '')}
            value={current ? [current] : []}
        >
            {thumb && (
                <span
                    aria-hidden
                    className={cn(
                        // The item's own corner and raise: an inset ring, so its outline adds no width.
                        'absolute top-0.5 left-0 -z-10 h-[29px] rounded-[calc(var(--radius-item)-3px)] bg-segment [box-shadow:inset_0_0_0_1px_var(--color-segment-border),var(--shadow-segment)]',
                        thumb.moved &&
                            'transition-[translate,width] duration-200 ease-out-strong motion-reduce:transition-none',
                    )}
                    data-slot="segmented-control-thumb"
                    style={{ translate: `${thumb.left}px 0`, width: thumb.width } as CSSProperties}
                />
            )}
            {children}
        </ToggleGroup>
    );
};

export type SegmentedControlItemProps = Omit<Toggle.Props, 'className'> & { className?: string };

export const SegmentedControlItem = ({ className, ...props }: SegmentedControlItemProps) => (
    <Toggle
        className={cn(
            // The track's radius minus its 2px inset and 1px border, so the curves stay concentric in every theme.
            'inline-flex h-[29px] min-w-0 cursor-pointer select-none items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[calc(var(--radius-item)-3px)] px-2.5 font-medium text-neutral-600 text-xs transition-[background-color,color] duration-150',
            'hover:bg-neutral-950/5 hover:text-neutral-800',
            // The thumb under it is the raised look; the item only takes the thumb's text colour.
            'data-pressed:text-segment-fg data-pressed:hover:bg-transparent data-pressed:hover:text-segment-fg',
            'data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="segmented-control-item"
        render={radioToggleRender}
        {...props}
    />
);
