'use client';

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { useRender } from '@base-ui/react/use-render';
import { ChevronDown, ChevronLeft, PanelLeft } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

type AppShellProps = ComponentProps<'div'> & {
    /** Where the navigation sits on the canvas: a `Sidebar` beside the panel, or a `TopNav` over it. */
    nav?: 'side' | 'top';
};

/**
 * The canvas-and-panel shell: the navigation sits straight on the canvas, the
 * page on an inset panel with an 8px gutter.
 */
export const AppShell = ({ nav = 'side', className, ...props }: AppShellProps) => (
    <div
        className={cn('flex min-h-screen bg-neutral-100', nav === 'top' && 'flex-col', className)}
        data-nav={nav}
        data-slot="app-shell"
        {...props}
    />
);

export const AppPanel = ({ className, ...props }: ComponentProps<'main'>) => (
    <main
        className={cn(
            // The gutter opens on every side but the navigation's.
            'relative m-2 ml-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 [[data-nav=top]>&]:mt-0 [[data-nav=top]>&]:ml-2',
            className,
        )}
        data-slot="app-panel"
        {...props}
    />
);

/**
 * The email sequencing sidebar: no fill of its own, so it shares the canvas,
 * with a logo row, blocks of navigation and an account footer.
 */
export const Sidebar = ({ className, ...props }: ComponentProps<'aside'>) => (
    <aside
        className={cn('flex w-sidebar shrink-0 flex-col overflow-hidden', className)}
        data-slot="sidebar"
        {...props}
    />
);

/** The 56px logo row: a logo on the left, the collapse toggle on the right. */
export const SidebarHeader = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex h-nav shrink-0 items-center justify-between pt-3 pr-4 pb-2 pl-2',
            className,
        )}
        data-slot="sidebar-header"
        {...props}
    />
);

/** A 26px mark in ink, on no tile, centred in a 36px box. */
export const SidebarLogo = ({ className, children, ...props }: ComponentProps<'span'>) => (
    <span
        className={cn('grid size-9 shrink-0 place-items-center', className)}
        data-slot="sidebar-logo"
        {...props}
    >
        <span className="grid size-6.5 place-items-center text-neutral-950 [&_svg:not([class*=size-])]:size-4">
            {children}
        </span>
    </span>
);

type SidebarToggleProps = ComponentProps<'button'> & {
    /**
     * Whether the sidebar it opens and closes is open now: it sets `aria-expanded` and turns the
     * default name from "Expand sidebar" to "Collapse sidebar". Left out, the button states neither
     * and is named "Collapse sidebar", as a toggle in an open sidebar's header is.
     */
    expanded?: boolean;
    /** Its names for screen readers while the sidebar is open and while it is closed. */
    collapseLabel?: string;
    expandLabel?: string;
};

/** Opens and closes the sidebar; give it `expanded` and `aria-controls` so its state is announced. */
export const SidebarToggle = ({
    className,
    type = 'button',
    expanded,
    collapseLabel = 'Collapse sidebar',
    expandLabel = 'Expand sidebar',
    'aria-label': label = expanded === false ? expandLabel : collapseLabel,
    ...props
}: SidebarToggleProps) => (
    <button
        aria-expanded={expanded}
        aria-label={label}
        className={cn(
            'grid size-6.5 cursor-pointer place-items-center rounded-chip text-neutral-300 transition-colors duration-150 hover:text-neutral-600',
            focusRing,
            className,
        )}
        data-slot="sidebar-toggle"
        type={type}
        {...props}
    >
        <PanelLeft className="size-4.5" strokeWidth={2} />
    </button>
);

type SidebarGroupProps = ComponentProps<'nav'> & {
    /** Small heading above the group ("Projects"). */
    label?: ReactNode;
};

/**
 * A block of navigation. Items sit 2px apart, inset 8px left and 12px right.
 * Blocks are told apart by space, not a hairline: one that follows another
 * starts 24px down.
 */
