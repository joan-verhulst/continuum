'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { type CSSProperties, createContext, type ReactNode, useContext, useMemo } from 'react';
import { cn } from '../lib/cn';

export type ThemeMode = 'light' | 'dark';

type ThemeValue = {
    /** The id of a custom theme (its `.continuum[data-theme=…]` block); none for the default. */
    theme?: string;
    mode: ThemeMode;
    /** Corner scale: every radius token times this; 1 is the theme as drawn. */
    radius: number;
};

const ThemeContext = createContext<ThemeValue>({ mode: 'light', radius: 1 });

/** The scale as a style, left off at 1 so the theme's own values apply untouched. */
const radiusStyle = (radius: number, style?: CSSProperties) =>
    radius === 1 ? style : ({ ...style, '--continuum-radius-scale': radius } as CSSProperties);

export const useTheme = () => useContext(ThemeContext);

type ThemeProps = useRender.ComponentProps<'div'> & Partial<ThemeValue>;

/**
 * Opens a themed scope. Everything the system styles has to sit inside one,
 * because the tokens and the built stylesheet only apply under `.continuum`.
 * `theme` names a custom theme written by the theme builder or `createThemeCss`;
 * without one the default tokens apply. Pass `render={<body />}` or any element
 * to make it the scope itself.
 */
export const Theme = ({
    theme,
    mode,
    radius,
    render,
    ref,
    className,
    style,
    ...props
}: ThemeProps) => {
    const parent = useTheme();
    const value = useMemo(
        () => ({
            theme: theme ?? parent.theme,
            mode: mode ?? parent.mode,
            radius: radius ?? parent.radius,
        }),
        [theme, mode, radius, parent.theme, parent.mode, parent.radius],
    );
    const element = useRender({
        defaultTagName: 'div',
        render,
        ref,
        props: mergeProps<'div'>(
            {
                className: cn('continuum', className),
                style: radiusStyle(value.radius, style),
                // Plain attributes rather than state, so a missing theme sets no attribute at all.
                ...({ 'data-theme': value.theme, 'data-mode': value.mode } as object),
            },
            props,
        ),
    });

    return <ThemeContext.Provider value={value}>{element}</ThemeContext.Provider>;
};

const PortalContext = createContext<HTMLElement | null>(null);

/**
 * Where the overlays inside it open: menus, popovers, tooltips, dialogs, sheets and toasts portal
 * into `container` instead of the body. The container has to hold fixed descendants (a transform,
 * `contain: paint` or `container-type: size`) and be sized to the screen it stands for, so a scrim,
 * a sheet and a menu's collisions keep to it, as a preview of a phone's screen needs. An overlay's
 * own `container` prop still wins.
 */
export const PortalContainer = ({
    container,
    children,
}: {
    container: HTMLElement | null;
    children: ReactNode;
}) => <PortalContext.Provider value={container}>{children}</PortalContext.Provider>;

/** The container an overlay portals into: its own if given, else the nearest PortalContainer's, else the body. */
export const usePortalContainer = <T = HTMLElement>(container?: T | null) => {
    const fallback = useContext(PortalContext);
    return container ?? fallback ?? undefined;
};

/**
 * Re-opens the current theme inside a portal. Base UI renders menus, tooltips
 * and dialogs at the end of the body, outside the scope that styles them.
 */
export const ThemeScope = ({ children }: { children: ReactNode }) => {
    const { theme, mode, radius } = useTheme();

    return (
        <div
            className="continuum contents"
            data-mode={mode}
            data-theme={theme}
            style={radiusStyle(radius)}
        >
            {children}
        </div>
    );
};
