'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps, useEffect } from 'react';
import { cn } from '../lib/cn';
import { OverflowChevron, useOverflowScroll } from '../lib/overflow-scroll';
import { radioToggleRender } from '../lib/radio-toggle-render';
import { useSingleValue } from '../lib/use-single-value';
import { buttonVariants, focusRing } from './button';
import type { SegmentedControlProps } from './segmented-control';

/**
 * The bar that floats at the bottom of a page: a dock of sections and, beside
 * it, the page's main action (a + or a filter). Its corners follow the theme,
 * a full pill by default, unless `shape` says otherwise.
 */
export const BottomBar = ({
    floating,
    className,
    ...props
}: ComponentProps<'div'> & {
    /**
     * Pins the bar 24px above the bottom of its positioned parent, centred, and never wider than the
     * parent less 16px a side, so a dock with more sections than fit scrolls rather than spills.
     */
    floating?: boolean;
}) => (
    <div
        className={cn(
            'flex min-w-0 max-w-full items-center gap-2',
            floating && 'absolute inset-x-0 bottom-6 z-10 mx-auto w-fit max-w-[calc(100%-32px)]',
            className,
        )}
        data-slot="bottom-bar"
        {...props}
    />
);

const shapeVariants = {
    theme: '',
    pill: '[--radius-dock:9999px]',
    // A tighter corner, the item's 10px, so it still scales with the theme's corners.
    rounded: '[--radius-dock:var(--radius-item)]',
};

export const dockVariants = cva(
    // The field row's 38px: 32px items inside a 2px inset and a hairline. The inset is fixed like the
    // heights, so it stays even on all four sides whatever the spacing unit.
    'flex h-control-lg w-fit min-w-0 max-w-full items-center gap-0.5 rounded-dock border border-neutral-200 bg-neutral-50 p-[2px] shadow-float',
    { variants: { shape: shapeVariants }, defaultVariants: { shape: 'theme' } },
);

export type DockProps = SegmentedControlProps & VariantProps<typeof dockVariants>;

/**
 * The sections of a page. Like a segmented control it always keeps one selected. More sections
 * than fit scroll sideways, with a chevron at the end that has more and the selected one kept in view.
 */
export const Dock = ({
    shape,
    value,
    defaultValue,
    onValueChange,
    className,
    ...props
}: DockProps) => {
    const [current, select] = useSingleValue(value, defaultValue, onValueChange);
    const { ref, edges, step, reveal, style } = useOverflowScroll<HTMLDivElement>();

    useEffect(() => {
        // Again when the row starts overflowing, so the selected one is in view from the start.
        if (current && edges.overflows) reveal('[data-pressed]');
    }, [current, reveal, edges.overflows]);

    return (
        <div className={cn(dockVariants({ shape }), className)} data-slot="dock">
            {edges.overflows && (
                <OverflowChevron
                    className={chevron}
                    direction={-1}
                    disabled={!edges.start}
                    onStep={step}
                />
            )}
            <ToggleGroup
                // The row clips at the dock's inset, not its items, so a focus ring keeps its room.
                className="scrollbar-none my-[-2px] flex min-w-0 items-center gap-0.5 overflow-x-auto py-[2px]"
                data-slot="dock-items"
                ref={ref}
                role="radiogroup"
                style={style}
                {...props}
                // Clicking the pressed item hands back an empty array, which `select` ignores.
                onValueChange={values => select(values[0] ?? '')}
                value={current ? [current] : []}
            />
            {edges.overflows && (
                <OverflowChevron
                    className={chevron}
                    direction={1}
                    disabled={!edges.end}
                    onStep={step}
                />
            )}
        </div>
    );
};

// An item's 32px and its concentric corner.
const chevron = 'size-cell rounded-[calc(var(--radius-dock)-3px)]';

export type DockItemProps = Omit<Toggle.Props, 'className'> & { className?: string };

export const DockItem = ({ className, ...props }: DockItemProps) => (
    <Toggle
        className={cn(
            // The bar's radius minus its 2px inset and 1px border, so the curves stay concentric.
            'inline-flex h-cell cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-[calc(var(--radius-dock)-3px)] px-3 font-medium text-neutral-600 text-xs transition-[background-color,color,box-shadow] duration-150',
            'hover:text-neutral-950',
            'data-pressed:bg-segment data-pressed:text-segment-fg data-pressed:[box-shadow:inset_0_0_0_1px_var(--color-segment-border),var(--shadow-segment)]',
            'data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="dock-item"
        render={radioToggleRender}
        {...props}
    />
);

/**
 * A count after a dock item's label ("Active 12"), in the item's own colour at 70%, so it follows
 * the pressed item onto its fill. It hides on a compact shell, where the labels need the room.
 */
export const DockCount = ({ className, ...props }: ComponentProps<'span'>) => (
    <span
        className={cn(
            '@max-shell-compact/shell:hidden font-normal tabular-nums opacity-70',
            className,
        )}
        data-slot="dock-count"
        {...props}
    />
);

export const dockActionVariants = cva(
    [
        // A lit action's ring drawn inside, so it stays the dock's 38px instead of growing 1px each side.
        'rounded-dock [box-shadow:inset_0_1px_0_0_var(--color-action-highlight),inset_0_0_0_1px_var(--color-action-ring)]',
        // On a compact shell an action with an icon keeps only the icon, a 38px square, so the dock
        // keeps the width; its label stays in the button for screen readers, set at no size.
        '@max-shell-compact/shell:has-[svg]:w-control-lg @max-shell-compact/shell:has-[svg]:gap-0 @max-shell-compact/shell:has-[svg]:px-0 @max-shell-compact/shell:has-[svg]:text-[0px]',
    ],
    {
        variants: {
            shape: shapeVariants,
            size: {
                default: '',
                icon: 'w-control-lg px-0',
            },
        },
        defaultVariants: { shape: 'theme', size: 'default' },
    },
);

export type DockActionProps = ComponentProps<'button'> & VariantProps<typeof dockActionVariants>;

/**
 * The action beside the dock: a large primary Button with the dock's corners.
 * "Start campaign" with a rocket, a filter with its count "(6)", or
 * `size="icon"` for a lone +.
 */
export const DockAction = ({
    shape,
    size,
    className,
    type = 'button',
    ...props
}: DockActionProps) => (
    <button
        className={cn(
            buttonVariants({ variant: 'primary', size: 'lg' }),
            dockActionVariants({ shape, size }),
            className,
        )}
        data-slot="dock-action"
        type={type}
        {...props}
    />
);
