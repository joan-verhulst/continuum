'use client';

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { useRender } from '@base-ui/react/use-render';
import { ChevronDown, ChevronLeft, PanelLeft } from 'lucide-react';
import {
    type ComponentProps,
    createContext,
    type MouseEvent,
    type ReactNode,
    type Ref,
    type RefObject,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { cn } from '../lib/cn';
import { focusRing, touchTarget } from './button';

/** The shell's navigation drawer, as the parts inside an `AppShell` share it. */
export type AppShellNav = {
    /** Where the navigation sits: a `Sidebar` beside the panel, or a `TopNav` over it. */
    nav: 'side' | 'top';
    /** Whether the drawer is open. It only shows on a shell narrower than the sidebar's width. */
    open: boolean;
    setOpen: (open: boolean) => void;
    /** Whether the shell has a drawer to open: a `Sidebar`, or a `TopNav`'s sections. */
    hasDrawer: boolean;
    /** The drawer's id, for a toggle's `aria-controls`. */
    drawerId: string | undefined;
    /** The control that opened the drawer, where focus goes back to when it closes. */
    opener: RefObject<HTMLElement | null>;
    /** Takes the drawer's element; the `Sidebar` and the `TopNav` set it themselves. */
    setDrawer: (node: HTMLElement | null) => void;
};

const AppShellContext = createContext<AppShellNav | null>(null);

/*
 * Whether a part sits inside an AppPanel. The shell's own navigation is the panel's sibling; a
 * Sidebar or a TopNav drawn inside the panel (a preview of one, say) is content, so it never
 * becomes the shell's drawer.
 */
const InPanelContext = createContext(false);

/**
 * The shell's drawer, for a custom bar's own toggle; null outside an `AppShell`. `inPanel` says
 * whether the caller sits inside the panel: the shell's own navigation is the panel's sibling.
 */
export const useAppShellNav = () => {
    const shell = useContext(AppShellContext);
    const inPanel = useContext(InPanelContext);
    return shell && { ...shell, inPanel };
};

/** The shell, for a part that may be its navigation: null for one drawn inside the panel. */
const useShellNavigation = () => {
    const shell = useContext(AppShellContext);
    return useContext(InPanelContext) ? null : shell;
};

const assignRef = <T,>(ref: Ref<T> | undefined, node: T | null) => {
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
};

/** One callback ref that sets both, so a part keeps the caller's ref while the shell holds it too. */
const useBothRefs = <T,>(a: Ref<T> | undefined, b: Ref<T> | undefined) =>
    useCallback(
        (node: T | null) => {
            assignRef(a, node);
            assignRef(b, node);
        },
        [a, b],
    );

const focusable =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The navigation on a shell narrower than the sidebar's width: it leaves the canvas and slides in
 * over the panel from the left, on the canvas's colour with the sheet's shadow, 256px and never
 * closer than 48px to the far edge, so the page still shows beside it. Closed, it is hidden, which
 * also takes it out of the tab order; under reduced motion it appears without sliding. On a wide
 * shell none of it applies.
 */
export const navDrawerClasses = (open: boolean) =>
    cn(
        '@max-shell-sidebar/shell:absolute @max-shell-sidebar/shell:inset-y-0 @max-shell-sidebar/shell:left-0 @max-shell-sidebar/shell:z-50 @max-shell-sidebar/shell:w-sidebar @max-shell-sidebar/shell:max-w-[calc(100%-48px)]',
        '@max-shell-sidebar/shell:bg-neutral-100 @max-shell-sidebar/shell:shadow-sheet @max-shell-sidebar/shell:outline-none',
        // Visibility switches at once on open, so focus can move in, and waits for the slide on close.
        '@max-shell-sidebar/shell:duration-200 @max-shell-sidebar/shell:ease-out-strong @max-shell-sidebar/shell:motion-reduce:transition-none',
        open
            ? '@max-shell-sidebar/shell:transition-[translate]'
            : '@max-shell-sidebar/shell:invisible @max-shell-sidebar/shell:-translate-x-full @max-shell-sidebar/shell:transition-[translate,visibility]',
    );

type AppShellProps = ComponentProps<'div'> & {
    /** Where the navigation sits on the canvas: a `Sidebar` beside the panel, or a `TopNav` over it. */
    nav?: 'side' | 'top';
    /**
     * Whether the navigation's drawer is open, on a shell too narrow for the sidebar. Left out, the
     * shell keeps it itself, starting from `defaultNavOpen`.
     */
    navOpen?: boolean;
    defaultNavOpen?: boolean;
    onNavOpenChange?: (open: boolean) => void;
};

/**
 * The canvas-and-panel shell: the navigation sits straight on the canvas, the
 * page on an inset panel with an 8px gutter.
 *
 * It is the container its parts answer to, so they follow the shell's width rather than the
 * screen's, and a shell shown narrow inside a page or an embed behaves as it would on a phone.
 * Below the sidebar's width the navigation becomes a drawer, opened from a toggle at the start of
 * the header bar (or the top nav) over a 40% scrim. Escape, the scrim or choosing a page closes it,
 * and focus goes back to the toggle. The panel keeps its gutter, corners and hairline at every
 * width, so a phone shows the same shell as a desktop, only without the sidebar beside it.
 */
export const AppShell = ({
    nav = 'side',
    navOpen,
    defaultNavOpen = false,
    onNavOpenChange,
    className,
    children,
    ref,
    ...props
}: AppShellProps) => {
    const [shell, setShell] = useState<HTMLDivElement | null>(null);
    const [drawer, setDrawer] = useState<HTMLElement | null>(null);
    // Unknown until measured, so a drawer asked to start open isn't closed before the shell is.
    const [narrow, setNarrow] = useState<boolean>();
    const [ownOpen, setOwnOpen] = useState(defaultNavOpen);
    const open = navOpen ?? ownOpen;
    const opener = useRef<HTMLElement | null>(null);
    const latest = useRef({ open, onNavOpenChange });
    latest.current = { open, onNavOpenChange };
    const shellRef = useBothRefs(ref, setShell);

    const setOpen = useCallback((next: boolean) => {
        if (next === latest.current.open) return;
        setOwnOpen(next);
        latest.current.onNavOpenChange?.(next);
    }, []);

    // The same width the parts' container queries use, read from the token so the two agree.
    useEffect(() => {
        if (!shell) return;
        const measure = () => {
            const limit =
                Number.parseFloat(
                    getComputedStyle(shell).getPropertyValue('--container-shell-sidebar'),
                ) || 1024;
            setNarrow(shell.clientWidth < limit);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(shell);
        return () => observer.disconnect();
    }, [shell]);

    // A shell that grows wide enough for the sidebar shuts the drawer, so it doesn't spring open
    // again the next time the shell narrows.
    useEffect(() => {
        if (open && narrow === false) setOpen(false);
    }, [open, narrow, setOpen]);

    const shown = open && narrow === true && drawer !== null;

    // Open, the drawer is the only thing to use: the rest of the shell goes inert, focus moves in
    // (to the current page if it can be seen), Escape closes it, and focus goes back on close.
    useEffect(() => {
        if (!shown || !shell || !drawer) return;
        const rest = Array.from(shell.children).filter(
            (child): child is HTMLElement =>
                child instanceof HTMLElement &&
                !child.contains(drawer) &&
                child.dataset.slot !== 'app-shell-scrim',
        );
        for (const child of rest) child.inert = true;

        const active = document.activeElement;
        if (!opener.current && active instanceof HTMLElement && active !== document.body) {
            opener.current = active;
        }
        const first = [
            drawer.querySelector('[aria-current=page]'),
            ...drawer.querySelectorAll(focusable),
        ].find(
            (node): node is HTMLElement =>
                node instanceof HTMLElement && node.checkVisibility?.() !== false,
        );
        (first ?? drawer).focus({ preventScroll: true });

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            // A menu portalled out of the drawer handles its own Escape.
            const focused = document.activeElement;
            if (focused && focused !== document.body && !drawer.contains(focused)) return;
            setOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            for (const child of rest) child.inert = false;
            const focused = document.activeElement;
            if (!focused || focused === document.body || drawer.contains(focused)) {
                opener.current?.focus({ preventScroll: true });
            }
            opener.current = null;
        };
    }, [shown, shell, drawer, setOpen]);

    const value = useMemo<AppShellNav>(
        () => ({
            nav,
            open,
            setOpen,
            hasDrawer: drawer !== null,
            drawerId: drawer?.id || undefined,
            opener,
            setDrawer,
        }),
        [nav, open, setOpen, drawer],
    );

    return (
        <AppShellContext.Provider value={value}>
            <InPanelContext.Provider value={false}>
                <div
                    className={cn(
                        // Positioned and isolated, so the drawer and its scrim lie over this shell alone.
                        '@container/shell relative isolate flex min-h-screen bg-neutral-100',
                        nav === 'top' && 'flex-col',
                        className,
                    )}
                    data-nav={nav}
                    data-slot="app-shell"
                    ref={shellRef}
                    {...props}
                >
                    {children}
                    {drawer && (
                        // Black rather than a neutral step, as a dialog's scrim: the ramp flips in dark mode.
                        <div
                            aria-hidden
                            className={cn(
                                'absolute inset-0 z-40 @max-shell-sidebar/shell:block hidden bg-black/40 transition-[opacity,visibility] duration-200 ease-out-strong motion-reduce:transition-none',
                                !open && 'invisible opacity-0',
                            )}
                            data-slot="app-shell-scrim"
                            onClick={() => setOpen(false)}
                        />
                    )}
                </div>
            </InPanelContext.Provider>
        </AppShellContext.Provider>
    );
};

export const AppPanel = ({ className, ...props }: ComponentProps<'main'>) => {
    const shell = useShellNavigation();

    return (
        <InPanelContext.Provider value={true}>
            <main
                className={cn(
                    // The gutter opens on every side but the navigation's.
                    'relative m-2 ml-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-panel border border-neutral-200 bg-neutral-50 [[data-nav=top]>&]:mt-0 [[data-nav=top]>&]:ml-2',
                    // With the sidebar gone to a drawer, the gutter opens on its side too.
                    shell?.hasDrawer && '@max-shell-sidebar/shell:ml-2',
                    className,
                )}
                data-slot="app-panel"
                {...props}
            />
        </InPanelContext.Provider>
    );
};

/**
 * The email sequencing sidebar: no fill of its own, so it shares the canvas,
 * with a logo row, blocks of navigation and an account footer. In an `AppShell` narrower than
 * the sidebar's width it becomes the shell's drawer.
 */
export const Sidebar = ({ className, id, ref, ...props }: ComponentProps<'aside'>) => {
    const shell = useShellNavigation();
    const ownId = useId();
    const drawerRef = useBothRefs(ref, shell?.setDrawer);

    return (
        <aside
            className={cn(
                'flex w-sidebar shrink-0 flex-col overflow-hidden',
                shell && navDrawerClasses(shell.open),
                className,
            )}
            data-slot="sidebar"
            id={shell ? (id ?? ownId) : id}
            ref={shell ? drawerRef : ref}
            // Open, it can take focus itself, for when nothing in it can.
            tabIndex={shell?.open ? -1 : undefined}
            {...props}
        />
    );
};

/** The 56px logo row: a logo on the left, the collapse toggle on the right. */
export const SidebarHeader = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            // Centred in the row with the logo 2px low, so a theme's height scale never squeezes it out.
            'flex h-nav shrink-0 items-center justify-between pt-1 pr-4 pl-2',
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

/**
 * Opens and closes the sidebar; give it `expanded` and `aria-controls` so its state is announced.
 * Inside an `AppShell`, without an `onClick` of its own, it opens and closes the shell's drawer, so
 * the one in the drawer's header closes it.
 */
export const SidebarToggle = ({
    className,
    type = 'button',
    expanded,
    collapseLabel = 'Collapse sidebar',
    expandLabel = 'Expand sidebar',
    'aria-label': label = expanded === false ? expandLabel : collapseLabel,
    onClick,
    ...props
}: SidebarToggleProps) => {
    const shell = useContext(AppShellContext);
    const drives = !onClick && shell?.hasDrawer;

    return (
        <button
            aria-controls={drives ? shell.drawerId : undefined}
            aria-expanded={expanded}
            aria-label={label}
            className={cn(
                'grid size-6.5 cursor-pointer place-items-center rounded-chip text-neutral-300 transition-colors duration-150 hover:text-neutral-600',
                touchTarget,
                focusRing,
                className,
            )}
            data-slot="sidebar-toggle"
            onClick={
                drives
                    ? (event: MouseEvent<HTMLButtonElement>) => {
                          if (!shell.open) shell.opener.current = event.currentTarget;
                          shell.setOpen(!shell.open);
                      }
                    : onClick
            }
            type={type}
            {...props}
        >
            <PanelLeft className="size-4.5" strokeWidth={2} />
        </button>
    );
};

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
    'hover:bg-neutral-950/5',
    // The active item as the theme draws it: the wash by default, tinted, filled or raised.
    'aria-[current=page]:bg-nav-active aria-[current=page]:text-nav-active-fg aria-[current=page]:hover:bg-nav-active',
    'aria-[current=page]:[box-shadow:inset_0_0_0_1px_var(--color-nav-active-border),var(--shadow-nav-active)] aria-[current=page]:[background-image:var(--nav-active-image)]',
    // In a foldout, the piece of its guide line beside the page you are on, in the text's colour.
    'in-data-[slot=nav-group-rows]:relative in-data-[slot=nav-group-rows]:aria-[current=page]:before:absolute in-data-[slot=nav-group-rows]:aria-[current=page]:before:inset-y-1.5 in-data-[slot=nav-group-rows]:aria-[current=page]:before:-left-[7px] in-data-[slot=nav-group-rows]:aria-[current=page]:before:w-px in-data-[slot=nav-group-rows]:aria-[current=page]:before:bg-neutral-950 in-data-[slot=nav-group-rows]:aria-[current=page]:before:content-[""]',
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
     * projects"); `inset` is a page under a project, in the quieter grey, indented by the
     * foldout it sits in.
     */
    variant?: 'default' | 'primary' | 'project' | 'inset';
};

