'use client';

import type { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronRight, ChevronsUpDown, Ellipsis, House } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/cn';
import { focusRing } from './button';
import {
    DropdownMenu,
    DropdownMenuContent,
    type DropdownMenuContentProps,
    DropdownMenuTrigger,
} from './dropdown-menu';

/** Header-bar trail from the app shell and the analytics top bars. */
export const Breadcrumb = ({
    'aria-label': ariaLabel = 'Breadcrumb',
    ...props
}: ComponentProps<'nav'>) => <nav aria-label={ariaLabel} data-slot="breadcrumb" {...props} />;

// One line, always: a trail that wraps would push the header bar's height. The page truncates first.
export const breadcrumbListVariants = cva('flex min-w-0 items-center gap-2 text-neutral-600', {
    variants: {
        size: {
            md: 'font-normal text-xs',
            // The 2024 and 2025 product headers set the trail a size up, in medium.
            lg: 'font-medium text-sm',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export type BreadcrumbListProps = ComponentProps<'ol'> &
    VariantProps<typeof breadcrumbListVariants>;

export const BreadcrumbList = ({ size, className, ...props }: BreadcrumbListProps) => (
    <ol
        className={cn(breadcrumbListVariants({ size }), className)}
        data-slot="breadcrumb-list"
        {...props}
    />
);

export const BreadcrumbItem = ({ className, ...props }: ComponentProps<'li'>) => (
    <li
        className={cn(
            // Links keep their width; only the current page gives way when the bar is short.
            'inline-flex shrink-0 items-center gap-2 has-[[data-slot=breadcrumb-page]]:min-w-0 has-[[data-slot=breadcrumb-page]]:shrink',
            className,
        )}
        data-slot="breadcrumb-item"
        {...props}
    />
);

export type BreadcrumbLinkProps = useRender.ComponentProps<'a'>;

/** Pass `render={<Link to="…" />}` to use the router's own link. */
export const BreadcrumbLink = ({ render, ref, className, ...props }: BreadcrumbLinkProps) =>
    useRender({
        defaultTagName: 'a',
        render,
        ref,
        // State keys become data attributes, so this sets data-slot="breadcrumb-link".
        state: { slot: 'breadcrumb-link' },
        props: mergeProps<'a'>(
            {
                className: cn(
                    'rounded-chip text-neutral-600 transition-colors duration-150 hover:text-neutral-950',
                    focusRing,
                    className,
                ),
            },
            props,
        ),
    });

export const BreadcrumbPage = ({ className, ...props }: ComponentProps<'span'>) => (
    <span
        aria-current="page"
        className={cn('min-w-0 truncate text-neutral-950', className)}
        data-slot="breadcrumb-page"
        {...props}
    />
);

export const BreadcrumbSeparator = ({ className, children, ...props }: ComponentProps<'li'>) => (
    <li
        aria-hidden
        className={cn('inline-flex text-neutral-400 [&_svg]:size-4', className)}
        data-slot="breadcrumb-separator"
        role="presentation"
        {...props}
    >
        {children ?? <ChevronRight strokeWidth={2} />}
    </li>
);

export type BreadcrumbMenuProps = Omit<MenuPrimitive.Root.Props, 'children'> & {
    /**
     * The crumb's text, for a switcher ("Northwind ⌄") that moves to a sibling: another workspace,
     * project or report. Left out, the trigger is an ellipsis for the pages a long trail hides.
     */
    label?: ReactNode;
    /** Names the ellipsis; a labelled switcher is named by its label. */
    'aria-label'?: string;
    /** DropdownMenuItems: the hidden pages, or the siblings to switch to. */
    children: ReactNode;
    /** Where the menu is portalled; the body by default. */
    container?: DropdownMenuContentProps['container'];
    className?: string;
};

/**
 * A crumb that opens a menu. With a `label` it switches between siblings; without, it is the "…"
 * that stands in for the middle of a long trail, so the bar keeps where you came from and where
 * you are, and the rest is one click away.
 */
export const BreadcrumbMenu = ({
    label,
    'aria-label': ariaLabel,
    children,
    container,
    className,
    ...props
}: BreadcrumbMenuProps) => (
    <DropdownMenu {...props}>
        <DropdownMenuTrigger
            aria-label={label ? undefined : (ariaLabel ?? 'Show hidden pages')}
            className={cn(
                // Pulled out by its padding, so its text lines up with the crumbs beside it.
                '-mx-1.5 inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-chip px-1.5 text-neutral-600',
                'transition-[background-color,color] duration-150 hover:bg-neutral-950/5 hover:text-neutral-950',
                'data-popup-open:bg-selected data-popup-open:text-neutral-950 [&_svg]:size-4 [&_svg]:shrink-0',
                focusRing,
                className,
            )}
            data-slot="breadcrumb-menu"
        >
            {label ?? <Ellipsis strokeWidth={2} />}
            {label && <ChevronsUpDown className="text-neutral-400" strokeWidth={2} />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-48" container={container}>
            {children}
        </DropdownMenuContent>
    </DropdownMenu>
);

/** House icon that stands in for the root crumb; wrap it in a BreadcrumbLink to make it a link. */
export const BreadcrumbHome = ({
    'aria-label': ariaLabel = 'Home',
    className,
    ...props
}: ComponentProps<typeof House>) => (
    <House
        aria-label={ariaLabel}
        className={cn('size-4 shrink-0 text-neutral-400', className)}
        data-slot="breadcrumb-home"
        role="img"
        strokeWidth={2}
        {...props}
    />
);