export const SidebarGroup = ({ label, className, children, ...props }: SidebarGroupProps) => (
    <nav
        className={cn(
            'flex shrink-0 flex-col gap-1 pt-2 pr-3 pl-2 [[data-slot=sidebar-group]+&]:pt-6',
            className,
        )}
        data-slot="sidebar-group"
        {...props}
    >
        {label && (
            <p
                className="px-2.5 py-1 font-normal text-neutral-600 text-xs"
                data-slot="sidebar-label"
            >
                {label}
            </p>
        )}
        <div className="flex flex-col gap-0.5">{children}</div>
    </nav>
);

export const navItemClasses = [
    'flex w-full cursor-pointer select-none items-center gap-2 rounded-item px-2.5 py-2 text-left font-normal transition-[background-color,color] duration-150',
    'hover:bg-neutral-950/5 aria-[current=page]:bg-selected',
    '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
    focusRing,
];

type NavItemProps = ComponentProps<'button'> & {
    /** Swaps the button for another element, e.g. `render={<a href="/inbox" />}`. */
    render?: useRender.RenderProp;
    active?: boolean;
    /** Leading 16px icon or emoji. */
    icon?: ReactNode;
    /** Right-aligned Kbd or Badge. */
    trailing?: ReactNode;
    /**
     * `primary` is the call to action at the top ("New Sequence"), set 16px
     * above the list; `project` is a 14px row in a project list ("All
     * projects"); `inset` is a page under a project, indented to line up with
     * the project's name.
     */
    variant?: 'default' | 'primary' | 'project' | 'inset';
};

/**
 * A sidebar row, on the control row's 34px. The selected row gets a 5% wash
 * rather than colour, set via aria-current so router links that set it
 * themselves work too.
 */
export const NavItem = ({
    render,
    active,
    icon,
    trailing,
    variant = 'default',
    className,
    children,
    type = 'button',
    ...props
}: NavItemProps) =>
    useRender({
        defaultTagName: 'button',
        render,
        props: {
            'aria-current': active ? 'page' : undefined,
            className: cn(
                navItemClasses,
                variant === 'default' && 'h-control text-neutral-950 text-xs',
                variant === 'project' && 'h-control text-neutral-950 text-sm',
                variant === 'inset' &&
                    'h-control pl-8 text-neutral-700 text-sm aria-[current=page]:text-neutral-950',
                variant === 'primary' &&
                    'mb-3.5 h-control bg-action text-on-action text-xs shadow-action [background-image:var(--action-gradient)] hover:bg-action-hover hover:[background-image:none]',
                className,
            ),
            'data-slot': 'nav-item',
            'data-variant': variant,
            // A rendered link or router element is not a button, so it gets no type.
            type: render ? undefined : type,
            ...props,
            children: (
                <>
                    {icon}
                    <span className="min-w-0 flex-1 truncate">{children}</span>
                    {trailing && (
                        <span className="ml-auto flex shrink-0 items-center">{trailing}</span>
                    )}
                </>
            ),
        },
    });

type SidebarLevelProps = ComponentProps<'div'> & {
    /**
     * The side it comes in from: `end` for a level opened from the one above it, `start` for the
     * level returned to.
     */
    from?: 'start' | 'end';
};

/**
 * One level of a sidebar that drills down: the top level's places, or the index of one of them
 * under a `SidebarBack`. Render the level that is open; it comes in 8px from its side as it fades
 * in, and only fades under reduced motion. Give each level a key, so a change of level enters anew.
 */
export const SidebarLevel = ({ from = 'end', className, ...props }: SidebarLevelProps) => (
    <div
        className={cn(
            'flex min-w-0 flex-col starting:opacity-0 transition-[opacity,translate] duration-200 ease-out-strong motion-reduce:transition-none',
            from === 'end'
                ? 'motion-safe:starting:translate-x-2'
                : 'motion-safe:starting:-translate-x-2',
            className,
        )}
        data-slot="sidebar-level"
        {...props}
    />
);

/**
 * The head of a nested level: its `SidebarBack`, then anything that works on the whole level (a
 * search). It stays at the top while the level's list scrolls under it, on the sidebar's canvas,
 * with a hairline at its foot; 12 above, 8 between its rows and 12 below, in a group's insets.
 */
export const SidebarLevelHead = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'sticky top-0 z-10 flex shrink-0 flex-col gap-2 border-neutral-200 border-b bg-neutral-100 pt-3 pr-3 pb-3 pl-2',
            className,
        )}
        data-slot="sidebar-level-head"
        {...props}
    />
);