/**
 * A sidebar row, on the control row's 34px. The selected row gets a 5% wash
 * rather than colour, set via aria-current so router links that set it
 * themselves work too. Chosen in the shell's drawer, it closes the drawer.
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
    onClick,
    ...props
}: NavItemProps) => {
    const shell = useShellNavigation();

    return useRender({
        defaultTagName: 'button',
        render,
        props: {
            'aria-current': active ? 'page' : undefined,
            className: cn(
                navItemClasses,
                variant === 'default' && 'h-control text-neutral-950 text-xs',
                variant === 'project' && 'h-control text-neutral-950 text-sm',
                variant === 'inset' &&
                    'h-control text-neutral-700 text-sm aria-[current=page]:text-nav-active-fg',
                variant === 'primary' &&
                    'mb-3.5 h-control bg-action text-on-action text-xs shadow-action [background-image:var(--action-gradient)] hover:bg-action-hover hover:[background-image:none]',
                className,
            ),
            'data-slot': 'nav-item',
            'data-variant': variant,
            // A rendered link or router element is not a button, so it gets no type.
            type: render ? undefined : type,
            ...props,
            onClick: (event: MouseEvent<HTMLButtonElement>) => {
                onClick?.(event);
                if (shell && !event.defaultPrevented) shell.setOpen(false);
            },
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
};

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
    /**
     * Holds the page you are on. Found by itself among its rows, open or closed; set it where the
     * page is not one of them (a page under it that the sidebar does not list).
     */
    current?: boolean;
};

