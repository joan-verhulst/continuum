'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import type { ComponentProps } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { focusRing } from './button';

/** The pill tabs from the report editor's detail view. */
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

export const TabsList = ({
    activateOnFocus = true,
    className,
    ...props
}: WithClassName<ComponentProps<typeof TabsPrimitive.List>>) => (
    <TabsPrimitive.List
        // Arrow keys select as they move, as they did before: a tab here only swaps a panel, so
        // there is nothing costly to guard behind Enter.
        activateOnFocus={activateOnFocus}
        className={cn('flex items-center gap-2', className)}
        data-slot="tabs-list"
        {...props}
    />
);

export const TabsTrigger = ({
    className,
    ...props
}: WithClassName<ComponentProps<typeof TabsPrimitive.Tab>>) => (
    <TabsPrimitive.Tab
        className={cn(
            // Drawn at 8px: the item radius less 2px, the same shape as a segment.
            'inline-flex h-[29px] cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[calc(var(--radius-item)-2px)] px-2 font-medium text-neutral-900 text-xs transition-[background-color,color] duration-150',
            'hover:bg-neutral-950/5 hover:text-neutral-950 data-active:bg-tint data-active:text-tint-fg',
            // Base UI marks a disabled tab with data-disabled, which also covers a rendered non-button.
            'data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            focusRing,
            className,
        )}
        data-slot="tabs-trigger"
        {...props}
    />
);

export const TabsContent = ({
    className,
    ...props
}: WithClassName<ComponentProps<typeof TabsPrimitive.Panel>>) => (
    <TabsPrimitive.Panel className={cn(focusRing, className)} data-slot="tabs-content" {...props} />
);
