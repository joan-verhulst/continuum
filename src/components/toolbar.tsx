'use client';

import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar';
import { cva, type VariantProps } from 'class-variance-authority';
import { Sparkles } from 'lucide-react';
import { type ComponentProps, createContext, type ReactNode, useContext } from 'react';
import { cn } from '../lib/cn';
import { useOverflowScroll } from '../lib/overflow-scroll';
import { focusRing } from './button';

const toolbarVariants = cva(
    'flex w-fit max-w-full items-stretch border border-neutral-200 bg-neutral-50 shadow-float',
    {
        variants: {
            variant: {
                inline: 'h-control overflow-hidden rounded-control',
                // The field row's 38px: items stretch to the 30px left inside a 3px inset and the hairline. It
                // keeps the inline bar's corner, not the dock's pill, so both variants follow the theme's corners.
                // The inset is fixed px, not the spacing unit, so the items' corner calc below stays true.
                floating: 'h-control-lg rounded-control p-[3px]',
            },
        },
        defaultVariants: { variant: 'inline' },
    },
);

/*
 * The items sit in a row inside the bar, so a bar wider than its room scrolls sideways under its
 * own border and shadow rather than clipping its last actions: the scrollbar hidden, the edge with
 * more faded. A bar that fits is left exactly as it was, since the row only scrolls once it
 * overflows.
 */
const toolbarRowVariants = cva('flex min-w-0 items-stretch', {
    variants: {
        variant: {
            inline: '',
            // Scrolling, the row reaches out over the inset and the hairline, so a focus ring keeps its room.
            floating: 'gap-0.5 data-overflows:-m-[4px] data-overflows:p-[4px]',
        },
    },
    defaultVariants: { variant: 'inline' },
});

const toolbarButtonVariants = cva(
    [
        'inline-flex cursor-pointer select-none items-center whitespace-nowrap font-medium text-neutral-600 text-xs transition-[background-color,color] duration-150',
        'hover:text-neutral-950',
        // Base UI keeps a disabled toolbar button focusable, so it sets data-disabled rather than the disabled attribute.
        'data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
        // In a compact shell a button with an icon keeps only the icon, a square on the bar's height;
        // its label stays in the tree at no size, so a screen reader still says it. A button
        // without an icon keeps its label, since it has nothing else to show.
        '@max-shell-compact/shell:has-[>svg]:gap-0 @max-shell-compact/shell:has-[>svg]:px-2 @max-shell-compact/shell:has-[>svg]:text-[0px]',
        focusRing,
    ],
    {
        variants: {
            variant: {
                // The bar clips overflow, so the ring has to sit inside the button. The divider runs the full
                // height, but the hover sits 2px inside it, the same shape as the chip.
                inline: [
                    'relative isolate gap-1.5 border-neutral-200 not-last:border-r px-3 focus-visible:-outline-offset-2',
                    'before:absolute before:inset-[2px] before:-z-10 before:rounded-[calc(var(--radius-control)-3px)] before:transition-colors before:duration-150 hover:before:bg-neutral-950/5',
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
export const Toolbar = ({ variant, className, children, ...props }: ToolbarProps) => {
    const { ref, edges, style } = useOverflowScroll<HTMLDivElement>();

    return (
        <ToolbarVariantContext.Provider value={variant ?? 'inline'}>
            <ToolbarPrimitive.Root
                className={cn(toolbarVariants({ variant }), className)}
                data-slot="toolbar"
                data-variant={variant ?? 'inline'}
                {...props}
            >
                <div
                    className={cn(
                        toolbarRowVariants({ variant }),
                        edges.overflows && 'scrollbar-none overflow-x-auto',
                    )}
                    data-overflows={edges.overflows || undefined}
                    data-slot="toolbar-row"
                    ref={ref}
                    style={edges.overflows ? style : undefined}
                >
                    {children}
                </div>
            </ToolbarPrimitive.Root>
        </ToolbarVariantContext.Provider>
    );
};

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
    'inline-flex select-none items-center gap-1.5 whitespace-nowrap bg-primary-500/20 font-medium text-primary-800 text-xxs [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                // Inset 2px inside a 1px border, so the bar's radius minus 3px keeps it concentric.
                inline: 'm-[2px] rounded-[calc(var(--radius-control)-3px)] px-2',
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
