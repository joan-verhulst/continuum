'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import {
    Children,
    type CSSProperties,
    isValidElement,
    type ReactNode,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { radioToggleRender } from '../lib/radio-toggle-render';
import { useSingleValue } from '../lib/use-single-value';
import { focusRing } from './button';
import { useField, useFieldControl } from './field';

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

// The keys Base UI's group moves focus with.
const selectKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/** The value of the first enabled item among the children, for a control given no value at all. */
const firstItemValue = (children: ReactNode): string | undefined => {
    for (const child of Children.toArray(children)) {
        if (!isValidElement<{ value?: unknown; disabled?: boolean }>(child)) continue;
        const { value, disabled } = child.props;
        if (typeof value === 'string' && !disabled) return value;
    }
    return undefined;
};

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
    disabled,
    className,
    children,
    onKeyDown,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    ...props
}: SegmentedControlProps) => {
    // Left without a value, it starts on its first item, so it holds one from the start.
    const [current, select] = useSingleValue(
        value,
        defaultValue ?? firstItemValue(children),
        onValueChange,
    );
    const ref = useRef<HTMLDivElement>(null);
    const field = useField();
    // Inside a Field it is named by the FieldLabel, described by the helper and disabled with it.
    // The group is a div, so a <label for> cannot name it; the id stays on the label.
    const control = useFieldControl({ disabled, 'aria-describedby': describedBy });

    // A radiogroup selects as the arrows move along it; Base UI's group only moves focus, so once it
    // has, the item that took focus is picked.
    const handleKeyDown: NonNullable<ToggleGroup.Props['onKeyDown']> = event => {
        onKeyDown?.(event);
        if (!selectKeys.has(event.key)) return;
        const group = event.currentTarget;
        const from = document.activeElement;
        requestAnimationFrame(() => {
            const item = document.activeElement;
            if (
                item instanceof HTMLElement &&
                item !== from &&
                item.parentElement === group &&
                item.matches('[data-slot=segmented-control-item]:not([data-disabled])')
            ) {
                item.click();
            }
        });
    };
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
                'relative isolate flex h-control max-w-full items-center rounded-item border border-neutral-200 bg-segment-track p-[2px]',
                fill ? 'w-full [&>[data-slot=segmented-control-item]]:flex-1' : 'w-fit',
                className,
            )}
            data-slot="segmented-control"
            ref={ref}
            role="radiogroup"
            aria-describedby={control['aria-describedby']}
            aria-labelledby={labelledBy ?? (props['aria-label'] ? undefined : field?.labelId)}
            disabled={control.disabled}
            onKeyDown={handleKeyDown}
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
                        // The 2px inset is fixed, as h-segment (control − 5px) assumes, at every spacing unit.
                        'absolute top-[2px] left-0 -z-10 h-segment rounded-[calc(var(--radius-item)-3px)] bg-segment [box-shadow:inset_0_0_0_1px_var(--color-segment-border),var(--shadow-segment)]',
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
            'inline-flex h-segment min-w-0 cursor-pointer select-none items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[calc(var(--radius-item)-3px)] px-2.5 font-medium text-neutral-600 text-xs transition-[background-color,color] duration-150',
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
