'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { useRender } from '@base-ui/react/use-render';
import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import {
    Children,
    type ComponentProps,
    createContext,
    Fragment,
    isValidElement,
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
import { Badge } from './badge';
import { focusRing } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';
import { HeaderBarSidebarToggle } from './header-bar';
import { MenuItem } from './menu-item';
import {
    navDrawerClasses,
    SidebarItem,
    SidebarSection,
    sidebarItemClasses,
    useAppShellNav,
} from './sidebar';
import { SidebarSwitcher } from './sidebar-switcher';

type TopNavContextValue = {
    /** Whether this bar is its shell's navigation, so it turns into a drawer when the shell is compact. */
    drawer: boolean;
    /** Where the switcher is shown again, at the top of the drawer. */
    switcherHost: HTMLElement | null;
    /** Where the sections are listed again, as rows, inside the drawer. */
    linksHost: HTMLElement | null;
};

const TopNavContext = createContext<TopNavContextValue>({
    drawer: false,
    switcherHost: null,
    linksHost: null,
});

/** Whether a part is drawn in the drawer's list rather than along the bar. */
const InDrawerContext = createContext(false);

/** Whether a part sits in a TopNavMenu's popup, so its rows are menu rows. */
const InMenuContext = createContext(false);

/** An item's count: how many wait for the reader there, as the sidebar's primary count badge. */
const TopNavCount = ({ children }: { children: ReactNode }) => (
    <Badge data-slot="top-nav-count" tone="primary" variant="count">
        {children}
    </Badge>
);

/*
 * The bar's contents keep to the page's column, so the brand starts where the page's title does:
 * the same caps and side padding as PageContent's widths.
 */
const columns = {
    narrow: 'max-w-content-narrow px-4 sm:px-6',
    default: 'max-w-content px-4 sm:px-6',
    wide: 'max-w-content-wide px-4 sm:px-6',
    dense: 'max-w-content-dense px-4 sm:px-6',
    inset: 'px-4 sm:px-6 lg:px-16 2xl:px-content-inset',
    full: 'px-4',
} as const;

export type TopNavProps = ComponentProps<'header'> & {
    /** The page's column, as its `PageContent` width, so the bar lines up with the page under it. */
    width?: keyof typeof columns;
};

/**
 * The top navigation: the top of the page. A 56px bar across the shell, on the page's surface with
 * a hairline under it, and the page straight under it, with no inset panel; put it in
 * `<AppShell nav="top">`. Its contents keep to the page's column: the brand, then a switcher, the
 * sections (links, and menus for a section with pages of its own), the account pushed right.
 *
 * Its sections scroll along the bar when they run out of room, so it keeps them up to the compact
 * width (640). Below it the switcher, the sections and the actions leave the bar: a toggle before
 * the brand opens the shell's drawer, which shows the switcher and the sections as a sidebar's rows.
 */
export const TopNav = ({ width = 'default', className, children, ...props }: TopNavProps) => {
    const shell = useAppShellNav();
    const drawer = shell !== null && shell.nav === 'top' && !shell.inPanel;
    const [switcherHost, setSwitcherHost] = useState<HTMLElement | null>(null);
    const [linksHost, setLinksHost] = useState<HTMLElement | null>(null);
    const drawerId = useId();
    const setDrawer = shell?.setDrawer;
    const context = useMemo(
        () => ({ drawer, switcherHost, linksHost }),
        [drawer, switcherHost, linksHost],
    );

    return (
        <TopNavContext.Provider value={context}>
            <header
                className={cn(
                    'sticky top-0 z-30 flex shrink-0 border-neutral-200 border-b bg-neutral-50',
                    className,
                )}
                data-slot="top-nav"
                data-width={width}
                {...props}
            >
                <div
                    className={cn(
                        'mx-auto box-content flex h-nav min-w-0 flex-1 items-center gap-6 @max-shell-compact/shell:px-4',
                        columns[width],
                    )}
                    data-slot="top-nav-row"
                >
                    {/* 8px from the brand rather than the bar's 24px: the two read as one group. */}
                    {drawer && <HeaderBarSidebarToggle className="-mr-4" />}
                    {children}
                </div>
            </header>
            {drawer && (
                <div
                    className={cn(
                        '@max-shell-compact/shell:flex hidden w-sidebar flex-col overflow-y-auto',
                        navDrawerClasses(shell?.open ?? false, 'top'),
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
                    {/* The switcher, where a sidebar has it: under the header. */}
                    <div className="flex flex-col empty:hidden" ref={setSwitcherHost} />
                    {/* The sections, as a sidebar group's rows; TopNavLinks lists them here. */}
                    <div className="flex flex-col pt-2 pr-3 pl-2" ref={setLinksHost} />
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

/** The mark and the product's name, linking home. The name hides on a compact bar. */
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
                    {children && (
                        <span className="@max-shell-compact/shell:hidden">{children}</span>
                    )}
                </>
            ),
        },
    });

type TopNavSwitcherProps = Omit<MenuPrimitive.Root.Props, 'children'> & {
    /** A `SidebarSwitcherMark`, avatar or logo: 20px on the bar, 28 in the drawer. */
    mark?: ReactNode;
    /** The current workspace, or what to say when there is none ("No project"). */
    name: ReactNode;
    /** The quiet line under the name, shown in the drawer only: the bar has room for one line. */
    detail?: ReactNode;
    /** Its name for screen readers, which should say it switches ("Northwind. Switch workspace"). */
    'aria-label'?: string;
    /** Where the menu is portalled; the body by default. */
    container?: ComponentProps<typeof DropdownMenuContent>['container'];
    className?: string;
    /** The menu: the other workspaces as `DropdownMenuItem`s, then a separator and "New …". */
    children: ReactNode;
};

/**
 * The sidebar's switcher on the bar: the current workspace, project or account, as a button that
 * opens a menu of the others. A 20 mark, the name and an up-down chevron on a link's 34px row; the
 * same menu as the sidebar's. In the drawer it is the sidebar's switcher, under the header.
 */
export const TopNavSwitcher = ({
    mark,
    name,
    detail,
    'aria-label': label,
    container,
    className,
    children,
    ...props
}: TopNavSwitcherProps) => {
    const { drawer, switcherHost } = useContext(TopNavContext);

    return (
        <>
            <DropdownMenu {...props}>
                <DropdownMenuTrigger
                    aria-label={label}
                    className={cn(
                        'flex h-control min-w-0 max-w-60 shrink-0 cursor-pointer items-center gap-2 rounded-item pr-2 pl-2 text-left transition-colors duration-150 hover:bg-neutral-950/5 data-popup-open:bg-selected',
                        focusRing,
                        // Shown in the drawer instead, while the shell is compact.
                        drawer && '@max-shell-compact/shell:hidden',
                        className,
                    )}
                    data-slot="top-nav-switcher"
                >
                    {mark && (
                        // A workspace mark, however it is wrapped, drawn at its 20 size (11 type);
                        // an avatar or an image fills the 20 square.
                        <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-chip *:size-full [&>img]:object-cover [&_[data-slot=sidebar-switcher-mark]]:size-5 [&_[data-slot=sidebar-switcher-mark]]:text-xxs">
                            {mark}
                        </span>
                    )}
                    <span className="min-w-0 truncate font-medium text-neutral-950 text-xs">
                        {name}
                    </span>
                    <ChevronsUpDown
                        aria-hidden
                        className="size-icon shrink-0 text-neutral-500"
                        strokeWidth={2}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    className="min-w-menu-wide"
                    container={container}
                >
                    {children}
                </DropdownMenuContent>
            </DropdownMenu>
            {drawer &&
                switcherHost &&
                createPortal(
                    <SidebarSwitcher
                        aria-label={label}
                        container={container}
                        detail={detail}
                        mark={mark}
                        name={name}
                    >
                        {children}
                    </SidebarSwitcher>,
                    switcherHost,
                )}
        </>
    );
};

/**
 * The sections, 2px apart. On a narrow bar they scroll sideways rather than wrap, with a chevron
 * at the end that has more and the current one kept in view.
 */
export const TopNavLinks = ({ className, children, ...props }: ComponentProps<'nav'>) => {
    const { drawer, linksHost } = useContext(TopNavContext);
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
        const index = links.findIndex(link => link.matches('[aria-current=page], [data-current]'));
        const link = index < 0 ? null : `${index}:${links[index]?.textContent ?? ''}`;
        if (link === shown.current.link && reveal === shown.current.reveal) return;
        shown.current = { link, reveal };
        if (link) reveal('[aria-current=page], [data-current]');
    });

    return (
        <>
            <nav
                className={cn(
                    'flex min-w-0 items-center gap-0.5',
                    // Listed in the drawer instead, while the shell is compact.
                    drawer && '@max-shell-compact/shell:hidden',
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
                linksHost &&
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
                    linksHost,
                )}
        </>
    );
};

// A link's 34px and corner.
const chevron = 'size-control rounded-item';

// A section on the bar: the sidebar's row, as wide as its label, in the quieter grey until current.
const barLink =
    'h-control w-auto shrink-0 px-3 text-neutral-600 text-xs hover:text-neutral-950 aria-[current=page]:text-neutral-950';

type TopNavLinkProps = ComponentProps<'button'> & {
    /** Swaps the button for another element, e.g. `render={<a href="/connections" />}`. */
    render?: useRender.RenderProp;
    active?: boolean;
    /** Leading 16px icon; most bars read better without. */
    icon?: ReactNode;
    /** How many wait for the reader there, as the sidebar's count badge after the label. */
    count?: ReactNode;
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
    count,
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
                sidebarItemClasses,
                inDrawer ? 'h-control text-neutral-950 text-xs' : barLink,
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
                    {count !== undefined && <TopNavCount>{count}</TopNavCount>}
                </>
            ) : (
                <>
                    {icon}
                    {children}
                    {count !== undefined && <TopNavCount>{count}</TopNavCount>}
                </>
            ),
        },
    });
};

