'use client';

import { useRender } from '@base-ui/react/use-render';
import {
    type ComponentProps,
    createContext,
    type MouseEvent,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import { OverflowChevron, useOverflowScroll } from '../lib/overflow-scroll';
import { focusRing } from './button';
import { HeaderBarSidebarToggle } from './header-bar';
import { navDrawerClasses, navItemClasses, useAppShellNav } from './sidebar';

type TopNavContextValue = {
    /** Whether this bar is its shell's navigation, so it turns into a drawer when the shell narrows. */
    drawer: boolean;
    /** Where the sections are listed again, as rows, inside the drawer. */
    host: HTMLElement | null;
};

const TopNavContext = createContext<TopNavContextValue>({ drawer: false, host: null });

/** Whether a link is drawn in the drawer's list rather than along the bar. */
const InDrawerContext = createContext(false);

/**
 * The top navigation: the sidebar laid on its side, for an app with a handful of sections. A 56px
 * bar with no fill of its own, so it shares the canvas, over the inset panel; put it in
 * `<AppShell nav="top">`. The brand on the left, the sections beside it, actions pushed right.
 *
 * On a shell too narrow for the sidebar the sections and the actions leave the bar: a toggle before
 * the brand opens the shell's drawer, which lists the sections as a sidebar's rows.
 */
export const TopNav = ({ className, children, ...props }: ComponentProps<'header'>) => {
    const shell = useAppShellNav();
    const drawer = shell !== null && shell.nav === 'top' && !shell.inPanel;
    const [host, setHost] = useState<HTMLElement | null>(null);
    const drawerId = useId();
    const setDrawer = shell?.setDrawer;
    const context = useMemo(() => ({ drawer, host }), [drawer, host]);

    return (
        <TopNavContext.Provider value={context}>
            <header
                className={cn('flex h-nav shrink-0 items-center gap-6 px-4', className)}
                data-slot="top-nav"
                {...props}
            >
                {/* 8px from the brand rather than the bar's 24px: the two read as one group. */}
                {drawer && <HeaderBarSidebarToggle className="-mr-4" />}
                {children}
            </header>
            {drawer && (
                <div
                    className={cn(
                        '@max-shell-sidebar/shell:flex hidden w-sidebar flex-col',
                        navDrawerClasses(shell?.open ?? false),
                    )}
                    data-slot="top-nav-drawer"
                    id={drawerId}
                    ref={setDrawer}
                    tabIndex={shell?.open ? -1 : undefined}
                >
                    {/* The close toggle sits where the bar's toggle was, so opening and closing is one place. */}
                    <div className="flex h-nav shrink-0 items-center px-4">
                        <HeaderBarSidebarToggle />
                    </div>
                    {/* The sections, as a sidebar group's rows; TopNavLinks lists them here. */}
                    <div className="flex flex-col pt-2 pr-3 pl-2" ref={setHost} />
                </div>
            )}
        </TopNavContext.Provider>
    );
};

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
                    <span className="grid size-6.5 shrink-0 place-items-center [&_svg:not([class*=size-])]:size-4">
                        {logo}
                    </span>
                    {children && <span>{children}</span>}
                </>
            ),
        },
    });

/**
 * The sections, 2px apart. On a narrow bar they scroll sideways rather than wrap, with a chevron
 * at the end that has more and the current one kept in view.
 */
