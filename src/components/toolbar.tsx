'use client';

import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar';
import { cva, type VariantProps } from 'class-variance-authority';
import { Sparkles } from 'lucide-react';
import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

const toolbarVariants = cva(
    'flex w-fit max-w-full items-stretch border border-neutral-200 bg-neutral-50 shadow-float',
    {
        variants: {
            variant: {
                inline: 'h-[34px] overflow-hidden rounded-control',
                // The field row's 38px: items stretch to the 30px left inside a 3px inset and the hairline. It
                // keeps the inline bar's corner, not the dock's pill, so both variants follow the theme's corners.
                floating: 'h-[38px] gap-0.5 rounded-control p-[3px]',
            },
        },
        defaultVariants: { variant: 'inline' },
    },
);

const toolbarButtonVariants = cva(
    [
        'inline-flex cursor-pointer select-none items-center whitespace-nowrap font-medium text-neutral-600 text-xs transition-[background-color,color] duration-150',
        'hover:text-neutral-950',
        // Base UI keeps a disabled toolbar button focusable, so it sets data-disabled rather than the disabled attribute.
        'data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
        focusRing,
    ],
    {
        variants: {
            variant: {
                // The bar clips overflow, so the ring has to sit inside the button. The divider runs the full
                // height, but the hover sits 2px inside it, the same shape as the chip.
                inline: [
                    'relative isolate gap-1.5 border-neutral-200 not-last:border-r px-3 focus-visible:-outline-offset-2',
                    'before:absolute before:inset-0.5 before:-z-10 before:rounded-[calc(var(--radius-control)-3px)] before:transition-colors before:duration-150 hover:before:bg-neutral-950/5',
                ],
                // The bar's radius minus its 3px inset and 1px border, so the curves stay concentric.
                floating:
                    'gap-2 rounded-[calc(var(--radius-control)-4px)] px-3 hover:bg-neutral-950/5',
            },
        },
        defaultVariants: { variant: 'inline' },
    },
);

type ToolbarVariant = NonNullable<VariantProps<typeof toolbarVariants>['variant']>;

const ToolbarVariantContext = createContext<ToolbarVariant>('inline');

// Base UI also accepts a className function of state; Continuum merges strings with cn(), so it takes a string.
export type ToolbarProps = Omit<ComponentProps<typeof ToolbarPrimitive.Root>, 'className'> &
    VariantProps<typeof toolbarVariants> & { className?: string };

/**
 * `inline` is an AI toolbar over a table cell or a selection: flush segments
 * split by hairlines. `floating` is a bottom action bar: padded, with rounded
 * items and no dividers, at the dock's height with the inline bar's corners.
 */
export const Toolbar = ({ variant, className, ...props }: ToolbarProps) => (
    <ToolbarVariantContext.Provider value={variant ?? 'inline'}>
        <ToolbarPrimitive.Root
            className={cn(toolbarVariants({ variant }), className)}
            data-slot="toolbar"
            data-variant={variant ?? 'inline'}
            {...props}
        />
    </ToolbarVariantContext.Provider>
);

export const ToolbarButton = ({
    className,
    ...props
}: Omit<ComponentProps<typeof ToolbarPrimitive.Button>, 'className'> & { className?: string }) => {
    const variant = useContext(ToolbarVariantContext);

    return (
        <ToolbarPrimitive.Button
            className={cn(toolbarButtonVariants({ variant }), className)}
            data-slot="toolbar-button"
            type="button"
            {...props}
        />
    );
};

type ToolbarChipProps = ComponentProps<'span'> & {
    /** Replaces the default sparkles icon. */
    icon?: ReactNode;
};

const toolbarChipVariants = cva(
    'inline-flex select-none items-center gap-1.5 whitespace-nowrap bg-primary-500/20 font-medium text-primary-700 text-xxs [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                // Inset 2px inside a 1px border, so the bar's radius minus 3px keeps it concentric.
                inline: 'm-0.5 rounded-[calc(var(--radius-control)-3px)] px-2',
                // The bar's own 3px inset already holds it, so it takes the buttons' size and corner.
                floating: 'rounded-[calc(var(--radius-control)-4px)] px-2.5',
            },
        },
        defaultVariants: { variant: 'inline' },
    },
);

/** The lead chip ("AI suggestions") at the start of the toolbar, coloured like a primary badge. */
export const ToolbarChip = ({ icon, className, children, ...props }: ToolbarChipProps) => {
    const variant = useContext(ToolbarVariantContext);

    return (
        <span
            className={cn(toolbarChipVariants({ variant }), className)}
            data-slot="toolbar-chip"
            {...props}
        >
            {icon ?? <Sparkles strokeWidth={2} />}
            {children}
        </span>
    );
};
