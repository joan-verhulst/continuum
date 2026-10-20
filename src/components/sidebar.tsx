'use client';

import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Collapsible, Slot } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';

/**
 * The canvas-and-panel shell shared by the report editor and invoice editor:
 * the sidebar sits straight on the canvas, the page on an inset panel.
 */
export const AppShell = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('flex min-h-screen bg-neutral-100', className)}
        data-slot="app-shell"
        {...props}
    />
);

export const AppPanel = ({ className, ...props }: ComponentProps<'main'>) => (
    <main
        className={cn(
            'm-2 ml-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50',
            className,
        )}
        data-slot="app-panel"
        {...props}
    />
);

/** The panel's top bar: breadcrumb on the left, actions on the right. */
export const HeaderBar = ({ className, ...props }: ComponentProps<'header'>) => (
    <header
        className={cn(
            'flex h-[54px] shrink-0 items-center justify-between gap-4 border-neutral-200 border-b py-2 pr-2 pl-4',
            className,
        )}
        data-slot="header-bar"
        {...props}
    />
);

/** Sidebar v2 from the library; no fill of its own so it shares the canvas. */
export const Sidebar = ({ className, ...props }: ComponentProps<'aside'>) => (
    <aside
        className={cn('flex w-64 shrink-0 flex-col gap-3 p-3', className)}
        data-slot="sidebar"
        {...props}
    />
);

export const SidebarHeader = ({ className, ...props }: ComponentProps<'div'>) => (
    <div className={cn('flex flex-col gap-2', className)} data-slot="sidebar-header" {...props} />
);

export const SidebarFooter = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('mt-auto flex flex-col gap-2', className)}
        data-slot="sidebar-footer"
        {...props}
    />
);

type WorkspaceSwitcherProps = ComponentProps<'button'> & {
    /** 32px logo or avatar. */
    avatar?: ReactNode;
    name: ReactNode;
    plan?: ReactNode;
};

export const WorkspaceSwitcher = ({
    avatar,
    name,
    plan,
    className,
    type = 'button',
    ...props
}: WorkspaceSwitcherProps) => (
    <button
        className={cn(
            'flex h-12 w-full cursor-pointer items-center gap-3 rounded-item p-2 text-left transition-colors duration-150 hover:bg-neutral-950/5',
            focusRing,
            className,
        )}
        data-slot="workspace-switcher"
        type={type}
        {...props}
    >
        {avatar && (
            <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-chip [&>img]:size-full [&>img]:object-cover">
                {avatar}
            </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium text-neutral-600 text-xs">{name}</span>
            {/* Drawn at 12px neutral-400; 11px keeps it on the type scale, 500 keeps it legible on the canvas. */}
            {plan && <span className="truncate font-medium text-neutral-500 text-xxs">{plan}</span>}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-neutral-600" strokeWidth={1.5} />
    </button>
);

export const SidebarNav = ({ className, ...props }: ComponentProps<'nav'>) => (
    <nav className={cn('flex flex-col gap-0.5', className)} data-slot="sidebar-nav" {...props} />
);

type NavItemProps = ComponentProps<'button'> & {
    asChild?: boolean;
    active?: boolean;
    /** Leading 16px icon. */
    icon?: ReactNode;
    /** Right-aligned Kbd or Badge. */
    trailing?: ReactNode;
};

/**
 * Library "menu item (v2)". `active` sets aria-current="page", and the selected
 * look keys off that attribute, so router links that set it themselves work too.
 */
export const NavItem = ({
    asChild,
    active,
    icon,
    trailing,
    className,
    children,
    type = 'button',
    ...props
}: NavItemProps) => {
    const Component = asChild ? Slot.Root : 'button';

    return (
        <Component
            className={cn(
                'flex h-[33px] w-full cursor-pointer select-none items-center gap-2 rounded-item border border-transparent py-1.5 pr-1.5 pl-3 text-left font-medium text-neutral-600 text-xs transition-[background-color,border-color,color] duration-150',
                'hover:bg-neutral-950/5 hover:text-neutral-700',
                'aria-[current=page]:border-neutral-200 aria-[current=page]:bg-neutral-50 aria-[current=page]:text-neutral-950 aria-[current=page]:shadow-float',
                '[&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
                focusRing,
                className,
            )}
            aria-current={active ? 'page' : undefined}
            data-slot="nav-item"
            type={asChild ? undefined : type}
            {...props}
        >
            {icon}
            {asChild ? (
                <Slot.Slottable>{children}</Slot.Slottable>
            ) : (
                <span className="min-w-0 flex-1 truncate">{children}</span>
            )}
            {trailing && <span className="ml-auto flex shrink-0 items-center">{trailing}</span>}
        </Component>
    );
};

type NavSectionProps = ComponentProps<typeof Collapsible.Root> & {
    title: ReactNode;
};

/** Collapsible group of nav items under a small header ("Settings"). */
export const NavSection = ({
    title,
    defaultOpen = true,
    className,
    children,
    ...props
}: NavSectionProps) => (
    <Collapsible.Root
        className={cn('flex flex-col', className)}
        data-slot="nav-section"
        defaultOpen={defaultOpen}
        {...props}
    >
        <Collapsible.Trigger
            className={cn(
                'group flex h-8 w-full cursor-pointer items-center justify-between rounded-item py-1.5 pr-1.5 pl-3 font-medium text-neutral-600 text-xxs transition-colors duration-150 hover:text-neutral-800',
                focusRing,
            )}
            data-slot="nav-section-trigger"
        >
            {title}
            <ChevronDown
                className="size-4 text-neutral-600 transition-transform duration-200 ease-out-strong group-data-[state=closed]:-rotate-90"
                strokeWidth={1.5}
            />
        </Collapsible.Trigger>
        <Collapsible.Content className="flex flex-col gap-0.5" data-slot="nav-section-content">
            {children}
        </Collapsible.Content>
    </Collapsible.Root>
);
