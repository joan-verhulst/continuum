'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { Check, ListFilter } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn, type WithClassName } from '../lib/cn';
import { Badge } from './badge';
import { Button, type ButtonProps } from './button';
import {
    DropdownMenu,
    DropdownMenuContent,
    type DropdownMenuContentProps,
    DropdownMenuGroup,
    DropdownMenuItem,
    type DropdownMenuItemProps,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './dropdown-menu';

/** Applied filters as a map of group to picked values, the shape the menu and its chips share. */
export type FilterValues = Record<string, string[]>;

/** Adds or removes one value of a group, dropping the group once it is empty. */
export const toggleFilter = (values: FilterValues, group: string, value: string): FilterValues => {
    const current = values[group] ?? [];
    const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
    const rest = Object.fromEntries(Object.entries(values).filter(([key]) => key !== group));
    return next.length > 0 ? { ...rest, [group]: next } : rest;
};

/** How many values are picked across every group: the count on the trigger. */
export const countFilters = (values: FilterValues) =>
    Object.values(values).reduce((sum, picked) => sum + picked.length, 0);

/** Grouped checkbox filters behind one button; what is picked shows as chips in a `FilterBar`. */
export const FilterMenu = (props: MenuPrimitive.Root.Props) => <DropdownMenu {...props} />;

export type FilterMenuTriggerProps = ButtonProps & {
    /** Picked values; shown as a count beside the label once there are any. */
    count?: number;
};

/** A secondary "Filter" button with the number of filters applied. */
export const FilterMenuTrigger = ({
    count = 0,
    children = 'Filter',
    variant = 'secondary',
    ...props
}: FilterMenuTriggerProps) => (
    <DropdownMenuTrigger
        data-slot="filter-menu-trigger"
        render={<Button variant={variant} {...props} />}
    >
        <ListFilter strokeWidth={2} />
        {children}
        {count > 0 && (
            // Pulled in so the count sits as close to the edge as the icon does on the other side.
            <Badge className="-mr-1.5 ml-0.5 h-5 min-w-5" variant="count">
                {count}
            </Badge>
        )}
    </DropdownMenuTrigger>
);

/** The menu's panel; a little wider than a row menu, since its labels are values, not verbs. */
export const FilterMenuContent = ({
    className,
    align = 'start',
    ...props
}: DropdownMenuContentProps) => (
    <DropdownMenuContent
        align={align}
        className={cn('w-60', className)}
        data-slot="filter-menu-content"
        {...props}
    />
);

export type FilterMenuGroupProps = WithClassName<MenuPrimitive.Group.Props> & {
    label: ReactNode;
};

/** One dimension to filter by, its label over its options. */
export const FilterMenuGroup = ({ label, children, ...props }: FilterMenuGroupProps) => (
    <DropdownMenuGroup data-slot="filter-menu-group" {...props}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {children}
    </DropdownMenuGroup>
);

export type FilterMenuItemProps = WithClassName<MenuPrimitive.CheckboxItem.Props> & {
    /** Leading 16px icon or dot, before the label. */
    icon?: ReactNode;
    /** How many records the value matches, quiet at the end of the row. */
    count?: number;
};

/**
 * One value as a checkbox row. The box is the checkbox drawn small, so the menu reads as a set to
 * tick, not actions to run; the menu stays open while values are ticked.
 */
export const FilterMenuItem = ({
    icon,
    count,
    className,
    children,
    closeOnClick = false,
    ...props
}: FilterMenuItemProps) => (
    <MenuPrimitive.CheckboxItem
        className={cn(
            'group/filter-item relative flex h-8 shrink-0 cursor-pointer select-none items-center gap-2 rounded-item px-2 font-medium text-neutral-700 text-xs outline-none',
            'data-highlighted:bg-neutral-950/5 data-highlighted:text-neutral-800',
            'data-disabled:pointer-events-none data-disabled:opacity-50',
            '[&>svg]:text-neutral-600 [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0',
            className,
        )}
        closeOnClick={closeOnClick}
        data-slot="filter-menu-item"
        {...props}
    >
        <span
            className={cn(
                // 16px in a 32px row: the checkbox's look, its corner one step in from the chip's.
                'inline-flex size-4 shrink-0 items-center justify-center rounded-[calc(var(--radius-chip)-2px)] border border-neutral-300 text-on-action transition-[background-color,border-color] duration-150',
                'group-data-checked/filter-item:border-transparent group-data-checked/filter-item:bg-action group-data-checked/filter-item:[background-image:var(--action-gradient)]',
            )}
            data-slot="filter-menu-box"
        >
            <MenuPrimitive.CheckboxItemIndicator className="flex">
                <Check className="size-3" strokeWidth={2} />
            </MenuPrimitive.CheckboxItemIndicator>
        </span>
        {icon}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {count !== undefined && (
            <span className="shrink-0 font-normal text-neutral-500 text-xxs tabular-nums">
                {count.toLocaleString()}
            </span>
        )}
    </MenuPrimitive.CheckboxItem>
);

export type FilterMenuClearProps = Omit<DropdownMenuItemProps, 'children'> & {
    children?: ReactNode;
};

/** "Clear all" at the foot of the menu, under a full-width rule; disabled while nothing is picked. */
export const FilterMenuClear = ({ children = 'Clear all', ...props }: FilterMenuClearProps) => (
    <>
        <DropdownMenuSeparator />
        <DropdownMenuItem data-slot="filter-menu-clear" {...props}>
            {children}
        </DropdownMenuItem>
    </>
);

export type FilterBarProps = ComponentProps<'div'> & {
    /** Shows a ghost "Clear all" after the chips. */
    onClear?: () => void;
    clearLabel?: ReactNode;
};

/**
 * The trigger and the applied filters in one row: put the `FilterMenuTrigger`'s menu first, then a
 * `FilterChip` per group; "Clear all" follows once there is something to clear.
 */
export const FilterBar = ({
    onClear,
    clearLabel = 'Clear all',
    className,
    children,
    ...props
}: FilterBarProps) => (
    <div
        className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}
        data-slot="filter-bar"
        {...props}
    >
        {children}
        {onClear && (
            <Button data-slot="filter-bar-clear" onClick={onClear} variant="ghost">
                {clearLabel}
            </Button>
        )}
    </div>
);
