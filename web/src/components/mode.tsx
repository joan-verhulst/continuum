'use client';

import { Button, type ButtonProps, Theme, type ThemeMode } from 'continuum';
import { Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useCallback, useLayoutEffect, useSyncExternalStore } from 'react';
import { modeStorageKey } from './mode-key';

/*
 * Light and dark for the whole site. The site opens dark; a reader who switches to light keeps it,
 * in localStorage, so every Theme on the page (and every portal that re-opens one) agrees. The
 * landing (/) is dark whatever the choice. <ModeScript> sets the same before the first paint.
 */

const changed = 'contui-mode-change';

const subscribe = (onChange: () => void) => {
    window.addEventListener(changed, onChange);
    // Another tab switching the mode switches this one too.
    window.addEventListener('storage', onChange);
    return () => {
        window.removeEventListener(changed, onChange);
        window.removeEventListener('storage', onChange);
    };
};

/** The reader's choice: light only if they chose it, dark otherwise. */
const read = (): ThemeMode => {
    try {
        return localStorage.getItem(modeStorageKey) === 'light' ? 'light' : 'dark';
    } catch {
        // Storage can be blocked: the site's default.
        return 'dark';
    }
};

/** Whether a path is always dark: the landing. */
const alwaysDark = (pathname: string | null) => pathname === '/';

/** The reader's mode and a setter that keeps it for next time. */
export const useMode = () => {
    const mode = useSyncExternalStore(subscribe, read, () => 'dark' as ThemeMode);
    const pathname = usePathname();
    const setMode = useCallback(
        (next: ThemeMode) => {
            try {
                localStorage.setItem(modeStorageKey, next);
            } catch {
                // Not kept, but the page still switches.
            }
            if (!alwaysDark(pathname)) document.documentElement.dataset.mode = next;
            window.dispatchEvent(new Event(changed));
        },
        [pathname],
    );
    return { mode, setMode };
};

/** The mode the page shows: the reader's, but dark on the landing. */
export const useShownMode = (): ThemeMode => {
    const { mode } = useMode();
    return alwaysDark(usePathname()) ? 'dark' : mode;
};

/**
 * The scope every page sits in: the site's ContinuumUI theme in the shown mode, on its canvas. It
 * keeps <html data-mode> in step as the reader moves between the landing and the other pages.
 */
export const SiteTheme = ({ children }: { children: ReactNode }) => {
    const mode = useShownMode();
    const pathname = usePathname();
    // Read afresh rather than from `mode`, which is the server's guess for the hydrating render;
    // `mode` only says when to read again.
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on each change of mode
    useLayoutEffect(() => {
        document.documentElement.dataset.mode = alwaysDark(pathname) ? 'dark' : read();
    }, [pathname, mode]);
    return (
        <Theme
            className="flex min-h-dvh flex-col bg-neutral-50 text-neutral-950"
            mode={mode}
            // The site's frame wears ContinuumUI (styles/continuum-ui.css); what it shows of the system
            // opens the default theme again (DefaultTheme).
            theme="continuum-ui"
            // The mode script sets the attribute before React does; the two agree after hydration.
            suppressHydrationWarning
        >
            {children}
        </Theme>
    );
};

/** A ghost icon button that flips light and dark, named for what it turns the page into. */
export const ModeSwitch = (props: Omit<ButtonProps, 'onClick' | 'children'>) => {
    const { mode, setMode } = useMode();
    const next = mode === 'dark' ? 'light' : 'dark';
    return (
        <Button
            aria-label={`Switch to ${next} mode`}
            onClick={() => setMode(next)}
            size="icon"
            title={`Switch to ${next} mode`}
            variant="ghost"
            {...props}
        >
            {mode === 'dark' ? <Sun strokeWidth={2} /> : <Moon strokeWidth={2} />}
        </Button>
    );
};
