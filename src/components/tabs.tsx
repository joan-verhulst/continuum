'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { type ComponentProps, createContext, useContext } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { focusRing } from './button';

/*
 * Tabs switch between panels: the facets of one object (Summary · Findings · Sources), each with
 * content of its own. To pick a value that reshapes the same content (List · Grid, 7d · 30d), use a
 * SegmentedControl instead.
 */

export type TabsVariant = 'pill' | 'line';

// A context, not a parent selector, so a pill list nested in a line list keeps its own look.
const TabsVariantContext = createContext<TabsVariant>('line');

export const Tabs = ({
    className,
    ...props
}: WithClassName<ComponentProps<typeof TabsPrimitive.Root>>) => (
    <TabsPrimitive.Root
        className={cn('flex flex-col gap-4', className)}
        data-slot="tabs"
        {...props}
    />
);

export type TabsListProps = WithClassName<ComponentProps<typeof TabsPrimitive.List>> & {
    /**
     * `line` (the default) sets the tabs on a hairline and underlines the active one, for the tabs of a
     * page, section or panel under its title. `pill` fills the active tab, for a tight spot in a card or dialog.
     */
    variant?: TabsVariant;
};

export const TabsList = ({
    activateOnFocus = true,
    variant = 'line',
    className,
    ...props
}: TabsListProps) => (
    <TabsVariantContext.Provider value={variant}>
        <TabsPrimitive.List
            // Arrow keys select as they move, as they did before: a tab here only swaps a panel, so
            // there is nothing costly to guard behind Enter.
            activateOnFocus={activateOnFocus}
            className={cn(
                'flex items-center',
                variant === 'line' ? 'border-neutral-200 border-b' : 'gap-0.5',
                className,
            )}
            data-slot="tabs-list"
            data-variant={variant}
            {...props}
        />
    </TabsVariantContext.Provider>
);

const triggerVariants: Record<TabsVariant, string> = {
    // A control row tall with the item radius, like a nav item: a pill tab sits on the page, not in a track.
    pill: 'h-[34px] rounded-item px-3 text-neutral-600 hover:bg-neutral-950/5 hover:text-neutral-950 data-active:bg-tint data-active:text-tint-fg',
    // Set edge to edge, so the underline spans the tab, and 44px tall, so the label has room above the line.
    // It hangs 1px over the hairline, so the 2px underline sits on the line, not above it.
    line: "-mb-px relative h-11 rounded-sm px-3 text-neutral-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-neutral-950 after:opacity-0 after:transition-opacity after:duration-150 after:content-[''] hover:text-neutral-950 data-active:text-neutral-950 data-active:after:opacity-100",
};

/**
 * One tab. Holds, in this order: an optional leading icon, the label, then an optional trailing
 * piece (a `TabsCount`, a `Kbd`, a `StatusDot` or an icon). Badges and chips stay out: at 22–25px
 * they fill a 29px tab and read as a button inside a button.
 */
export const TabsTrigger = ({
    className,
    ...props
}: WithClassName<ComponentProps<typeof TabsPrimitive.Tab>>) => {
    const variant = useContext(TabsVariantContext);

    return (
        <TabsPrimitive.Tab
            className={cn(
                'inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium text-xs transition-[background-color,color] duration-150',
                triggerVariants[variant],
                // Base UI marks a disabled tab with data-disabled, which also covers a rendered non-button.
                'data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
                focusRing,
                className,
            )}
            data-slot="tabs-trigger"
            {...props}
        />
    );
};

/** The number after a tab's label ("Findings 12"). Takes the tab's colour, so it follows the active state. */
export const TabsCount = ({ className, ...props }: ComponentProps<'span'>) => (
    <span
        className={cn(
            'inline-flex h-4 min-w-4 items-center justify-center rounded-pill bg-current/10 px-1 font-medium text-xxs tabular-nums',
            className,
        )}
        data-slot="tabs-count"
        {...props}
    />
);

export const TabsContent = ({
    className,
    ...props
}: WithClassName<ComponentProps<typeof TabsPrimitive.Panel>>) => (
    <TabsPrimitive.Panel className={cn(focusRing, className)} data-slot="tabs-content" {...props} />
);
