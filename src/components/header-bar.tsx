'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';
import { Notice, type NoticeProps, useNotice } from './notice';
import { SidebarToggle, useAppShellNav } from './sidebar';

type HeaderBarProps = ComponentProps<'header'> & {
    /**
     * Whether the bar starts with the toggle that opens the shell's sidebar as a drawer, when the
     * shell is too narrow for it. On by default; a bar with a toggle of its own turns it off.
     */
    sidebarToggle?: boolean;
};

/**
 * The panel's top bar: breadcrumb on the left, actions on the right. Its hairline
 * is one of the few kept: the page scrolls under it, and space can't mark that edge.
 * It positions its notice, which hangs from that hairline.
 *
 * In an `AppShell` too narrow for the sidebar it starts with the toggle that opens the sidebar
 * as a drawer, in the place of the back and forward arrows, which hide, as the actions do.
 */
export const HeaderBar = ({
    sidebarToggle = true,
    className,
    children,
    ...props
}: HeaderBarProps) => {
    const shell = useAppShellNav();

    return (
        <header
            className={cn(
                'relative flex h-header shrink-0 items-center justify-between gap-4 border-neutral-200 border-b py-2 pr-2 pl-4',
                // With the toggle shown first, the trail after it takes the free space, so it stays
                // beside the toggle rather than being pushed to the far end.
                '@max-shell-sidebar/shell:[&>[data-slot=header-bar-sidebar-toggle]+*]:mr-auto',
                className,
            )}
            data-slot="header-bar"
            {...props}
        >
            {/* A shell with a top nav keeps its toggle there. */}
            {sidebarToggle && shell?.nav === 'side' && <HeaderBarSidebarToggle />}
            {children}
        </header>
    );
};

type HeaderBarSidebarToggleProps = Omit<ComponentProps<'button'>, 'children'> & {
    /** Its names for screen readers while the drawer is closed and while it is open. */
    openLabel?: string;
    closeLabel?: string;
};

/**
 * Opens the shell's navigation as a drawer. It is the sidebar's own toggle, the same icon in the
 * same quiet grey, so the narrow bar reads as the wide shell with its sidebar folded away. It only
 * shows while the shell is too narrow for the sidebar, and renders nothing outside an `AppShell`
 * with a drawer. The header bar starts with one of its own; put one in a bar of your own making.
 */
export const HeaderBarSidebarToggle = ({
    openLabel = 'Open navigation',
    closeLabel = 'Close navigation',
    className,
    onClick,
    ...props
}: HeaderBarSidebarToggleProps) => {
    const shell = useAppShellNav();
    if (!shell?.hasDrawer) return null;

    return (
        <SidebarToggle
            aria-controls={shell.drawerId}
            aria-label={shell.open ? closeLabel : openLabel}
            // 12 to the trail, as in a bar that draws its own toggle, not the bar's 16 between its ends.
            className={cn('-mr-1 @max-shell-sidebar/shell:grid hidden shrink-0', className)}
            data-slot="header-bar-sidebar-toggle"
            expanded={shell.open}
            onClick={event => {
                onClick?.(event);
                if (event.defaultPrevented) return;
                if (!shell.open) shell.opener.current = event.currentTarget;
                shell.setOpen(!shell.open);
            }}
            {...props}
        />
    );
};

/** The left of the bar: back and forward, then the breadcrumb; it gives way before the actions do. */
export const HeaderBarStart = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        // Stretched to the bar's height, so the arrows' rule can run its full height.
        className={cn('flex min-w-0 flex-1 items-center gap-3 self-stretch', className)}
        data-slot="header-bar-start"
        {...props}
    />
);

export type HeaderBarNavProps = Omit<ComponentProps<'div'>, 'children'> & {
    onBack?: () => void;
    /** Leave it out for a back button alone, as a detail page that returns to its list has. */
    onForward?: () => void;
    /** Whether there is somewhere to go; the arrow dims without it, or without its handler. */
    canGoBack?: boolean;
    canGoForward?: boolean;
    /** The arrows' names for screen readers. */
    backLabel?: string;
    forwardLabel?: string;
};

/**
 * Back and forward through the pages visited in the app, before the trail: the trail says where the
 * page sits, the arrows where you came from. Ghost 28px buttons, ruled off from the trail by a
 * hairline that runs the bar's full height, as the segments of a toolbar are.
 * They hide on a shell too narrow for the sidebar, where the drawer's toggle takes their place.
 */
export const HeaderBarNav = ({
    onBack,
    onForward,
    canGoBack = true,
    canGoForward = true,
    backLabel = 'Back',
    forwardLabel = 'Forward',
    className,
    ...props
}: HeaderBarNavProps) => (
    <div
        className={cn(
            /*
             * Pulled through the bar's vertical padding, so the rule meets its top and its hairline,
             * and through its left padding: 12px before the arrows, near the 13px the bar leaves above
             * and below them, and 16px after, so the rule doesn't crowd them.
             */
            '-my-2 -ml-4 flex @max-shell-sidebar/shell:hidden shrink-0 items-center gap-0.5 self-stretch border-neutral-200 border-r pr-4 pl-3',
            className,
        )}
        data-slot="header-bar-nav"
        {...props}
    >
        {/* An arrow with nothing to call has nowhere to go, so it dims as one at the end of the history. */}
        <Button
            aria-label={backLabel}
            disabled={!canGoBack || !onBack}
            onClick={onBack}
            size="icon-sm"
            variant="ghost"
        >
            <ArrowLeft strokeWidth={2} />
        </Button>
        {onForward && (
            <Button
                aria-label={forwardLabel}
                disabled={!canGoForward}
                onClick={onForward}
                size="icon-sm"
                variant="ghost"
            >
                <ArrowRight strokeWidth={2} />
            </Button>
        )}
    </div>
);

/**
 * A history for `HeaderBarNav` inside an app that keeps its own pages, not the browser's: `go` visits
 * a page and drops anything forward of it, as a browser does. Use the router's history instead
 * where there is one.
 */
export const usePageHistory = <Page,>(initial: Page[], start = initial.length - 1) => {
    const [state, setState] = useState({ pages: initial, index: start });
    const page = state.pages[state.index] as Page;

    return {
        page,
        canGoBack: state.index > 0,
        canGoForward: state.index < state.pages.length - 1,
        back: () => setState(s => ({ ...s, index: Math.max(0, s.index - 1) })),
        forward: () => setState(s => ({ ...s, index: Math.min(s.pages.length - 1, s.index + 1) })),
        go: (next: Page) =>
            setState(s => ({
                pages: [...s.pages.slice(0, s.index + 1), next],
                index: s.index + 1,
            })),
    };
};

/**
 * The right of the bar: one or two actions, secondary before primary. They hide on a shell too
 * narrow for the sidebar: the page keeps its own primary, and the bar its trail.
 */
export const HeaderBarActions = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        className={cn(
            'flex @max-shell-sidebar/shell:hidden shrink-0 items-center gap-2',
            className,
        )}
        data-slot="header-bar-actions"
        {...props}
    />
);

/** @deprecated Moved to `Notice`, which hangs from any bar, not only the header. */
export const HeaderBarNotice = Notice;
/** @deprecated Moved to `NoticeProps`. */
export type HeaderBarNoticeProps = NoticeProps;
/** @deprecated Moved to `useNotice`. */
export const useHeaderNotice = useNotice;