/** Whether any of the menu's rows is the page you are on, read from their `active`. */
const holdsCurrent = (node: ReactNode): boolean => {
    let found = false;
    const visit = (children: ReactNode) =>
        Children.forEach(children, child => {
            if (found || !isValidElement(child)) return;
            const props = child.props as { active?: boolean; children?: ReactNode };
            if (child.type === TopNavMenuItem && props.active) found = true;
            else if (child.type === Fragment || child.type === TopNavMenuGroup)
                visit(props.children);
        });
    visit(node);
    return found;
};

type TopNavMenuProps = Omit<MenuPrimitive.Root.Props, 'children'> & {
    /** The section's name on the bar. */
    label: ReactNode;
    /** Leading 16px icon, as the links have. */
    icon?: ReactNode;
    /** How many it holds, a plain figure after the chevron in the drawer, as a sidebar section's. */
    count?: ReactNode;
    /**
     * Holds the page you are on. Found by itself among its rows (an item set `active`); set it
     * where the page is not one of them.
     */
    current?: boolean;
    /** Where the menu is portalled; the body by default. */
    container?: ComponentProps<typeof DropdownMenuContent>['container'];
    className?: string;
    /** Its pages, as `TopNavMenuItem`s, in `TopNavMenuGroup`s when they fall into groups. */
    children: ReactNode;
};

