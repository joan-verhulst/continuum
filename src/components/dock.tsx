'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';
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
    /** Pins the bar 24px above the bottom of its positioned parent, centred. */
    floating?: boolean;
}) => (
    <div
        className={cn(
            'flex items-center gap-2',
            floating && 'absolute inset-x-0 bottom-6 z-10 mx-auto w-fit',
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
    // The field row's 38px: 32px items inside a 3px inset and a hairline.
    'flex h-[38px] w-fit max-w-full items-center gap-0.5 rounded-dock border border-neutral-200 bg-neutral-50 p-[3px] shadow-float',
    { variants: { shape: shapeVariants }, defaultVariants: { shape: 'theme' } },
);

export type DockProps = SegmentedControlProps & VariantProps<typeof dockVariants>;

/** The sections of a page. Like a segmented control it always keeps one selected. */
export const Dock = ({
    shape,
    value,
    defaultValue,
    onValueChange,
    className,
    ...props
}: DockProps) => {
    const [current, select] = useSingleValue(value, defaultValue, onValueChange);

    return (
        <ToggleGroup
            className={cn(dockVariants({ shape }), className)}
            data-slot="dock"
            role="radiogroup"
            {...props}
            // Clicking the pressed item hands back an empty array, which `select` ignores.
            onValueChange={values => select(values[0] ?? '')}
            value={current ? [current] : []}
        />
    );
};

export type DockItemProps = Omit<Toggle.Props, 'className'> & { className?: string };

export const DockItem = ({ className, ...props }: DockItemProps) => (
    <Toggle
        className={cn(
            // The bar's radius minus its 3px inset and 1px border, so the curves stay concentric.
            'inline-flex h-8 cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-[calc(var(--radius-dock)-4px)] px-3 font-medium text-neutral-600 text-xs transition-[background-color,color,box-shadow] duration-150',
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

export const dockActionVariants = cva('rounded-dock', {
    variants: {
        shape: shapeVariants,
        size: {
            default: '',
            icon: 'w-[38px] px-0',
        },
    },
    defaultVariants: { shape: 'theme', size: 'default' },
});

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