type SidebarBackProps = Omit<ComponentProps<'button'>, 'children'> & {
    /** The level's name, shown after the chevron: "Components". */
    children: ReactNode;
    /** Spoken before the name, so the button says where it goes: "Back to the menu". */
    backLabel?: string;
};

/**
 * The head of a nested level: a chevron back and the level's name, a nav row in medium weight.
 * It takes the reader back to the level above; the page that is open stays.
 */
export const SidebarBack = ({
    backLabel = 'Back',
    className,
    children,
    type = 'button',
    ...props
}: SidebarBackProps) => (
    <button
        className={cn(navItemClasses, 'h-control font-medium text-neutral-950 text-xs', className)}
        data-slot="sidebar-back"
        type={type}
        {...props}
    >
        <ChevronLeft aria-hidden strokeWidth={2} />
        <span className="sr-only">{backLabel}: </span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
);

type NavGroupProps = Omit<ComponentProps<typeof CollapsiblePrimitive.Root>, 'className'> & {
    className?: string;
    /** Leading 16px icon or emoji. */
    icon?: ReactNode;
    label: ReactNode;
};

/**
 * A project that folds open to its pages. Open, it takes the selected wash and
 * shows its chevron; closed, the chevron only shows on hover.
 */
export const NavGroup = ({ icon, label, className, children, ...props }: NavGroupProps) => (
    <CollapsiblePrimitive.Root
        className={cn('flex flex-col', className)}
        data-slot="nav-group"
        {...props}
    >
        {/* Base UI marks only the open trigger (data-panel-open), so closed is the default look. */}
        <CollapsiblePrimitive.Trigger
            className={cn(
                navItemClasses,
                'group h-control text-neutral-700 text-sm data-panel-open:bg-selected data-panel-open:text-neutral-950',
            )}
            data-slot="nav-group-trigger"
        >
            {icon && (
                <span className="grid size-4 shrink-0 place-items-center text-xs">{icon}</span>
            )}
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <ChevronDown
                className="-rotate-90 opacity-0 transition-[opacity,rotate] duration-200 ease-out-strong group-hover:opacity-100 group-data-panel-open:rotate-0 group-data-panel-open:opacity-100 motion-reduce:transition-none"
                strokeWidth={2}
            />
        </CollapsiblePrimitive.Trigger>
        <CollapsiblePrimitive.Panel
            className={cn(
                // Opens to its own height and closes back, the rows fading with it.
                'h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out-strong',
                'data-ending-style:h-0 data-starting-style:h-0 data-ending-style:opacity-0 data-starting-style:opacity-0',
                'motion-reduce:transition-opacity',
            )}
            data-slot="nav-group-content"
        >
            {/* The padding sits inside, so a closed panel is truly 0px tall. */}
            <div className="flex flex-col gap-0.5 py-1">{children}</div>
        </CollapsiblePrimitive.Panel>
    </CollapsiblePrimitive.Root>
);

/**
 * Pushed to the bottom: who is signed in, and a bell. Inset 18px, the group's 8px and a nav row's
 * 10px, so the avatar's edge lines up with the nav icons and the logo above it.
 */
export const SidebarFooter = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('mt-auto flex shrink-0 items-center gap-3 pt-4 pr-5 pb-6 pl-4.5', className)}
        data-slot="sidebar-footer"
        {...props}
    />
);

type SidebarAccountProps = ComponentProps<'div'> & {
    /** 36px logo or avatar. */
    avatar?: ReactNode;
    name: ReactNode;
    plan?: ReactNode;
};

export const SidebarAccount = ({
    avatar,
    name,
    plan,
    className,
    ...props
}: SidebarAccountProps) => (
    <div
        className={cn('flex min-w-0 flex-1 items-center gap-3', className)}
        data-slot="sidebar-account"
        {...props}
    >
        {avatar && (
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-chip [&>img]:size-full [&>img]:object-cover">
                {avatar}
            </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium text-neutral-600 text-xs">{name}</span>
            {plan && <span className="truncate font-medium text-neutral-600 text-xxs">{plan}</span>}
        </span>
    </div>
);