/*
 * Where the guide line runs: down from the middle of the group's 16px icon, 10px into its row. The
 * rows hang 6px off it, so a page's label lines up with the group's.
 */
const guide = 'ml-[17px] border-neutral-200 border-l pl-1.5';

/**
 * A section that folds open to its pages, as deep as it needs: a foldout's rows can be foldouts
 * too. Each level hangs off a guide line from the icon above it, one icon's width further in.
 *
 * Open or closed, the row stays a plain row: open is told by the chevron and the rows under it.
 * A background always means "you are here": the page you are on takes the theme's active look,
 * every foldout that holds it the theme's quieter section look, and the guide line beside the
 * page darkens, so the way from a section to its page can be followed. The chevron shows on
 * hover when closed (always on a touch screen, which has none) and turns as the group opens.
 */
export const NavGroup = ({
    icon,
    label,
    current,
    className,
    children,
    ...props
}: NavGroupProps) => (
    <CollapsiblePrimitive.Root
        className={cn('flex flex-col', className)}
        data-current={current || undefined}
        data-slot="nav-group"
        {...props}
    >
        {/* Base UI marks only the open trigger (data-panel-open), so closed is the default look. */}
        <CollapsiblePrimitive.Trigger
            className={cn(
                navItemClasses,
                'group h-control text-neutral-700 text-sm data-panel-open:text-neutral-950',
                // The section that holds the page: set, or found among its rows, open or closed.
                '[[data-current]>&]:bg-nav-section [[data-current]>&]:text-nav-section-fg',
                '[[data-slot=nav-group]:has([aria-current=page])>&]:bg-nav-section',
                '[[data-slot=nav-group]:has([aria-current=page])>&]:text-nav-section-fg',
                '[[data-slot=nav-group]:has([aria-current=page])>&]:hover:bg-nav-section',
                // A foldout inside a foldout that holds the page darkens its piece of the guide line too.
                '[[data-slot=nav-group-rows]>[data-slot=nav-group]:has([aria-current=page])>&]:relative [[data-slot=nav-group-rows]>[data-slot=nav-group]:has([aria-current=page])>&]:before:absolute [[data-slot=nav-group-rows]>[data-slot=nav-group]:has([aria-current=page])>&]:before:inset-y-1.5 [[data-slot=nav-group-rows]>[data-slot=nav-group]:has([aria-current=page])>&]:before:-left-[7px] [[data-slot=nav-group-rows]>[data-slot=nav-group]:has([aria-current=page])>&]:before:w-px [[data-slot=nav-group-rows]>[data-slot=nav-group]:has([aria-current=page])>&]:before:bg-neutral-950 [[data-slot=nav-group-rows]>[data-slot=nav-group]:has([aria-current=page])>&]:before:content-[""]',
            )}
            data-slot="nav-group-trigger"
        >
            {icon && (
                <span className="grid size-4 shrink-0 place-items-center text-xs">{icon}</span>
            )}
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <ChevronDown
                className="-rotate-90 opacity-0 pointer-coarse:opacity-100 transition-[opacity,rotate] duration-200 ease-out-strong group-hover:opacity-100 group-data-panel-open:rotate-0 group-data-panel-open:opacity-100 motion-reduce:transition-none"
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
            // Kept in the page while closed, so a closed section still knows it holds the page.
            keepMounted
        >
            {/* The padding sits inside, so a closed panel is truly 0px tall. */}
            <div className={cn('my-1 flex flex-col gap-0.5', guide)} data-slot="nav-group-rows">
                {children}
            </div>
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
