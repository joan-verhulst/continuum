'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import {
    type ComponentProps,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { OverflowChevron, useOverflowScroll } from '../lib/overflow-scroll';
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

/**
 * More tabs than fit scroll sideways, as the dock's items do: a chevron either side, the edge with
 * more faded, and the active tab kept in view. A list that fits is left exactly as it was: it only
 * becomes a scroller once it overflows, so a focus ring on its first or last tab is never clipped.
 */
export const TabsList = ({
    activateOnFocus = true,
    variant = 'line',
    className,
    ...props
}: TabsListProps) => {
    const { ref, edges, step, reveal, style } = useOverflowScroll<HTMLDivElement>();
    const list = useRef<HTMLDivElement | null>(null);
    const shown = useRef<{ tab: string | null; overflows?: boolean; reveal?: typeof reveal }>({
        tab: null,
    });
    const setList = useCallback(
        (node: HTMLDivElement | null) => {
            list.current = node;
            ref(node);
        },
        [ref],
    );

    // Brought into view only when the active tab changes, as the top nav does, so a re-render never
    // scrolls the row back while someone is looking along it. The list holds no value, so the
    // active tab is known by its place; `reveal` is new once the row has mounted, and the row
    // starting to scroll counts too, since only then can the tab be out of view.
    useEffect(() => {
        const tabs = Array.from(list.current?.children ?? []);
        const index = tabs.findIndex(tab => tab.matches('[data-active]'));
        const tab = index < 0 ? null : `${index}:${tabs[index]?.textContent ?? ''}`;
        const { overflows } = edges;
        const last = shown.current;
        if (tab === last.tab && reveal === last.reveal && overflows === last.overflows) return;
        shown.current = { tab, overflows, reveal };
        if (tab && overflows) reveal('[data-active]');
    });

    return (
        <TabsVariantContext.Provider value={variant}>
            <div
                className={cn(
                    'relative flex min-w-0 items-center',
                    // The hairline belongs to the frame, not the scroller, so it runs the full width
                    // under the chevrons and never fades with the row. The active tab's underline
                    // paints over its last pixel, as it hung over the list's border before.
                    variant === 'line' &&
                        "before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-neutral-200 before:content-['']",
                )}
                data-slot="tabs-list-frame"
            >
                {edges.overflows && (
                    <OverflowChevron
                        className={chevron}
                        direction={-1}
                        disabled={!edges.start}
                        onStep={step}
                    />
                )}
                <TabsPrimitive.List
                    // Arrow keys select as they move, as they did before: a tab here only swaps a panel, so
                    // there is nothing costly to guard behind Enter.
                    activateOnFocus={activateOnFocus}
                    className={cn(
                        'flex min-w-0 flex-1 items-center',
                        variant === 'pill' && 'gap-0.5',
                        // Scrolling, the row clips 4px over and under its tabs, so a focus ring keeps its room.
                        edges.overflows && 'scrollbar-none -my-1 overflow-x-auto py-1',
                        className,
                    )}
                    data-slot="tabs-list"
                    data-variant={variant}
                    ref={setList}
                    style={edges.overflows ? style : undefined}
                    {...props}
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
        </TabsVariantContext.Provider>
    );
};

// A pill tab's 34px and corner, for both looks.
const chevron = 'size-control rounded-item';

const triggerVariants: Record<TabsVariant, string> = {
    // A control row tall with the item radius, like a nav item: a pill tab sits on the page, not in a track.
    pill: 'h-control rounded-item px-3 text-neutral-600 hover:bg-neutral-950/5 hover:text-neutral-950 data-active:bg-tint data-active:text-tint-fg',
    // Set edge to edge, so the underline spans the tab, and 44px tall, so the label has room above the line.
    // Its last pixel is the frame's hairline, so the 2px underline sits on the line, not above it.
    line: "relative h-tab rounded-chip px-3 text-neutral-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-neutral-950 after:opacity-0 after:transition-opacity after:duration-150 after:content-[''] hover:text-neutral-950 data-active:text-neutral-950 data-active:after:opacity-100",
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