/**
 * A section with pages of its own, the sidebar's foldout on the bar: a link with a chevron that opens
 * a menu of its pages. Holding the page you are on, it takes the current look, since the page itself
 * is not on the bar. In the drawer it is a sidebar section that folds open to its pages.
 */
export const TopNavMenu = ({
    label,
    icon,
    count,
    current,
    container,
    className,
    children,
    ...props
}: TopNavMenuProps) => {
    const inDrawer = useContext(InDrawerContext);
    const holds = current || holdsCurrent(children);

    if (inDrawer)
        return (
            <SidebarSection
                // Among the bar's links, listed as a sidebar's default rows: the section's row and
                // its pages in their type and ink, not a project list's 14.
                className={cn(
                    '[&>[data-slot=sidebar-section-trigger]]:text-neutral-950 [&>[data-slot=sidebar-section-trigger]]:text-xs [&_[data-slot=sidebar-item]]:text-xs',
                    className,
                )}
                count={count}
                current={current}
                defaultOpen={holds}
                icon={icon}
                label={label}
            >
                {children}
            </SidebarSection>
        );

    return (
        <DropdownMenu {...props}>
            <DropdownMenuTrigger
                className={cn(
                    sidebarItemClasses,
                    barLink,
                    'group gap-1.5 data-popup-open:bg-neutral-950/5 data-popup-open:text-neutral-950',
                    // The section that holds the page draws as the current link.
                    'data-current:bg-nav-active data-current:text-nav-active-fg data-current:hover:bg-nav-active',
                    'data-current:[background-image:var(--nav-active-image)] data-current:[box-shadow:inset_0_0_0_1px_var(--color-nav-active-border),var(--shadow-nav-active)]',
                    className,
                )}
                data-current={holds || undefined}
                data-slot="top-nav-menu"
            >
                {icon}
                {label}
                <ChevronDown
                    aria-hidden
                    className="-mr-1 text-neutral-500 transition-transform duration-200 ease-out-strong group-data-popup-open:rotate-180 motion-reduce:transition-none"
                    strokeWidth={2}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-menu-wide" container={container}>
                <InMenuContext.Provider value={true}>{children}</InMenuContext.Provider>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

type TopNavMenuGroupProps = Omit<ComponentProps<'div'>, 'children'> & {
    /** Small heading above the group's pages ("Reports"). */
    label?: ReactNode;
    children: ReactNode;
};

/**
 * A group of a TopNavMenu's pages under a small heading, as a sidebar group is. In the menu a
 * group after another is ruled off by a hairline; in the drawer it is the heading over its rows.
 */
export const TopNavMenuGroup = ({ label, className, children, ...props }: TopNavMenuGroupProps) => {
    const inMenu = useContext(InMenuContext);
    const id = useId();

    if (!inMenu)
        return (
            <div className={cn('flex flex-col gap-0.5', className)} {...props}>
                {label && (
                    <p className="pt-2 pb-1 pl-2.5 font-normal text-neutral-600 text-xs">{label}</p>
                )}
                {children}
            </div>
        );

    return (
        <MenuPrimitive.Group
            aria-labelledby={label ? id : undefined}
            className={cn(
                'flex flex-col gap-1 [[data-slot=top-nav-menu-group]+&]:border-neutral-200 [[data-slot=top-nav-menu-group]+&]:border-t [[data-slot=top-nav-menu-group]+&]:pt-1',
                className,
            )}
            data-slot="top-nav-menu-group"
            {...props}
        >
            {label && (
                <div className="px-3 pt-1.5 pb-1 font-medium text-neutral-600 text-xxs" id={id}>
                    {label}
                </div>
            )}
            {children}
        </MenuPrimitive.Group>
    );
};

type TopNavMenuItemProps = Omit<ComponentProps<'button'>, 'onClick'> & {
    /** Swaps the row for another element, e.g. `render={<a href="/reports/revenue" />}`. */
    render?: useRender.RenderProp;
    /** The page you are on: the selected wash, and its menu takes the bar's current look. */
    active?: boolean;
    /** Leading 16px icon. */
    icon?: ReactNode;
    /** How many wait for the reader there, as a count badge at the row's end. */
    count?: ReactNode;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
};

/**
 * One page of a TopNavMenu: a menu row on the bar, the page you are on on the selected wash; a
 * sidebar's inset row in the drawer.
 */
export const TopNavMenuItem = ({
    render,
    active,
    icon,
    count,
    className,
    children,
    onClick,
    ...props
}: TopNavMenuItemProps) => {
    const inMenu = useContext(InMenuContext);

    if (!inMenu)
        return (
            <SidebarItem
                active={active}
                className={className}
                count={count}
                icon={icon}
                onClick={onClick}
                render={render}
                variant="inset"
                {...props}
            >
                {children}
            </SidebarItem>
        );

    return (
        <MenuItem
            aria-current={active ? 'page' : undefined}
            className={cn(
                'aria-[current=page]:bg-selected aria-[current=page]:text-neutral-950',
                className,
            )}
            data-slot="top-nav-menu-item"
            leading={icon}
            render={
                <MenuPrimitive.Item
                    onClick={onClick}
                    render={render as MenuPrimitive.Item.Props['render']}
                />
            }
            trailing={count !== undefined ? <TopNavCount>{count}</TopNavCount> : undefined}
        >
            {children}
        </MenuItem>
    );
};

/** Pushed to the right: a search, a bell, the account's avatar and its menu. They hide on a compact shell. */
export const TopNavActions = ({ className, ...props }: ComponentProps<'div'>) => {
    const { drawer } = useContext(TopNavContext);

    return (
        <div
            className={cn(
                'ml-auto flex shrink-0 items-center gap-2',
                drawer && '@max-shell-compact/shell:hidden',
                className,
            )}
            data-slot="top-nav-actions"
            {...props}
        />
    );
};
