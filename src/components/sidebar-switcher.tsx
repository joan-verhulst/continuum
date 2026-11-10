'use client';

import type { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { ChevronsUpDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';

type SidebarSwitcherMarkProps = ComponentProps<'span'> & {
    /**
     * The workspace's colour, any CSS colour; left out, the mark is a quiet neutral square whose
     * initial flips with the mode. A pale colour, or one that flips with the mode, needs an `ink`.
     */
    color?: string;
    /**
     * The initial's colour on `color`, any CSS colour; white by default. Pass one that reads on
     * the colour: `var(--color-on-action)` when the colour is the action, a dark ink on a pale one.
     */
    ink?: string;
    /** 28 in the switcher, 20 in a row of its menu. */
    size?: 20 | 28;
};

/** A workspace's square mark: its initial on its colour, with chip corners. */
export const SidebarSwitcherMark = ({
    color,
    ink,
    size = 28,
    className,
    style,
    ...props
}: SidebarSwitcherMarkProps) => (
    <span
        aria-hidden
        className={cn(
            'grid shrink-0 place-items-center rounded-chip font-medium ring-1 ring-neutral-950/10 ring-inset',
            // Without a colour both the square and its initial are neutral steps, so they flip together.
            color === undefined ? 'bg-neutral-200 text-neutral-700' : !ink && 'text-white',
            size === 28 ? 'size-7 text-xs' : 'size-5 text-xxs',
            className,
        )}
        data-slot="sidebar-switcher-mark"
        style={{
            ...(color !== undefined && { background: color }),
            ...(color !== undefined && ink && { color: ink }),
            ...style,
        }}
        {...props}
    />
);

type SidebarSwitcherProps = Omit<MenuPrimitive.Root.Props, 'children'> & {
    /** A 28px `SidebarSwitcherMark`, avatar or logo. */
    mark?: ReactNode;
    /** The current workspace, or what to say when there is none ("No project"). */
    name: ReactNode;
    /** A quiet line under the name: its plan, its role, "Pick one to work on". */
    detail?: ReactNode;
    /** Its name for screen readers, which should say it switches ("Northwind. Switch workspace"). */
    'aria-label'?: string;
    /**
     * `top` sits under the SidebarHeader, in a group's insets, and opens its menu below; `footer`
     * takes the account's place in the SidebarFooter, pulled to the nav rows' edge, and opens above.
     * Either way the button is inset like a nav row, so its mark lines up with the nav icons.
     */
    placement?: 'top' | 'footer';
    /** Where the menu is portalled; the body by default. */
    container?: ComponentProps<typeof DropdownMenuContent>['container'];
    className?: string;
    /** The menu: the other workspaces as `DropdownMenuItem`s, then a separator and "New …". */
    children: ReactNode;
};

/**
 * The current workspace, project or account, as a button that opens a menu of the others: a mark,
 * the name over a quiet line, and an up-down chevron. It sits under the SidebarHeader or in the
 * SidebarFooter, and its menu is a `DropdownMenu`, at least as wide as the button.
 */
export const SidebarSwitcher = ({
    mark,
    name,
    detail,
    'aria-label': label,
    placement = 'top',
    container,
    className,
    children,
    ...props
}: SidebarSwitcherProps) => (
    <div
        className={cn(
            'flex min-w-0 shrink-0',
            placement === 'top' ? 'pt-2 pr-3 pb-1 pl-2' : '-ml-2.5 flex-1',
            className,
        )}
        data-placement={placement}
        data-slot="sidebar-switcher"
    >
        <DropdownMenu {...props}>
            <DropdownMenuTrigger
                aria-label={label}
                className={cn(
                    'flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-item py-1.5 pr-2 pl-2.5 text-left transition-colors duration-150 hover:bg-neutral-950/5 data-popup-open:bg-selected',
                    focusRing,
                )}
                data-slot="sidebar-switcher-trigger"
            >
                {mark && (
                    <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-chip *:size-full [&>img]:object-cover">
                        {mark}
                    </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-neutral-950 text-xs">{name}</span>
                    {detail && <span className="truncate text-neutral-600 text-xxs">{detail}</span>}
                </span>
                <ChevronsUpDown
                    aria-hidden
                    className="size-4 shrink-0 text-neutral-500"
                    strokeWidth={2}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-(--anchor-width) min-w-menu-wide"
                container={container}
                side={placement === 'top' ? 'bottom' : 'top'}
            >
                {children}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);