export const TopNavLinks = ({ className, children, ...props }: ComponentProps<'nav'>) => {
    const { drawer, host } = useContext(TopNavContext);
    const { ref, edges, step, reveal, style } = useOverflowScroll<HTMLDivElement>();
    const row = useRef<HTMLDivElement | null>(null);
    const shown = useRef<{ link: string | null; reveal?: typeof reveal }>({ link: null });
    const setRow = useCallback(
        (node: HTMLDivElement | null) => {
            row.current = node;
            ref(node);
        },
        [ref],
    );

    // Brought into view only when the current section changes, as the dock does on its value, so a
    // re-render never scrolls the row back while someone is looking along it. The links carry no
    // value, so the current one is known by its place among them. `reveal` is new once the row has
    // mounted, which counts as a change, so the first current link is brought into view too.
    useEffect(() => {
        const links = Array.from(row.current?.children ?? []);
        const index = links.findIndex(link => link.matches('[aria-current=page]'));
        const link = index < 0 ? null : `${index}:${links[index]?.textContent ?? ''}`;
        if (link === shown.current.link && reveal === shown.current.reveal) return;
        shown.current = { link, reveal };
        if (link) reveal('[aria-current=page]');
    });

    return (
        <>
            <nav
                className={cn(
                    'flex min-w-0 items-center gap-0.5',
                    // Listed in the drawer instead, while the shell is too narrow for the sidebar.
                    drawer && '@max-shell-sidebar/shell:hidden',
                    className,
                )}
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
                    className="scrollbar-none -my-1 flex min-w-0 items-center gap-0.5 overflow-x-auto py-1"
                    ref={setRow}
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
            {/* The same sections again, as the drawer's rows; only one of the two lists ever shows. */}
            {drawer &&
                host &&
                createPortal(
                    <InDrawerContext.Provider value={true}>
                        <nav
                            aria-label={props['aria-label']}
                            className="flex flex-col gap-0.5"
                            data-slot="top-nav-drawer-links"
                        >
                            {children}
                        </nav>
                    </InDrawerContext.Provider>,
                    host,
                )}
        </>
    );
};

// A link's 34px and corner.
const chevron = 'size-control rounded-item';

type TopNavLinkProps = ComponentProps<'button'> & {
    /** Swaps the button for another element, e.g. `render={<a href="/connections" />}`. */
    render?: useRender.RenderProp;
    active?: boolean;
    /** Leading 16px icon; most bars read better without. */
    icon?: ReactNode;
};

/**
 * A section, as a sidebar row is: 34px, the selected one on a 5% wash set via aria-current, so
 * router links that set it themselves work too. In the shell's drawer it is drawn as a sidebar's
 * row, and choosing it closes the drawer.
 */
export const TopNavLink = ({
    render,
    active,
    icon,
    className,
    children,
    type = 'button',
    onClick,
    ...props
}: TopNavLinkProps) => {
    const inDrawer = useContext(InDrawerContext);
    const shell = useAppShellNav();

    return useRender({
        defaultTagName: 'button',
        render,
        props: {
            'aria-current': active ? 'page' : undefined,
            className: cn(
                navItemClasses,
                inDrawer
                    ? 'h-control text-neutral-950 text-xs'
                    : 'h-control w-auto shrink-0 px-3 text-neutral-600 text-xs hover:text-neutral-950 aria-[current=page]:text-neutral-950',
                className,
            ),
            'data-slot': 'top-nav-link',
            // A rendered link or router element is not a button, so it gets no type.
            type: render ? undefined : type,
            ...props,
            onClick: (event: MouseEvent<HTMLButtonElement>) => {
                onClick?.(event);
                if (inDrawer && !event.defaultPrevented) shell?.setOpen(false);
            },
            children: inDrawer ? (
                <>
                    {icon}
                    <span className="min-w-0 flex-1 truncate">{children}</span>
                </>
            ) : (
                <>
                    {icon}
                    {children}
                </>
            ),
        },
    });
};

/** Pushed to the right: a search, a bell, the account's avatar and its menu. They hide on a shell too narrow for the sidebar. */
export const TopNavActions = ({ className, ...props }: ComponentProps<'div'>) => {
    const { drawer } = useContext(TopNavContext);

    return (
        <div
            className={cn(
                'ml-auto flex shrink-0 items-center gap-2',
                drawer && '@max-shell-sidebar/shell:hidden',
                className,
            )}
            data-slot="top-nav-actions"
            {...props}
        />
    );
};
