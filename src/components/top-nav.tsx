'use client';

import { useRender } from '@base-ui/react/use-render';
import { type ComponentProps, type ReactNode, useEffect } from 'react';
import { cn } from '../lib/cn';
import { OverflowChevron, useOverflowScroll } from '../lib/overflow-scroll';
import { focusRing } from './button';
import { navItemClasses } from './sidebar';

/**
 * The top navigation: the sidebar laid on its side, for an app with a handful of sections. A 56px
 * bar with no fill of its own, so it shares the canvas, over the inset panel; put it in
 * `<AppShell nav="top">`. The brand on the left, the sections beside it, actions pushed right.
 */
export const TopNav = ({ className, ...props }: ComponentProps<'header'>) => (
    <header
        className={cn('flex h-14 shrink-0 items-center gap-6 px-4', className)}
        data-slot="top-nav"
        {...props}
    />
);

type TopNavBrandProps = ComponentProps<'a'> & {
    /** Swaps the link for another element, e.g. a router link. */
    render?: useRender.RenderProp;
    /** The 26px mark, in ink on no tile, as the sidebar's. */
    logo: ReactNode;
};

/** The mark and the product's name, linking home. The name hides on a narrow bar. */
export const TopNavBrand = ({ render, logo, className, children, ...props }: TopNavBrandProps) =>
    useRender({
        defaultTagName: 'a',
        render,
        props: {
            className: cn(
                'flex shrink-0 items-center gap-2 rounded-item pr-1 font-medium text-neutral-950 text-sm',
                focusRing,
                className,
            ),
            'data-slot': 'top-nav-brand',
            ...props,
            children: (
                <>
                    <span className="grid size-[26px] shrink-0 place-items-center [&_svg:not([class*=size-])]:size-4">
                        {logo}
                    </span>
                    {children && <span className="hidden sm:inline">{children}</span>}
                </>
            ),
        },
    });

/**
 * The sections, 2px apart. On a narrow bar they scroll sideways rather than wrap, with a chevron
 * at the end that has more and the current one kept in view.
 */
export const TopNavLinks = ({ className, children, ...props }: ComponentProps<'nav'>) => {
    const { ref, edges, step, reveal, style } = useOverflowScroll<HTMLDivElement>();

    // Children change when the current section does, so this follows it.
    // biome-ignore lint/correctness/useExhaustiveDependencies: children stand in for the current link
    useEffect(() => {
        reveal('[aria-current=page]');
    }, [children, reveal]);

    return (
        <nav
            className={cn('flex min-w-0 items-center gap-0.5', className)}
            data-slot="top-nav-links"
            {...props}
        >
            {edges.overflows && (
                <OverflowChevron
                    className={chevron}
                    direction={-1}
                    disabled={!edges.start}
                    onStep={step}
                />
            )}
            {/* The row clips 4px over and under its links, so a focus ring keeps its room. */}
            <div
                className="-my-1 flex min-w-0 items-center gap-0.5 overflow-x-auto py-1 [scrollbar-width:none]"
                ref={ref}
                style={style}
            >
                {children}
            </div>
            {edges.overflows && (
                <OverflowChevron
                    className={chevron}
                    direction={1}
                    disabled={!edges.end}
                    onStep={step}
                />
            )}
        </nav>
    );
};

// A link's 34px and corner.
const chevron = 'size-[34px] rounded-item';

type TopNavLinkProps = ComponentProps<'button'> & {
    /** Swaps the button for another element, e.g. `render={<a href="/connections" />}`. */
    render?: useRender.RenderProp;
    active?: boolean;
    /** Leading 16px icon; most bars read better without. */
    icon?: ReactNode;
};

/**
 * A section, as a sidebar row is: 34px, the selected one on a 5% wash set via aria-current, so
 * router links that set it themselves work too.
 */
export const TopNavLink = ({
    render,
    active,
    icon,
    className,
    children,
    type = 'button',
    ...props
}: TopNavLinkProps) =>
    useRender({
        defaultTagName: 'button',
        render,
        props: {
            'aria-current': active ? 'page' : undefined,
            className: cn(
                navItemClasses,
                'h-[34px] w-auto shrink-0 px-3 text-neutral-600 text-xs hover:text-neutral-950 aria-[current=page]:text-neutral-950',
                className,
            ),
            'data-slot': 'top-nav-link',
            // A rendered link or router element is not a button, so it gets no type.
            type: render ? undefined : type,
            ...props,
            children: (
                <>
                    {icon}
                    {children}
                </>
            ),
        },
    });

/** Pushed to the right: a search, a bell, the account's avatar and its menu. */
export const TopNavActions = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn('ml-auto flex shrink-0 items-center gap-2', className)}
        data-slot="top-nav-actions"
        {...props}
    />
);
